"""Genera el informe de autoevaluación de calidad (Proyecto Final, Aseguramiento de la Calidad).

Uso: python docs/calidad/generar_informe.py

Lee los resultados de docs/calidad/resultados_pruebas.json y las capturas de
docs/calidad/evidencias, y escribe docs/calidad/Informe_Autoevaluacion_Calidad_FacturaAI.docx.
"""

import json
import re
from collections import Counter
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE = Path(__file__).parent
EVIDENCIAS = BASE / "evidencias"
SALIDA = BASE / "Informe_Autoevaluacion_Calidad_FacturaAI.docx"
PRUEBAS = json.loads((BASE / "resultados_pruebas.json").read_text(encoding="utf8"))

AZUL = RGBColor(0x1F, 0x3A, 0x5F)
TOKEN = re.compile(r"(\*\*.+?\*\*|\[\[.+?\]\]|`.+?`)")

contador = {"tabla": 0, "figura": 0}


def runs(par, texto, tam=None):
    for parte in TOKEN.split(texto):
        if not parte:
            continue
        if parte.startswith("**"):
            r = par.add_run(parte[2:-2])
            r.bold = True
        elif parte.startswith("[["):
            r = par.add_run(parte[2:-2])
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        elif parte.startswith("`"):
            r = par.add_run(parte[1:-1])
            r.font.name = "Consolas"
            r.font.size = Pt(min(tam, 9.5) if tam else 9.5)
        else:
            r = par.add_run(parte)
        if tam and not parte.startswith("`"):
            r.font.size = Pt(tam)
    return par


def p(doc, texto, sangria=False, alinear=WD_ALIGN_PARAGRAPH.JUSTIFY, tam=None, despues=6):
    par = doc.add_paragraph()
    par.alignment = alinear
    par.paragraph_format.space_after = Pt(despues)
    if sangria:
        par.paragraph_format.first_line_indent = Cm(1)
    return runs(par, texto, tam)


def viñetas(doc, items, estilo="List Bullet"):
    for item in items:
        par = doc.add_paragraph(style=estilo)
        par.paragraph_format.space_after = Pt(3)
        runs(par, item)


def titulo(doc, texto, nivel=1):
    h = doc.add_heading(texto, level=nivel)
    for r in h.runs:
        r.font.color.rgb = AZUL
        r.font.name = "Arial"
    return h


def sombrear(celda, color):
    tcpr = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcpr.append(shd)


def repetir_encabezado(fila):
    trpr = fila._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trpr.append(el)


def tabla(doc, titulo_tabla, encabezados, filas, anchos=None, tam=9, nota=None, colores=None):
    contador["tabla"] += 1
    cap = doc.add_paragraph()
    cap.paragraph_format.space_before = Pt(6)
    cap.paragraph_format.space_after = Pt(2)
    cap.paragraph_format.keep_with_next = True
    r = cap.add_run(f"Tabla {contador['tabla']}. ")
    r.bold = True
    r2 = cap.add_run(titulo_tabla)
    r2.italic = True
    t = doc.add_table(rows=1, cols=len(encabezados))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, e in enumerate(encabezados):
        c = t.rows[0].cells[i]
        c.text = ""
        runs(c.paragraphs[0], f"**{e}**", tam)
        sombrear(c, "1F3A5F")
        for rr in c.paragraphs[0].runs:
            rr.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    repetir_encabezado(t.rows[0])
    for n, fila in enumerate(filas):
        cells = t.add_row().cells
        for i, valor in enumerate(fila):
            cells[i].text = ""
            par = cells[i].paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            runs(par, str(valor), tam)
            if colores and colores.get((n, i)):
                sombrear(cells[i], colores[(n, i)])
    if anchos:
        t.autofit = False
        for i, ancho in enumerate(anchos):
            t.columns[i].width = Cm(ancho)
        for fila in t.rows:
            for i, ancho in enumerate(anchos):
                fila.cells[i].width = Cm(ancho)
    if nota:
        p(doc, f"Nota. {nota}", tam=8.5, despues=8)
    else:
        doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def figura(doc, archivo, titulo_figura, ancho=15.5, nota=None):
    contador["figura"] += 1
    cap = doc.add_paragraph()
    cap.paragraph_format.keep_with_next = True
    cap.paragraph_format.space_after = Pt(2)
    r = cap.add_run(f"Figura {contador['figura']}. ")
    r.bold = True
    cap.add_run(titulo_figura).italic = True
    ruta = EVIDENCIAS / archivo
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.keep_with_next = bool(nota)
    if ruta.exists():
        par.add_run().add_picture(str(ruta), width=Cm(ancho))
    else:
        runs(par, f"[[PEGAR CAPTURA: {archivo}]]")
    if nota:
        p(doc, f"Nota. {nota}", tam=8.5, despues=10)


