"""Repara los índices (general, de figuras y de tablas) de la tesis.

Uso: python docs/tesis/arreglar_indices.py [documento.docx]

El índice general se basa en niveles de esquema de los estilos, por lo que no
depende del separador de listas configurado en Windows. Los índices de figuras
y tablas usan el separador de listas del equipo (',' en es-US / es-GT).
"""

import re
import shutil
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Twips
from docx.text.paragraph import Paragraph

from tesis_writer import ESTILO_ANEXO, W_P, campo, crear_estilo_anexo

SEPARADOR = ","
NIVELES = {
    "Heading 1": 1,
    "Tesis T1": 1,
    "TITULO PRELIMINAR": 1,
    "Títulos posteriores": 1,
    "Subtítulo 1": 2,
    "Subtítulo 2": 3,
    "Subtítulo 3": 4,
    ESTILO_ANEXO: 2,
}
NIVEL_ILUSTRACIONES = 9
INDICE_GENERAL = 'TOC \\o "1-4" \\h \\z \\u'
INDICE_FIGURAS = f'TOC \\h \\z \\t "Figuras formato{SEPARADOR}{NIVEL_ILUSTRACIONES}"'
INDICE_TABLAS = f'TOC \\h \\z \\t "Tablas formato{SEPARADOR}{NIVEL_ILUSTRACIONES}"'
SANGRIA_LEYENDA = Twips(1560)
ANEXO = re.compile(r"^Anexo [A-Z]\.")
CAPITULOS_SIN_NUMERO = ("DESCRIPCIÓN DEL ESTUDIO",)


def fijar_nivel_esquema(estilo, nivel):
    ppr = estilo.element.get_or_add_pPr()
    for viejo in ppr.findall(qn("w:outlineLvl")):
        ppr.remove(viejo)
    nuevo = OxmlElement("w:outlineLvl")
    nuevo.set(qn("w:val"), str(nivel - 1))
    siguientes = ("w:textAlignment", "w:textboxTightWrap", "w:divId", "w:cnfStyle",
                  "w:rPr", "w:sectPr", "w:pPrChange")
    ancla = next((h for h in ppr if h.tag in {qn(s) for s in siguientes}), None)
    if ancla is not None:
        ancla.addprevious(nuevo)
    else:
        ppr.append(nuevo)


def quitar_nivel_directo(par_el):
    ppr = par_el.find(qn("w:pPr"))
    if ppr is not None:
        for o in ppr.findall(qn("w:outlineLvl")):
            ppr.remove(o)


def primer_campo(par_el):
    """fldChar inicial y w:instrText del primer campo de un párrafo."""
    inicio, textos = None, []
    for el in par_el.iter(qn("w:fldChar"), qn("w:instrText")):
        if el.tag == qn("w:instrText"):
            textos.append(el)
        elif el.get(qn("w:fldCharType")) == "begin" and inicio is None:
            inicio = el
        elif el.get(qn("w:fldCharType")) == "separate":
            break
    return inicio, textos


def campos_toc(doc):
    for par_el in doc.element.body.iter(W_P):
        inicio, textos = primer_campo(par_el)
        instr = "".join(t.text or "" for t in textos).strip()
        if inicio is not None and instr.startswith("TOC"):
            yield par_el, inicio, textos, instr


def cambiar_instruccion(inicio, textos, instruccion):
    textos[0].text = f" {instruccion} "
    for t in textos[1:]:
        t.text = ""
    inicio.set(qn("w:dirty"), "true")


def titulo_indice(doc, texto):
    for par_el in doc.element.body.iter(W_P):
        p = Paragraph(par_el, doc._body)
        if p.text.strip().upper().replace("INDICE", "ÍNDICE") == texto:
            return p
    raise LookupError(texto)


def insertar_indice_figuras(doc, figuras_titulo, tablas_titulo):
    """Crea el campo del índice de figuras si no existe entre ambos títulos."""
    el = figuras_titulo._p.getnext()
    while el is not None and el is not tablas_titulo._p:
        if el.tag == W_P and primer_campo(el)[0] is not None:
            return False
        el = el.getnext()
    nuevo = OxmlElement("w:p")
    figuras_titulo._p.addnext(nuevo)
    par = Paragraph(nuevo, figuras_titulo._parent)
    par.style = doc.styles["toc 1"] if "toc 1" in [s.name for s in doc.styles] else None
    campo(par, INDICE_FIGURAS, "Clic derecho > Actualizar campo para generar el índice de figuras.")
    return True


def actualizar_campos_al_abrir(doc):
    ajustes = doc.settings.element
    if ajustes.find(qn("w:updateFields")) is not None:
        return
    el = OxmlElement("w:updateFields")
    el.set(qn("w:val"), "true")
    siguientes = {qn(f"w:{n}") for n in (
        "hdrShapeDefaults", "footnotePr", "endnotePr", "compat", "docVars", "rsids", "attachedSchema",
        "themeFontLang", "clrSchemeMapping", "doNotIncludeSubdocsInStats", "doNotAutoCompressPictures",
        "forceUpgrade", "captions", "readModeInkLockDown", "smartTagType", "shapeDefaults",
        "doNotEmbedSmartTags", "decimalSymbol", "listSeparator")}
    siguientes.add("{http://schemas.openxmlformats.org/officeDocument/2006/math}mathPr")
    posterior = next((h for h in ajustes if h.tag in siguientes), None)
    if posterior is not None:
        posterior.addprevious(el)
    else:
        ajustes.append(el)


