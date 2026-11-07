"""Ampliaciones de los capítulos 4 a 6."""


# --------------------------------------------------------------------------- #
# Capítulo 4: Análisis de la aplicación
# --------------------------------------------------------------------------- #
def requerimientos(w):
    w.h1("Requerimientos del sistema")
    w.p("Los requerimientos se obtuvieron mediante entrevistas con el Gerente General y el jefe de sucursal, la observación directa de los procesos de venta y bodega, y la revisión del sistema de facturación existente. Se clasifican en funcionales, que describen lo que el sistema debe hacer, y no funcionales, que establecen las condiciones de calidad con las que debe hacerlo.")
    w.h2("Requerimientos funcionales")
    w.tabla("Requerimientos funcionales de la plataforma",
            ["Código", "Requerimiento", "Prioridad"],
            [
                ["RF-01", "Autenticar a los usuarios y restringir el acceso a los módulos según su rol (administrador, vendedor, contador)", "Alta"],
                ["RF-02", "Registrar ventas en el punto de venta con búsqueda de productos y de clientes por NIT", "Alta"],
                ["RF-03", "Certificar cada venta como DTE ante el certificador FEL y almacenar su número de autorización", "Alta"],
                ["RF-04", "Descontar automáticamente el inventario de la bodega correspondiente al certificar una venta", "Alta"],
                ["RF-05", "Gestionar el catálogo de productos, categorías, subcategorías, marcas y proveedores", "Alta"],
                ["RF-06", "Registrar compras a proveedores e incrementar las existencias de la bodega receptora", "Alta"],
                ["RF-07", "Registrar traslados entre bodegas y sucursales con trazabilidad de origen y destino", "Alta"],
                ["RF-08", "Registrar ajustes de inventario y devoluciones con justificación", "Media"],
                ["RF-09", "Mantener un kárdex con todos los movimientos de entrada y salida por producto y bodega", "Alta"],
                ["RF-10", "Generar pronósticos de demanda por producto mediante el modelo de aprendizaje supervisado", "Alta"],
                ["RF-11", "Calcular el Punto de Reorden y sugerir órdenes de compra", "Alta"],
                ["RF-12", "Mostrar en el tablero los indicadores de ventas, las alertas de reabastecimiento y de baja rotación", "Alta"],
                ["RF-13", "Emitir cotizaciones y convertirlas en facturas", "Media"],
                ["RF-14", "Anular documentos y revertir los movimientos de inventario asociados", "Alta"],
                ["RF-15", "Exportar e importar información de inventario en hojas de cálculo", "Baja"],
            ])
    w.h2("Requerimientos no funcionales")
    w.tabla("Requerimientos no funcionales de la plataforma",
            ["Código", "Atributo", "Requerimiento"],
            [
                ["RNF-01", "Seguridad", "Las contraseñas se almacenan cifradas con bcrypt y las sesiones se validan mediante JWT con expiración"],
                ["RNF-02", "Seguridad", "La comunicación entre el navegador y el servidor se realiza exclusivamente mediante HTTPS"],
                ["RNF-03", "Integridad", "La certificación de la venta y el descuento de inventario se ejecutan en una misma transacción de base de datos"],
                ["RNF-04", "Rendimiento", "El registro de una venta en el punto de venta no debe superar [[3]] segundos, excluido el tiempo de respuesta del certificador"],
                ["RNF-05", "Disponibilidad", "La plataforma debe estar disponible durante el horario comercial de todas las sucursales"],
                ["RNF-06", "Usabilidad", "La interfaz debe ser utilizable por personal sin formación técnica tras una capacitación breve"],
                ["RNF-07", "Mantenibilidad", "El motor predictivo debe poder reentrenarse y sustituirse sin detener el módulo transaccional"],
                ["RNF-08", "Portabilidad", "El acceso debe realizarse desde navegadores web modernos sin instalación local"],
                ["RNF-09", "Precisión", "El modelo predictivo debe mantener un MAPE inferior al 15 % en el conjunto de prueba"],
            ])
    w.h2("Reglas de negocio")
    w.viñetas([
        "**RN-01:** Una venta solo se considera concluida cuando el certificador devuelve el número de autorización del DTE.",
        "**RN-02:** No se permite vender una cantidad superior a la existencia disponible en la bodega de despacho, salvo que la configuración de inventario lo autorice expresamente.",
        "**RN-03:** El sistema sugiere las órdenes de compra, pero solo el Gerente General puede aprobarlas, ajustarlas o rechazarlas.",
        "**RN-04:** Los productos con menos de doce meses de historial no reciben pronóstico automático y se marcan para revisión manual.",
        "**RN-05:** Los productos de categorías perecederas que superen 60 días sin rotación generan una alerta de salida prioritaria por PEPS.",
        "**RN-06:** Toda anulación, ajuste o devolución debe quedar registrada en el kárdex con el usuario y la fecha que la originaron.",
    ])


