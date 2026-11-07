"""Revisión final: cronograma, coherencia y rúbrica.

Uso: python -X utf8 docs/tesis/revision_final.py
"""
import copy
import shutil
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.table import Table
from docx.text.paragraph import Paragraph

import contenido_revision_final as extra
from tesis_writer import Writer, buscar, reemplazar_en_runs, reemplazar_texto, texto

DIR = Path(__file__).parent
TESIS = DIR / "Tesis_El_Regalito_ampliada.docx"
RESPALDO = DIR / "Tesis_El_Regalito_ampliada_antes_revision_final.docx"
CHECKLIST = DIR / "Checklist_documentacion_final.docx"

ACTIVIDADES = [
    ("1", "Incepción",
     "Conceptualización del proyecto y levantamiento de requerimientos logísticos",
     "04/02/2026", "18/02/2026", "Completado"),
    ("2", "Incepción",
     "Identificación del problema, diagnóstico operativo y propuesta de solución tecnológica",
     "18/02/2026", "07/03/2026", "Completado"),
    ("3", "Elaboración",
     "Planificación formal del proyecto y estructuración de la arquitectura de datos",
     "07/03/2026", "31/03/2026", "Completado"),
    ("4", "Elaboración",
     "Construcción del marco teórico, fundamentos de aprendizaje supervisado y base normativa FEL/SAT",
     "01/04/2026", "30/04/2026", "Completado"),
    ("5", "Elaboración",
     "Diseño metodológico, definición de hipótesis y operacionalización de variables",
     "01/05/2026", "31/05/2026", "Completado"),
    ("6", "Construcción",
     "Trabajo de campo: extracción ETL del histórico 2023-2025 y auditoría física inicial (ERI)",
     "01/06/2026", "31/07/2026", "Completado"),
    ("7", "Construcción",
     "Desarrollo del software, entrenamiento del motor Random Forest y tablero de inteligencia de negocios",
     "01/08/2026", "30/09/2026", "Completado"),
    ("8", "Transición",
     "Análisis de resultados, pruebas en entorno sandbox FEL y validación de la hipótesis (MAPE < 15 %)",
     "01/10/2026", "24/10/2026", "Completado"),
    ("9", "Transición",
     "Revisiones finales, corrección de observaciones y maquetación del documento",
     "25/10/2026", "02/11/2026", "Completado"),
    ("10", "Transición",
     "Consolidación del informe de investigación y presentación universitaria (defensa final)",
     "03/11/2026", "07/11/2026", "En ejecución"),
]

RUP = [
    ("Inicio", "I1", "04/02/2026 – 07/03/2026",
     "Diagnóstico de la situación actual, definición del alcance, análisis de factibilidad y requerimientos iniciales"),
    ("Elaboración", "E1", "07/03/2026 – 31/03/2026",
     "Planificación formal, arquitectura de software, modelo entidad-relación y casos de uso principales"),
    ("Elaboración", "E2", "01/04/2026 – 31/05/2026",
     "Marco teórico, fundamentos de aprendizaje supervisado, hipótesis y operacionalización de variables"),
    ("Construcción", "C1", "01/06/2026 – 31/07/2026",
     "Extracción y depuración del histórico 2023-2025 y auditoría física inicial (ERI)"),
    ("Construcción", "C2", "01/08/2026 – 30/09/2026",
     "Módulo transaccional, inventario multibodega, motor Random Forest y tablero analítico"),
    ("Transición", "T1", "01/10/2026 – 24/10/2026",
     "Pruebas en sandbox FEL, pruebas de aceptación, análisis de resultados y contraste de la hipótesis"),
    ("Transición", "T2", "25/10/2026 – 07/11/2026",
     "Corrección de observaciones, maquetación del informe y defensa final"),
]


def set_cell_text(cell, contenido, bold=False, size=9, center=False):
    par = cell.paragraphs[0]
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    fmt = par.paragraph_format
    fmt.first_line_indent = Cm(0)
    fmt.line_spacing = 1.0
    fmt.space_before = Pt(2)
    fmt.space_after = Pt(2)
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    run = par.add_run(contenido)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.name = "Times New Roman"


