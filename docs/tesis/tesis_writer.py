"""Inserción de contenido en la plantilla UMG respetando sus estilos.

Marcado dentro del texto:
  *texto*    -> cursiva
  **texto**  -> negrita
  [[texto]]  -> resaltado amarillo (dato que el autor debe completar o verificar)
"""

import copy
import re

from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt
from docx.table import Table
from docx.text.paragraph import Paragraph

ESTILO_ANEXO = "Título anexo"
TOKEN = re.compile(r"(\*\*.+?\*\*|\*.+?\*|\[\[.+?\]\])")
W_P = qn("w:p")
W_TBL = qn("w:tbl")


def texto(el):
    return "".join(t.text or "" for t in el.iter(qn("w:t")))


def agregar_runs(par, contenido, tam=None, fuente=None):
    for trozo in TOKEN.split(contenido):
        if not trozo:
            continue
        negrita = cursiva = resaltar = False
        if trozo.startswith("**") and trozo.endswith("**"):
            trozo, negrita = trozo[2:-2], True
        elif trozo.startswith("[[") and trozo.endswith("]]"):
            trozo, resaltar = trozo[2:-2], True
        elif trozo.startswith("*") and trozo.endswith("*") and len(trozo) > 1:
            trozo, cursiva = trozo[1:-1], True
        r = par.add_run(trozo)
        if negrita:
            r.bold = True
        if cursiva:
            r.italic = True
        if resaltar:
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        if tam:
            r.font.size = Pt(tam)
        if fuente:
            r.font.name = fuente


def reemplazar_texto(par_el, doc, contenido):
    """Sustituye el texto de un párrafo conservando su estilo y sus marcadores."""
    for hijo in list(par_el):
        if hijo.tag in (qn("w:r"), qn("w:proofErr"), qn("w:hyperlink")):
            par_el.remove(hijo)
    agregar_runs(Paragraph(par_el, doc._body), contenido)