def modelado_as_is_to_be(w):
    w.h2("Modelo del negocio actual (AS-IS)")
    w.p("En la situación actual, el proceso de reabastecimiento se inicia cuando un encargado de sucursal detecta visualmente que un producto se agotó o está por agotarse y lo notifica por mensajería instantánea al jefe de sucursal de la matriz. Este revisa de manera informal las existencias de la bodega central y, si el producto está disponible, coordina el envío sin generar un documento de traslado; si no lo está, el Gerente General decide la compra con base en su experiencia y en la urgencia percibida. Como resultado, el inventario registrado en el sistema no refleja los movimientos reales entre bodegas y las compras se realizan cuando el desabastecimiento ya ocurrió.")
    w.figura("Proceso actual de reabastecimiento (AS-IS)",
             "diagrama de proceso BPMN o de actividades del flujo actual: detección visual, mensaje por WhatsApp, envío informal, compra de emergencia")
    w.h2("Modelo del negocio propuesto (TO-BE)")
    w.p("En el proceso propuesto, cada venta certificada descuenta automáticamente el inventario de la bodega correspondiente y cada traslado se registra en el sistema, de modo que las existencias se mantienen actualizadas. El proceso ETL alimenta periódicamente al modelo predictivo, que calcula la demanda esperada y el Punto de Reorden de cada artículo. Cuando la existencia proyectada alcanza el Punto de Reorden, el tablero emite una alerta y propone una orden de compra con la cantidad sugerida. El Gerente General revisa la propuesta, la aprueba o la ajusta, y el Encargado de Bodega recibe la mercadería y la distribuye mediante traslados registrados.")
    w.figura("Proceso propuesto de reabastecimiento (TO-BE)",
             "diagrama de proceso del flujo propuesto: venta certificada, actualización de existencias, pronóstico, alerta ROP, aprobación de la orden, recepción y traslado")


def iteraciones(w):
    w.p("La tabla siguiente detalla las iteraciones ejecutadas en cada fase de RUP y el incremento funcional entregado en cada una.")
    w.tabla("Iteraciones del proyecto por fase de RUP",
            ["Fase", "Iteración", "Incremento entregado"],
            [
                ["Inicio", "I1", "Diagnóstico de la situación actual, definición del alcance, análisis de factibilidad y requerimientos iniciales"],
                ["Elaboración", "E1", "Arquitectura de software, modelo entidad-relación y casos de uso principales"],
                ["Elaboración", "E2", "Extracción y depuración del histórico 2023-2025; prototipo del modelo predictivo"],
                ["Construcción", "C1", "Módulo transaccional: autenticación, catálogos, punto de venta y facturación"],
                ["Construcción", "C2", "Módulo de inventario: existencias, kárdex, compras, traslados, ajustes y devoluciones"],
                ["Construcción", "C3", "Integración FEL, microservicio predictivo, cálculo del ROP y tablero analítico"],
                ["Transición", "T1", "Pruebas de certificación en sandbox, pruebas de aceptación, capacitación y despliegue"],
            ],
            nota="Elaboración propia. [[Ajuste las iteraciones a las fechas reales de su cronograma.]]")


def riesgos(w):
    w.h2("Gestión de riesgos")
    w.p("Uno de los principios de RUP es abordar los riesgos de mayor impacto en las primeras iteraciones. La tabla siguiente presenta los riesgos identificados, su valoración y la estrategia de mitigación aplicada.")
    w.tabla("Matriz de riesgos del proyecto",
            ["Riesgo", "Probabilidad", "Impacto", "Mitigación"],
            [
                ["Datos históricos incompletos o con errores", "Alta", "Alto", "Depuración en el ETL y validación de totales contra los reportes de ventas"],
                ["Precisión del modelo inferior a la meta", "Media", "Alto", "Prototipo temprano del modelo en la fase de elaboración y comparación de algoritmos"],
                ["Rechazos o indisponibilidad del certificador FEL", "Media", "Alto", "Pruebas exhaustivas en sandbox y manejo transaccional de errores"],
                ["Resistencia del personal al cambio", "Media", "Medio", "Participación del personal en la validación y capacitación por rol"],
                ["Productos sin historial suficiente", "Alta", "Medio", "Regla de revisión manual para artículos con menos de 12 meses de ventas"],
                ["Pérdida de información", "Baja", "Alto", "Respaldos automáticos diarios y verificación periódica de restauración"],
            ])