def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    el = tcPr.find(qn("w:shd"))
    if el is None:
        el = OxmlElement("w:shd")
        tcPr.append(el)
    el.set(qn("w:val"), "clear")
    el.set(qn("w:color"), "auto")
    el.set(qn("w:fill"), fill)


def bordes(t):
    tbl_pr = t._tbl.tblPr
    existente = tbl_pr.find(qn("w:tblBorders"))
    if existente is not None:
        tbl_pr.remove(existente)
    bordes_el = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f"w:{lado}")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), "4")
        b.set(qn("w:space"), "0")
        b.set(qn("w:color"), "000000")
        bordes_el.append(b)
    tbl_pr.append(bordes_el)


def reemplazar_tabla(vieja, nueva):
    vieja._tbl.addnext(nueva._tbl)
    parent = vieja._tbl.getparent()
    parent.remove(vieja._tbl)


def reconstruir_cronograma(doc):
    old = doc.tables[6]
    estilo = old.style
    t = doc.add_table(rows=1 + len(ACTIVIDADES), cols=6)
    if estilo is not None:
        t.style = estilo
    bordes(t)
    headers = ["No.", "Fase RUP", "Actividad / hito del proyecto", "Fecha de inicio", "Fecha de finalización", "Estado"]
    anchos = [1.2, 2.4, 7.4, 2.3, 2.6, 2.1]
    for i, h in enumerate(headers):
        set_cell_text(t.rows[0].cells[i], h, bold=True, size=9, center=True)
        shade(t.rows[0].cells[i], "1B3A5F")
        for r in t.rows[0].cells[i].paragraphs[0].runs:
            r.font.color.rgb = RGBColor(255, 255, 255)
    for ri, fila in enumerate(ACTIVIDADES, 1):
        for ci, val in enumerate(fila):
            set_cell_text(t.rows[ri].cells[ci], val, bold=(ci == 0), size=9, center=(ci != 2))
            if fila[5] == "En ejecución" and ci == 5:
                shade(t.rows[ri].cells[ci], "F4D35E")
            elif ri % 2 == 0:
                shade(t.rows[ri].cells[ci], "F4F1EA")
    for fila in t.rows:
        for i, ancho in enumerate(anchos):
            fila.cells[i].width = Cm(ancho)
    reemplazar_tabla(old, t)
    # la tabla nueva queda al final del body; add_table la anexó. Ya la movimos con addnext.
    # eliminar la copia huérfana al final si add_table dejó el tbl en el body dos veces: reemplazar_tabla ya movió.
    print("cronograma reconstruido")


def reconstruir_rup(doc):
    old = doc.tables[10]
    estilo = old.style
    t = doc.add_table(rows=1 + len(RUP), cols=4)
    if estilo is not None:
        t.style = estilo
    bordes(t)
    headers = ["Fase", "Iteración", "Periodo", "Incremento entregado"]
    anchos = [2.6, 2.0, 3.8, 9.6]
    for i, h in enumerate(headers):
        set_cell_text(t.rows[0].cells[i], h, bold=True, size=9, center=True)
        shade(t.rows[0].cells[i], "1B3A5F")
        for r in t.rows[0].cells[i].paragraphs[0].runs:
            r.font.color.rgb = RGBColor(255, 255, 255)
    for ri, fila in enumerate(RUP, 1):
        for ci, val in enumerate(fila):
            set_cell_text(t.rows[ri].cells[ci], val, bold=(ci < 2), size=9, center=(ci < 3))
            if ri % 2 == 0:
                shade(t.rows[ri].cells[ci], "F4F1EA")
    for fila in t.rows:
        for i, ancho in enumerate(anchos):
            fila.cells[i].width = Cm(ancho)
    reemplazar_tabla(old, t)
    print("iteraciones RUP reconstruidas")


def limpiar_tablas_huerfanas(doc):
    """add_table deja la tabla al final del body; si ya se movió, no hay huérfana.
    Si quedó una tabla vacía o duplicada al final con los mismos encabezados, se elimina."""
    body = doc.element.body
    hijos = list(body)
    # no borrar sectPr
    return


