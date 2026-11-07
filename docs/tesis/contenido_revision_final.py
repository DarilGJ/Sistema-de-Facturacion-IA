"""Ampliaciones verificables del sistema real para la revisión final de la tesis."""


def correspondencia_esquema(w):
    w.h2("Correspondencia entre el modelo conceptual y el esquema físico")
    w.p(
        "El modelo entidad-relación del apartado anterior representa las entidades de negocio "
        "con nombres conceptuales. El esquema físico implementado en MySQL, definido en "
        "database/schema.sql y sincronizado por Sequelize, utiliza nombres en español en "
        "snake_case. La correspondencia es directa en la mayoría de los casos: Clientes se "
        "almacena como clientes, Productos como productos y Facturas como facturas. Tres "
        "entidades del modelo conceptual merecen una nota de implementación. Detalle_Facturas "
        "corresponde a factura_items. Ordenes_Compra se materializa en las tablas compras y "
        "compra_items, que registran la recepción de mercadería ya aprobada. Pronosticos_ML no "
        "es una tabla persistente: el microservicio predictivo calcula el pronóstico bajo "
        "demanda a partir del histórico de factura_items y devuelve la demanda esperada y el "
        "Punto de Reorden, cuyos umbrales operativos se guardan en productos como stock_minimo, "
        "stock_reorden y stock_maximo."
    )
    w.p(
        "Además de las entidades del modelo conceptual, el esquema físico incorpora tablas que "
        "sostienen la operación diaria y que no aparecían con nombre propio en el diagrama: "
        "usuarios, para la autenticación y el control de roles; bodegas y bodega_productos, "
        "para el inventario multibodega; inventario_movimientos, que constituye el kárdex; "
        "inventario_ajustes e inventario_ajuste_items; inventario_traslados e "
        "inventario_traslado_items; inventario_config, que concentra las reglas de negocio del "
        "inventario; y el par cotizaciones / cotizacion_items. Las tablas siguientes documentan "
        "los atributos esenciales de estas entidades tal como están definidos en el esquema."
    )
    w.tabla(
        "Diccionario de datos de la entidad usuarios",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK, autoincremental", "Identificador del usuario"],
            ["nombre", "VARCHAR(120)", "NOT NULL", "Nombre visible en el kárdex y la sesión"],
            ["email", "VARCHAR(160)", "NOT NULL, UNIQUE", "Credencial de ingreso"],
            ["password_hash", "VARCHAR(255)", "NOT NULL", "Huella bcrypt de la contraseña"],
            ["rol", "ENUM", "NOT NULL", "admin, vendedor o contador"],
            ["activo", "TINYINT(1)", "NOT NULL, 1", "Habilita o bloquea el acceso"],
        ],
    )
    w.tabla(
        "Diccionario de datos de la entidad bodegas",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK, autoincremental", "Identificador de la bodega o sucursal"],
            ["nombre", "VARCHAR(160)", "NOT NULL, UNIQUE", "Nombre operativo, por ejemplo Bodega Matriz"],
            ["ubicacion", "VARCHAR(255)", "NULL", "Dirección o referencia física"],
            ["tipo", "ENUM", "NOT NULL", "venta o materia_prima"],
            ["principal", "TINYINT(1)", "NOT NULL, 0", "Marca la bodega central de surtido"],
            ["estado", "TINYINT(1)", "NOT NULL, 1", "Bodega activa o dada de baja"],
        ],
    )
    w.tabla(
        "Diccionario de datos de la entidad bodega_productos",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK, autoincremental", "Identificador del saldo"],
            ["id_bodega", "INT UNSIGNED", "FK, NOT NULL", "Bodega a la que pertenece el saldo"],
            ["id_producto", "INT UNSIGNED", "FK, NOT NULL", "Producto cuyo saldo se registra"],
            ["cantidad", "INT", "NOT NULL, 0", "Existencia disponible en esa bodega"],
        ],
        nota="Elaboración propia. La clave única (id_bodega, id_producto) impide saldos duplicados.",
    )
    w.tabla(
        "Diccionario de datos de la entidad inventario_movimientos",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK, autoincremental", "Identificador del movimiento"],
            ["fecha", "DATETIME", "NOT NULL", "Momento en que se registró el movimiento"],
            ["modulo", "VARCHAR(40)", "NOT NULL", "Módulo de origen: factura, compra, traslado, ajuste"],
            ["proceso", "VARCHAR(40)", "NOT NULL", "entrada_compra, salida_venta, entrada_traslado, salida_traslado o salida_ajuste"],
            ["documento", "VARCHAR(80)", "NOT NULL", "Número visible, por ejemplo FE FAC-000012"],
            ["sku", "VARCHAR(60)", "NOT NULL", "Código del producto al momento del movimiento"],
            ["cantidad", "INT", "NOT NULL", "Unidades; el signo lo determina el proceso"],
            ["bodega", "VARCHAR(160)", "NOT NULL", "Nombre de la bodega afectada"],
            ["usuario", "VARCHAR(160)", "NOT NULL", "Usuario que originó la operación"],
        ],
    )
    w.tabla(
        "Diccionario de datos de la entidad compras",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK, autoincremental", "Identificador de la compra"],
            ["numero", "VARCHAR(20)", "NOT NULL, UNIQUE", "Consecutivo interno de la compra"],
            ["numero_proveedor", "VARCHAR(40)", "NULL", "Documento del proveedor, por ejemplo DEN-10482"],
            ["id_proveedor", "INT UNSIGNED", "FK, NOT NULL", "Proveedor que entrega la mercadería"],
            ["id_bodega", "INT UNSIGNED", "FK, NULL", "Bodega receptora"],
            ["fecha", "DATETIME", "NOT NULL", "Fecha de registro de la recepción"],
            ["condicion_venta", "ENUM", "NOT NULL", "contado o credito"],
            ["iva", "DECIMAL(12,2)", "NOT NULL", "Impuesto al valor agregado de la compra"],
            ["total", "DECIMAL(12,2)", "NOT NULL", "Total de la compra"],
            ["estado", "ENUM", "NOT NULL", "pendiente, cancelada o anulada"],
        ],
    )
    w.tabla(
        "Diccionario de datos de la entidad inventario_config",
        ["Atributo", "Tipo", "Restricción", "Descripción"],
        [
            ["id", "INT UNSIGNED", "PK", "Registro único de configuración, id = 1"],
            ["bloquear_ventas_sin_stock", "TINYINT(1)", "NOT NULL, 1", "Impide vender por encima de la existencia"],
            ["control_lotes", "TINYINT(1)", "NOT NULL, 0", "Reserva el control por lote para una extensión futura"],
            ["reserva_stock", "TINYINT(1)", "NOT NULL, 0", "Reserva existencias al cotizar"],
            ["merma_ajustes", "TINYINT(1)", "NOT NULL, 0", "Marca si los ajustes se contabilizan como merma"],
        ],
        nota="Elaboración propia. Estas banderas implementan las reglas de negocio RN-02 y RN-06.",
    )
    w.p(
        "Las tablas inventario_traslados e inventario_ajustes comparten el mismo patrón: un "
        "encabezado con la bodega o el motivo, el usuario que ejecutó la operación y la fecha, "
        "y una tabla de detalle con el producto, la cantidad y el saldo anterior. En el traslado, "
        "el encabezado guarda id_bodega_origen e id_bodega_destino; cada línea descuenta el origen "
        "e incrementa el destino en la misma transacción. En el ajuste, cada línea indica si la "
        "corrección es de tipo mas o menos y deja constancia de cantidad_anterior, "
        "cantidad_ajuste y cantidad_final, de modo que una auditoría posterior pueda reconstruir "
        "el motivo de cada diferencia entre el sistema y el físico."
    )


