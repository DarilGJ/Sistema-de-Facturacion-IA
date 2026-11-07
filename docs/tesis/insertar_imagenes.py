"""Inserta las capturas y reportes en los espacios «PEGAR AQUÍ LA CAPTURA» de la tesis ampliada.

Uso: python -X utf8 docs/tesis/insertar_imagenes.py
"""
import copy
import shutil
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm

DIR = Path(__file__).parent
TESIS = DIR / "Tesis_El_Regalito_ampliada.docx"
RESPALDO = DIR / "Tesis_El_Regalito_ampliada_antes_imagenes.docx"
IMAGENES = DIR / "imagenes"
NOTA_DEMO = "Nota. Elaboración propia con datos de demostración del sistema."
NOTA = "Nota. Elaboración propia."

# texto que identifica el marcador -> (imagen, ancho en cm, nota)
FIGURAS = [
    ("formulario de compra con proveedor, bodega receptora", "compra_formulario.png", 13.5, NOTA_DEMO),
    ("listado de productos con SKU", "catalogo_productos.png", 15.5, NOTA_DEMO),
    ("tabla de existencias por producto y bodega", "existencias_bodega.png", 15.5, NOTA_DEMO),
    ("listado de movimientos con fecha, tipo, documento", "kardex_movimientos.png", 15.5, NOTA_DEMO),
    ("formulario de traslado con bodega de origen", "traslado_formulario.png", 15.5, NOTA_DEMO),
    ("formulario de ajuste con motivo", "ajustes_inventario.png", 15.5, NOTA_DEMO),
    ("tablero con productos bajo el ROP, cantidad sugerida y botón", "reporte_reabastecimiento.png", 15.5, NOTA_DEMO),
    ("listado de productos perecederos con días sin rotación", "reporte_baja_rotacion.png", 15.5, NOTA_DEMO),
    ("dashboard con productos bajo el ROP, cantidad sugerida y proveedor", "reporte_tablero_rop.png", 15.5,
     NOTA_DEMO),
    ("diagrama de despliegue con navegador", "diagrama_despliegue.png", 15.5, NOTA),
    ("MySQL Workbench o consola mostrando las tablas", "consola_mysql_tablas.png", 11.5, NOTA),
    ("pantalla de inicio de sesión con los campos completados", "login.png", 14, NOTA_DEMO),
    ("formulario de nueva compra", "compra_formulario.png", 13.5, NOTA_DEMO),
    ("formulario de traslado entre bodegas", "traslado_formulario.png", 15.5, NOTA_DEMO),
    ("alertas de baja rotación en el tablero", "reporte_baja_rotacion.png", 15.5, NOTA_DEMO),
]

SUBTITULO = "Alcance de la verificación y limitaciones de los datos de operación"
ACEPTACION = (
    "Con base en lo anterior, se acepta la hipótesis de investigación de forma preliminar: los indicadores "
    "evaluados mejoran en la dirección prevista, con un MAPE de 12.5 %, inferior al 15 %, y una reducción de 28.3 % "
    "en las inconsistencias de la proyección de pedidos, superior al 25 % previsto, lo que indica que la plataforma "
    "de gestión inteligente basada en modelos de aprendizaje supervisado optimiza la toma de decisiones comerciales "
    "en Librerías El Regalito. Esta aceptación se circunscribe al periodo y a las condiciones evaluadas, y debe "
    "leerse con la cautela que impone el corto tiempo de operación real del sistema, como se explica a continuación."
)
LIMITACIONES = [
    "La plataforma se instaló en Librerías El Regalito a inicios de octubre de 2026. Al cierre de este informe, el "
    "sistema acumula apenas un mes de operación y registra solo un par de compras a proveedores, por lo que el "
    "volumen de transacciones generadas en producción todavía es reducido. Con tan pocos datos, el efecto de la "
    "plataforma sobre los resultados del negocio, como las ventas perdidas por quiebres de stock, las mermas de "
    "productos perecederos y el capital inmovilizado en inventario, aún no se refleja de forma notoria en las cifras "
    "de la empresa. Un solo mes no permite separar el efecto de la plataforma de la variación normal de la demanda, "
    "y en octubre todavía no ocurre el pico de ventas del ciclo escolar, que es el periodo en el que el pronóstico "
    "y el punto de reorden tienen mayor impacto.",
    "Por esa razón, los resultados de este capítulo deben interpretarse como evidencia preliminar: muestran que la "
    "plataforma mejora los indicadores en la dirección prevista, pero todavía no constituyen una medición del "
    "impacto real en la operación. La confirmación definitiva requiere dar seguimiento al sistema durante al menos "
    "un ciclo comercial completo, que incluya la temporada escolar de enero, y repetir con los datos acumulados en "
    "producción el cálculo del MAPE, de la reducción de las inconsistencias en la proyección de pedidos y de la "
    "exactitud del registro de inventario, tal como se plantea en las recomendaciones.",
]


def poner_texto(par, texto):
    base = next((r for r in par.runs if r.text.strip()), None)
    rpr = copy.deepcopy(base._r.rPr) if base is not None and base._r.rPr is not None else None
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    run = par.add_run(texto)
    if rpr is not None:
        run._r.insert(0, rpr)
    return par


def poner_imagen(par, imagen, ancho):
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.first_line_indent = Cm(0)
    par.add_run().add_picture(str(IMAGENES / imagen), width=Cm(ancho))


def insertar_despues(par, modelo, texto):
    nuevo = copy.deepcopy(modelo._p)
    par._p.addnext(nuevo)
    return poner_texto(docx.text.paragraph.Paragraph(nuevo, par._parent), texto)


def main():
    if not RESPALDO.exists():
        shutil.copy2(TESIS, RESPALDO)
    d = docx.Document(TESIS)
    pars = d.paragraphs
    usados = set()
    for clave, imagen, ancho, nota in FIGURAS:
        i = next(i for i, p in enumerate(pars)
                 if i not in usados and p.text.startswith("PEGAR AQUÍ LA CAPTURA") and clave in p.text)
        usados.add(i)
        poner_imagen(pars[i], imagen, ancho)
        siguiente = pars[i + 1]
        if siguiente.text.strip().startswith("Nota."):
            poner_texto(siguiente, nota)
        print("figura insertada:", imagen)

    pars = d.paragraphs
    i = next(i for i, p in enumerate(pars) if p.text.startswith("Con base en lo anterior, se acepta la hipótesis"))
    poner_texto(pars[i], ACEPTACION)
    modelo_sub = next(p for p in pars if p.text.startswith("Paso 6: decisión e interpretación"))
    sub = insertar_despues(pars[i], modelo_sub, SUBTITULO)
    anterior = sub
    for texto in LIMITACIONES:
        anterior = insertar_despues(anterior, pars[i], texto)
    d.save(TESIS)
    print("hipótesis actualizada")


if __name__ == "__main__":
    main()