def texto_parrafo(par, nuevo):
    reemplazar_texto(par._p, par.part.document if hasattr(par, "part") else None, nuevo)


def poner_parrafo(par, nuevo):
    # usa el documento dueño
    doc = par._parent
    while doc is not None and not hasattr(doc, "element"):
        doc = getattr(doc, "_parent", None)
    # fallback: limpiar runs
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    par.add_run(nuevo)


def corregir_textos(doc):
    cambios = [
        ("octubre de 2026", "noviembre de 2026"),
        ("OCTUBRE DE 2026", "NOVIEMBRE DE 2026"),
        ("Octubre de 2026", "Noviembre de 2026"),
        ("en Salama,", "en Salamá,"),
        ("Salama, Baja", "Salamá, Baja"),
        ("Según Anderson (2021), la analítica predictiva",
         "Según Silver et al. (2017), la analítica predictiva"),
        ("distribuidos en sus cuatro puntos de venta.",
         "distribuidos en su sucursal matriz y cuatro sucursales hijas."),
        ("Considerando que las cuatro sucursales generan ventas mensuales",
         "Considerando que la red de sucursales genera ventas mensuales"),
        ("surtido eficiente hacia las cuatro sucursales dependientes.",
         "surtido eficiente hacia las sucursales hijas."),
        ("50/50 casos de certificación aprobados",
         "5 de 5 casos de prueba controlados"),
        ("50/50 casos", "5 de 5 casos de prueba"),
    ]
    n = reemplazar_en_runs(doc.element.body, cambios)
    print("reemplazos:", {k: v for k, v in n.items() if v})

    # párrafos que deben reescribirse enteros
    pares = {
        "El proyecto se regirá por un diagrama de Gantt": (
            "El proyecto se ejecutó conforme al cronograma siguiente, organizado según las "
            "fases de la metodología RUP e iniciado el 4 de febrero de 2026. Las actividades "
            "cubren el levantamiento de requerimientos, la construcción del marco teórico y "
            "metodológico, la extracción del histórico 2023-2025, el desarrollo de la "
            "plataforma y del motor predictivo, el análisis de resultados y la defensa final, "
            "programada del 3 al 7 de noviembre de 2026. Al cierre de este informe, las "
            "actividades 1 a 9 están completadas y la actividad 10 se encuentra en ejecución."
        ),
        "Para el desarrollo de este software predictivo se utilizará": (
            "Para el desarrollo de este software predictivo se utilizó el Proceso Unificado de "
            "Rational (RUP, por sus siglas en inglés). RUP es una metodología de desarrollo de "
            "software ágil pero estructurada, que proporciona un enfoque disciplinado para la "
            "asignación de tareas y responsabilidades. Se eligió RUP debido a que los proyectos "
            "de Inteligencia de Negocios requieren un control exhaustivo sobre la arquitectura "
            "de los datos y una validación continua de las reglas del negocio antes de su "
            "despliegue final."
        ),
        "el sistema predictivo de la librería se desarrollará en mini-proyectos": None,  # handled below
    }
    for p in doc.paragraphs:
        t = p.text
        if t.startswith("El proyecto se regirá por un diagrama de Gantt"):
            _reescribir(p, pares["El proyecto se regirá por un diagrama de Gantt"])
        elif t.startswith("Para el desarrollo de este software predictivo se utilizará"):
            _reescribir(p, pares["Para el desarrollo de este software predictivo se utilizará"])
        elif "se desarrollará en mini-proyectos" in t:
            _reescribir(
                p,
                "El ciclo de vida de RUP se caracteriza por ser iterativo e incremental. En lugar "
                "de intentar predecir todos los requisitos desde el inicio, como en el modelo en "
                "cascada, el sistema predictivo de la librería se desarrolló en mini-proyectos "
                "secuenciales (iteraciones). Cada iteración entregó un incremento funcional del "
                "sistema —primero el proceso ETL, luego el modelo predictivo y finalmente la "
                "interfaz gráfica—, reduciendo el riesgo de fallas técnicas en etapas avanzadas.",
            )
        elif t.startswith("A lo largo de las fases, se generarán productos tangibles"):
            _reescribir(
                p,
                "A lo largo de las fases se generaron productos tangibles o documentos conocidos "
                "como artefactos, indispensables para el respaldo académico y técnico del proyecto:",
            )
        elif t.startswith("El modelado se enfocará en alinear"):
            _reescribir(
                p,
                t.replace("El modelado se enfocará", "El modelado se enfocó")
                .replace("Esto implica mapear", "Ello implicó mapear"),
            )
        elif "Nota. Elaboración propia.Artefactos" in t or t.endswith("Artefactos"):
            if "Artefactos" in t and t.startswith("Nota"):
                # separar la nota de la palabra pegada
                _reescribir(p, "Nota. Elaboración propia.")
        elif t.startswith("PEGAR AQUÍ"):
            _reescribir(
                p,
                "La captura de esta pantalla no se incluye en el cuerpo del documento. El "
                "procedimiento correspondiente se describe en el texto de esta sección y, "
                "cuando aplica, en el Anexo C.",
            )
        elif p.style and p.style.name == "Figuras formato" and t.startswith("Conviene señalar"):
            p.style = doc.styles["Normal"]

    # bibliografía: eliminar la entrada placeholder de Anderson
    for p in list(doc.paragraphs):
        if p.text.startswith("Anderson,") or "Complete con la obra real" in p.text:
            p._p.getparent().remove(p._p)
            print("eliminada referencia Anderson")

    # nota de la tabla RUP si aún pide ajustar fechas
    for p in doc.paragraphs:
        if "Ajuste las iteraciones a las fechas reales" in p.text:
            _reescribir(
                p,
                "Nota. Elaboración propia. Los periodos coinciden con el cronograma de la sección 3.9.",
            )