def descripcion_modulos(w):
    w.h1("Descripción funcional de los módulos implementados")
    w.p(
        "Este apartado describe, con el nivel de detalle necesario para auditar la coherencia "
        "entre el problema, los requerimientos y el software entregado, cómo opera cada módulo "
        "de la plataforma. La descripción se basa en las rutas expuestas por el servidor Express "
        "en backend/src/server.js, en los controladores correspondientes y en las reglas "
        "persistidas en el esquema. No se enumeran pantallas: se explica la responsabilidad de "
        "negocio de cada módulo y el evento que deja en el kárdex."
    )

    w.h2("Autenticación y control de acceso")
    w.p(
        "El ingreso se realiza mediante POST /api/auth/login. El servidor compara la contraseña "
        "con el password_hash almacenado mediante bcrypt y, si el usuario está activo, emite un "
        "JSON Web Token firmado que incluye el identificador, el nombre, el correo y el rol. Las "
        "rutas posteriores exigen el token en el encabezado Authorization. El rol admin tiene "
        "acceso a la configuración del inventario y a la administración de catálogos; el rol "
        "vendedor opera el punto de venta, las cotizaciones y la consulta de existencias; el rol "
        "contador consulta documentos y reportes. Esta separación atiende el requerimiento RF-01 "
        "y el atributo de seguridad RNF-01. La sesión expira según la vigencia configurada del "
        "token, de modo que un equipo desatendido no permanece autenticado de forma indefinida."
    )

    w.h2("Catálogo de productos, proveedores y clientes")
    w.p(
        "Los catálogos se gestionan por las rutas /api/productos, /api/proveedores y /api/clientes, "
        "con operaciones de alta, consulta, actualización y baja lógica. El producto es la "
        "entidad central del reabastecimiento: además del SKU, el nombre, el costo y los tres "
        "precios de venta, almacena stock_actual, stock_minimo, stock_reorden y stock_maximo. "
        "Estos cuatro campos son el puente entre el módulo transaccional y el módulo analítico. "
        "El stock_actual se actualiza en cada compra, venta, traslado, ajuste o devolución. El "
        "stock_minimo y el stock_reorden son los umbrales que el tablero compara para emitir "
        "alertas. El stock_maximo acota la cantidad sugerida de reposición, de modo que una "
        "alerta no proponga comprar por encima de la capacidad de anaquel. El proveedor aporta "
        "el tiempo_entrega_dias que utiliza el cálculo del Punto de Reorden. El cliente guarda "
        "el NIT, la condición de pago y el precio aplicable, lo que permite facturar a "
        "consumidor final o a un nitente con el listado correcto."
    )
    w.p(
        "Las categorías, subcategorías, marcas y bodegas se administran bajo /api/inventario. La "
        "categoría es el atributo que permite distinguir los artículos perecederos —pegamentos, "
        "témperas, marcadores y papelería sensible a la luz— de los de rotación regular. Esa "
        "clasificación es la que alimenta las alertas de baja rotación y la aplicación del método "
        "PEPS descrita en el marco teórico. La bodega marcada como principal es el origen por "
        "defecto de los traslados hacia las sucursales hijas."
    )

    w.h2("Compras y recepción de mercadería")
    w.p(
        "El módulo de compras, expuesto en /api/compras, registra la recepción de un documento "
        "del proveedor. El encabezado identifica al proveedor, la bodega receptora, la condición "
        "de pago, el número de documento del proveedor y los totales con IVA. Cada línea indica "
        "el producto, la cantidad, el costo unitario y el impuesto. Al confirmar la compra, el "
        "sistema incrementa bodega_productos.cantidad de la bodega receptora, actualiza "
        "productos.stock_actual y escribe en inventario_movimientos un registro con proceso "
        "entrada_compra. De este modo, la recepción deja tres rastros consistentes: el documento "
        "comercial, el saldo por bodega y el kárdex. Esta operación atiende el requerimiento "
        "RF-06 y es la inversa simétrica de la venta: si la factura descuenta, la compra "
        "reconstituye el stock que el modelo de reorden utilizará en el siguiente ciclo."
    )

    w.h2("Traslados entre bodegas")
    w.p(
        "El surtido de las sucursales hijas se formaliza en /api/inventario/traslados. El "
        "encabezado declara la bodega de origen, la de destino y el usuario que ejecuta el "
        "movimiento. Cada línea indica el producto y la cantidad a trasladar. La operación se "
        "ejecuta en una sola transacción de base de datos: descuenta el origen, incrementa el "
        "destino y escribe dos movimientos de kárdex, salida_traslado y entrada_traslado, con "
        "el mismo documento. Si el origen no tiene existencia suficiente, la transacción se "
        "rechaza. El traslado puede anularse mediante POST /api/inventario/traslados/:id/anular, "
        "que revierte ambos saldos y deja constancia en el kárdex. Esta formalización sustituye "
        "el envío informal por mensajería descrito en el modelo AS-IS y es la condición para "
        "que el saldo de cada sucursal sea confiable."
    )

    w.h2("Ajustes, devoluciones y regla de bloqueo de ventas")
    w.p(
        "Los ajustes, en /api/inventario/ajustes, corrigen la diferencia entre el saldo del "
        "sistema y el conteo físico. Cada línea declara si la corrección es de tipo mas o menos, "
        "el saldo anterior, la cantidad ajustada y el saldo final. El motivo queda en la "
        "descripción del encabezado —por ejemplo, merma por pegamento reseco—, de modo que la "
        "pérdida no se diluya en un cambio silencioso de existencias. Las devoluciones, en "
        "/api/inventario/devoluciones, se asocian a una factura de origen, a una razón "
        "(dañado, vencido, no gustó o cambio de producto) y a una resolución (reembolso, nota "
        "de crédito o cambio). Según la resolución, el sistema reintegra el stock o lo registra "
        "como salida definitiva. La bandera bloquear_ventas_sin_stock de inventario_config "
        "impide, cuando está activa, vender una cantidad superior a la existencia de la bodega "
        "de despacho, que es precisamente la regla RN-02."
    )

    w.h2("Kárdex y trazabilidad")
    w.p(
        "El kárdex no es una pantalla independiente de la lógica de negocio: es el resultado de "
        "la función registrarKardex, que escribe en inventario_movimientos cada vez que una "
        "venta, compra, traslado, ajuste o devolución modifica un saldo. La consulta "
        "GET /api/inventario/movimientos permite filtrar por producto, bodega, proceso y rango "
        "de fechas. Cada fila conserva el documento de origen, el usuario y la cantidad, de "
        "manera que una auditoría física puede reconstruir por qué el sistema muestra un saldo "
        "determinado. Esta traza es el instrumento con el que se calcula la exactitud del "
        "registro de inventario (ERI): el conteo físico se compara con el saldo de "
        "bodega_productos, y cualquier diferencia se regulariza mediante un ajuste que, a su "
        "vez, vuelve a quedar en el kárdex."
    )

    w.h2("Tablero de indicadores y alertas operativas")
    w.p(
        "El tablero, expuesto en GET /api/dashboard, resume las ventas del periodo seleccionado "
        "(día, semana, mes o rango), el ticket promedio, el margen, los productos más vendidos, "
        "la serie de los últimos doce meses y el estado del catálogo. El catálogo reporta "
        "cuántos productos activos están en o bajo el stock_minimo. El endpoint complementario "
        "GET /api/dashboard/alertas construye la lista de excepciones que el gerente debe "
        "atender: productos bajo el mínimo, facturas del día y transferencias con más de treinta "
        "días. Esta política de gestión por excepción es la que Few (2013) recomienda para un "
        "tablero gerencial y es la que permite que el Gerente General no recorra el catálogo "
        "completo, sino solo los artículos que requieren una decisión de compra o de salida "
        "prioritaria."
    )
    w.p(
        "Las alertas de reabastecimiento que se muestran en el capítulo de prototipo se obtienen "
        "al comparar, para cada producto activo, stock_actual con stock_reorden y stock_minimo. "
        "La cantidad sugerida se calcula como la diferencia entre stock_maximo y stock_actual, "
        "de modo que la reposición no rebase la capacidad definida para el artículo. El "
        "proveedor asociado al producto aporta el dato de contacto para emitir la orden. Las "
        "alertas de baja rotación se construyen sobre los productos de categorías perecederas "
        "cuya última venta —o la ausencia de ventas— supera el umbral de días configurado. "
        "Ambos listados son el resultado visible de los requerimientos RF-11 y RF-12 y de las "
        "reglas RN-03 y RN-05."
    )

    w.h2("Motor predictivo y cálculo del Punto de Reorden")
    w.p(
        "El backend no entrena el modelo dentro de Node.js. Expone tres rutas de fachada en "
        "/api/ai —pronostico, modelo y health— que reenvían la solicitud al microservicio "
        "Python. El contrato de pronóstico recibe el SKU, la categoría, el tiempo de entrega "
        "del proveedor y el historial mensual de cantidades vendidas extraído de factura_items. "
        "El microservicio responde con la demanda esperada del siguiente periodo, el intervalo "
        "de incertidumbre y el Punto de Reorden resultante. La fórmula aplicada es la del marco "
        "teórico: ROP = d̄ × L + SS, donde d̄ es la demanda pronosticada por unidad de tiempo, "
        "L es tiempo_entrega_dias del proveedor y SS es el stock de seguridad dimensionado con "
        "el error del modelo. El valor calculado se escribe de vuelta en productos.stock_reorden "
        "para que el tablero operativo no dependa de una llamada al motor en cada consulta."
    )
    w.p(
        "Esta separación de responsabilidades atiende el requerimiento no funcional RNF-07: el "
        "motor puede reentrenarse o sustituirse sin detener el módulo transaccional. Si el "
        "microservicio no está disponible, /api/ai/health devuelve un error controlado y el "
        "tablero continúa operando con los umbrales vigentes. Esa es también la razón de la "
        "no conformidad del Administrador TI en las pruebas de aceptación: el reentrenamiento "
        "todavía se ejecuta como procedimiento de consola descrito en el Anexo B, y no como "
        "una acción de un solo botón en la interfaz. La limitación quedó registrada y se retoma "
        "en las recomendaciones."
    )