class Writer:
    """Inserta bloques antes de un elemento ancla del cuerpo del documento."""

    def __init__(self, doc, ancla):
        self.doc = doc
        self.ancla = ancla
        self.estilo_tabla = None
        for t in doc.tables:
            if t.style is not None:
                self.estilo_tabla = t.style
                break

    # ------------------------------------------------------------------ base
    def _par(self, estilo=None):
        p = OxmlElement("w:p")
        self.ancla.addprevious(p)
        par = Paragraph(p, self.doc._body)
        if estilo:
            par.style = self.doc.styles[estilo]
        return par

    def _salto_de_pagina(self, par):
        par.paragraph_format.page_break_before = True

    # -------------------------------------------------------------- títulos
    def capitulo(self, titulo):
        par = self._par("Heading 1")
        self._salto_de_pagina(par)
        par.add_run(titulo)

    def titulo_posterior(self, titulo):
        par = self._par("Títulos posteriores")
        self._salto_de_pagina(par)
        par.add_run(titulo)

    def h1(self, titulo):
        self._par("Subtítulo 1").add_run(titulo)

    def h2(self, titulo):
        self._par("Subtítulo 2").add_run(titulo)

    def h3(self, titulo):
        self._par("Subtítulo 3").add_run(titulo)

    def anexo(self, titulo):
        par = self._par(ESTILO_ANEXO)
        self._salto_de_pagina(par)
        par.add_run(titulo)

    def encabezado_anexo(self, titulo):
        par = self._par()
        par.paragraph_format.first_line_indent = Cm(0)
        par.paragraph_format.space_before = Pt(12)
        par.paragraph_format.keep_with_next = True
        agregar_runs(par, f"**{titulo}**")

    # ---------------------------------------------------------------- texto
    def p(self, contenido, sangria=True):
        par = self._par()
        if not sangria:
            par.paragraph_format.first_line_indent = Cm(0)
        agregar_runs(par, contenido)
        return par

    def viñetas(self, items, simbolo="•"):
        for it in items:
            par = self._par()
            par.paragraph_format.left_indent = Cm(1.27)
            par.paragraph_format.first_line_indent = Cm(-0.63)
            agregar_runs(par, f"{simbolo}\t{it}")

    def numerada(self, items):
        for i, it in enumerate(items, 1):
            par = self._par()
            par.paragraph_format.left_indent = Cm(1.27)
            par.paragraph_format.first_line_indent = Cm(-0.63)
            agregar_runs(par, f"{i}.\t{it}")

    def ecuacion(self, formula, numero=None):
        par = self._par()
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.paragraph_format.first_line_indent = Cm(0)
        agregar_runs(par, f"*{formula}*" + (f"\t\t({numero})" if numero else ""))

    def codigo(self, bloque):
        for linea in bloque.strip("\n").split("\n"):
            par = self._par()
            fmt = par.paragraph_format
            fmt.line_spacing = 1.0
            fmt.first_line_indent = Cm(0)
            fmt.left_indent = Cm(0.63)
            par.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = par.add_run(linea if linea else " ")
            r.font.name = "Consolas"
            r.font.size = Pt(9)
        self._par().paragraph_format.line_spacing = 1.0

    def termino(self, nombre, definicion):
        par = self._par()
        agregar_runs(par, f"**{nombre}.** {definicion}")

    def referencia(self, contenido):
        par = self._par()
        fmt = par.paragraph_format
        fmt.left_indent = Cm(1.27)
        fmt.first_line_indent = Cm(-1.27)
        par.alignment = WD_ALIGN_PARAGRAPH.LEFT
        agregar_runs(par, contenido)

    # ------------------------------------------------------ figuras / tablas
    def _leyenda(self, estilo, titulo):
        par = self._par(estilo)
        par.paragraph_format.keep_with_next = True
        par.add_run().add_break(WD_BREAK.LINE)
        agregar_runs(par, titulo)

    def nota(self, contenido="Elaboración propia."):
        par = self._par("Fuente")
        agregar_runs(par, f"*Nota.* {contenido}")

    def figura(self, titulo, descripcion, nota="Elaboración propia."):
        self._leyenda("Figuras formato", titulo)
        par = self._par()
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.paragraph_format.first_line_indent = Cm(0)
        par.paragraph_format.keep_with_next = True
        agregar_runs(par, f"[[PEGAR AQUÍ LA CAPTURA: {descripcion}]]")
        self.nota(nota)

    def leyenda_figura_existente(self, titulo):
        self._leyenda("Figuras formato", titulo)

    def tabla(self, titulo, encabezados, filas, nota="Elaboración propia.", anchos=None):
        self._leyenda("Tablas formato", titulo)
        t = self.doc.add_table(rows=1, cols=len(encabezados))
        if self.estilo_tabla is not None:
            t.style = self.estilo_tabla
        self._bordes(t)
        for i, e in enumerate(encabezados):
            self._celda(t.rows[0].cells[i], f"**{e}**")
        for fila in filas:
            cells = t.add_row().cells
            for i, v in enumerate(fila):
                self._celda(cells[i], v)
        if anchos:
            for fila in t.rows:
                for i, ancho in enumerate(anchos):
                    fila.cells[i].width = Cm(ancho)
        self.ancla.addprevious(t._tbl)
        self.nota(nota)
        return t

    def _celda(self, celda, contenido):
        par = celda.paragraphs[0]
        fmt = par.paragraph_format
        fmt.first_line_indent = Cm(0)
        fmt.line_spacing = 1.0
        fmt.space_before = Pt(2)
        fmt.space_after = Pt(2)
        par.alignment = WD_ALIGN_PARAGRAPH.LEFT
        agregar_runs(par, contenido, tam=10)

    @staticmethod
    def _bordes(t):
        tbl_pr = t._tbl.tblPr
        bordes = OxmlElement("w:tblBorders")
        for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
            b = OxmlElement(f"w:{lado}")
            b.set(qn("w:val"), "single")
            b.set(qn("w:sz"), "4")
            b.set(qn("w:space"), "0")
            b.set(qn("w:color"), "000000")
            bordes.append(b)
        siguientes = [qn(f"w:{n}") for n in ("shd", "tblLayout", "tblCellMar", "tblLook", "tblCaption", "tblDescription")]
        posterior = next((h for h in tbl_pr if h.tag in siguientes), None)
        if posterior is not None:
            posterior.addprevious(bordes)
        else:
            tbl_pr.append(bordes)