# --------------------------------------------------------------------------- #
# Capítulo 5: Diseño
# --------------------------------------------------------------------------- #
FIGURAS_CAP5 = [
    "Caso de uso específico: aprobación de orden de compra",
    "Caso de uso específico: alerta de baja rotación",
    "Diagrama de actividades del proceso de reabastecimiento",
    "Diagrama de secuencias del proceso de predicción y reabastecimiento",
    "Diagrama de componentes de la plataforma",
    "Diagrama de objetos de una instancia de reabastecimiento automático",
    "Diagrama de clases del sistema",
    "Diagrama entidad-relación de la base de datos",
    "Diagrama de infraestructura de la plataforma",
]


def casos_de_uso(w):
    w.h2("Diagrama de casos de uso general")
    w.figura("Diagrama de casos de uso general de la plataforma",
             "diagrama UML de casos de uso con los actores Gerente General, Encargado de Bodega, Encargado de Sucursal/Cajero, Administrador TI y los sistemas externos Certificador FEL y Motor ML")
    w.p("Los casos de uso principales se especifican a continuación mediante plantillas que describen sus actores, condiciones y flujo de eventos.")
    casos = [
        ("CU-01 Emitir factura electrónica", "Encargado de Sucursal / Cajero; Certificador FEL",
         "El usuario ha iniciado sesión y el cliente está registrado o se factura a consumidor final.",
         "1. El cajero agrega los productos. 2. El sistema verifica existencias y calcula el IVA. 3. El cajero confirma la venta. 4. El sistema envía el DTE al certificador. 5. El certificador devuelve el número de autorización. 6. El sistema registra la factura, descuenta el inventario y registra el movimiento en el kárdex.",
         "Si el certificador rechaza el documento, la transacción se revierte y no se descuenta inventario."),
        ("CU-02 Generar pronóstico de demanda", "Administrador TI; Motor ML",
         "Existe un histórico de al menos doce meses para el producto.",
         "1. El proceso ETL extrae las ventas. 2. El motor genera las variables. 3. El modelo calcula la demanda esperada. 4. El sistema almacena el pronóstico, el ROP y el MAPE registrado.",
         "Si el producto no tiene historial suficiente, se marca para revisión manual."),
        ("CU-03 Aprobar orden de compra sugerida", "Gerente General",
         "Existe al menos una alerta de reabastecimiento activa.",
         "1. El gerente consulta las sugerencias en el tablero. 2. Revisa la cantidad sugerida y el pronóstico. 3. Aprueba o ajusta la cantidad. 4. El sistema registra la orden con origen «Automática» o «Ajustada».",
         "Si el gerente rechaza la sugerencia, registra el motivo."),
        ("CU-04 Atender alerta de baja rotación", "Encargado de Bodega",
         "Un producto perecedero supera el umbral de días sin rotación.",
         "1. El sistema emite la alerta. 2. El encargado identifica el lote más antiguo. 3. Prioriza su despacho o traslado conforme a PEPS. 4. Registra el movimiento.",
         "Si el producto ya está deteriorado, registra un ajuste por merma."),
        ("CU-05 Registrar traslado entre bodegas", "Encargado de Bodega",
         "Existen existencias en la bodega de origen.",
         "1. El encargado selecciona origen, destino y productos. 2. El sistema valida existencias. 3. Registra la salida y la entrada en el kárdex de ambas bodegas.",
         "Si la existencia es insuficiente, el sistema impide el traslado."),
        ("CU-06 Reentrenar el modelo predictivo", "Administrador TI",
         "Concluyó un trimestre o el MAPE en producción superó el umbral.",
         "1. Ejecuta el ETL actualizado. 2. Entrena el nuevo modelo. 3. Compara su MAPE con el vigente. 4. Publica el nuevo modelo si es igual o mejor.",
         "Si el nuevo modelo es inferior, conserva el vigente y documenta la causa."),
    ]
    for nombre, actores, pre, flujo, alterno in casos:
        w.tabla(f"Especificación del caso de uso {nombre}",
                ["Elemento", "Descripción"],
                [
                    ["Actores", actores],
                    ["Precondición", pre],
                    ["Flujo principal", flujo],
                    ["Flujo alterno", alterno],
                ],
                anchos=[3.5, 11])