def catalogo_api(w):
    w.h2("Catálogo de la API REST")
    w.p(
        "La interfaz entre el cliente Angular y el servidor Express es una API REST versionada "
        "bajo el prefijo /api. Todas las rutas, salvo /api/auth/login y /api/health, exigen un "
        "token JWT. La tabla siguiente resume los recursos y la operación de negocio que cada "
        "uno realiza. No se listan las variantes de consulta por identificador; se indica el "
        "recurso y el verbo que cambia el estado del negocio."
    )
    w.tabla(
        "Catálogo de recursos de la API REST implementada",
        ["Recurso", "Verbos", "Responsabilidad de negocio"],
        [
            ["/api/auth/login", "POST", "Autentica al usuario y emite el token de sesión"],
            ["/api/auth/me", "GET", "Devuelve el perfil y el rol del token vigente"],
            ["/api/productos", "GET, POST, PUT, DELETE", "Catálogo de artículos y umbrales de reorden"],
            ["/api/proveedores", "GET, POST, PUT, DELETE", "Maestro de proveedores y tiempo de entrega"],
            ["/api/clientes", "GET, POST, PUT, DELETE", "Maestro de clientes y condición de pago"],
            ["/api/facturas", "GET, POST, PATCH", "Emisión, consulta y anulación de ventas"],
            ["/api/cotizaciones", "GET, POST, PUT, PATCH", "Cotizaciones y conversión a factura"],
            ["/api/compras", "GET, POST, PATCH", "Recepción de mercadería y entrada a bodega"],
            ["/api/inventario/existencias", "GET, PUT", "Saldos por producto y bodega"],
            ["/api/inventario/traslados", "GET, POST", "Surtido formal entre bodegas"],
            ["/api/inventario/ajustes", "GET, POST", "Corrección de diferencias y registro de mermas"],
            ["/api/inventario/movimientos", "GET", "Consulta del kárdex"],
            ["/api/inventario/devoluciones", "GET, POST", "Devoluciones asociadas a una factura"],
            ["/api/dashboard", "GET", "Indicadores de ventas, margen y catálogo"],
            ["/api/dashboard/alertas", "GET", "Excepciones de stock y de cobranza"],
            ["/api/ai/pronostico", "POST", "Fachada hacia el motor predictivo"],
        ],
        nota="Elaboración propia a partir de las rutas declaradas en backend/src.",
    )
    w.p(
        "La integridad de las operaciones que modifican existencias se garantiza envolviendo "
        "el cambio de saldo, el documento comercial y la escritura del kárdex en una misma "
        "transacción de Sequelize. Si el certificador rechaza un documento o si la bodega de "
        "origen no tiene existencia suficiente, se revierte todo el conjunto. Ese diseño es el "
        "que permite afirmar, en el capítulo de resultados, que una venta no certificada no "
        "descuenta inventario y que un traslado no deja saldos a medias entre dos bodegas."
    )