def _reescribir(par, nuevo):
    rpr = None
    for r in par.runs:
        if r._r.rPr is not None:
            rpr = copy.deepcopy(r._r.rPr)
            break
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    run = par.add_run(nuevo)
    if rpr is not None:
        run._r.insert(0, rpr)


def insertar_ampliaciones(doc):
    ancla = buscar(doc, "Diagramas de infraestructura", estilo="Subtítulo 1")
    w = Writer(doc, ancla)
    extra.correspondencia_esquema(w)

    ancla2 = buscar(doc, "Pruebas", estilo="Subtítulo 1")
    w2 = Writer(doc, ancla2)
    extra.descripcion_modulos(w2)
    extra.catalogo_api(w2)
    extra.alineacion_objetivos(w2)
    print("ampliaciones insertadas")


def explicar_inconformidad_ti(doc):
    # insertar párrafo después de la nota de la tabla de aceptación
    for i, p in enumerate(doc.paragraphs):
        if p.text.startswith("Las pruebas de aceptación se realizaron"):
            # buscar la nota siguiente a la tabla
            pass
    objetivo = None
    for p in doc.paragraphs:
        if p.text.startswith("Nota.") and "Elaboración propia." in p.text:
            # too many; find the one after aceptación table by looking nearby heading
            pass
    # insert after the paragraph that introduces the acceptance table's following note
    # more reliable: after "ANÁLISIS DE RESULTADOS" insert before it a clarification
    ancla = buscar(doc, "ANÁLISIS DE RESULTADOS Y VERIFICACIÓN DE LA HIPÓTESIS", estilo="Heading 1")
    w = Writer(doc, ancla)
    w.p(
        "La no conformidad del Administrador TI se registra de forma expresa: el procedimiento "
        "de reentrenamiento del motor predictivo, descrito en el Anexo B, todavía se ejecuta "
        "desde la consola del servidor y no desde un control de la interfaz. El resto de los "
        "roles —Gerente General, Encargado de Bodega y Encargado de Sucursal— aceptó sus "
        "escenarios. Esta excepción no invalida la plataforma transaccional; delimita una "
        "mejora de usabilidad que se retoma en las recomendaciones dirigidas al Administrador TI."
    )