def diccionario_datos(w):
    w.h2("Diccionario de datos")
    w.p("El diccionario de datos describe cada entidad del modelo entidad-relación, sus atributos, tipos de dato y restricciones. Constituye la referencia para el desarrollo, el mantenimiento y la construcción de los procesos ETL.")
    entidades = [
        ("Clientes", [
            ["id_cliente", "INT", "PK, autoincremental", "Identificador del cliente"],
            ["nit", "VARCHAR", "Único; «CF» para consumidor final", "Número de Identificación Tributaria"],
            ["nombre", "VARCHAR", "Obligatorio", "Nombre o razón social"],
            ["direccion", "VARCHAR", "Opcional", "Dirección fiscal"],
        ]),
        ("Facturas", [
            ["id_factura", "INT", "PK, autoincremental", "Identificador de la factura"],
            ["id_cliente", "INT", "FK → Clientes", "Cliente receptor del DTE"],
            ["fecha_emision", "DATETIME", "Obligatorio", "Fecha y hora de certificación"],
            ["total", "DECIMAL", "≥ 0", "Monto total con IVA"],
        ]),
        ("Detalle_Facturas", [
            ["id_detalle", "INT", "PK, autoincremental", "Identificador de la línea"],
            ["id_factura", "INT", "FK → Facturas", "Factura a la que pertenece"],
            ["id_producto", "INT", "FK → Productos", "Producto vendido"],
            ["cantidad", "INT", "> 0", "Unidades vendidas; base del conjunto de entrenamiento"],
            ["subtotal", "DECIMAL", "≥ 0", "Monto de la línea"],
        ]),
        ("Categorias", [
            ["id_categoria", "INT", "PK, autoincremental", "Identificador de la categoría"],
            ["nombre_categoria", "VARCHAR", "Único", "Nombre de la categoría"],
            ["es_perecedero", "BOOLEAN", "Obligatorio", "Indica si aplica control de baja rotación por PEPS"],
        ]),
        ("Productos", [
            ["id_producto", "INT", "PK, autoincremental", "Identificador del producto"],
            ["sku", "VARCHAR", "Único", "Código de inventario"],
            ["id_categoria", "INT", "FK → Categorias", "Categoría del producto"],
            ["id_proveedor", "INT", "FK → Proveedores", "Proveedor principal"],
            ["nombre", "VARCHAR", "Obligatorio", "Descripción comercial"],
            ["stock_fisico", "INT", "≥ 0", "Existencia actual"],
        ]),
        ("Proveedores", [
            ["id_proveedor", "INT", "PK, autoincremental", "Identificador del proveedor"],
            ["nombre_empresa", "VARCHAR", "Obligatorio", "Razón social"],
            ["tiempo_entrega_dias", "INT", "> 0", "Tiempo de entrega (L) utilizado en el cálculo del ROP"],
        ]),
        ("Ordenes_Compra", [
            ["id_orden", "INT", "PK, autoincremental", "Identificador de la orden"],
            ["id_proveedor", "INT", "FK → Proveedores", "Proveedor destinatario"],
            ["fecha_generacion", "DATETIME", "Obligatorio", "Fecha de creación"],
            ["estado", "VARCHAR", "Pendiente / Aprobada / Rechazada", "Estado de la orden"],
            ["origen", "VARCHAR", "Manual / Automática", "Permite comparar el error de ambos métodos"],
        ]),
        ("Pronosticos_ML", [
            ["id_pronostico", "INT", "PK, autoincremental", "Identificador del pronóstico"],
            ["id_producto", "INT", "FK → Productos", "Producto pronosticado"],
            ["fecha_calculo", "DATETIME", "Obligatorio", "Fecha de ejecución del modelo"],
            ["demanda_esperada", "INT", "≥ 0", "Demanda pronosticada para el periodo"],
            ["punto_reorden_rop", "INT", "≥ 0", "Punto de Reorden calculado"],
            ["mape_registrado", "DECIMAL", "0–100", "Error del modelo en su última evaluación"],
        ]),
    ]
    for nombre, filas in entidades:
        w.tabla(f"Diccionario de datos de la entidad {nombre}",
                ["Atributo", "Tipo", "Restricción", "Descripción"], filas,
                anchos=[3.5, 2.5, 4, 5])


