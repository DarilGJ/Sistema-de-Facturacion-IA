"""Motor predictivo de demanda de Librerías El Regalito.

Contiene el proceso ETL (extracción, agregación mensual y generación de variables), el entrenamiento del
Random Forest con partición cronológica 80/20, las métricas de evaluación (MAPE, MAE y RMSE), las pruebas
estadísticas de la hipótesis y el cálculo del Punto de Reorden.
"""
from __future__ import annotations

import math
import os
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

MESES_TEMPORADA_ESCOLAR = {12, 1, 2}
MIN_PERIODOS_HISTORIAL = 12
UMBRAL_MAPE = 15.0
META_REDUCCION = 25.0
Z_NIVEL_SERVICIO = 1.65
DIAS_POR_MES = 30

CARACTERISTICAS = [
    "mes",
    "temporada_escolar",
    "rezago_1",
    "rezago_2",
    "rezago_3",
    "rezago_12",
    "media_movil_3",
    "nivel_producto",
    "categoria_cod",
]

REJILLA_HIPERPARAMETROS = {
    "n_estimators": [100, 300],
    "max_depth": [6, 10, None],
    "min_samples_leaf": [1, 2, 4],
    "max_features": ["sqrt", 1.0],
}

# Los %% escapan el formato de fecha porque PyMySQL aplica sustitución de parámetros con %s.
CONSULTA_VENTAS = """
SELECT p.sku,
       COALESCE(NULLIF(p.categoria, ''), 'Sin categoría') AS categoria,
       DATE_FORMAT(f.fecha, '%%Y-%%m')                    AS periodo,
       SUM(fi.cantidad)                                   AS cantidad
FROM factura_items fi
JOIN facturas  f ON f.id = fi.id_factura
JOIN productos p ON p.id = fi.id_producto
WHERE f.estado <> 'anulada'
  AND f.fecha >= %s AND f.fecha < %s
GROUP BY p.sku, categoria, periodo
"""


def configuracion_mysql() -> dict:
    """Lee la conexión desde variables de entorno o, si faltan, desde backend/.env."""
    archivo = Path(__file__).resolve().parent.parent / "backend" / ".env"
    valores = {}
    if archivo.exists():
        for linea in archivo.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.lstrip().startswith("#"):
                clave, valor = linea.split("=", 1)
                valores[clave.strip()] = valor.strip().strip('"').strip("'")

    def leer(clave, defecto=""):
        return os.environ.get(clave, valores.get(clave, defecto))

    return {
        "host": leer("DB_HOST", "localhost"),
        "port": int(leer("DB_PORT", "3306")),
        "user": leer("DB_USER", "root"),
        "password": leer("DB_PASSWORD"),
        "database": leer("DB_NAME", "sistema_facturacion"),
    }


def cargar_ventas_mysql(desde: str, hasta: str, conexion: dict | None = None) -> pd.DataFrame:
    import pymysql

    cnx = pymysql.connect(**(conexion or configuracion_mysql()), charset="utf8mb4")
    try:
        with cnx.cursor() as cur:
            cur.execute(CONSULTA_VENTAS, (desde, hasta))
            filas = cur.fetchall()
    finally:
        cnx.close()
    ventas = pd.DataFrame(filas, columns=["sku", "categoria", "periodo", "cantidad"])
    ventas["cantidad"] = ventas["cantidad"].astype(float)
    return ventas


def cargar_ventas_csv(ruta: str | Path) -> pd.DataFrame:
    """Acepta un export del sistema anterior con columnas sku, cantidad y periodo (AAAA-MM) o fecha.

    La columna categoria es opcional. Si el archivo trae una fila por venta, se agrega por mes.
    """
    ventas = pd.read_csv(ruta)
    ventas.columns = [c.strip().lower() for c in ventas.columns]
    if "periodo" not in ventas.columns:
        if "fecha" not in ventas.columns:
            raise ValueError("El archivo debe incluir la columna 'periodo' (AAAA-MM) o 'fecha'.")
        ventas["periodo"] = pd.to_datetime(ventas["fecha"]).dt.strftime("%Y-%m")
    if "categoria" not in ventas.columns:
        ventas["categoria"] = "Sin categoría"
    ventas["sku"] = ventas["sku"].astype(str).str.strip()
    return (
        ventas.groupby(["sku", "categoria", "periodo"], as_index=False)["cantidad"].sum()
        .astype({"cantidad": float})
    )