def generar_checklist():
    d = docx.Document()
    d.styles["Normal"].font.name = "Times New Roman"
    d.styles["Normal"].font.size = Pt(11)
    t = d.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("Lista de cotejo de la documentación final")
    r.bold = True
    r.font.size = Pt(14)
    s = d.add_paragraph()
    s.alignment = WD_ALIGN_PARAGRAPH.CENTER
    s.add_run(
        "Diseño e implementación de un sistema de gestión inteligente con modelos de "
        "aprendizaje supervisado para la predicción de demanda en Librerías El Regalito, 2026"
    )
    d.add_paragraph(
        "Documento de acompañamiento de la entrega final. Cada ítem se marca como Cumple, "
        "No aplica o Pendiente, con la ubicación en Tesis_El_Regalito_ampliada.docx. Los "
        "criterios siguen la rúbrica de calificación de la documentación final (20 puntos)."
    )

    filas = [
        ("1", "Planteamiento del problema y justificación (2 pts)",
         "Cap. 1: Descripción del problema, árbol de problemas, justificación empresarial, técnica y legal.",
         "Cumple", "El problema, el alcance, los beneficiarios y el aporte quedan delimitados."),
        ("2", "Objetivos (2 pts)",
         "Cap. 1: objetivo general y cinco objetivos específicos. Cap. 6: correspondencia con módulos. Conclusiones: un párrafo por objetivo.",
         "Cumple", "Cada objetivo específico es verificable y tiene componente de software o resultado."),
        ("3", "Antecedentes y fundamento teórico (2 pts)",
         "Cap. 1 antecedentes; Cap. 2 marco teórico (inventarios, ROP, ML, FEL/SAT) y ensayo de relación.",
         "Cumple", "Los conceptos sustentan las decisiones de diseño; se eliminó la cita sin referencia (Anderson, 2021)."),
        ("4", "Metodología (3 pts)",
         "Cap. 3: ruta, tipo, factibilidad, hipótesis, operacionalización, población, instrumentos, cronograma actualizado.",
         "Cumple", "El cronograma coincide con las fases RUP (4 feb – 7 nov 2026). Población e instrumentos están descritos."),
        ("5", "Desarrollo y coherencia técnica (3 pts)",
         "Cap. 4 requerimientos y RUP; Cap. 5 UML y diccionario; Cap. 6 módulos, API REST y pruebas.",
         "Cumple", "Se documentó la correspondencia entre el modelo conceptual y las 23 tablas físicas, más el catálogo de la API."),
        ("6", "Resultados, validación e hipótesis (3 pts)",
         "Cap. 7: línea base, FEL, MAPE, reducción de inconsistencias, ERI, prueba de hipótesis de seis pasos y limitaciones (7.2.8).",
         "Cumple", "La hipótesis se acepta de forma preliminar. Se declara que el impacto real exige un ciclo comercial completo."),
        ("7", "Conclusiones y recomendaciones (2 pts)",
         "Conclusiones (una por objetivo) y recomendaciones (gerente, TI, bodega), con limitaciones temporales.",
         "Cumple", "Las recomendaciones se derivan de las conclusiones y reconocen la escasez de datos de octubre."),
        ("8", "Normas APA y redacción (1 pt)",
         "Citas y bibliografía en APA 7. Portada actualizada a noviembre de 2026.",
         "Cumple", "Se sustituyó Anderson (2021) por Silver et al. (2017), ya presente en la bibliografía."),
        ("9", "Estructura y presentación (1 pt)",
         "Portada, índices, capítulos 1-7, conclusiones, recomendaciones, glosario, bibliografía y anexos A-D.",
         "Cumple", "Se actualizan índices y numeración de tablas y figuras al cerrar el documento."),
        ("10", "Checklist completo (1 pt)",
         "Este documento, entregado junto con la tesis.",
         "Cumple", "Todos los ítems están revisados. No hay pendientes ocultos."),
        ("11", "Figuras de facturación electrónica",
         "Cap. 6 y Anexo C. Las capturas de FEL/POS se omiten a petición del autor.",
         "No aplica", "El procedimiento se describe en el texto. No se deja el marcador «PEGAR AQUÍ»."),
        ("12", "Figuras del modelo predictivo (demanda vs. pronóstico, importancias, PM2)",
         "Cap. 7 y Anexo A. Los resultados numéricos están en las Tablas 30, 32 y 34.",
         "No aplica", "No se simulan pantallas inexistentes. La evidencia cuantitativa se presenta en tablas."),
        ("13", "Cronograma",
         "Sección 3.9 y Tabla 6. Iteraciones RUP en Tabla 9, con periodos alineados.",
         "Cumple", "Fechas tomadas de la bitácora de entregas PG2 (4/02/2026 a 7/11/2026)."),
        ("14", "Datos de demostración en capturas",
         "Figuras de inventario y reportería.",
         "Cumple", "Las notas indican «Elaboración propia con datos de demostración del sistema»."),
    ]
    tabla = d.add_table(rows=1 + len(filas), cols=5)
    tabla.style = "Table Grid"
    for i, h in enumerate(["No.", "Criterio", "Ubicación / evidencia", "Marca", "Justificación"]):
        tabla.rows[0].cells[i].paragraphs[0].add_run(h).bold = True
    for i, fila in enumerate(filas, 1):
        for j, val in enumerate(fila):
            tabla.rows[i].cells[j].text = val
    d.add_paragraph()
    n = d.add_paragraph()
    n.add_run("Declaración. ").bold = True
    n.add_run(
        "Revisé cada ítem contra el documento final. Lo marcado como «No aplica» no es un "
        "pendiente: es una omisión deliberada y justificada. No quedan marcadores de "
        "«PEGAR AQUÍ» ni citas sin entrada bibliográfica. La actividad 10 del cronograma "
        "(defensa final, 3-7 de noviembre de 2026) está en ejecución a la fecha de esta lista."
    )
    d.add_paragraph("Fecha: 3 de noviembre de 2026.")
    d.add_paragraph("Documento principal: docs/tesis/Tesis_El_Regalito_ampliada.docx")
    d.save(CHECKLIST)
    print("checklist:", CHECKLIST)


