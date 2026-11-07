"""Entrena el Random Forest, evalúa la hipótesis y publica el modelo.

Uso:
    python entrenar_modelo.py --mysql --desde 2023-01-01 --hasta 2026-01-01
    python entrenar_modelo.py --csv historico_2023_2025.csv
"""
import argparse
import json
from pathlib import Path

import predict_demand as pd_motor

DIRECTORIO = Path(__file__).resolve().parent


def imprimir(reporte: dict) -> None:
    rf, rl = reporte["random_forest"], reporte["regresion_lineal"]
    a, b = reporte["contraste_a"], reporte["contraste_b"]
    print(f"Productos modelados: {reporte['productos']} "
          f"(excluidos por arranque en frío: {reporte['productos_excluidos_arranque_frio']})")
    print(f"Entrenamiento: {reporte['entrenamiento']['desde']} a {reporte['entrenamiento']['hasta']} "
          f"({reporte['entrenamiento']['observaciones']} obs.)")
    print(f"Prueba:        {reporte['prueba']['desde']} a {reporte['prueba']['hasta']} "
          f"({reporte['prueba']['observaciones']} obs.)")
    print(f"Hiperparámetros: {reporte['hiperparametros']}")
    print(f"Random Forest     MAPE {rf['mape']:.2f} %  MAE {rf['mae']:.2f}  RMSE {rf['rmse']:.2f}")
    print(f"Regresión lineal  MAPE {rl['mape']:.2f} %  MAE {rl['mae']:.2f}  RMSE {rl['rmse']:.2f}")
    print(f"Contraste A: t = {a['t']:.2f}, p = {a['p']:.4g}, n = {a['n']} (Shapiro p = {a['shapiro_p']})")
    print(f"Contraste B: E_emp = {b['e_emp']:.0f}, E_sis = {b['e_sis']:.0f}, reducción = {b['reduccion']:.1f} %"
          + (f", Z = {b['z']:.2f}, p = {b['p']:.4g}, r = {b['r']:.2f}" if "z" in b else ""))
    print(f"Cumple MAPE < 15 %: {reporte['cumple_mape']}  |  Cumple reducción ≥ 25 %: {reporte['cumple_reduccion']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    fuente = parser.add_mutually_exclusive_group(required=True)
    fuente.add_argument("--csv", help="Export del histórico con columnas sku, cantidad y periodo o fecha")
    fuente.add_argument("--mysql", action="store_true", help="Extrae las ventas de la base del sistema")
    parser.add_argument("--desde", default="2023-01-01")
    parser.add_argument("--hasta", default="2026-01-01", help="Fecha exclusiva")
    parser.add_argument("--salida", default=str(DIRECTORIO / "modelos"))
    args = parser.parse_args()

    ventas = (pd_motor.cargar_ventas_csv(args.csv) if args.csv
              else pd_motor.cargar_ventas_mysql(args.desde, args.hasta))
    if ventas.empty:
        raise SystemExit("No se encontraron ventas en el periodo indicado.")

    try:
        paquete = pd_motor.entrenar_y_evaluar(ventas)
    except ValueError as error:
        raise SystemExit(f"No se pudo entrenar: {error} El modelo requiere al menos 12 meses previos por "
                         "producto más un periodo de prueba; verifique el rango --desde/--hasta.")
    ruta = pd_motor.guardar_modelo(paquete, args.salida)
    reporte = paquete["reporte"]
    (Path(args.salida) / f"{ruta.stem}_metricas.json").write_text(
        json.dumps(reporte, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    imprimir(reporte)
    print(f"Modelo guardado en {ruta}")


if __name__ == "__main__":
    main()