def completar_series(ventas: pd.DataFrame) -> pd.DataFrame:
    """Completa con cero los meses sin ventas desde la primera venta de cada producto."""
    ventas = ventas.copy()
    ventas["periodo"] = pd.PeriodIndex(ventas["periodo"], freq="M")
    ultimo = ventas["periodo"].max()
    categorias = ventas.groupby("sku")["categoria"].agg(lambda s: s.mode().iat[0])
    series = []
    for sku, grupo in ventas.groupby("sku"):
        meses = pd.period_range(grupo["periodo"].min(), ultimo, freq="M")
        serie = grupo.groupby("periodo")["cantidad"].sum().reindex(meses, fill_value=0.0)
        series.append(pd.DataFrame({
            "sku": sku,
            "categoria": categorias[sku],
            "periodo": meses,
            "cantidad": serie.to_numpy(),
        }))
    return pd.concat(series, ignore_index=True)


def generar_caracteristicas(series: pd.DataFrame, categorias: list[str] | None = None) -> pd.DataFrame:
    """Genera variables de calendario y de rezago. Descarta las filas sin 12 meses previos (arranque en frío)."""
    datos = series.sort_values(["sku", "periodo"]).copy()
    por_sku = datos.groupby("sku")["cantidad"]
    datos["mes"] = datos["periodo"].dt.month
    datos["temporada_escolar"] = datos["mes"].isin(MESES_TEMPORADA_ESCOLAR).astype(int)
    for k in (1, 2, 3, 12):
        datos[f"rezago_{k}"] = por_sku.shift(k)
    datos["media_movil_3"] = por_sku.transform(lambda s: s.shift(1).rolling(3).mean())
    datos["nivel_producto"] = por_sku.transform(lambda s: s.shift(1).expanding().mean())
    categorias = categorias or sorted(datos["categoria"].unique())
    datos["categoria_cod"] = datos["categoria"].map({c: i for i, c in enumerate(categorias)}).fillna(-1)
    return datos.dropna(subset=CARACTERISTICAS).sort_values(["periodo", "sku"]).reset_index(drop=True)


def particion_cronologica(datos: pd.DataFrame, proporcion: float = 0.8):
    periodos = np.sort(datos["periodo"].unique())
    if len(periodos) < 5:
        raise ValueError("Se requieren al menos 5 periodos con variables completas para particionar.")
    corte = periodos[math.ceil(len(periodos) * proporcion) - 1]
    return datos[datos["periodo"] <= corte], datos[datos["periodo"] > corte]


def metricas(reales, pronosticos) -> dict:
    """MAPE sobre los periodos con demanda positiva (no está definido con demanda cero), MAE y RMSE."""
    reales = np.asarray(reales, dtype=float)
    pronosticos = np.asarray(pronosticos, dtype=float)
    positivos = reales > 0
    ape = np.abs(reales[positivos] - pronosticos[positivos]) / reales[positivos] * 100
    return {
        "mape": float(ape.mean()) if ape.size else float("nan"),
        "mae": float(np.mean(np.abs(reales - pronosticos))),
        "rmse": float(np.sqrt(np.mean((reales - pronosticos) ** 2))),
        "n": int(reales.size),
        "n_mape": int(ape.size),
        "ape": ape,
    }


