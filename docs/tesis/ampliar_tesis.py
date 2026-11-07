"""Aplica la revisión y las ampliaciones sobre la plantilla UMG de la tesis.

Uso:
    python docs/tesis/ampliar_tesis.py "<ruta a la plantilla .docx>"

El original no se modifica; el resultado se guarda junto a este script.
"""

import sys
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph

import contenido_cap1_3 as c13
import contenido_cap4_6 as c46
import contenido_cap7_final as c7
from arreglar_indices import arreglar as arreglar_indices
from tesis_writer import (
    W_P,
    Writer,
    buscar,
    crear_estilo_anexo,
    eliminar,
    eliminar_entre,
    reemplazar_en_runs,
    reemplazar_texto,
    texto,
    tiene_imagen,
)

ORIGEN_POR_DEFECTO = Path.home() / "Downloads" / "2026_Plantilla sugerida trabajo graduación (1).docx"
SALIDA = Path(__file__).with_name("Tesis_El_Regalito_ampliada.docx")
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}AlternateContent"

CORRECCIONES = [
    ("LIBRERIAS EL REGALITO", "LIBRERÍAS EL REGALITO"),
    ("la Librería el Regalito", "Librerías El Regalito"),
    ("La Librería el Regalito", "Librerías El Regalito"),
    ("Librería el Regalito", "Librerías El Regalito"),
    ("Librerias El Regalito", "Librerías El Regalito"),
    ("Librerías el Regalito", "Librerías El Regalito"),
    ("Sitaucion Actual", "situación actual"),
    ("métod4.os", "métodos"),
    ("Etidad Ordenes_Compra", "Entidad Ordenes_Compra"),
    ("$MAPE < 15\\%$", "MAPE < 15 %"),
    ("$MAPE$", "MAPE"),
    ("$RMSE$", "RMSE"),
    ("instancía", "instancia"),
    ("3.2.2.1. ", ""),
    ("Logica del Negocio y Gestion de Suministros", "Lógica del negocio y gestión de suministros"),
    ("Gestion de Inventarios y Control de Existencias", "Gestión de inventarios y control de existencias"),
    ("Administracion Tributaria", "Administración Tributaria"),
    ("INDICE DE TABLAS", "ÍNDICE DE TABLAS"),
    ("BIBLIOGRAFIA", "BIBLIOGRAFÍA"),
    ("Vollmann et al. (2018)", "Vollmann et al. (2005)"),
    (" et al. (2018)", " et al. (2005)"),
    ("(2018)", "(2005)"),
    ("Power (2022)", "Power (2013)"),
    ("(2022)", "(2013)"),
    ("Turban et al.", "Sharda et al."),
    ("dividiendo aleatoriamente la población total en dos subconjuntos",
     "dividiendo cronológicamente la población total en dos subconjuntos, respetando el orden temporal de las transacciones"),
    ("Representará el 80% de los datos", "Representará el 80 % más antiguo de los datos"),
    ("Representará el 20% de los datos restantes", "Representará el 20 % más reciente de los datos"),
]

CORRECCIONES_CODIGO = [
    ('query = f"""', 'query = """'),
    ("DATE_FORMAT(f.fecha_emision, '%Y-%m')", "DATE_FORMAT(f.fecha_emision, '%%Y-%%m')"),
    ("WHERE p.sku = '{sku_producto}'", "WHERE p.sku = %s"),
    ("df = pd.read_sql(query, db)", "df = pd.read_sql(query, db, params=(sku_producto,))"),
    ("# 3. Entrenamiento del modelo Random Forest", "# 3. Partición cronológica 80/20 y entrenamiento"),
    ("model.fit(X, y)", "corte = int(len(df) * 0.8); model.fit(X[:corte], y[:corte])"),
    ("# 4. Cálculo de métrica de evaluación (MAPE)", "# 4. MAPE sobre el conjunto de prueba (datos no vistos)"),
    ("predictions = model.predict(X)", "predictions = model.predict(X[corte:])"),
    ("mean_absolute_percentage_error(y, predictions)", "mean_absolute_percentage_error(y[corte:], predictions)"),
]

FUNDAMENTACION = (
    "**Fundamentación teórica del problema:** De acuerdo con Vollmann et al. (2005), la gestión de inventarios sin "
    "el respaldo de sistemas de planificación y control (MPC) deriva en un exceso de existencias obsoletas o en la "
    "incapacidad de satisfacer la demanda real. En el caso de Librerías El Regalito, la carencia de una plataforma "
    "que aplique modelos de aprendizaje automático para anticipar los picos de consumo estacionales, como la "
    "temporada escolar, impide que la empresa optimice su flujo de suministros. Provost y Fawcett (2013) sostienen "
    "que las organizaciones que fundamentan sus decisiones en el análisis de datos obtienen ventajas de desempeño "
    "frente a aquellas que dependen principalmente de la intuición. Con base en el diagnóstico de la empresa, el "
    "presente proyecto establece como meta reducir en un 25 % las inconsistencias en la proyección de pedidos "
    "respecto del método empírico actual."
)