def infraestructura_extra(w):
    w.h2("Seguridad de la arquitectura")
    w.p("La seguridad de la plataforma se aborda en varias capas. En la capa de presentación, las rutas privadas están protegidas por un guardia de navegación que impide el acceso sin sesión, y un interceptor adjunta el token de autenticación a cada solicitud. En la capa de negocio, cada ruta de la API verifica la firma y la vigencia del token JWT y el rol del usuario antes de ejecutar la operación. En la capa de datos, la aplicación se conecta con un usuario de base de datos con privilegios limitados y las consultas se construyen mediante el ORM con parámetros, lo que previene la inyección de SQL. Las contraseñas se almacenan cifradas mediante la función de derivación bcrypt y las credenciales del certificador FEL se mantienen en variables de entorno fuera del código fuente.")
    w.h2("Diseño de la interfaz de usuario")
    w.p("El diseño de la interfaz se rige por tres principios. El primero es la orientación por rol: cada usuario visualiza en su menú únicamente los módulos que corresponden a sus funciones. El segundo es la gestión por excepción: el tablero destaca las alertas que requieren acción, como productos bajo el Punto de Reorden o con baja rotación, en lugar de presentar todos los datos disponibles (Few, 2013). El tercero es la consistencia: todos los módulos comparten la misma estructura de navegación, los mismos componentes de tabla y formulario, y la misma terminología fiscal guatemalteca (quetzales, IVA, NIT, DTE).")


# --------------------------------------------------------------------------- #
# Capítulo 6: Desarrollo
# --------------------------------------------------------------------------- #
def explicacion_python(w):
    w.p("El fragmento anterior se organiza en cinco etapas. En la primera, la consulta SQL agrega las ventas mensuales del producto a partir de la entidad Detalle_Facturas; la consulta se ejecuta con parámetros para evitar la inyección de SQL. En la segunda, se verifica que existan al menos doce periodos, condición que implementa la regla de arranque en frío, y se generan las variables de calendario y de rezago. En la tercera, los datos se dividen cronológicamente: el 80 % más antiguo se utiliza para entrenar el modelo y el 20 % más reciente se reserva para su evaluación. En la cuarta, el MAPE se calcula exclusivamente sobre el conjunto de prueba, que el modelo no utilizó para aprender, lo que garantiza que la métrica refleje su desempeño real sobre periodos futuros. En la quinta, se proyecta la demanda del siguiente periodo y se calcula el Punto de Reorden a partir del tiempo de entrega del proveedor y del stock de seguridad.")


def explicacion_node(w):
    w.p("El controlador de certificación construye el documento con los datos del emisor, del receptor y de los productos, y lo envía al servicio del certificador autorizado. La dirección del servicio y las credenciales se leen desde variables de entorno, de modo que el mismo código opera en el ambiente sandbox y en producción sin modificaciones. Cuando el certificador responde con el número de autorización, la serie y el número del DTE, el sistema registra la factura y actualiza las existencias. En la implementación final, ambas operaciones se ejecutan dentro de una misma transacción de base de datos con bloqueo de las filas de producto, de forma que una venta no pueda quedar certificada sin descontar inventario ni descontar inventario sin estar certificada.")
    w.p("**C. Estructura del repositorio**", sangria=False)
    w.p("El código fuente se organiza en cuatro directorios que corresponden a los componentes de la arquitectura:")
    w.tabla("Estructura del repositorio de código fuente",
            ["Directorio", "Contenido"],
            [
                ["frontend/", "Aplicación Angular: páginas por módulo, servicios HTTP, guardias de ruta, interceptores y utilidades de impresión de documentos"],
                ["backend/", "API REST en Node.js con Express: rutas, controladores, modelos Sequelize, servicios de facturación, middleware de autenticación y utilidades de kárdex"],
                ["database/", "Script schema.sql con la creación de la base de datos, las tablas y los datos iniciales"],
                ["ai-engine/", "Microservicio Python con FastAPI que expone el modelo predictivo"],
            ])
    w.p("**D. Interfaz de usuario en Angular**", sangria=False)
    w.p("La interfaz se construyó con componentes independientes por módulo: punto de venta, comprobantes, cotizaciones, compras, inventario y tablero. Los servicios centralizan la comunicación con la API; un guardia de ruta impide el acceso a las páginas privadas sin sesión activa, y un interceptor añade el token JWT a cada solicitud y redirige al inicio de sesión cuando el token expira. Las vistas de inventario comparten una navegación común que agrupa productos, categorías, marcas, bodegas, existencias, movimientos, ajustes, traslados y devoluciones.")
    w.p("**E. Kárdex y consistencia del inventario**", sangria=False)
    w.p("Cada operación que modifica existencias (venta, compra, traslado, ajuste, devolución o anulación) registra un movimiento en el kárdex con el producto, la bodega, el tipo de movimiento, la cantidad, el saldo resultante, el documento de origen y el usuario. Las existencias por bodega se recalculan a partir de estos movimientos, de modo que el saldo siempre puede explicarse por la secuencia de operaciones que lo originó. Este diseño es el que permite la trazabilidad necesaria para reducir las inconsistencias de inventario.")