def prueba_precision(ape: np.ndarray, umbral: float = UMBRAL_MAPE) -> dict:
    """Contraste A: t de Student unilateral H1: media de APE < umbral, con Shapiro-Wilk como control."""
    t = stats.ttest_1samp(ape, umbral, alternative="less")
    shapiro = stats.shapiro(ape) if 3 <= ape.size <= 5000 else None
    resultado = {
        "prueba": "t de Student para una muestra (unilateral)",
        "n": int(ape.size),
        "t": float(t.statistic),
        "p": float(t.pvalue),
        "shapiro_p": float(shapiro.pvalue) if shapiro else None,
    }
    if shapiro and shapiro.pvalue < 0.05 and ape.size < 30:
        w = stats.wilcoxon(ape - umbral, alternative="less")
        resultado.update(prueba_robusta="Wilcoxon contra la mediana", p_robusta=float(w.pvalue))
    return resultado


def prueba_pedidos(reales, pedido_empirico, pedido_sistema) -> dict:
    """Contraste B: reducción de inconsistencias (Ecuación 7.1) y Wilcoxon de rangos con signo unilateral."""
    reales = np.asarray(reales, dtype=float)
    err_emp = np.abs(np.asarray(pedido_empirico, dtype=float) - reales)
    err_sis = np.abs(np.asarray(pedido_sistema, dtype=float) - reales)
    e_emp, e_sis = float(err_emp.sum()), float(err_sis.sum())
    reduccion = (e_emp - e_sis) / e_emp * 100 if e_emp else float("nan")
    diferencias = err_emp - err_sis
    n_pares = int(np.count_nonzero(diferencias))
    resultado = {"e_emp": e_emp, "e_sis": e_sis, "reduccion": reduccion, "n_pares": n_pares}
    if n_pares >= 10:
        w = stats.wilcoxon(err_emp, err_sis, alternative="greater", method="approx")
        z = float(w.zstatistic)
        resultado.update(prueba="Wilcoxon de rangos con signo (unilateral)", w=float(w.statistic), z=z,
                         p=float(w.pvalue), r=abs(z) / math.sqrt(n_pares))
    return resultado


def punto_reorden(demanda_mensual: float, desviacion_mensual: float, tiempo_entrega_dias: float,
                  z: float = Z_NIVEL_SERVICIO) -> dict:
    """ROP = d × L + SS, con SS = z × σ_d × √L (Ecuaciones 2.1 y 2.2), en unidades diarias."""
    d = demanda_mensual / DIAS_POR_MES
    sigma_d = desviacion_mensual / math.sqrt(DIAS_POR_MES)
    ss = z * sigma_d * math.sqrt(tiempo_entrega_dias)
    return {
        "demanda_diaria": d,
        "stock_seguridad": math.ceil(ss),
        "punto_reorden": math.ceil(d * tiempo_entrega_dias + ss),
    }