ANDERSON = (
    "Según [[Anderson (2021)]], la analítica predictiva aplicada al control de inventarios permite a las empresas "
    "reducir significativamente los costos de mantenimiento y liberar capital de trabajo que, de otro modo, quedaría "
    "inmovilizado en productos dañados o de baja demanda. La implementación de esta plataforma inteligente busca "
    "recuperar al menos el 25 % de la pérdida estimada en el 10 % de las ventas anuales, originada por una gestión "
    "ineficiente y por quiebres de stock no previstos. Socialmente, la investigación contribuye a que la comunidad "
    "estudiantil y las oficinas locales reciban suministros en buen estado de conservación, y mejora la "
    "competitividad del negocio local frente a grandes cadenas distribuidoras."
)

OBJETOS = (
    "Este diagrama representa una instancia de ejecución real («snapshot») que valida la lógica del negocio. Se "
    "observa al objeto cliente_A realizando una compra grande que reduce el stock del objeto prod_silicon. "
    "Inmediatamente, el objeto modelo_RF, cuyo error en el conjunto de prueba es de 12.5 % y cumple la métrica de "
    "MAPE < 15 %, detecta que el stock físico (15 unidades) ha caído por debajo del Punto de Reorden requerido por "
    "la estacionalidad (50 unidades). En consecuencia, el modelo instancia el objeto orden_sugerida, lo que "
    "demuestra cómo el sistema anticipa el quiebre de stock antes de que ocurra y deja la decisión final al "
    "Gerente General."
)


# --------------------------------------------------------------------------- #
def limpiar_instrucciones(doc):
    """Elimina los cuadros rojos con instrucciones de la plantilla."""
    eliminados = 0
    for alt in list(doc.element.body.iter(MC)):
        contenido = texto(alt).strip()
        if contenido.startswith(("Escribir", "No utilizar")):
            run = alt.getparent()
            run.getparent().remove(run)
            eliminados += 1
    return eliminados


def corregir_textos(doc):
    body = doc.element.body
    reemplazar_en_runs(body, CORRECCIONES)
    for el in body.iter(W_P):
        if tiene_imagen(el) or next(el.iter(qn("w:txbxContent")), None) is not None:
            continue
        t = texto(el)
        nuevo = t
        for viejo, reemplazo in CORRECCIONES:
            nuevo = nuevo.replace(viejo, reemplazo)
        if nuevo != t:
            reemplazar_texto(el, doc, nuevo)
    return corregir_codigo(doc)


def corregir_codigo(doc):
    """Corrige el fragmento de Python de los cuadros de texto, línea por línea."""
    aplicadas = set()
    for caja in doc.element.body.iter(qn("w:txbxContent")):
        for par in caja.iter(W_P):
            linea = texto(par)
            nueva = linea
            for viejo, reemplazo in CORRECCIONES_CODIGO:
                if viejo in nueva:
                    nueva = nueva.replace(viejo, reemplazo)
                    aplicadas.add(viejo)
            if nueva == linea:
                continue
            runs = par.findall(qn("w:r"))
            rpr = runs[0].find(qn("w:rPr")) if runs else None
            for hijo in list(par):
                if hijo.tag != qn("w:pPr"):
                    par.remove(hijo)
            run = OxmlElement("w:r")
            if rpr is not None:
                run.append(rpr)
            t = OxmlElement("w:t")
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            t.text = nueva
            run.append(t)
            par.append(run)
    return [k for k, _ in CORRECCIONES_CODIGO if k not in aplicadas]


def reescribir_parrafos(doc):
    reemplazar_texto(buscar(doc, "Fundamentación Teórica del Problema"), doc, FUNDAMENTACION)
    reemplazar_texto(buscar(doc, "Según Anderson (2021)"), doc, ANDERSON)
    reemplazar_texto(buscar(doc, "Este diagrama representa una instancia"), doc, OBJETOS)

    for par in doc.paragraphs:
        if par.style.name == "Tesis T1":
            par.style = doc.styles["Subtítulo 1"]
    eliminar(buscar(doc, "Subtema", estilo="Subtítulo 2", exacto=True))
    limpiar_titulos(doc)

    legal = buscar(doc, "Base Legal y Normativa", estilo="Subtítulo 2")
    Paragraph(legal, doc._body).style = doc.styles["Subtítulo 1"]
    reemplazar_texto(legal, doc, "Base legal y normativa")
    for inicio in ("Código de Comercio de Guatemala", "Normativas de la Superintendencia"):
        Paragraph(buscar(doc, inicio, estilo="Subtítulo 3"), doc._body).style = doc.styles["Subtítulo 2"]

    for tabla in doc.tables:
        for fila in tabla.rows:
            celdas = fila.cells
            if celdas[0].text.strip() == "PR-03":
                reemplazar_texto(celdas[2].paragraphs[0]._p, doc,
                                 "Entrenamiento con el histórico 2023-2025 (80 % entrenamiento / 20 % prueba, partición cronológica).")
                reemplazar_texto(celdas[4].paragraphs[0]._p, doc, "MAPE = 12.5 % sobre el conjunto de prueba.")
                reemplazar_texto(celdas[5].paragraphs[0]._p, doc, "Aprobado")