# ---------------------------------------------------------------------------
# Búsqueda y edición sobre el cuerpo
# ---------------------------------------------------------------------------
def crear_estilo_anexo(doc):
    if ESTILO_ANEXO in [s.name for s in doc.styles]:
        return
    st = doc.styles.add_style(ESTILO_ANEXO, WD_STYLE_TYPE.PARAGRAPH)
    st.base_style = doc.styles["Normal"]
    st.next_paragraph_style = doc.styles["Normal"]
    st.font.bold = True
    fmt = st.paragraph_format
    fmt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fmt.first_line_indent = Cm(0)
    fmt.keep_with_next = True
    fmt.space_after = Pt(12)


def campo(par, instruccion, marcador):
    """Agrega a un párrafo un campo de Word con un texto provisional como resultado."""
    def fld(tipo):
        r = OxmlElement("w:r")
        f = OxmlElement("w:fldChar")
        f.set(qn("w:fldCharType"), tipo)
        if tipo == "begin":
            f.set(qn("w:dirty"), "true")
        r.append(f)
        par._p.append(r)

    fld("begin")
    r = OxmlElement("w:r")
    t = OxmlElement("w:instrText")
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = f" {instruccion} "
    r.append(t)
    par._p.append(r)
    fld("separate")
    par.add_run(marcador)
    fld("end")


def hijos(doc):
    return list(doc.element.body.iterchildren())


def buscar(doc, inicio, estilo=None, desde=None, exacto=False):
    """Primer párrafo cuyo texto empieza con `inicio` (opcionalmente con estilo)."""
    activo = desde is None
    for el in hijos(doc):
        if not activo:
            activo = el is desde
            continue
        if el.tag != W_P:
            continue
        t = texto(el).strip()
        ok = (t == inicio) if exacto else t.startswith(inicio)
        if ok and (estilo is None or Paragraph(el, doc._body).style.name == estilo):
            return el
    raise LookupError(f"No se encontró el párrafo: {inicio!r} ({estilo})")


def siguiente(el, condicion):
    sig = el.getnext()
    while sig is not None and not condicion(sig):
        sig = sig.getnext()
    return sig


def eliminar(el):
    """Elimina un elemento; si lleva un salto de sección, solo vacía su contenido."""
    if el.tag == qn("w:sectPr"):
        return
    ppr = el.find(qn("w:pPr")) if el.tag == W_P else None
    if ppr is not None and ppr.find(qn("w:sectPr")) is not None:
        for hijo in list(el):
            if hijo is not ppr:
                el.remove(hijo)
        return
    el.getparent().remove(el)


def eliminar_entre(inicio, fin):
    el = inicio.getnext()
    while el is not None and el is not fin:
        sig = el.getnext()
        eliminar(el)
        el = sig


def tiene_imagen(el):
    return any(True for _ in el.iter("{http://schemas.openxmlformats.org/drawingml/2006/picture}pic"))


def reemplazar_en_runs(raiz, cambios):
    """Reemplaza cadenas contenidas íntegramente en un mismo w:t."""
    pendientes = {k: 0 for k, _ in cambios}
    for t in raiz.iter(qn("w:t")):
        if not t.text:
            continue
        nuevo = t.text
        for viejo, reemplazo in cambios:
            if viejo in nuevo:
                pendientes[viejo] += nuevo.count(viejo)
                nuevo = nuevo.replace(viejo, reemplazo)
        if nuevo != t.text:
            t.text = nuevo
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    return pendientes


def clonar(el):
    return copy.deepcopy(el)
