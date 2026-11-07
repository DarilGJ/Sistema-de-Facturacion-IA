"""Llena la plantilla de la práctica de Lighthouse con las mediciones reales de FacturaAI.

Uso: python -X utf8 docs/calidad/llenar_lighthouse.py RUTA_PLANTILLA.docx RUTA_SALIDA.docx
"""
import copy
import re
import sys
from pathlib import Path

import docx
from docx.shared import Cm, Pt

EVIDENCIAS = Path(__file__).parent / "evidencias"


def poner(par, texto):
    """Reemplaza el texto del párrafo conservando el formato; **texto** va en negrita."""
    base = next((r for r in par.runs if r.text.strip() and not r.bold), None) or (par.runs[0] if par.runs else None)
    rpr = copy.deepcopy(base._r.rPr) if base is not None and base._r.rPr is not None else None
    for r in list(par.runs):
        r._r.getparent().remove(r._r)
    for parte in re.split(r"(\*\*.+?\*\*)", texto):
        if not parte:
            continue
        negrita = parte.startswith("**")
        run = par.add_run(parte[2:-2] if negrita else parte)
        if rpr is not None:
            run._r.insert(0, copy.deepcopy(rpr))
        run.bold = negrita


def celda(c, *parrafos):
    primero = c.paragraphs[0]
    for extra in c.paragraphs[1:]:
        extra._p.getparent().remove(extra._p)
    poner(primero, parrafos[0])
    anterior = primero
    for texto in parrafos[1:]:
        nuevo = copy.deepcopy(primero._p)
        anterior._p.addnext(nuevo)
        anterior = docx.text.paragraph.Paragraph(nuevo, primero._parent)
        poner(anterior, texto)


def fila(tabla, i, *valores):
    for c, v in zip(tabla.rows[i].cells, valores):
        celda(c, *(v if isinstance(v, tuple) else (v,)))


def agregar_fila(tabla):
    tr = copy.deepcopy(tabla.rows[-1]._tr)
    tabla._tbl.append(tr)


def quitar_fila(tabla, i):
    tabla._tbl.remove(tabla.rows[i]._tr)


def figura_despues(par, imagen, leyenda, modelo, ancho=11):
    img = copy.deepcopy(modelo._p)
    par._p.addnext(img)
    p_img = docx.text.paragraph.Paragraph(img, par._parent)
    for r in list(p_img.runs):
        r._r.getparent().remove(r._r)
    p_img.alignment = 1
    p_img.add_run().add_picture(str(EVIDENCIAS / imagen), width=Cm(ancho))
    cap = copy.deepcopy(modelo._p)
    img.addnext(cap)
    p_cap = docx.text.paragraph.Paragraph(cap, par._parent)
    poner(p_cap, leyenda)
    p_cap.alignment = 1
    for r in p_cap.runs:
        r.italic = True
        r.font.size = Pt(9)
    return p_cap