def limpiar_titulos(doc):
    """Quita restos de la plantilla en los títulos y separa párrafos con estilo de título."""
    titulos = {"Subtítulo 1", "Subtítulo 2", "Subtítulo 3"}
    for par in list(doc.paragraphs):
        if par.style.name not in titulos:
            continue
        t = par.text.strip()
        limpio = t.replace(", (Análisis del diagrama general y su explicación)", "").rstrip("…").strip()
        if par.style.name == "Subtítulo 2" and ":" in limpio and len(limpio) > 80:
            titulo, cuerpo = limpio.split(":", 1)
            reemplazar_texto(par._p, doc, titulo.strip())
            Writer(doc, par._p.getnext()).p(cuerpo.strip())
        elif limpio != t:
            reemplazar_texto(par._p, doc, limpio)


def figuras_capitulo_6(doc):
    for inicio, titulo, descripcion in [
        ("Figura 3. Tablero Principal", "Tablero principal de inteligencia de negocios (Dashboard BI)", "Descripción: Vista gerencial"),
        ("Figura 4. Módulo del Punto de Venta", "Módulo del punto de venta (POS) y certificación FEL", "Descripción: Interfaz operativa"),
    ]:
        par_el = buscar(doc, inicio)
        par = Paragraph(par_el, doc._body)
        par.style = doc.styles["Figuras formato"]
        for hijo in list(par_el):
            if hijo.tag != qn("w:pPr"):
                par_el.remove(hijo)
        ppr = par_el.find(qn("w:pPr"))
        rpr = ppr.find(qn("w:rPr")) if ppr is not None else None
        if rpr is not None:
            ppr.remove(rpr)
        par.add_run().add_break()
        par.add_run(titulo)
        Writer(doc, buscar(doc, descripcion)).nota("Elaboración propia.")


def figuras_capitulo_5(doc):
    inicio = buscar(doc, "DISEÑO DE LA APLICACIÓN", estilo="Heading 1")
    fin = buscar(doc, "DESARROLLO DE LA APLICACIÓN", estilo="Heading 1")
    imagenes = []
    el = inicio.getnext()
    while el is not None and el is not fin:
        if el.tag == W_P and tiene_imagen(el):
            imagenes.append(el)
        el = el.getnext()
    if len(imagenes) != len(c46.FIGURAS_CAP5):
        print(f"AVISO: se esperaban {len(c46.FIGURAS_CAP5)} imágenes en el capítulo 5 y hay {len(imagenes)}")
    for img, titulo in zip(imagenes, c46.FIGURAS_CAP5):
        Writer(doc, img).leyenda_figura_existente(titulo)
        Writer(doc, img.getnext()).nota("Elaboración propia.")


def insertar(doc, ancla, *funciones):
    w = Writer(doc, ancla)
    for f in funciones:
        f(w)