def entrenar_y_evaluar(ventas: pd.DataFrame, proporcion: float = 0.8, semilla: int = 42) -> dict:
    series = completar_series(ventas)
    categorias = sorted(series["categoria"].unique())
    datos = generar_caracteristicas(series, categorias)
    entrenamiento, prueba = particion_cronologica(datos, proporcion)
    x_train, y_train = entrenamiento[CARACTERISTICAS], entrenamiento["cantidad"]
    x_test, y_test = prueba[CARACTERISTICAS], prueba["cantidad"]

    busqueda = GridSearchCV(
        RandomForestRegressor(random_state=semilla, n_jobs=-1),
        REJILLA_HIPERPARAMETROS,
        cv=TimeSeriesSplit(n_splits=4),
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    busqueda.fit(x_train, y_train)
    modelo = busqueda.best_estimator_
    pron_rf = np.clip(modelo.predict(x_test), 0, None)

    lineal = LinearRegression().fit(x_train, y_train)
    pron_lineal = np.clip(lineal.predict(x_test), 0, None)

    m_rf = metricas(y_test, pron_rf)
    m_lineal = metricas(y_test, pron_lineal)
    precision = prueba_precision(m_rf["ape"])
    # El método empírico repone lo vendido el mes anterior; el sistema pide la demanda pronosticada.
    pedidos = prueba_pedidos(y_test, x_test["rezago_1"], np.round(pron_rf))

    importancias = sorted(zip(CARACTERISTICAS, modelo.feature_importances_), key=lambda par: -par[1])
    residuos = (y_train - modelo.predict(x_train)).groupby(entrenamiento["sku"]).std().fillna(0)

    def periodo(df, extremo):
        return str(getattr(df["periodo"], extremo)())

    reporte = {
        "fecha_entrenamiento": datetime.now().isoformat(timespec="seconds"),
        "productos": int(datos["sku"].nunique()),
        "productos_excluidos_arranque_frio": int(series["sku"].nunique() - datos["sku"].nunique()),
        "entrenamiento": {"desde": periodo(entrenamiento, "min"), "hasta": periodo(entrenamiento, "max"),
                          "observaciones": int(len(entrenamiento))},
        "prueba": {"desde": periodo(prueba, "min"), "hasta": periodo(prueba, "max"),
                   "observaciones": int(len(prueba))},
        "hiperparametros": busqueda.best_params_,
        "random_forest": {k: v for k, v in m_rf.items() if k != "ape"},
        "regresion_lineal": {k: v for k, v in m_lineal.items() if k != "ape"},
        "contraste_a": precision,
        "contraste_b": pedidos,
        "cumple_mape": m_rf["mape"] < UMBRAL_MAPE and precision["p"] < 0.05,
        "cumple_reduccion": pedidos["reduccion"] >= META_REDUCCION and pedidos.get("p", 1) < 0.05,
        "importancia_variables": [{"variable": v, "importancia": float(i)} for v, i in importancias],
    }
    paquete = {
        "modelo": modelo,
        "categorias": categorias,
        "caracteristicas": CARACTERISTICAS,
        "desviacion_residuos": residuos.to_dict(),
        "reporte": reporte,
    }
    return paquete


def guardar_modelo(paquete: dict, directorio: str | Path) -> Path:
    directorio = Path(directorio)
    directorio.mkdir(parents=True, exist_ok=True)
    fecha = datetime.now()
    trimestre = (fecha.month - 1) // 3 + 1
    ruta = directorio / f"modelo_rf_{fecha.year}T{trimestre}.joblib"
    joblib.dump(paquete, ruta)
    joblib.dump(paquete, directorio / "modelo_vigente.joblib")
    return ruta


def cargar_modelo(ruta: str | Path) -> dict:
    return joblib.load(ruta)


def pronosticar(paquete: dict, sku: str, categoria: str, historial: list[dict], tiempo_entrega_dias: float,
                z: float = Z_NIVEL_SERVICIO) -> dict:
    """Pronostica el mes siguiente al último del historial y calcula el Punto de Reorden.

    Los productos con menos de 12 meses de historial se marcan para revisión manual (regla RN-04).
    """
    if len(historial) < MIN_PERIODOS_HISTORIAL:
        return {"sku": sku, "revision_manual": True,
                "motivo": f"Historial de {len(historial)} meses; se requieren al menos {MIN_PERIODOS_HISTORIAL}."}
    serie = pd.DataFrame(historial)
    serie["sku"], serie["categoria"] = sku, categoria
    serie = completar_series(serie[["sku", "categoria", "periodo", "cantidad"]])
    siguiente = serie["periodo"].max() + 1
    serie = pd.concat([serie, pd.DataFrame({"sku": [sku], "categoria": [categoria], "periodo": [siguiente],
                                            "cantidad": [np.nan]})], ignore_index=True)
    fila = generar_caracteristicas(serie.fillna({"cantidad": 0}), paquete["categorias"])
    fila = fila[fila["periodo"] == siguiente]
    demanda = float(max(paquete["modelo"].predict(fila[paquete["caracteristicas"]])[0], 0))
    sigma = float(paquete["desviacion_residuos"].get(sku, serie["cantidad"].dropna().std()))
    rop = punto_reorden(demanda, sigma, tiempo_entrega_dias, z)
    return {"sku": sku, "periodo": str(siguiente), "revision_manual": False,
            "demanda_esperada": round(demanda, 2), **rop}