def pruebas_extra(w):
    w.p("Además de las pruebas funcionales anteriores, se ejecutaron pruebas de integración, de seguridad y de rendimiento, cuyos resultados se resumen en la tabla siguiente.")
    w.tabla("Pruebas de integración, seguridad y rendimiento",
            ["ID", "Tipo", "Caso de prueba", "Resultado esperado", "Resultado obtenido", "Estado"],
            [
                ["PR-06", "Integración", "Anulación de una factura certificada", "Estado anulado y reversión del inventario en el kárdex", "[[resultado]]", "[[Aprobado]]"],
                ["PR-07", "Integración", "Rechazo del DTE por el certificador", "Reversión de la transacción sin descontar inventario", "[[resultado]]", "[[Aprobado]]"],
                ["PR-08", "Integración", "Traslado entre bodegas", "Salida y entrada registradas en ambas bodegas", "[[resultado]]", "[[Aprobado]]"],
                ["PR-09", "Seguridad", "Acceso a una ruta privada sin token", "Respuesta 401 y redirección al inicio de sesión", "[[resultado]]", "[[Aprobado]]"],
                ["PR-10", "Seguridad", "Acceso de un vendedor a un módulo de administrador", "Acceso denegado (403)", "[[resultado]]", "[[Aprobado]]"],
                ["PR-11", "Seguridad", "Intento de inyección SQL en el buscador", "Consulta parametrizada sin efecto", "[[resultado]]", "[[Aprobado]]"],
                ["PR-12", "Rendimiento", "Registro de una venta de 10 líneas", "Tiempo menor a [[3]] s sin contar el certificador", "[[tiempo medido]]", "[[Aprobado]]"],
                ["PR-13", "Rendimiento", "Generación de pronósticos para todo el catálogo", "Tiempo menor a [[5]] min", "[[tiempo medido]]", "[[Aprobado]]"],
            ],
            nota="Elaboración propia. [[Complete los resultados obtenidos en sus pruebas.]]")