def estilo_indice_ilustraciones(doc):
    """Sangría francesa y relleno de puntos para las entradas de figuras y tablas."""
    estilos = doc.styles.element
    style_id = f"TOC{NIVEL_ILUSTRACIONES}"
    for s in estilos.findall(qn("w:style")):
        nombre = s.find(qn("w:name"))
        if nombre is not None and nombre.get(qn("w:val")).lower().startswith(f"toc {NIVEL_ILUSTRACIONES}"):
            estilos.remove(s)
    nuevo = OxmlElement("w:style")
    nuevo.set(qn("w:type"), "paragraph")
    nuevo.set(qn("w:styleId"), style_id)
    for tag, valor in (("w:name", f"toc {NIVEL_ILUSTRACIONES}"), ("w:basedOn", "Normal"),
                       ("w:next", "Normal"), ("w:uiPriority", "39"), ("w:unhideWhenUsed", None)):
        hijo = OxmlElement(tag)
        if valor is not None:
            hijo.set(qn("w:val"), valor)
        nuevo.append(hijo)
    estilos.append(nuevo)
    st = next(s for s in doc.styles if s.style_id == style_id)
    seccion = doc.sections[0]
    ancho = seccion.page_width - seccion.left_margin - seccion.right_margin
    fmt = st.paragraph_format
    fmt.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fmt.left_indent = SANGRIA_LEYENDA
    fmt.first_line_indent = -SANGRIA_LEYENDA
    fmt.right_indent = Twips(400)
    fmt.line_spacing = 1.15
    fmt.space_after = Pt(6)
    fmt.tab_stops.clear_all()
    fmt.tab_stops.add_tab_stop(SANGRIA_LEYENDA)
    fmt.tab_stops.add_tab_stop(ancho, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    st.font.bold = False
    st.font.italic = False


def numerar_capitulos(doc):
    for p in doc.paragraphs:
        if p.text.strip() in CAPITULOS_SIN_NUMERO and p.style.name != "Heading 1":
            p.style = doc.styles["Heading 1"]


def es_vacio(par_el):
    return (not "".join(t.text or "" for t in par_el.iter(qn("w:t"))).strip()
            and par_el.find(f"{qn('w:pPr')}/{qn('w:sectPr')}") is None
            and not list(par_el.iter(qn("w:drawing"), qn("w:pict"), qn("w:fldChar"))))


def quitar_vacios_tras_indice(titulo_siguiente):
    """Quita los párrafos vacíos que empujan el índice siguiente a una página en blanco."""
    el = titulo_siguiente._p.getprevious()
    quitados = 0
    while el is not None and el.tag == W_P and (es_vacio(el) or el.find(f"{qn('w:pPr')}/{qn('w:sectPr')}") is not None):
        anterior = el.getprevious()
        if es_vacio(el):
            el.getparent().remove(el)
            quitados += 1
        el = anterior
    return quitados


def quitar_titulo_contents(doc):
    """Elimina el título en inglés que Word agrega al insertar una tabla de contenido automática."""
    for sdt_content in doc.element.body.iter(qn("w:sdtContent")):
        for par_el in sdt_content.findall(qn("w:p")):
            p = Paragraph(par_el, doc._body)
            if p.text.strip() in ("Contents", "Table of Contents") and primer_campo(par_el)[0] is None:
                sdt_content.remove(par_el)
                return True
    return False


def arreglar(doc):
    crear_estilo_anexo(doc)
    nombres = {s.name: s for s in doc.styles}
    for nombre, nivel in NIVELES.items():
        if nombre in nombres:
            fijar_nivel_esquema(nombres[nombre], nivel)

    anexos = 0
    for p in doc.paragraphs:
        if ANEXO.match(p.text.strip()) and p.style.name in ("Normal", ESTILO_ANEXO):
            p.style = nombres[ESTILO_ANEXO]
            anexos += 1
    for par_el in doc.element.body.iter(W_P):
        if Paragraph(par_el, doc._body).style.name not in NIVELES:
            quitar_nivel_directo(par_el)

    numerar_capitulos(doc)
    estilo_indice_ilustraciones(doc)
    quitar_titulo_contents(doc)
    figuras = titulo_indice(doc, "ÍNDICE DE FIGURAS")
    tablas = titulo_indice(doc, "ÍNDICE DE TABLAS")
    creado = insertar_indice_figuras(doc, figuras, tablas)
    quitar_vacios_tras_indice(tablas)
    quitar_vacios_tras_indice(titulo_indice(doc, "INTRODUCCIÓN"))

    for _, inicio, textos, instr in campos_toc(doc):
        if "Figuras formato" in instr:
            cambiar_instruccion(inicio, textos, INDICE_FIGURAS)
        elif "Tablas formato" in instr:
            cambiar_instruccion(inicio, textos, INDICE_TABLAS)
        else:
            cambiar_instruccion(inicio, textos, INDICE_GENERAL)

    actualizar_campos_al_abrir(doc)
    return anexos, creado


def main():
    ruta = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("Tesis_El_Regalito_ampliada.docx")
    respaldo = ruta.with_name(ruta.stem + "_respaldo" + ruta.suffix)
    if not respaldo.exists():
        shutil.copy2(ruta, respaldo)
    doc = Document(ruta)
    anexos, creado = arreglar(doc)
    doc.save(ruta)
    print(f"Anexos con estilo de índice: {anexos}")
    print(f"Campo de índice de figuras creado: {creado}")
    for _, _, _, instr in campos_toc(doc):
        print("Campo:", instr)


if __name__ == "__main__":
    main()