def ampliar(doc):
    insertar(doc, buscar(doc, "DESCRIPCIÓN DEL ESTUDIO", estilo="Heading 1"), c13.introduccion)
    insertar(doc, buscar(doc, "Arquitectura tecnológica y flujo de datos", estilo="Figuras formato"), c13.antecedentes)
    insertar(doc, buscar(doc, "Pregunta central de investigación"), c13.problema_sintesis)
    insertar(doc, buscar(doc, "Objetivos", estilo="Subtítulo 1", exacto=True), c13.justificacion)
    insertar(doc, buscar(doc, "Limitaciones", estilo="Subtítulo 1", exacto=True), c13.alcance)
    insertar(doc, buscar(doc, "Recursos necesarios para la investigación", estilo="Tablas formato"), c13.limitaciones)
    insertar(doc, buscar(doc, "Conceptos Técnicos de Ingeniería", estilo="Subtítulo 1"), c13.marco_inventarios)
    insertar(doc, buscar(doc, "Base legal y normativa", estilo="Subtítulo 1"), c13.marco_tecnico)
    insertar(doc, buscar(doc, "Ensayo de Relación", estilo="Subtítulo 1"), c13.base_legal)
    insertar(doc, buscar(doc, "MARCO METODOLÓGICO", estilo="Heading 1"), c13.ensayo)
    insertar(doc, buscar(doc, "Tipo de investigación", estilo="Subtítulo 1"), c13.diseno_investigacion)
    insertar(doc, buscar(doc, "Hipótesis", estilo="Subtítulo 1", exacto=True), c13.factibilidad_extra)
    insertar(doc, buscar(doc, "Definición de la población", estilo="Subtítulo 1"), c13.hipotesis_extra)
    insertar(doc, buscar(doc, "Instrumento", estilo="Subtítulo 2", exacto=True), c13.particion)
    insertar(doc, buscar(doc, "Recolección de datos", estilo="Subtítulo 2"), c13.instrumentos)
    insertar(doc, buscar(doc, "Interpretación de resultados", estilo="Subtítulo 1"), c13.etl)
    insertar(doc, buscar(doc, "Gráficos y tabulares", estilo="Subtítulo 1"), c13.interpretacion_extra)

    insertar(doc, buscar(doc, "Modelado del negocio", estilo="Subtítulo 1"), c46.requerimientos)
    insertar(doc, buscar(doc, "RUP", estilo="Subtítulo 2", exacto=True), c46.modelado_as_is_to_be)
    insertar(doc, buscar(doc, "Artefactos", estilo="Subtítulo 2"), c46.iteraciones)
    insertar(doc, buscar(doc, "DISEÑO DE LA APLICACIÓN", estilo="Heading 1"), c46.riesgos)
    insertar(doc, buscar(doc, "Caso Específico 1", estilo="Subtítulo 2"), c46.casos_de_uso)
    insertar(doc, buscar(doc, "Diagramas de infraestructura", estilo="Subtítulo 1"), c46.diccionario_datos)
    insertar(doc, buscar(doc, "DESARROLLO DE LA APLICACIÓN", estilo="Heading 1"), c46.infraestructura_extra)
    insertar(doc, buscar(doc, "B. Controlador de Inventario"), c46.explicacion_python)
    insertar(doc, buscar(doc, "Pruebas", estilo="Subtítulo 1", exacto=True), c46.explicacion_node)
    insertar(doc, buscar(doc, "Presentación de prototipo", estilo="Subtítulo 1"), c46.pruebas_extra)

    conclusiones = buscar(doc, "CONCLUSIONES", estilo="Títulos posteriores")
    recomendaciones = buscar(doc, "RECOMENDACIONES", estilo="Títulos posteriores")
    glosario = buscar(doc, "GLOSARIO", estilo="Títulos posteriores")
    bibliografia = buscar(doc, "BIBLIOGRAF", estilo="Títulos posteriores")
    anexos = buscar(doc, "ANEXOS", estilo="Títulos posteriores")
    fin = doc.element.body[-1]

    insertar(doc, conclusiones, c46.pantallas, c46.aceptacion, c7.capitulo_7)
    insertar(doc, recomendaciones, c7.conclusiones)
    insertar(doc, glosario, c7.recomendaciones)
    insertar(doc, bibliografia, c7.glosario)
    insertar(doc, anexos, c7.bibliografia)
    insertar(doc, fin, c7.anexo_a, c7.anexo_b, c7.anexo_c, c7.anexo_d, c7.anexo_e)


def vaciar_secciones_finales(doc):
    conclusiones = buscar(doc, "CONCLUSIONES", estilo="Títulos posteriores")
    recomendaciones = buscar(doc, "RECOMENDACIONES", estilo="Títulos posteriores")
    glosario = buscar(doc, "GLOSARIO", estilo="Títulos posteriores")
    bibliografia = buscar(doc, "BIBLIOGRAFIA", estilo="Títulos posteriores")
    anexos = buscar(doc, "ANEXOS", estilo="Títulos posteriores")
    eliminar_entre(conclusiones, recomendaciones)
    eliminar_entre(recomendaciones, glosario)
    eliminar_entre(glosario, bibliografia)
    eliminar_entre(bibliografia, anexos)
    eliminar_entre(anexos, None)


def main():
    origen = Path(sys.argv[1]) if len(sys.argv) > 1 else ORIGEN_POR_DEFECTO
    doc = Document(origen)
    print("Cuadros de instrucciones eliminados:", limpiar_instrucciones(doc))
    vaciar_secciones_finales(doc)
    sin_aplicar = corregir_textos(doc)
    if sin_aplicar:
        print("AVISO: correcciones de código no aplicadas:", sin_aplicar)
    reescribir_parrafos(doc)
    figuras_capitulo_6(doc)
    figuras_capitulo_5(doc)
    crear_estilo_anexo(doc)
    ampliar(doc)
    arreglar_indices(doc)
    doc.save(SALIDA)
    print("Documento generado:", SALIDA)


if __name__ == "__main__":
    main()