PANTALLAS = [
    ("Pantalla de inicio de sesión", "pantalla de login de la plataforma",
     "Interfaz de acceso en la que el usuario ingresa su correo y contraseña. El sistema valida las credenciales contra la base de datos, emite un token de sesión y dirige al usuario al tablero principal con los módulos que corresponden a su rol."),
    ("Listado de comprobantes emitidos", "listado de facturas con número, cliente, NIT, total, estado y número de autorización FEL",
     "Vista que concentra los documentos emitidos con su estado (certificado, anulado) y su número de autorización. Permite filtrar por fecha, cliente y estado, consultar el detalle, reimprimir el documento y solicitar su anulación."),
    ("Formulario de emisión de factura", "formulario de nueva factura con cliente, productos, IVA 12 % y total en quetzales",
     "Formulario para la emisión de facturas fuera del punto de venta rápido, con selección del cliente por NIT, del tipo de documento, de la condición de pago y de los productos. El sistema calcula el IVA y valida la existencia disponible antes de certificar."),
    ("Módulo de cotizaciones", "listado o formulario de cotizaciones",
     "Permite elaborar cotizaciones para clientes institucionales, darles seguimiento y convertirlas en factura cuando el cliente confirma la compra, conservando los precios y cantidades cotizados."),
    ("Registro de compras a proveedores", "formulario de compra con proveedor, bodega receptora y productos",
     "Interfaz para registrar el ingreso de mercadería comprada. Al confirmar la compra, el sistema incrementa las existencias de la bodega receptora y registra el movimiento de entrada en el kárdex."),
    ("Catálogo de productos", "listado de productos con SKU, categoría, marca, precio y existencia",
     "Gestión del catálogo con sus atributos comerciales y de inventario. La clasificación por categoría permite identificar los productos perecederos sujetos a control de baja rotación."),
    ("Existencias por bodega", "tabla de existencias por producto y bodega",
     "Vista consolidada del saldo de cada producto en cada bodega y sucursal, que sustituye la consulta informal por mensajería y permite planificar los traslados desde la matriz."),
    ("Kárdex de movimientos de inventario", "listado de movimientos con fecha, tipo, documento, cantidad y saldo",
     "Registro cronológico de entradas y salidas por producto y bodega. Cada movimiento indica el documento que lo originó y el saldo resultante, lo que proporciona la trazabilidad necesaria para las auditorías."),
    ("Registro de traslados entre bodegas", "formulario de traslado con bodega de origen, destino y productos",
     "Formaliza el surtido de las sucursales hijas desde la matriz. El traslado descuenta la bodega de origen e incrementa la de destino en una sola operación."),
    ("Ajustes de inventario", "formulario de ajuste con motivo (merma, daño, conteo físico)",
     "Permite corregir diferencias detectadas en las auditorías físicas y registrar las mermas con su justificación, de modo que el saldo del sistema se mantenga alineado con la existencia real."),
    ("Devoluciones de clientes", "pantalla de devoluciones",
     "Gestión de las devoluciones con su documento de respaldo. Según el estado del producto devuelto, el sistema lo reintegra al inventario disponible o lo registra como merma."),
    ("Pronóstico de demanda por producto", "gráfica de demanda histórica vs. pronosticada para un producto",
     "Vista del resultado del modelo predictivo, que muestra la demanda histórica, la demanda pronosticada para los próximos periodos y el MAPE registrado en la última evaluación."),
    ("Alertas de reabastecimiento y órdenes sugeridas", "tablero con productos bajo el ROP, cantidad sugerida y botón de aprobación",
     "Lista de productos cuya existencia alcanzó el Punto de Reorden, con la cantidad sugerida y el proveedor. El Gerente General aprueba, ajusta o rechaza cada sugerencia."),
    ("Alertas de baja rotación de productos perecederos", "listado de productos perecederos con días sin rotación",
     "Muestra los productos de categorías perecederas que superan el umbral de días sin venta, para que el Encargado de Bodega priorice su salida conforme al método PEPS."),
]


def pantallas(w):
    w.p("A continuación se presentan las pantallas de los demás módulos de la plataforma.")
    for titulo, captura, descripcion in PANTALLAS:
        w.figura(titulo, captura)
        w.p(f"*Descripción:* {descripcion}")


def aceptacion(w):
    w.h1("Pruebas de aceptación con usuarios")
    w.p("Las pruebas de aceptación se realizaron con los usuarios finales de la empresa durante la fase de transición, con el propósito de verificar que la plataforma satisface sus necesidades operativas en condiciones reales de uso. Cada usuario ejecutó los escenarios correspondientes a su rol y registró su conformidad.")
    w.tabla("Resultados de las pruebas de aceptación por rol",
            ["Rol", "Escenario evaluado", "Criterio de aceptación", "Resultado"],
            [
                ["Gerente General", "Revisar y aprobar órdenes sugeridas", "Comprende la sugerencia y la aprueba sin asistencia", "[[Conforme]]"],
                ["Gerente General", "Consultar indicadores del tablero", "Identifica productos en riesgo de quiebre", "[[Conforme]]"],
                ["Encargado de Bodega", "Registrar compra y traslado", "Registra la operación sin errores", "[[Conforme]]"],
                ["Encargado de Bodega", "Atender alerta de baja rotación", "Identifica el lote y registra el despacho", "[[Conforme]]"],
                ["Encargado de Sucursal / Cajero", "Emitir factura certificada", "Completa la venta en menos de [[2]] minutos", "[[Conforme]]"],
                ["Administrador TI", "Verificar estado de servicios y reentrenar modelo", "Ejecuta el procedimiento del manual técnico", "[[Conforme]]"],
            ],
            nota="Elaboración propia. [[Complete con los resultados reales y, de ser posible, adjunte las actas firmadas en los anexos.]]")