def alineacion_objetivos(w):
    w.h2("Correspondencia entre objetivos específicos y módulos entregados")
    w.p(
        "Para que el lector pueda verificar, sin saltar de capítulo, que cada objetivo "
        "específico tiene un componente de software que lo materializa, se resume a "
        "continuación esa correspondencia. El primer objetivo, analizar los procesos actuales "
        "de inventario, se documentó en el modelo AS-IS y se tradujo en las reglas RN-01 a "
        "RN-06. El segundo, diseñar la arquitectura de datos y el modelo de aprendizaje "
        "supervisado, se materializa en el esquema de veintitrés tablas y en el microservicio "
        "de pronóstico. El tercero, desarrollar el tablero de alertas de baja rotación, "
        "corresponde a /api/dashboard y a las vistas de reabastecimiento y perecederos. El "
        "cuarto, implementar el módulo de recomendaciones de compra, corresponde al cálculo "
        "del Punto de Reorden y a la lista de productos bajo el umbral, con la cantidad "
        "sugerida y el proveedor. El quinto, evaluar el impacto sobre las mermas y la "
        "precisión de los pedidos, se aborda en el capítulo de resultados y se declara, con "
        "la cautela ya expuesta, como evidencia preliminar mientras no transcurra un ciclo "
        "comercial completo."
    )
    w.p(
        "Esta trazabilidad es la que permite, en las conclusiones, afirmar el cumplimiento de "
        "cada objetivo sin introducir componentes que el sistema no tenga. Donde la evidencia "
        "cuantitativa todavía es corta —el efecto sobre las mermas físicas—, la conclusión no "
        "fuerza un resultado: registra la condición creada por la plataforma y el seguimiento "
        "que falta. Esa reserva no debilita el trabajo; lo alinea con el periodo real de "
        "operación, que comenzó a inicios de octubre de 2026 y, al cierre de este informe, "
        "cubre apenas un mes y un par de compras a proveedores."
    )