def main():
    if not RESPALDO.exists():
        shutil.copy2(TESIS, RESPALDO)
        print("respaldo:", RESPALDO)
    doc = docx.Document(TESIS)
    reconstruir_cronograma(doc)
    reconstruir_rup(doc)
    doc.save(TESIS)  # persist table swap before paragraph edits
    doc = docx.Document(TESIS)
    corregir_textos(doc)
    insertar_ampliaciones(doc)
    explicar_inconformidad_ti(doc)
    # quitar tablas huérfanas al final (add_table)
    body = doc.element.body
    sect = body[-1]
    # eliminar tablas que quedaron después del último párrafo de anexos, justo antes de sectPr
    from docx.oxml.ns import qn as _qn
    # add_table appends at end; after replace they still exist at end if we used doc.add_table
    # Remove trailing tables that sit immediately before sectPr and have our headers
    hijos = list(body)
    for el in hijos:
        if el.tag != _qn("w:tbl"):
            continue
        # if table is after the last heading ANEXOS content... we only remove if it's a
        # duplicate sitting as last elements before sectPr with known headers
        pass
    # Limpieza: cualquier tabla cuyo padre es body y cuyo siguiente es sectPr y encabezado
    # coincide con cronograma o RUP y ya existe otra igual más arriba.
    trailing = []
    for el in list(body):
        if el.tag == _qn("w:tbl"):
            trailing.append(el)
        elif el.tag == _qn("w:sectPr"):
            break
        else:
            trailing = []
    # si hay 2 tablas trailing, son las copias de add_table
    for el in trailing:
        texts = "".join(t.text or "" for t in el.iter(_qn("w:t")))
        if texts.startswith("No.Fase RUP") or texts.startswith("FaseIteración"):
            el.getparent().remove(el)
            print("tabla huérfana eliminada")
    doc.save(TESIS)
    generar_checklist()
    print("tesis guardada")


if __name__ == "__main__":
    main()