def salto(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


# ---------------------------------------------------------------------------
# Datos de la evaluación
# ---------------------------------------------------------------------------

ISO = [
    # característica, percepción, evidencia, evidencia que respalda y recomendación
    ("Adecuación funcional", 4, 2,
     "Los RF-01 (roles), RF-03 (certificación FEL), RF-10 y RF-11 (pronóstico y punto de reorden) no están "
     "implementados; el motor de IA es un stub de reglas fijas. La venta calcula 18 % de impuesto (CP-19) y la "
     "anulación no revierte inventario (CP-27). 28 de 54 pantallas son placeholders. **Recomendación:** "
     "corregir primero el cálculo fiscal y la anulación, y priorizar el modelo predictivo, que es el núcleo de la tesis."),
    ("Eficiencia de desempeño", 4, 3,
     "Comportamiento temporal bueno: mediana de 11 ms y p95 de 27 ms en 30 consultas (CP-34); Lighthouse 97 "
     "(móvil) y 100 (escritorio) en la versión diagnóstico. Capacidad deficiente: con 10 ventas simultáneas, "
     "0 terminaron y todas respondieron 500 a los 60 s (CP-35). **Recomendación:** ampliar el pool de conexiones "
     "y no abrir consultas fuera de la transacción."),
    ("Compatibilidad", 4, 2,
     "Interoperabilidad: no existe conexión con ningún certificador FEL ni con la SAT (CP-20); el frontend no "
     "consume el motor de IA (0 llamadas a `/api/ai`). La API REST/JSON sí es consumible por otros clientes. "
     "**Recomendación:** integrar el ambiente de pruebas de un certificador autorizado."),
    ("Usabilidad", 4, 3,
     "Accesibilidad 100 en Lighthouse solo en la pantalla de inicio de sesión, que además funciona con teclado "
     "y se adapta a 320–412 px y a zoom de 200 % (Figura 5); en cambio, hay filas de tablas clicables sin "
     "acceso por teclado; montos mostrados como RD$, DOP, $ y Q en "
     "distintas pantallas; la línea de factura se agrega con cantidad 0. **Recomendación:** unificar moneda "
     "GTQ y probar con personal real de la librería."),
    ("Fiabilidad", 4, 2,
     "La instancia en Render respondió 503 en todos los intentos del 31/10/2026; el servidor arranca aunque "
     "no haya base de datos; un JSON mal formado devuelve 500 (CP-05); la concurrencia tumba la facturación "
     "(CP-35); el stock queda inconsistente (CP-24, CP-26). **Recomendación:** monitoreo del endpoint de salud "
     "y pruebas de concurrencia antes de cada entrega."),
    ("Seguridad", 4, 2,
     "Positivo: bcrypt, JWT, `.env` fuera del repositorio, rutas protegidas (CP-07, CP-08). Negativo: no hay "
     "autorización por rol (CP-31, CP-32), no hay límite de intentos de inicio de sesión (CP-06), el login "
     "muestra y precarga la contraseña del administrador (Figura 1), cualquier usuario marca una factura como "
     "aceptada por la SAT (CP-29) y npm audit reporta 18 dependencias vulnerables en el backend (1 crítica). "
     "**Recomendación:** middleware de roles, limitador de intentos y retiro de credenciales por defecto."),
    ("Mantenibilidad", 4, 2,
     "0 pruebas en el backend (`\"test\": \"echo Error\"`) y 1 prueba trivial en el frontend; sin linter en el "
     "backend; complejidad cognitiva de 40 en `emitirFactura` y de 50 en el registro de devoluciones (límite 15, "
     "SonarJS); `roundMoney` copiado en 6 archivos; tres fuentes de verdad del esquema. **Recomendación:** "
     "convertir `pruebas_api.py` en suite automatizada y refactorizar los servicios más complejos."),
    ("Portabilidad", 4, 3,
     "El sistema se instaló y ejecutó en una máquina nueva siguiendo el README (MariaDB 10.4 de XAMPP, Node 22) "
     "y compila en producción sin errores. No hay Docker, ni `engines` en package.json, ni archivo de despliegue; "
     "las instrucciones son solo para Windows. **Recomendación:** contenedor Docker y versión de Node fijada."),
]

DEFECTOS = [
    ("D-01", "La venta calcula impuesto de 18 % (ITBIS dominicano) en lugar del IVA de 12 %. Pasos: emitir "
             "factura de 1 unidad a Q100.00. Obtenido: impuesto Q18.00, total Q118.00.", "Crítica",
     "Q2 / Clases de equivalencia", "CP-19, Figura 3, `emitir-factura.js:8`, `crear-factura.ts:14`"),
    ("D-02", "No hay certificación FEL: el número de autorización es un UUID generado localmente y la factura "
             "queda con `tributacion = desconocido`.", "Crítica", "Q2 / Riesgo", "CP-20, `emitir-factura.js:111`"),
    ("D-03", "Con 10 ventas simultáneas ninguna termina: todas responden 500 a los 60 s "
             "(SequelizeConnectionAcquireTimeoutError). Pool por defecto de 5 conexiones y consulta fuera de la "
             "transacción.", "Crítica", "Q4 / Riesgo (concurrencia)",
     "CP-35, `emitir-factura.js:59`, `config/sequelize.js`"),
    ("D-04", "No existe autorización por rol: un usuario `vendedor` anula facturas y desactiva el bloqueo de "
             "ventas sin stock.", "Alta", "Q4 / Tabla de decisión", "CP-31, CP-32"),
    ("D-05", "Anular una factura no devuelve el stock ni registra el movimiento en el kárdex. Pasos: facturar "
             "4 unidades y anular. Stock 6 → 6.", "Alta", "Q2 / Transición de estados",
     "CP-27, `factura.controller.js:99-104`"),
    ("D-06", "Dos líneas del mismo producto evaden el control de stock y pierden una actualización: con stock 6 "
             "se venden 10 unidades y el stock queda en 1.", "Alta", "Q4 / Riesgo", "CP-26"),
    ("D-07", "Una cotización ya facturada se reabre por PATCH y se factura por segunda vez.", "Alta",
     "Q2 / Transición de estados", "CP-30, `cotizacion.controller.js:173-182`"),
    ("D-08", "Cualquier usuario cambia el estado tributario a `aceptadas` sin intervención del certificador.",
     "Alta", "Q4 / Transición de estados", "CP-29, `factura.controller.js:96-98`"),
    ("D-09", "El precio unitario lo decide el cliente de la API: se emitió una factura por Q0.00.", "Alta",
     "Q4 / Valores frontera", "CP-21, `emitir-factura.js:96-100`"),
    ("D-10", "Sin límite de intentos: 20 contraseñas erróneas seguidas devuelven 401 sin bloqueo.", "Alta",
     "Q4 / Riesgo", "CP-06"),
    ("D-11", "El login precarga y muestra las credenciales del administrador; `schema.sql` crea ese usuario "
             "con contraseña conocida.", "Alta", "Q3 / Exploratoria", "Figura 1, `login.ts:24-25`"),
    ("D-12", "La instancia publicada en Render no responde (HTTP 503 en 3 intentos, 31/10/2026).", "Alta",
     "Q4 / Disponibilidad", "Registro de `GET /api/health`"),
    ("D-13", "18 dependencias vulnerables en el backend (1 crítica: proxy-addr; 4 altas: axios, body-parser, "
             "brace-expansion, follow-redirects) y 42 en el frontend.", "Alta", "Q1 / Análisis estático",
     "Salida de `npm audit`"),
    ("D-14", "Si la configuración permite vender sin stock, el stock queda negativo (-1).", "Media",
     "Q2 / Tabla de decisión", "CP-24"),
    ("D-15", "El NIT no se valida: se registró el cliente con NIT `ABC-…`.", "Media",
     "Q2 / Clases de equivalencia", "CP-10, `cliente.model.js:37-39`"),
    ("D-16", "Una compra con precio unitario -50 se acepta (total Q0.00).", "Media", "Q2 / Valores frontera",
     "CP-33, `compra.controller.js:125`"),
    ("D-17", "La pantalla de inicio no registra First Contentful Paint (Lighthouse NO_FCP) porque todo el "
             "contenido nace con `opacity: 0` en una animación CSS.", "Media", "Q4 / Lighthouse",
     "`lighthouse_build_original_NO_FCP.json`, `login.css:10,21`"),
    ("D-18", "Localización de República Dominicana: RD$, DOP, DGII e ITBIS en 74 líneas de 30 archivos.",
     "Media", "Q3 / Exploratoria", "Figura 2, Figura 3"),
    ("D-19", "28 de 54 pantallas protegidas son placeholders, entre ellas Estado SAT y Reportes; notas de "
             "crédito y débito siempre vacías.", "Media", "Q3 / Exploratoria", "Figura 4"),
    ("D-20", "Un JSON mal formado en el login devuelve 500 en lugar de 400.", "Baja",
     "Q4 / Clases de equivalencia", "CP-05, `server.js:49-52`"),
    ("D-21", "La línea agregada a la factura nace con cantidad 0 y no cuenta en el total hasta editarla.",
     "Baja", "Q3 / Exploratoria", "`crear-factura.ts:239`"),
]

RIESGOS = [
    ("R-01 Facturas sin certificar o con impuesto mal calculado ante la SAT", "Alta", "Alto", "Crítico",
     "Parametrizar el IVA desde `impuesto_porcentaje`; integrar el sandbox de un certificador FEL; prueba de "
     "regresión del cálculo en cada entrega."),
    ("R-02 Caída del punto de venta con ventas simultáneas en matriz y sucursales", "Alta", "Alto", "Crítico",
     "Pool de conexiones ≥ 20, pasar la transacción a `getOrCreateInventarioConfig`, prueba de carga con 25 "
     "ventas concurrentes."),
    ("R-03 Inventario descuadrado que contamina los datos de entrenamiento del modelo", "Alta", "Alto",
     "Crítico", "Revertir stock al anular, deduplicar líneas, impedir stock negativo y conciliar kárdex."),
    ("R-04 El modelo predictivo prometido en la tesis no existe al momento de la defensa", "Alta", "Alto",
     "Crítico", "Entrenar el Random Forest con el histórico 2023-2025 y reportar el MAPE sobre el conjunto de "
     "prueba."),
    ("R-05 Fraude interno: anulaciones, ventas a Q0.00 o estado SAT falso", "Media", "Alto", "Alto",
     "Middleware de roles, precio desde catálogo y bitácora de auditoría."),
    ("R-06 Acceso no autorizado con la contraseña por defecto o por fuerza bruta", "Media", "Alto", "Alto",
     "Eliminar credenciales precargadas, forzar cambio de contraseña y limitar intentos."),
    ("R-07 Regresiones al corregir defectos por falta de pruebas automatizadas", "Alta", "Medio", "Alto",
     "Suite de pruebas en CI que se ejecute en cada pull request."),
    ("R-08 Despliegue caído el día de la presentación", "Alta", "Medio", "Alto",
     "Ambiente local de respaldo probado y monitoreo del endpoint de salud."),
    ("R-09 Dependencia de una sola persona (todo el código tiene un autor)", "Media", "Alto", "Alto",
     "Documentar decisiones y pedir revisión del asesor en cada iteración."),
    ("R-10 Explotación de dependencias vulnerables", "Media", "Medio", "Medio",
     "`npm audit fix`, Dependabot y revisión mensual."),
]

REQUISITOS = [
    ("RNF-05", "La plataforma debe estar disponible durante el horario comercial de todas las sucursales.",
     "No es medible: no fija porcentaje, horario ni forma de medirlo. El 31/10/2026 la instancia respondió 503 y "
     "el requisito no permite declarar si eso es incumplimiento.",
     "El endpoint `GET /api/health` debe responder HTTP 200 en menos de 2 s al menos el 99 % de las mediciones "
     "realizadas cada 5 minutos entre las 07:00 y las 19:00 (hora de Guatemala), de lunes a sábado, medido "
     "mensualmente."),
    ("RNF-06", "La interfaz debe ser utilizable por personal sin formación técnica tras una capacitación breve.",
     "Ambiguo: «utilizable» y «breve» no tienen criterio de aceptación ni usuario de referencia.",
     "Tras una capacitación de 30 minutos, 4 de 5 vendedores de Librerías El Regalito deben emitir una factura de "
     "3 productos a un cliente con NIT en menos de 2 minutos y sin ayuda, en una prueba de usabilidad moderada."),
    ("RNF-04", "El registro de una venta no debe superar [3] segundos, excluido el tiempo del certificador.",
     "Incompleto: el valor quedó como marcador sin confirmar y no indica la carga bajo la cual se mide. CP-35 "
     "demostró que el tiempo se dispara con concurrencia.",
     "Con 25 ventas simultáneas de hasta 10 líneas, el percentil 95 del tiempo de respuesta de `POST /api/facturas` "
     "debe ser menor que 3 s, excluida la llamada al certificador, y ninguna venta debe fallar."),
    ("RF-14", "Anular documentos y revertir los movimientos de inventario asociados.",
     "Ambiguo e incompleto: no dice qué documentos, quién puede anular, en qué estados ni qué pasa ante la SAT. "
     "La implementación anula facturas sin revertir stock (CP-27).",
     "Un usuario con rol administrador puede anular una factura en estado `emitida` indicando un motivo; el sistema "
     "solicita la anulación al certificador FEL, restituye las cantidades en la bodega de origen, registra el "
     "movimiento en el kárdex y rechaza la anulación si la factura tiene devoluciones."),
    ("RF-02", "Registrar ventas en el punto de venta con búsqueda de productos y de clientes por NIT.",
     "Incompleto: no define el cálculo fiscal ni la validación del NIT. Falta una regla de negocio del IVA, por "
     "eso el 18 % pasó inadvertido.",
     "Al registrar una venta, el sistema valida el NIT del receptor con el dígito verificador módulo 11 (o acepta "
     "«CF»), toma el precio del catálogo y calcula el IVA al 12 % incluido en el precio de venta, mostrando el "
     "monto en quetzales (GTQ)."),
]

PROCESO = [
    ("Roles definidos", "Una sola persona ejerce de analista, desarrollador, probador y responsable del "
     "despliegue.", "Los 13 commits tienen un único autor.", "No hay separación entre quien desarrolla y quien "
     "verifica."),
    ("Control de versiones", "Git con GitHub (`DarilGJ/Sistema-de-Facturacion-IA`) y ramas `main` y `develop`.",
     "`develop` lleva 11 commits que nunca se integraron a `main`; 0 merges.", "La rama principal no refleja el "
     "producto entregado."),
    ("Revisión entre pares", "No existe.", "0 pull requests; commits de hasta 13,768 líneas en 102 archivos "
     "(`adbcb93`).", "Un commit de ese tamaño no es revisable."),
    ("Definición de terminado", "No está escrita.", "Funcionalidades marcadas como listas con defectos "
     "críticos (IVA, anulación, roles).", "«Terminado» equivale a «la pantalla funciona en el caso feliz»."),
    ("Momento de las pruebas", "Al final y de forma manual.", "Backend sin script de pruebas; frontend con 1 "
     "prueba generada por Angular CLI.", "No se probó durante el desarrollo."),
    ("Integración continua", "No existe.", "Sin carpeta `.github/workflows` ni pipeline.", "Nada impide que un "
     "cambio rompa la compilación."),
    ("Estándares de código", "Prettier en el frontend; ningún linter en el backend.", "SonarJS: 14 hallazgos "
     "en el backend y 28 en el frontend.", "La calidad depende de la disciplina individual."),
    ("Gestión de configuración", "`.env` ignorado y `.env.example` documentado; README con pasos de instalación.",
     "La instalación en una máquina nueva funcionó siguiendo el README.", "Fortaleza real del proyecto."),
]

LIGHTHOUSE = [
    ("Mobile 1", 97, 100, 100, 82, "1.9 s", "2.1 s", "30 ms", "0", "1.9 s"),
    ("Mobile 2", 97, 100, 100, 82, "1.9 s", "2.2 s", "60 ms", "0", "1.9 s"),
    ("Mobile 3", 97, 100, 100, 82, "1.9 s", "2.1 s", "50 ms", "0", "1.9 s"),
    ("Desktop", 100, 100, 100, 82, "0.5 s", "0.6 s", "0 ms", "0", "0.5 s"),
]


def portada(doc):
    for _ in range(3):
        doc.add_paragraph()
    for texto, tam, negrita in [
        ("UNIVERSIDAD MARIANO GÁLVEZ DE GUATEMALA", 14, True),
        ("Facultad de Ingeniería en Sistemas de Información — Centro Universitario Salamá", 12, False),
        ("Curso: Aseguramiento de la Calidad del Software", 12, False),
    ]:
        par = p(doc, f"**{texto}**" if negrita else texto, alinear=WD_ALIGN_PARAGRAPH.CENTER, tam=tam)
    for _ in range(3):
        doc.add_paragraph()
    p(doc, "**PROYECTO FINAL**", alinear=WD_ALIGN_PARAGRAPH.CENTER, tam=16)
    p(doc, "**Informe de Autoevaluación de Calidad del Proyecto de Seminario**", alinear=WD_ALIGN_PARAGRAPH.CENTER,
      tam=15)
    p(doc, "Sistema de gestión inteligente para facturación electrónica e inventario con predicción de demanda "
           "(FacturaAI) — Librerías El Regalito", alinear=WD_ALIGN_PARAGRAPH.CENTER, tam=12)
    for _ in range(2):
        doc.add_paragraph()
    titulo(doc, "1. Portada e identificación", 2)
    tabla(doc, "Identificación del informe", ["Campo", "Detalle"], [
        ("Proyecto", "Diseño e implementación de un sistema de gestión inteligente con modelos de aprendizaje "
                     "supervisado para la predicción de demanda en Librerías El Regalito, 2026"),
        ("Equipo", "Daril Andrés Villey García Jacinto (trabajo individual)"),
        ("Curso", "Aseguramiento de la Calidad del Software — UMG Salamá"),
        ("Fecha de evaluación", "31 de octubre de 2026"),
        ("Versión evaluada", "Rama `develop`, commit `523e980` (4 de septiembre de 2026), repositorio "
                             "`github.com/DarilGJ/Sistema-de-Facturacion-IA`"),
    ], anchos=[4, 12], tam=10)
    salto(doc)


def resumen_ejecutivo(doc):
    titulo(doc, "2. Resumen ejecutivo")
    promedio_p = sum(c[1] for c in ISO) / len(ISO)
    promedio_e = sum(c[2] for c in ISO) / len(ISO)
    p(doc, f"**Conclusión general.** La plataforma FacturaAI tiene una base técnica funcional —se instala, compila "
           f"y resuelve el flujo básico de catálogo, venta, compra e inventario—, pero **no está lista para operar "
           f"en Librerías El Regalito**. La calificación global con evidencia es **{promedio_e:.1f} de 5**, frente "
           f"a una percepción inicial de {promedio_p:.1f}: una brecha de {promedio_p - promedio_e:.1f} puntos. De "
           f"{PRUEBAS['total']} casos de prueba ejecutados pasaron {PRUEBAS['pasan']} "
           f"({PRUEBAS['pasan'] / PRUEBAS['total']:.0%}); se registraron {len(DEFECTOS)} defectos, "
           f"{sum(d[2] == 'Crítica' for d in DEFECTOS)} de ellos críticos.")
    p(doc, "**Tres hallazgos principales**")
    viñetas(doc, [
        "**Incumplimiento fiscal.** Cada venta cobra 18 % de impuesto (tasa del ITBIS dominicano) en lugar del 12 % "
        "de IVA, y la «autorización FEL» es un identificador generado localmente: ninguna factura está certificada "
        "ante la SAT (CP-19, CP-20).",
        "**Integridad y capacidad del punto de venta.** Con 10 ventas simultáneas ninguna terminó (error 500 a los "
        "60 s); anular una factura no devuelve el stock, y dos líneas del mismo producto venden más de lo existente "
        "(CP-35, CP-27, CP-26). Esto además contamina los datos con los que se entrenaría el modelo predictivo.",
        "**Seguridad sin autorización.** Cualquier usuario autenticado, incluido un vendedor, anula facturas, cambia "
        "la configuración y marca facturas como aceptadas por la SAT; el inicio de sesión no limita intentos y "
        "muestra la contraseña del administrador (CP-29 a CP-32, CP-06).",
    ])
    p(doc, "**Tres recomendaciones clave**")
    viñetas(doc, [
        "Corregir el cálculo del IVA tomando la tasa de `impuesto_porcentaje` y conectar el ambiente de pruebas de "
        "un certificador FEL antes de cualquier otra funcionalidad.",
        "Ampliar el pool de conexiones, mover toda consulta de la venta dentro de la transacción y hacer que la "
        "anulación restituya inventario; verificarlo con la suite `pruebas_api.py` en integración continua.",
        "Agregar un middleware de autorización por rol, un limitador de intentos de inicio de sesión y retirar las "
        "credenciales por defecto.",
    ])
    salto(doc)


def descripcion(doc):
    titulo(doc, "3. Descripción del proyecto y alcance")
    p(doc, "FacturaAI es una aplicación web para Librerías El Regalito (una matriz y cuatro sucursales) que integra "
           "punto de venta, facturación, cotizaciones, compras, inventario multibodega con kárdex y un tablero de "
           "indicadores. El proyecto de seminario —y la tesis de graduación asociada— promete además un motor de "
           "aprendizaje supervisado (Random Forest) que pronostique la demanda y sugiera órdenes de compra.",
      sangria=True)
    tabla(doc, "Arquitectura evaluada", ["Capa", "Tecnología", "Tamaño evaluado"], [
        ("Frontend", "Angular 20 (componentes standalone, carga diferida)", "55 archivos TS, 10,091 líneas; "
                                                                           "54 rutas protegidas"),
        ("Backend", "Node.js 22, Express 5, Sequelize 6, JWT, bcrypt", "71 archivos JS, 7,219 líneas; 57 rutas"),
        ("Base de datos", "MySQL 8 / MariaDB 10.4", "23 tablas (`database/schema.sql`)"),
        ("Motor de IA", "Python, FastAPI", "Stub de reglas: 2 endpoints, sin modelo"),
    ], anchos=[3, 6.5, 6.5])
    titulo(doc, "Qué se evaluó", 2)
    viñetas(doc, [
        "Requisitos funcionales y no funcionales documentados en el capítulo 4 de la tesis (RF-01 a RF-15, RNF-01 a "
        "RNF-09 y RN-01 a RN-06).",
        "La API completa en un ambiente local con base de datos de prueba (`sistema_facturacion_qa`), con énfasis "
        "en inicio de sesión, emisión y anulación de facturas, cotizaciones, clientes, compras y control de stock.",
        "La interfaz web: pantalla de inicio de sesión (Lighthouse), tablero, creación de factura y módulos "
        "placeholder (exploración manual).",
        "El código fuente (análisis estático con reglas SonarJS), las dependencias (npm audit), el historial de Git "
        "y la instancia publicada en Render.",
    ])
    titulo(doc, "Qué quedó fuera del análisis", 2)
    viñetas(doc, [
        "**Certificación FEL real y modelo predictivo:** no existen en el código; se evaluaron como ausencias, no "
        "como funcionalidades.",
        "**Pruebas con usuarios reales** de la librería y con datos históricos reales: no estaban disponibles.",
        "**Pruebas de carga** superiores a 10 usuarios concurrentes y pruebas de penetración profundas.",
        "**Lighthouse en pantallas autenticadas:** la herramienta no inicia sesión por sí sola; solo se midió la "
        "pantalla pública de inicio de sesión.",
        "Ambiente productivo: la instancia de Render no respondía y no se tuvo acceso a su base de datos.",
    ])


def metodologia(doc):
    titulo(doc, "4. Metodología")
    p(doc, "La evaluación se realizó el 31 de octubre de 2026 en una computadora con Windows 11, Node.js 22.17, "
           "Python 3.14 y Google Chrome 156. Se siguió el orden exigido por la Plantilla A: primero se registró la "
           "percepción y después se recolectó la evidencia. El backend se ejecutó contra una base de datos de prueba "
           "creada desde `database/schema.sql`, sin tocar la base de datos de desarrollo.", sangria=True)
    tabla(doc, "Herramientas, técnicas y criterios", ["Herramienta o técnica", "Uso en la evaluación",
                                                       "Criterio de aceptación"], [
        ("Google Lighthouse 12.8.2", "3 corridas Mobile y 1 Desktop sobre la pantalla de inicio de sesión, en "
                                     "incógnito, con las 4 categorías", "≥ 90 en cada categoría"),
        ("Reglas SonarJS 3.0.7 (motor de SonarLint)", "Análisis estático de solo lectura del backend y del "
                                                       "frontend", "0 errores; complejidad cognitiva ≤ 15"),
        ("npm audit", "Vulnerabilidades conocidas de dependencias", "0 críticas y 0 altas"),
        ("Karma + Jasmine (`ng test`)", "Ejecución de las pruebas unitarias existentes con cobertura",
         "Cobertura significativa de la lógica de negocio"),
        ("Casos de prueba de caja negra (`pruebas_api.py`)", f"{PRUEBAS['total']} casos ejecutados contra la API "
                                                             f"con clases de equivalencia, valores frontera, tabla de "
                                                             f"decisión, transición de estados y riesgo",
         "Resultado obtenido = resultado esperado"),
        ("Exploración manual en el navegador", "Revisión de pantallas, moneda, impuestos y placeholders con "
                                               "capturas", "Coherencia con los requisitos y la normativa de Guatemala"),
        ("Revisión de código e historial de Git", "Trazabilidad requisito → código y análisis del proceso",
         "Evidencia con archivo y línea"),
        ("PICT (pairwise)", "No se utilizó: las combinaciones relevantes se cubrieron con la tabla de decisión",
         "—"),
    ], anchos=[4.5, 7, 4.5])
    p(doc, "La severidad de los defectos se clasificó así: **Crítica** (impide operar legalmente o pierde ventas), "
           "**Alta** (compromete la seguridad o la integridad de los datos), **Media** (afecta la experiencia o la "
           "exactitud sin pérdida directa) y **Baja** (cosmética o con alternativa sencilla). Los riesgos se "
           "priorizaron con una matriz de probabilidad por impacto en tres niveles.", sangria=True)


def evaluacion_requisitos(doc):
    titulo(doc, "5. Evaluación de requisitos (Dimensión 1)")
    p(doc, "Se revisaron los 30 requisitos del capítulo 4 de la tesis con cuatro criterios: claridad, "
           "verificabilidad, completitud y ausencia de ambigüedad. Los requisitos funcionales están bien redactados "
           "como capacidades, pero la mayoría no tiene criterio de aceptación; los no funcionales mezclan metas "
           "verificables (RNF-09: MAPE < 15 %) con declaraciones que no se pueden medir.", sangria=True)
    tabla(doc, "Hallazgos generales sobre los requisitos", ["Hallazgo", "Evidencia", "Consecuencia observada"], [
        ("Falta una regla de negocio del impuesto", "Ningún RN menciona el IVA de 12 % ni si el precio lo incluye",
         "El sistema cobra 18 % y nadie lo detectó (D-01)"),
        ("Requisitos sin criterio de aceptación", "RF-01, RF-02, RF-12, RF-14, RNF-05, RNF-06", "No se puede "
                                                                                              "declarar si se cumplen"),
        ("Valor pendiente en un requisito", "RNF-04 conserva el marcador «[3] segundos»", "La meta de rendimiento "
                                                                                          "no está acordada"),
        ("Requisitos sin implementar", "RF-01 (roles), RF-03 (FEL), RF-10 y RF-11 (pronóstico y punto de reorden)",
         "Brecha entre lo documentado y lo construido"),
        ("Requisito no funcional faltante", "No hay requisito de concurrencia (ventas simultáneas en 5 sedes)",
         "El defecto D-03 no tenía contra qué medirse"),
    ], anchos=[4.5, 6, 5.5])
    tabla(doc, "Reescritura de requisitos mal formulados", ["ID", "Requisito original", "Problema",
                                                            "Requisito reescrito (verificable)"],
          REQUISITOS, anchos=[1.4, 4, 4.6, 6], tam=8.5)


def plantilla_a(doc):
    titulo(doc, "6. ISO/IEC 25010: percepción frente a evidencia (Dimensión 2)")
    p(doc, "Las notas de percepción se registraron antes de recolectar evidencia, en escala de 1 (muy deficiente) a 5 "
           "(excelente). La brecha se calcula como Percepción − Evidencia; una brecha positiva indica que el proyecto "
           "se creía mejor de lo que está. [[Las notas de percepción son una propuesta: ajústalas a lo que realmente "
           "pensabas antes de la evaluación y conserva la hoja original en el Anexo A.]]", sangria=True)
    filas, colores = [], {}
    for n, (car, per, evi, texto) in enumerate(ISO):
        brecha = per - evi
        filas.append((car, f"[[{per}]]", evi, f"+{brecha}" if brecha > 0 else str(brecha), texto))
        colores[(n, 3)] = "F4CCCC" if brecha >= 2 else "FCE5CD" if brecha == 1 else "D9EAD3"
    per = sum(c[1] for c in ISO) / len(ISO)
    evi = sum(c[2] for c in ISO) / len(ISO)
    filas.append(("**Promedio**", f"**{per:.1f}**", f"**{evi:.1f}**", f"**+{per - evi:.1f}**", ""))
    tabla(doc, "Plantilla A — Percepción frente a evidencia ISO/IEC 25010",
          ["Característica", "Percepción (1-5)", "Evidencia (1-5)", "Brecha", "Evidencia que respalda la nota y "
                                                                             "recomendación"],
          filas, anchos=[2.8, 1.7, 1.7, 1.4, 9.4], tam=8, colores=colores,
          nota="Brecha = Percepción − Evidencia. Rojo: brecha ≥ 2; naranja: brecha de 1. Todas las características "
               "pudieron evaluarse; en Compatibilidad solo se evaluó la interoperabilidad, porque la coexistencia no "
               "aplica a una aplicación web aislada.")
    titulo(doc, "Análisis de las brechas más grandes", 2)
    p(doc, "Cinco características tienen brecha de 2 puntos. Comparten una causa: la percepción se formó viendo "
           "pantallas que funcionan en el caso feliz, mientras que la evidencia se obtuvo probando reglas de negocio, "
           "casos límite y condiciones adversas.", sangria=True)
    viñetas(doc, [
        "**Adecuación funcional (+2).** La interfaz muestra «Factura Electrónica», «Estado SAT» y un tablero "
        "«DGII al día», lo que transmite completitud. Detrás no hay certificación, el impuesto es de otro país y el "
        "motor de IA devuelve valores fijos. Es la brecha más importante porque afecta directamente la hipótesis de "
        "la tesis.",
        "**Fiabilidad (+2).** Se confiaba en que las transacciones con bloqueo garantizaban la integridad. La prueba "
        "de concurrencia mostró lo contrario: el bloqueo existe, pero el pool de 5 conexiones se agota porque la "
        "venta pide una segunda conexión fuera de la transacción.",
        "**Seguridad (+2).** bcrypt y JWT dieron una sensación de seguridad completa. La autenticación está bien; "
        "lo que falta es la autorización: el rol viaja en el token y nunca se consulta.",
        "**Mantenibilidad (+2).** El código se percibe ordenado por carpetas, pero sin pruebas cada corrección de "
        "esta lista puede romper otra cosa sin que nadie lo note.",
        "**Compatibilidad (+2).** Se asumió que «tener un proxy hacia la IA» era integración. No hay ningún "
        "intercambio real con sistemas externos: ni certificador FEL ni consumo del motor de IA desde la interfaz.",
    ])


def pruebas(doc):
    titulo(doc, "7. Pruebas diseñadas y ejecutadas (Dimensión 3)")
    casos = PRUEBAS["casos"]
    p(doc, f"Se diseñaron y ejecutaron {len(casos)} casos de prueba de caja negra sobre las funciones más críticas: "
           f"inicio de sesión, control de acceso, registro de clientes, emisión de factura, control de stock, "
           f"ciclo de vida de la factura, conversión de cotizaciones, autorización por rol, compras y rendimiento. "
           f"La ejecución es reproducible con `python docs/calidad/pruebas_api.py` y quedó registrada en "
           f"`resultados_pruebas.json` (ejecución del {PRUEBAS['ejecutado'].replace('T', ' a las ')}).",
      sangria=True)
    tecnicas = Counter(c["tecnica"].split(" (")[0] for c in casos)
    tabla(doc, "Técnicas de diseño aplicadas", ["Técnica", "Casos", "Dónde se aplicó"], [
        ("Clases de equivalencia", tecnicas["Clases de equivalencia"], "Credenciales, NIT, token, cálculo del "
                                                                        "impuesto, formato del cuerpo"),
        ("Valores frontera", tecnicas["Valores frontera"], "Cantidad (−1, 0, 1, stock, stock + 1, 2.5, 10¹²), "
                                                            "precio 0 y negativo, cadenas vacías"),
        ("Tabla de decisión", tecnicas["Tabla de decisión"], "Bloqueo de stock × tipo de ítem × suficiencia de "
                                                              "stock; rol × operación"),
        ("Transición de estados", tecnicas["Transición de estados"], "Factura emitida → anulada → anulada; "
                                                                      "cotización facturada → reabierta; estado "
                                                                      "tributario"),
        ("Basada en riesgo", tecnicas["Riesgo"], "Fuerza bruta, líneas duplicadas, concurrencia, rendimiento, "
                                                  "cumplimiento SAT"),
    ], anchos=[4, 1.5, 10.5])
    tabla(doc, "Tabla de decisión del control de stock al facturar (3 unidades)",
          ["Regla", "Bloquear ventas sin stock", "Tipo de ítem", "Stock suficiente", "Acción esperada",
           "Resultado"], [
              ("R1 (CP-22)", "Sí", "Producto", "Sí (5)", "Vender y descontar", "PASA"),
              ("R2 (CP-23)", "Sí", "Producto", "No (2)", "Rechazar (400)", "PASA"),
              ("R3 (CP-24)", "No", "Producto", "No (2)", "Vender sin dejar stock negativo", "FALLA: stock −1"),
              ("R4 (CP-25)", "Sí", "Servicio", "No (2)", "Vender (los servicios no usan stock)", "PASA"),
          ], anchos=[2.2, 2.8, 2.2, 2.4, 3.6, 2.8])
    cuadrantes = Counter(c["cuadrante"] for c in casos)
    tabla(doc, "Cobertura por cuadrantes de pruebas ágiles", ["Cuadrante", "Enfoque", "Cobertura en este proyecto"], [
        ("Q1", "Tecnológico, apoya al equipo (unitarias, componentes)", "Insuficiente: 1 prueba unitaria trivial "
                                                                       "(«should create the app»); se complementó con "
                                                                       "análisis estático SonarJS y npm audit"),
        ("Q2", "Negocio, apoya al equipo (funcionales, ejemplos)", f"{cuadrantes['Q2']} casos de API sobre reglas "
                                                                    f"de negocio"),
        ("Q3", "Negocio, critica el producto (exploratorias, usabilidad)", "Exploración manual con 5 capturas; sin "
                                                                           "usuarios reales"),
        ("Q4", "Tecnológico, critica el producto (seguridad, rendimiento)", f"{cuadrantes['Q4']} casos de "
                                                                             f"seguridad, rendimiento y concurrencia, "
                                                                             f"más Lighthouse"),
    ], anchos=[1.6, 6, 8.4])
    filas, colores = [], {}
    for n, c in enumerate(casos):
        filas.append((c["id"], c["funcion"], c["tecnica"], c["cuadrante"], c["entrada"], c["esperado"],
                      c["obtenido"], c["resultado"]))
        colores[(n, 7)] = "D9EAD3" if c["resultado"] == "PASA" else "F4CCCC"
    tabla(doc, "Casos de prueba ejecutados", ["ID", "Función", "Técnica", "Q", "Entrada", "Esperado", "Obtenido",
                                              "Res."],
          filas, anchos=[1.2, 2.2, 2.4, 0.8, 3, 2.6, 3, 1.2], tam=7, colores=colores,
          nota=f"Pasan {PRUEBAS['pasan']} de {PRUEBAS['total']} casos. Ambiente: API local sobre MariaDB 10.4 con "
               f"la base de prueba recién creada.")
    titulo(doc, "Resultados con Google Lighthouse", 2)
    p(doc, "Lighthouse no pudo medir la versión original de la pantalla de inicio de sesión: en las cuatro corridas "
           "devolvió el error NO_FCP («la página no pintó contenido»), tanto con Chrome sin interfaz como con ventana "
           "visible, aunque la página sí se ve. La causa es que todo el contenido nace con `opacity: 0` dentro de "
           "animaciones CSS (`login.css`, líneas 10 y 21). Para confirmar la causa y obtener métricas de referencia "
           "se midió una copia de la compilación con las animaciones desactivadas, sin modificar el código fuente.",
      sangria=True)
    tabla(doc, "Puntajes y métricas de Lighthouse (versión diagnóstico, pantalla /login)",
          ["Corrida", "Perf.", "Acces.", "B. P.", "SEO", "FCP", "LCP", "TBT", "CLS", "SI"],
          LIGHTHOUSE, anchos=[2, 1.2, 1.3, 1.2, 1.2, 1.4, 1.4, 1.4, 1.2, 1.4], tam=8.5,
          nota="Promedio Mobile de desempeño: 97, sin variación entre corridas porque el servidor era local. El FCP "
               "de 1.9 s quedó en naranja. SEO 82 por falta de meta description y robots.txt inválido. Hallazgo de "
               "mayor ahorro: JavaScript sin usar (28 KiB, unos 150 ms en Mobile).")
    p(doc, "Accesibilidad 100 no significa que la aplicación sea accesible: solo se midió una pantalla con dos campos "
           "y un botón. La prueba manual confirmó que esa pantalla se recorre con Tab en orden lógico y se adapta a "
           "320–412 px y a zoom de 200 % (Figura 5), pero la revisión del código encontró lo que Lighthouse no ve en "
           "otras pantallas: varias tablas abren registros con clic en la fila, sin acceso por teclado.", sangria=True)


def proceso(doc):
    titulo(doc, "8. Proceso y cultura de calidad (Dimensión 4)")
    p(doc, "El análisis se basa en el historial del repositorio y en la forma real en que se construyó el proyecto, "
           "no en el proceso RUP descrito en la tesis.", sangria=True)
    tabla(doc, "Prácticas del proceso de desarrollo", ["Práctica", "Situación real", "Evidencia", "Brecha"],
          PROCESO, anchos=[3, 4.5, 4.5, 4], tam=8.5)
    p(doc, "La concentración del trabajo es el rasgo más revelador del proceso: el 4 de septiembre de 2026, entre "
           "las 00:51 y las 07:56, se registraron 6 commits que suman más de 20,000 líneas, incluido uno de 13,768 "
           "líneas en 102 archivos a las 04:41. Los tres últimos, en diez minutos, son «ajuste para levantar el "
           "proyecto», «ajuste de entorno» y «fix: aumentar presupuesto de estilos CSS». Este último subió el límite "
           "de estilos por componente de 4 kB a 20 kB para que la compilación pasara, en lugar de reducir el CSS. "
           "Desde esa fecha no hay más commits.", sangria=True)
    p(doc, "Fortalezas reales: separación de secretos (`.env` ignorado y `.env.example`), README suficiente para "
           "instalar el sistema en una máquina nueva, uso de transacciones con bloqueo en la venta, carga diferida de "
           "módulos en Angular y validaciones correctas de cantidad (los casos CP-12 a CP-18 pasan).", sangria=True)


def defectos_riesgos(doc):
    titulo(doc, "9. Registro de defectos y riesgos (Dimensión 5)")
    severidades = Counter(d[2] for d in DEFECTOS)
    p(doc, f"Se registraron {len(DEFECTOS)} defectos: {severidades['Crítica']} críticos, {severidades['Alta']} de "
           f"severidad alta, {severidades['Media']} media y {severidades['Baja']} baja.", sangria=True)
    color = {"Crítica": "E06666", "Alta": "F4CCCC", "Media": "FCE5CD", "Baja": "D9EAD3"}
    colores = {(n, 2): color[d[2]] for n, d in enumerate(DEFECTOS)}
    tabla(doc, "Plantilla B — Registro de defectos", ["ID", "Descripción y pasos para reproducir", "Severidad",
                                                       "Cuadrante / Técnica", "Evidencia"],
          DEFECTOS, anchos=[1.2, 7.0, 1.9, 2.5, 3.8], tam=8, colores=colores)
    nivel = {"Crítico": "E06666", "Alto": "F4CCCC", "Medio": "FCE5CD"}
    colores = {(n, 3): nivel[r[3]] for n, r in enumerate(RIESGOS)}
    tabla(doc, "Plantilla C — Matriz de riesgos priorizada", ["Riesgo", "Probabilidad", "Impacto", "Nivel",
                                                               "Acción de mitigación"],
          RIESGOS, anchos=[5, 1.8, 1.6, 1.6, 6.4], tam=8, colores=colores,
          nota="Nivel = Probabilidad × Impacto en escala Alta/Media/Baja. Los riesgos están ordenados por prioridad.")


def reflexion(doc):
    titulo(doc, "10. Reflexión sobre la forma de trabajar (Dimensión 6)")
    p(doc, "[[Las respuestas parten de la evidencia del repositorio; revísalas y cámbialas con tus propias palabras "
           "donde el motivo real haya sido otro.]]", sangria=True)
    tabla(doc, "Plantilla E — Reflexión sobre la forma de trabajar", ["Pregunta", "Respuesta con ejemplo concreto"], [
        ("¿Qué prácticas de calidad aplicábamos sin darnos cuenta?",
         "Separé los secretos desde el primer commit (`.env` en `.gitignore` y `.env.example` documentado); por "
         "eso la evaluación no encontró contraseñas reales en Git. Usé transacciones con `LOCK.UPDATE` al emitir "
         "facturas y validé que la cantidad sea un entero ≥ 1: los siete casos de valores frontera de cantidad "
         "pasaron. También escribí un README con el que el sistema se instaló sin ayuda en otra máquina."),
        ("¿Qué prácticas sabíamos que había que aplicar y no aplicamos? ¿Por qué?",
         "Pruebas automatizadas: el script de pruebas del backend sigue siendo `echo \"Error: no test specified\"`. "
         "Revisión de código: trabajé directo en `develop` y nunca abrí un pull request (0 merges, `main` quedó "
         "11 commits atrás). Autorización por rol: guardé el rol en el JWT y en la tabla `usuarios`, pero ninguna "
         "ruta lo consulta. No lo hice porque prioricé que cada módulo se viera funcionando en pantalla para las "
         "entregas del seminario, y las pruebas y la revisión no se notaban en una demostración."),
        ("¿En qué momento decidimos «entregar así» aun sabiendo que había problemas? ¿Qué nos presionó?",
         "La madrugada del 4 de septiembre de 2026: entre las 00:51 y las 07:56 subí seis commits, uno de 13,768 "
         "líneas a las 04:41. A las 07:56 la compilación fallaba por el tamaño del CSS y, en lugar de reducirlo, "
         "subí el límite de 4 kB a 20 kB («fix: aumentar presupuesto de estilos CSS»). La presión fue la fecha de "
         "entrega del avance [[confirma el motivo y la entrega]]. Ese mismo día quedaron los textos ITBIS, DGII y "
         "RD$ sin adaptar."),
        ("¿Qué brecha entre percepción y evidencia nos sorprendió más y por qué?",
         "La de fiabilidad. Creía que la venta era segura porque usa transacción y bloqueo de filas; nunca la "
         "probé con más de un usuario. Con 10 ventas simultáneas no terminó ninguna. También me sorprendió el IVA: "
         "veía «Quetzal» en la pantalla y nunca comparé el total contra una factura real; el sistema cobraba 18 %."),
        ("Si empezáramos el proyecto hoy, ¿qué haríamos distinto desde el primer día?",
         "Escribiría primero las reglas fiscales (IVA 12 %, NIT, FEL) como pruebas de aceptación y no avanzaría "
         "hasta que pasaran. Configuraría integración continua desde el primer commit, trabajaría con commits "
         "pequeños y pull requests revisados por el asesor, publicaría temprano con monitoreo del endpoint de salud "
         "y construiría el pipeline del modelo predictivo en paralelo, porque es el núcleo de la tesis."),
    ], anchos=[5, 11], tam=9)


def plan_mejora(doc):
    titulo(doc, "11. Plan de mejora y compromisos personales")
    tabla(doc, "Plantilla D — Plan de mejora PHVA", ["Fase", "Acción concreta", "Responsable", "Fecha"], [
        ("Planificar", "Escribir la definición de terminado (prueba automatizada, revisión, sin defectos críticos); "
                       "adoptar los requisitos reescritos en la sección 5; priorizar D-01 a D-09.", "Daril Villey",
         "2 al 7 de noviembre de 2026"),
        ("Hacer", "Corregir el IVA y tomarlo de `impuesto_porcentaje`; middleware de roles; pool de conexiones y "
                  "transacción completa en la venta; anulación con reversión de stock; limitador de intentos y "
                  "helmet; retirar credenciales por defecto; conectar el sandbox del certificador FEL.",
         "Daril Villey", "8 al 21 de noviembre de 2026"),
        ("Verificar", "Ejecutar `pruebas_api.py` (meta: 35 de 35), Lighthouse ≥ 90 en 4 categorías sobre login, "
                      "tablero y factura, npm audit sin críticas ni altas, complejidad de `emitirFactura` ≤ 15.",
         "Daril Villey; revisión del asesor [[Ing. Angel Escobar]]", "22 al 28 de noviembre de 2026"),
        ("Actuar", "Estandarizar: GitHub Actions que ejecute pruebas y auditoría en cada pull request a `develop`; "
                   "plantilla de pull request con la definición de terminado; integrar `develop` en `main`.",
         "Daril Villey", "29 de noviembre al 5 de diciembre de 2026"),
    ], anchos=[2.2, 8.6, 2.8, 2.4], tam=8.5)
    tabla(doc, "Plantilla F — Compromiso personal de mejora", ["Integrante", "Práctica de calidad a la que me "
                                                                             "comprometo", "Cómo la aplicaré en mi "
                                                                                           "próximo desarrollo"], [
        ("Daril Andrés Villey García Jacinto",
         "No declarar terminada ninguna funcionalidad sin pruebas automatizadas de sus reglas de negocio y de sus "
         "valores frontera.",
         "Por cada endpoint nuevo escribiré antes de programarlo al menos un caso válido, uno inválido y los valores "
         "frontera, tomando `pruebas_api.py` como base; los ejecutaré en GitHub Actions y no integraré a `develop` "
         "un cambio cuyas pruebas fallen."),
    ], anchos=[3.5, 5.5, 7], tam=9)


def conclusiones(doc):
    titulo(doc, "12. Conclusiones")
    evi = sum(c[2] for c in ISO) / len(ISO)
    p(doc, f"**Calificación global: {evi:.1f} de 5 — producto en desarrollo, no apto para producción.** El proyecto "
           f"cumple la parte visible del alcance —catálogo, ventas, compras, inventario y tablero—, pero falla en las "
           f"tres condiciones que lo harían utilizable en Librerías El Regalito: legalidad fiscal (IVA de 12 % y "
           f"certificación FEL), integridad del inventario bajo uso real y control de quién puede hacer qué.",
      sangria=True)
    viñetas(doc, [
        "La brecha promedio de 1.6 puntos entre percepción y evidencia confirma que la percepción se basó en "
        "demostraciones del caso feliz; ninguna característica resultó mejor de lo que se creía.",
        "Las técnicas de diseño de pruebas encontraron en un día defectos que meses de uso manual no mostraron: los "
        "valores frontera confirmaron lo que estaba bien y las tablas de decisión y transiciones de estado "
        "revelaron lo que estaba mal.",
        "Las herramientas automáticas tienen límites: Lighthouse dio 100 en accesibilidad a una pantalla que se "
        "corta en móvil, y Karma reportó 100 % de cobertura con una sola prueba trivial.",
        "Los defectos de inventario no son solo un problema contable: los datos de ventas y stock son la entrada "
        "del modelo predictivo de la tesis. Corregirlos es requisito para que el MAPE que se reporte sea creíble.",
    ])
    p(doc, "**Aprendizaje principal.** La calidad no se puede agregar al final ni se percibe mirando pantallas: se "
           "demuestra con evidencia repetible. La suite de 35 casos y los reportes de este informe quedan como línea "
           "base para medir si el plan de mejora funciona.", sangria=True)


def anexos(doc):
    titulo(doc, "13. Anexos")
    titulo(doc, "Anexo A. Hoja de percepción individual", 2)
    p(doc, "[[Adjunta aquí la hoja de percepción que llenaste antes de recolectar evidencia, con fecha y firma. Si "
           "usas las notas propuestas en la Plantilla A, transcríbelas a mano en tu hoja.]]")
    tabla(doc, "Hoja de percepción individual (llenar antes de la evidencia)", ["Característica", "Nota (1-5)",
                                                                               "Justificación breve"],
          [(c[0], f"[[{c[1]}]]", "") for c in ISO], anchos=[5, 2.5, 8.5], tam=9,
          nota="Integrante: Daril Andrés Villey García Jacinto. Fecha: ____________. Firma: ____________.")
    titulo(doc, "Anexo B. Capturas de evidencia", 2)
    figura(doc, "E01_login_credenciales_precargadas.png", "Pantalla de inicio de sesión con las credenciales del "
                                                          "administrador precargadas y visibles",
           nota="Defecto D-11. Compilación de producción servida localmente.")
    figura(doc, "E02_dashboard_RD_ITBIS_DGII.png", "Tablero con montos en RD$, impuesto ITBIS e insignia «DGII al "
                                                   "día»", nota="Defecto D-18.")
    figura(doc, "E03_factura_IVA18_DOP.png", "Creación de factura en quetzales que calcula «IVA 18%» y total "
                                             "$118.00 sobre Q100.00", nota="Defectos D-01 y D-18.")
    figura(doc, "E04_estado_SAT_placeholder.png", "Módulo «Estado SAT» sin contenido", nota="Defecto D-19.")
    figura(doc, "E05_login_movil_412px.png", "Inicio de sesión a 412 px de ancho: el formulario se adapta sin "
                                             "desplazamiento horizontal",
           ancho=6.5, nota="Resultado positivo de la prueba manual de diseño adaptable.")
    titulo(doc, "Anexo C. Reportes de herramientas", 2)
    tabla(doc, "Archivos de evidencia en docs/calidad/evidencias", ["Archivo", "Contenido"], [
        ("lighthouse_diag_mobile_1.html a _3.html", "Reportes completos de las 3 corridas Mobile"),
        ("lighthouse_diag_desktop.html", "Reporte de la corrida Desktop"),
        ("lighthouse_build_original_NO_FCP.json", "Error NO_FCP de la compilación original"),
        ("sonarjs_backend.json, sonarjs_frontend.json", "Hallazgos de las reglas SonarJS"),
        ("../resultados_pruebas.json", "Resultado de los 35 casos ejecutados"),
    ], anchos=[7, 9], tam=9)
    tabla(doc, "Resumen del análisis estático y de dependencias", ["Herramienta", "Backend", "Frontend"], [
        ("SonarJS: hallazgos", "14 (6 de complejidad cognitiva)", "28 (15 `void-use`, 1 omisión de sanitización)"),
        ("Mayor complejidad cognitiva", "50 en `devolucion.controller.js:247`; 40 en `emitir-factura.js:20`",
         "25 en `factura-print.ts:69`"),
        ("npm audit", "18 (1 crítica, 4 altas, 13 moderadas)", "42 (3 críticas, 12 altas, 27 moderadas; casi "
                                                               "todas en herramientas de desarrollo)"),
        ("Pruebas unitarias", "0", "1 (cobertura reportada 100 % sobre 2 sentencias)"),
    ], anchos=[4, 6, 6], tam=9)
    titulo(doc, "Anexo D. Reproducción de la evaluación", 2)
    viñetas(doc, [
        "Crear la base de prueba ejecutando `database/schema.sql` con el nombre `sistema_facturacion_qa`.",
        "Levantar el backend apuntando a esa base y ejecutar `python docs/calidad/pruebas_api.py`.",
        "Compilar el frontend con `npx ng build`, servir `dist/frontend/browser` y ejecutar Lighthouse en incógnito.",
        "Regenerar este informe con `python docs/calidad/generar_informe.py`.",
    ])


def estilos(doc):
    normal = doc.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    for nombre, tam in (("Heading 1", 14), ("Heading 2", 12)):
        st = doc.styles[nombre]
        st.font.size = Pt(tam)
        st.font.name = "Arial"
        st.paragraph_format.space_before = Pt(14 if nombre == "Heading 1" else 10)
        st.paragraph_format.space_after = Pt(6)
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
    sec.orientation = WD_ORIENT.PORTRAIT
    sec.left_margin = sec.right_margin = Cm(2.5)
    sec.top_margin = sec.bottom_margin = Cm(2.5)
    pie = sec.footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = pie.add_run("Aseguramiento de la Calidad · UMG Salamá · Autoevaluación FacturaAI · Página ")
    r.font.size = Pt(8)
    for tipo, texto in (("begin", None), (None, "PAGE"), ("end", None)):
        run = pie.add_run()
        run.font.size = Pt(8)
        if tipo:
            f = OxmlElement("w:fldChar")
            f.set(qn("w:fldCharType"), tipo)
            run._r.append(f)
        else:
            t = OxmlElement("w:instrText")
            t.text = texto
            run._r.append(t)


def indice(doc):
    encabezado = p(doc, "**Contenido**", alinear=WD_ALIGN_PARAGRAPH.LEFT, tam=14)
    for r in encabezado.runs:
        r.font.color.rgb = AZUL
    par = doc.add_paragraph()
    for tipo, texto in (("begin", None), (None, 'TOC \\o "1-2" \\h \\z \\u'), ("separate", None),
                        (None, None), ("end", None)):
        run = par.add_run()
        if tipo:
            f = OxmlElement("w:fldChar")
            f.set(qn("w:fldCharType"), tipo)
            if tipo == "begin":
                f.set(qn("w:dirty"), "true")
            run._r.append(f)
        elif texto:
            t = OxmlElement("w:instrText")
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            t.text = texto
            run._r.append(t)
        else:
            run.text = "Clic derecho > Actualizar campo para generar el índice."
    salto(doc)


def main():
    doc = Document()
    estilos(doc)
    portada(doc)
    indice(doc)
    resumen_ejecutivo(doc)
    descripcion(doc)
    metodologia(doc)
    evaluacion_requisitos(doc)
    plantilla_a(doc)
    pruebas(doc)
    proceso(doc)
    defectos_riesgos(doc)
    reflexion(doc)
    plan_mejora(doc)
    conclusiones(doc)
    anexos(doc)
    doc.save(SALIDA)
    print("Informe generado:", SALIDA)


if __name__ == "__main__":
    main()