def llenar(entrada, salida):
    d = docx.Document(entrada)
    P, T = d.paragraphs, d.tables

    # Encabezado y contexto
    fila(T[0], 2, "Modalidad", "Individual")
    fila(T[0], 3, "Entregable", "Informe técnico de auditoría individual — Daril Andrés Villey García Jacinto")
    fila(T[0], 4, "Página evaluada", "Pantalla de inicio de sesión de FacturaAI, puerta de entrada al módulo de "
                                     "facturación de Librerías El Regalito (http://localhost:8080/login)")
    fila(T[0], 5, "Herramienta", "Google Lighthouse 12.8.2 por línea de comandos, con Chrome sin interfaz y perfil "
                                 "temporal limpio (equivalente a la ventana de incógnito)")
    fila(T[0], 6, "Alcance", "Evaluación individual de una sola página, ejecutada el 31 de octubre de 2026")

    poner(P[5], "Para esta práctica se eligió una única página: la **pantalla de inicio de sesión de FacturaAI**, el "
                "sistema de facturación e inventario de **Librerías El Regalito** (Salamá, Guatemala). Es la página "
                "por la que todo cajero entra al módulo de facturación al iniciar cada turno, y la única que puede "
                "medirse sin sesión iniciada. La evaluación es individual y no se compara con ningún otro sitio; los "
                "resultados se interpretan frente a los umbrales de la propia herramienta y frente al uso real del "
                "sistema.")
    fila(T[1], 1, "URL evaluada", "http://localhost:8080/login (compilación de producción de Angular servida "
                                  "localmente; la instancia publicada en Render no respondía el día de la prueba)")
    fila(T[1], 2, "Empresa", "Librerías El Regalito (Salamá, Baja Verapaz, Guatemala)")
    fila(T[1], 3, "Contexto técnico", "Aplicación de una sola página (SPA) en Angular 20 con backend en Node.js y "
                                      "Express 5 sobre MySQL. Tras iniciar sesión da acceso a facturación, "
                                      "cotizaciones, compras, inventario y tablero de ventas.")
    poner(P[7], "**Descripción funcional del módulo.** La pantalla de inicio de sesión pide **correo** y "
                "**contraseña**, valida el formato en el navegador y, al presionar «Entrar», solicita un token JWT a "
                "la API. Con ese token el cajero llega al módulo de facturación, donde busca al cliente por NIT o "
                "como «Consumidor Final (CF)», agrega productos del catálogo, el sistema calcula subtotal, impuestos "
                "y total, y emite el documento con su número de autorización. Las reglas de negocio de ese flujo "
                "(cálculo de impuestos y emisión del documento) quedan fuera del alcance de Lighthouse, que solo mide "
                "cómo se carga y se construye la página. Si el acceso tarda o falla, el cajero no puede empezar a "
                "facturar, por lo que el rendimiento y la accesibilidad de esta pantalla tienen un impacto operativo "
                "directo.")

    # 2. Conocer la herramienta
    celda(T[2].rows[1].cells[2], "Alta: determina qué tan rápido el cajero ve el formulario de acceso y puede "
                                 "empezar a trabajar.")
    celda(T[2].rows[2].cells[2], "Alta: el formulario se usa con teclado al inicio de cada turno y debe ser "
                                 "operable por personal con baja visión.")
    celda(T[2].rows[3].cells[2], "Alta: la página recibe credenciales que dan acceso a datos fiscales de clientes.")
    celda(T[3].rows[1].cells[2], "Es el modo usado en esta práctica: mide la carga inicial de /login, desde la "
                                 "descarga del JavaScript de Angular hasta que el formulario aparece y responde.")
    celda(T[3].rows[2].cells[2], "Serviría para medir el inicio de sesión completo: escribir el correo y la "
                                 "contraseña, presionar «Entrar» y esperar el tablero. Detectaría bloqueos del hilo "
                                 "principal o saltos de diseño durante la transición.")
    celda(T[3].rows[3].cells[2], "Serviría para revisar estados que la carga no muestra, como el mensaje de error "
                                 "de credenciales inválidas o el botón en estado «Entrando...».")
    poner(P[17], "En la pantalla de inicio de sesión se espera, por tanto, que el puntaje de Performance sea menor en "
                 "Mobile. Al ser una SPA de Angular, el formulario no existe en el HTML inicial: el navegador debe "
                 "descargar, analizar y ejecutar el JavaScript del framework antes de pintarlo, tareas que dependen "
                 "de la CPU. Con el procesador ralentizado 4x, ese trabajo se encarece y sube el FCP y el LCP. Se "
                 "espera que Accessibility, Best Practices y SEO no cambien entre dispositivos, porque dependen del "
                 "marcado y no de la velocidad.")

    # 3. Ejecutar con rigor
    poner(P[20], "Lighthouse 12.8.2 desde la línea de comandos, con Chrome sin interfaz y un perfil temporal nuevo "
                 "en cada corrida: sin extensiones, sin caché ni cookies, igual que una ventana de incógnito.")
    poner(P[21], "Mismo equipo, misma compilación de producción y mismo servidor local en todas las corridas, "
                 "ejecutadas de forma consecutiva el 31 de octubre de 2026 a las 15:22.")
    poner(P[22], "Tres ejecuciones en modo Mobile (dispositivo de gama media emulado, CPU 4x más lenta, red 4G "
                 "simulada de 150 ms y 1.6 Mbps) y una en Desktop, con las cuatro categorías disponibles.")
    poner(P[23], "**Hallazgo previo a las corridas válidas.** La compilación original no pudo medirse: Lighthouse "
                 "devolvió el error **NO_FCP** («la página no pintó contenido») en cuatro intentos, con y sin "
                 "interfaz, aunque la página sí se ve en el navegador. La causa es que todo el contenido nace con "
                 "opacity: 0 dentro de animaciones CSS (login.css, líneas 10 y 21), y Lighthouse no cuenta como "
                 "pintado un contenido invisible. Para confirmar la causa se midió una copia idéntica de la "
                 "compilación con la regla *{animation:none!important} añadida a index.html, sin tocar el código "
                 "fuente. **Puntajes de desempeño (Performance) de cada ejecución:**")
    fila(T[4], 1, "Inicio de sesión, copia sin animaciones (Mobile)", "97", "97", "97", "97", "0")
    agregar_fila(T[4])
    fila(T[4], 2, "Inicio de sesión, compilación original (Mobile)", "NO_FCP", "NO_FCP", "NO_FCP", "Sin puntaje", "—")
    poner(P[26], "El puntaje fue 97 en las tres corridas, es decir, **0 puntos de diferencia**, siempre en la banda "
                 "verde (90 a 100). Las métricas sí variaron un poco: el TBT fue de 30, 60 y 50 ms y el LCP de 2.1, "
                 "2.2 y 2.1 s. El puntaje no se movió porque esas variaciones quedaron dentro del rango verde, donde "
                 "la curva de puntuación es casi plana, y porque Lighthouse simula la red a partir de la traza en vez "
                 "de esperar a una red real. La variación que sí hubo se atribuye a:")
    poner(P[27], "**Latencia de red:** fue mínima porque el servidor era local (localhost). En un servidor publicado, el "
                 "DNS, la negociación TLS y la distancia al servidor agregarían una variación que esta prueba no "
                 "tuvo.")
    poner(P[30], "**Variabilidad del backend:** la pantalla de inicio de sesión no consulta la API al cargar, así que el "
                 "backend no influyó en estas corridas. En pantallas que cargan catálogo o clientes sí influiría.")
    poner(P[31], "**Implicación al reportar a un cliente:** no debe entregarse un número aislado como si fuera una "
                 "verdad exacta. Lo correcto es reportar el **promedio con su rango** («97, rango 97–97, en 3 "
                 "corridas») junto con las condiciones de la prueba: dispositivo emulado, red simulada, versión 12.8.2 "
                 "y, sobre todo, que el servidor era local. Un 97 medido en localhost es un resultado optimista; en el "
                 "servidor publicado el puntaje será menor. También debe reportarse que la compilación original no "
                 "obtuvo puntaje, porque ese es el resultado que vería cualquier auditor externo.")

    # 4. Métricas
    poner(P[33], "Los valores corresponden a la corrida 3 (puntaje 97), elegida porque su TBT de 50 ms es la mediana "
                 "de las tres corridas. Lighthouse colorea cada métrica en verde, naranja o rojo según umbrales "
                 "definidos.")
    fila(T[5], 1, "First Contentful Paint (FCP)", "1.9 s", "Naranja",
         "Tiempo hasta que aparece el primer contenido. En el inicio de sesión es el momento en que el cajero deja "
         "de ver la pantalla vacía y aparece el panel. Supera por 0.1 s el umbral verde de 1.8 s porque el "
         "formulario se construye con JavaScript en el navegador.")
    fila(T[5], 2, "Largest Contentful Paint (LCP)", "2.1 s", "Verde",
         "Tiempo hasta que se pinta el elemento más grande, que aquí es el texto «FacturaAI» del encabezado. "
         "Representa cuándo el cajero ve la pantalla completa. El 79 % de ese tiempo es retraso de renderizado: "
         "el HTML llega rápido, pero el texto espera a que Angular termine.")
    fila(T[5], 3, "Total Blocking Time (TBT)", "50 ms", "Verde",
         "Tiempo en que el hilo principal estuvo bloqueado por tareas largas. Con 50 ms, el campo de correo "
         "responde casi de inmediato a lo que se escribe. La evaluación de scripts sumó 335 ms de trabajo, "
         "repartido en tareas cortas.")
    fila(T[5], 4, "Cumulative Layout Shift (CLS)", "0", "Verde",
         "Mide los desplazamientos inesperados del diseño. Con 0, los campos y el botón «Entrar» no se mueven "
         "mientras carga la página, así que no hay riesgo de pulsar el control equivocado.")
    fila(T[5], 5, "Speed Index", "1.9 s", "Verde",
         "Qué tan rápido se llena visualmente la página. Como el panel aparece completo de una vez, coincide con "
         "el FCP.")
    poner(P[36], "La combinación **LCP + TBT** es la que mejor describe lo que siente el cajero al abrir el sistema. "
                 "El LCP indica cuándo ve el formulario completo; el TBT indica si, una vez visible, puede escribir "
                 "sin que la pantalla se congele. En este caso ambas están en verde (2.1 s y 50 ms) y solo el FCP "
                 "queda en naranja (1.9 s). El dato más revelador es el desglose del LCP: el 79 % del tiempo es "
                 "retraso de renderizado, no descarga. La página pesa apenas 126 KiB, pero el formulario no existe "
                 "hasta que se ejecuta el JavaScript de Angular. Para el cajero eso es casi imperceptible en una "
                 "computadora; en un teléfono de gama baja, con red móvil real, el retraso crecería.")

    # 5. Oportunidades
    poner(P[38], "Lighthouse separa las Opportunities (mejoras con un ahorro estimado) de los Diagnostics "
                 "(información de apoyo sin ahorro estimado). Estos son los tres hallazgos de mayor impacto en la "
                 "pantalla de inicio de sesión:")
    fila(T[6], 1, "Reducir el JavaScript sin usar (unused-javascript)",
         "≈150 ms en Mobile y 40 ms en Desktop (28 KiB)",
         "El archivo principal chunk-5KO7WORL.js pesa 64 KiB comprimido y el 45 % de su código no se ejecuta en "
         "la pantalla de inicio de sesión. Se descarga y analiza código que solo usan otras pantallas.",
         ("Rol: Frontend.", "Revisar qué importa la ruta /login, mover a carga diferida las dependencias del "
                            "panel (las rutas ya usan loadComponent), usar @defer en bloques secundarios y "
                            "vigilar los budgets de angular.json."))
    fila(T[6], 2, "Usar tiempos de caché eficientes (uses-long-cache-ttl)",
         "≈120 KiB en cada visita repetida (9 recursos)",
         "Los archivos JavaScript y CSS se sirven sin cabecera de caché, así que el navegador los vuelve a "
         "descargar en cada visita aunque sus nombres llevan un hash que cambia con cada versión. Se midió con un "
         "servidor local; en producción depende de cómo lo configure el hosting.",
         ("Rol: DevOps.", "Configurar Cache-Control: public, max-age=31536000, immutable para los archivos con "
                          "hash y no-cache para index.html, en el servidor o en la CDN."))
    fila(T[6], 3, "Retraso de renderizado del LCP (diagnóstico lcp-breakdown)",
         "Sin ahorro estimado (1.68 s del LCP simulado de 2.14 s)",
         "El elemento LCP es el texto «FacturaAI». El HTML llega en menos de medio segundo, pero el texto no se "
         "pinta hasta que el navegador descarga index.html y después el JavaScript de Angular (main, polyfills y "
         "seis fragmentos), y lo ejecuta.",
         ("Rol: Arquitecto / Frontend.", "Prerenderizar la ruta /login con el SSR o SSG de Angular, o incluir un "
                                         "esqueleto del panel en index.html para que aparezca antes del "
                                         "JavaScript."))
    poner(P[40], "El orden refleja que la página ya es ligera (126 KiB en total y 24 elementos en el DOM), así que "
                 "los ahorros son pequeños. El costo principal no es el tamaño de los recursos, sino que todo el "
                 "contenido depende de ejecutar JavaScript, lo cual es coherente con una SPA y con el FCP en naranja.")

    # 6. Accesibilidad
    celda(T[7].rows[0].cells[0], "Resultado de las auditorías automáticas")
    celda(T[7].rows[0].cells[1], "¿Qué usuario se relaciona y cómo?")
    fila(T[7], 1, "Puntaje 100/100: **ninguna auditoría automática falló**. Aprobaron 10 reglas, entre ellas "
                  "nombre accesible del botón, etiquetas de los campos, contraste, idioma del documento y orden de "
                  "encabezados; 52 no aplicaban a una pantalla tan simple.",
         "Usuarios de lector de pantalla (NVDA, JAWS): escuchan «Email», «Contraseña» y «Entrar» correctamente, "
         "porque cada campo tiene su etiqueta y el botón tiene texto.")
    fila(T[7], 2, "10 revisiones que Lighthouse lista como **manuales** y no evalúa: controles enfocables con "
                  "teclado, orden lógico de tabulación, foco dirigido a contenido nuevo, ausencia de trampas de "
                  "foco, entre otras.",
         "Usuarios que navegan solo con teclado. Lighthouse no puede afirmar nada sobre ellos; por eso se "
         "verificaron a mano en la sección 6.2.")
    fila(T[7], 3, "Aprobadas meta-viewport y target-size: la página permite ampliar el zoom y los controles "
                  "táctiles tienen tamaño y separación suficientes.",
         "Personas con baja visión que necesitan ampliar, y cajeros que usan tableta o celular.")
    poner(P[46], "**Navegación solo con teclado (tecla Tab):** con Chrome controlado por puppeteer se presionó Tab "
                 "cinco veces sobre /login. El foco recorrió Email → Contraseña → Entrar, salió a la interfaz del "
                 "navegador y volvió a Email. El orden coincide con el visual y no hay trampas de foco. Los campos "
                 "muestran el foco con borde dorado y sombra, y el botón con el anillo del navegador (Figura 1).")
    poner(P[47], "**Zoom al 200 %:** se simuló una ventana de 1280 px al 200 % (640 px CSS). No aparece "
                 "desplazamiento horizontal: el contenido mide 640 px, igual que la vista. El botón «Entrar» queda "
                 "21 px por debajo del borde y se alcanza con desplazamiento vertical, lo que WCAG 1.4.10 permite "
                 "(Figura 2). A 320, 360 y 412 px de ancho tampoco hay desbordamiento.")
    poner(P[48], "**Resultado de la prueba manual y hallazgo no reportado por Lighthouse:** el texto de ayuda "
                 "«Demo: admin@demo.com / Admin123!» usa el color #64748b. Sobre el fondo real del panel, "
                 "rgb(27, 46, 75) medido en los píxeles de la captura, tiene un **contraste de 2.9:1**, por debajo "
                 "del mínimo de 4.5:1 (criterio WCAG 1.4.3). Lighthouse lo aprobó porque el panel tiene fondo "
                 "translúcido sobre un degradado: axe-core, su motor de accesibilidad, no calcula el contraste "
                 "cuando no puede determinar el color de fondo y deja esos elementos como «incompletos», sin restar "
                 "puntos. Además, ese texto muestra la contraseña del administrador y el formulario ya viene "
                 "precargado con ella, un problema de seguridad que Best Practices tampoco detecta. Se recomienda "
                 "retirar el texto y las credenciales precargadas. Si se conserva algún texto de ayuda, debe usar al "
                 "menos el color #94a3b8 del subtítulo, que alcanza 5.4:1.")
    modelo = P[33]
    cap1 = figura_despues(P[48], "M01_foco_teclado_boton.png",
                          "Figura 1. Foco visible en el botón «Entrar» tras tres pulsaciones de Tab", modelo)
    figura_despues(cap1, "M02_zoom_200.png", "Figura 2. Pantalla de inicio de sesión con zoom de 200 % (640 px CSS)",
                   modelo, ancho=10)

    # 7. Buenas prácticas y SEO
    fila(T[8], 1, "Best Practices", "100 / 100",
         "Aprobaron las 14 auditorías puntuables: sin errores en la consola, sin APIs obsoletas, sin cookies de "
         "terceros, sin bloqueo del pegado en el campo de contraseña, doctype y charset correctos. Limitación: se "
         "midió en localhost, que el navegador trata como origen seguro, así que «usa HTTPS» no prueba el "
         "despliegue. CSP, HSTS y la protección contra clickjacking son solo informativas en Lighthouse 12 y no "
         "suman al puntaje.",
         ("Seguridad (confidencialidad: el formulario recibe credenciales).",
          "Mantenibilidad (una consola sin errores facilita analizar fallos)."))
    fila(T[8], 2, "SEO", "82 / 100",
         "Falta la meta description y el robots.txt es inválido (13 errores): el servidor responde /robots.txt "
         "con el index.html de la SPA, porque toda ruta desconocida se redirige a la aplicación. El impacto en "
         "posicionamiento es bajo porque es una aplicación interna.",
         ("Usabilidad (reconocibilidad de la página y de su propósito).",
          "Mantenibilidad (configuración del servidor coherente con los archivos que publica)."))
    poner(P[51], "Es importante interpretar el SEO con criterio: en una aplicación de facturación interna, la "
                 "indexación por buscadores no es un objetivo y conviene impedirla. La corrección útil no es buscar "
                 "100 en SEO, sino publicar un robots.txt real con «Disallow: /» y una directiva noindex. Por eso el "
                 "82 no es prioritario frente a los hallazgos de seguridad del formulario.")

    # 8. Mobile vs Desktop
    poner(P[53], "Se ejecutó Lighthouse en modo Desktop (una sola corrida) sobre la misma pantalla y se comparó con "
                 "el promedio de las tres corridas en Mobile:")
    fila(T[9], 0, "Inicio de sesión", "Performance", "Accessibility", "Best Practices", "SEO")
    fila(T[9], 1, "Mobile (promedio)", "97", "100", "100", "82")
    fila(T[9], 2, "Desktop (1 corrida)", "100", "100", "100", "82")
    fila(T[9], 3, "Diferencia", "+3", "0", "0", "0")
    poner(P[55], "La única categoría que cambió fue Performance, que pasó de 97 en Mobile a 100 en Desktop. Las "
                 "métricas lo explican: FCP de 1.9 s a 0.5 s, LCP de 2.1 s a 0.6 s y TBT de 50 ms a 0 ms. Las otras "
                 "tres categorías quedaron iguales porque dependen del marcado y no de las condiciones de ejecución, "
                 "tal como se esperaba en la sección 2.3.")
    poner(P[56], "La mejora en Desktop se explica por la ausencia de CPU throttling y por una red sin restricciones. "
                 "En Mobile, la CPU emulada es 4 veces más lenta, así que analizar y ejecutar el JavaScript de Angular "
                 "tarda más, y como el formulario depende de ese JavaScript, el FCP y el LCP se retrasan. La brecha es "
                 "pequeña porque la página es ligera, pero es relevante para el negocio: si algún cajero entra desde "
                 "una tableta o un celular de gama media, su experiencia se parecerá más al puntaje Mobile, y con una "
                 "red real, no simulada, la diferencia crecería.")

    # 9. Límites
    poner(P[62], "El Principio 7 establece que **encontrar y corregir defectos no garantiza que el sistema cumpla "
                 "las necesidades del usuario**; un sistema sin defectos detectados puede, aun así, ser inútil o "
                 "incorrecto. Aplicado a este caso: **obtener 100 en tres categorías y 97 en desempeño no asegura "
                 "que el sistema sea de calidad**. La propia prueba lo demostró: Lighthouse dio 100 en "
                 "accesibilidad a un texto con contraste de 2.9:1 y 100 en buenas prácticas a un formulario que "
                 "muestra la contraseña del administrador. Tampoco puede saber si una factura lleva el NIT correcto, "
                 "si los totales cuadran o si el sistema resiste a varios cajeros facturando a la vez, porque evalúa "
                 "cómo se carga y se estructura la página, no si el proceso de negocio es correcto. Por ello, el "
                 "reporte debe complementarse con pruebas funcionales, de integración, de regresión y de carga.")

    # 10. Entregable final
    fila(T[11], 1, "1", "La compilación original no registra FCP (NO_FCP): todo el contenido nace con opacity: 0 en "
                        "animaciones CSS. Iniciar la animación desde un estado visible o respetar "
                        "prefers-reduced-motion.", "Performance / Medición", "A", "B", "1")
    fila(T[11], 2, "2", "Credenciales del administrador precargadas y visibles en el formulario (hallazgo manual). "
                        "Retirar los valores por defecto y el texto «Demo».", "Seguridad (manual)", "A", "B", "2")
    fila(T[11], 3, "3", "Contraste de 2.9:1 en el texto de ayuda, que Lighthouse no detectó (hallazgo manual). Usar "
                        "un color con al menos 4.5:1, como #94a3b8.", "Accesibilidad (manual)", "M", "B", "3")
    fila(T[11], 4, "4", "Archivos estáticos sin cabecera de caché (≈120 KiB por visita). Cache-Control immutable "
                        "para archivos con hash.", "Performance", "M", "B", "4")
    fila(T[11], 5, "5", "JavaScript sin usar (28 KiB) y renderizado que depende de Angular; meta description y "
                        "robots.txt inválido. Carga diferida, prerenderizado de /login y robots.txt real.",
         "Performance / SEO", "B", "M", "5")
    poner(P[76], "La auditoría mostró que la pantalla de inicio de sesión de FacturaAI tiene una base técnica sólida: "
                 "97 en Mobile, 100 en Desktop, CLS de 0, TBT de 50 ms y una página de solo 126 KiB. Sin embargo, la "
                 "compilación original ni siquiera obtiene puntaje, por las animaciones que ocultan el contenido. Lo "
                 "más revelador fue que la prueba manual encontró dos problemas que Lighthouse calificó con 100: un "
                 "texto con contraste insuficiente y la contraseña del administrador a la vista. Un evaluador "
                 "experimentado no se quedaría con los puntajes: combinaría varias corridas, el servidor publicado, "
                 "datos de campo y pruebas funcionales, y reportaría rangos y condiciones, no cifras únicas.")

    d.save(salida)


if __name__ == "__main__":
    llenar(sys.argv[1], sys.argv[2])
    print("Informe guardado en", sys.argv[2])
