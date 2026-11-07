"""Ampliaciones de la introducción y de los capítulos 1 a 3."""


# --------------------------------------------------------------------------- #
# Introducción
# --------------------------------------------------------------------------- #
def introduccion(w):
    w.p("El documento se organiza en siete capítulos. El primero describe el estudio: los antecedentes de la empresa, la descripción del problema y sus causas, las preguntas de investigación, la justificación, los objetivos, el alcance y las limitaciones. El segundo desarrolla el marco teórico que sustenta la investigación, desde la gestión de inventarios y los indicadores logísticos hasta los fundamentos del pronóstico de demanda, el aprendizaje supervisado, la arquitectura de software y la base legal guatemalteca aplicable a la facturación electrónica.")
    w.p("El tercer capítulo presenta el marco metodológico: la ruta cuantitativa, el tipo y diseño de la investigación, el análisis de factibilidad, la hipótesis y la operacionalización de sus variables, la definición de la población y la estrategia de partición de datos, los instrumentos y el procedimiento de recolección. El cuarto capítulo corresponde al análisis de la aplicación, donde se identifican los usuarios, se especifican los requerimientos y se modela el negocio bajo la metodología RUP. El quinto capítulo documenta el diseño mediante diagramas UML, el modelo entidad-relación, el diccionario de datos y la infraestructura de despliegue.")
    w.p("El sexto capítulo expone el desarrollo de la aplicación, los fragmentos de código más representativos, el plan de pruebas y el prototipo funcional. El séptimo capítulo analiza los resultados obtenidos y somete a verificación estadística la hipótesis de investigación. Finalmente, se presentan las conclusiones, las recomendaciones dirigidas a los responsables de la operación del sistema, el glosario, las referencias bibliográficas y los anexos, entre los que se incluyen la fundamentación matemática del modelo predictivo, el manual técnico de implementación y el manual de usuario.")


# --------------------------------------------------------------------------- #
# Capítulo 1
# --------------------------------------------------------------------------- #
def antecedentes(w):
    w.p("En el plano tributario, Guatemala inició en 2019 la transición hacia el Régimen de Factura Electrónica en Línea (FEL), establecido por la Superintendencia de Administración Tributaria (SAT) mediante el Acuerdo de Directorio 13-2018. Este régimen sustituye progresivamente la factura impresa por documentos electrónicos certificados en tiempo real por certificadores autorizados, y obliga a los contribuyentes a contar con sistemas capaces de generar, firmar y transmitir Documentos Tributarios Electrónicos (DTE). Para las pequeñas y medianas empresas, esta obligación representó inicialmente un costo de adaptación; sin embargo, también generó por primera vez un registro digital, estructurado y verificable de cada transacción de venta, que constituye la materia prima indispensable para cualquier iniciativa de analítica de datos.")
    w.p("En el ámbito internacional, la investigación sobre pronóstico de demanda en el comercio minorista ha mostrado un desplazamiento sostenido desde los métodos estadísticos clásicos hacia los métodos de aprendizaje automático. La competencia de pronósticos M5, organizada con datos reales de ventas diarias de miles de artículos de una cadena minorista estadounidense, evidenció que los métodos basados en árboles de decisión y en el aprendizaje de conjunto superaron de forma consistente a los métodos estadísticos tradicionales, en particular cuando la demanda presenta estacionalidad, efectos de calendario y relaciones entre productos (Makridakis et al., 2022). Estos hallazgos respaldan la pertinencia de aplicar modelos como Random Forest en contextos de demanda estacional, como el de los suministros escolares.")
    w.p("No obstante, la mayor parte de la evidencia disponible proviene de grandes cadenas con equipos especializados en ciencia de datos e infraestructura tecnológica robusta. En el segmento de las micro, pequeñas y medianas empresas guatemaltecas, la adopción de herramientas analíticas sigue siendo incipiente: los sistemas de punto de venta se utilizan principalmente para cumplir con la obligación tributaria, mientras que las decisiones de compra continúan dependiendo del criterio del propietario o del encargado de bodega. Esta brecha entre la disponibilidad de datos transaccionales y su aprovechamiento analítico es el espacio en el que se inserta el presente proyecto.")
    w.p("En cuanto a la trayectoria de la empresa, Librerías El Regalito inició operaciones en [[año de fundación]] en [[municipio/departamento]] y amplió progresivamente su cobertura hasta conformar una red de una sucursal matriz y cuatro sucursales hijas. A lo largo de su crecimiento, la empresa incorporó un sistema de facturación para cumplir con sus obligaciones fiscales, pero no desarrolló capacidades de análisis de inventario. El histórico de transacciones acumulado en el periodo 2023-2025 constituye, por tanto, un activo de información subutilizado que el presente proyecto se propone transformar en conocimiento útil para la toma de decisiones.")


def problema_sintesis(w):
    w.p("La relación entre las causas identificadas, sus efectos observables y los indicadores con los que se medirá la solución se resume en la tabla siguiente. Esta síntesis permite trazar desde el inicio la correspondencia entre el problema, los objetivos específicos y los resultados que se analizan en el Capítulo 7.")
    w.tabla("Síntesis de causas, efectos e indicadores del problema",
            ["Causa", "Efecto observable", "Indicador de medición"],
            [
                ["Inexistencia de modelos predictivos", "Compras reactivas, quiebres de stock en temporada escolar y sobrestock fuera de temporada", "Error Porcentual Absoluto Medio (MAPE) del pronóstico"],
                ["Asimetría de información entre sistema y bodega", "Descuadre entre existencias registradas y físicas", "Exactitud del registro de inventario (ERI)"],
                ["Logística informal hacia sucursales hijas", "Pedidos de emergencia sin planificación ni trazabilidad", "Porcentaje de error en la proyección de pedidos"],
                ["Ausencia de control de rotación", "Deterioro químico y decoloración de productos sensibles", "Porcentaje de mermas sobre el inventario"],
            ])
    w.figura("Árbol de problemas de la gestión de inventarios de Librerías El Regalito",
             "árbol de problemas con el problema central, las tres causas y las consecuencias (mermas, ventas perdidas, capital inmovilizado)")


def justificacion(w):
    w.p("Desde la perspectiva técnica, la investigación se justifica porque los métodos de reabastecimiento basados en promedios simples o en la experiencia del encargado no capturan adecuadamente la estacionalidad pronunciada de la demanda de útiles escolares, concentrada entre diciembre y febrero. Los modelos de aprendizaje supervisado, y en particular los métodos de conjunto basados en árboles de decisión, permiten incorporar simultáneamente variables de calendario, rezagos de venta y características del producto, lo que los hace adecuados para este tipo de demanda (Hyndman y Athanasopoulos, 2021). La integración de estos modelos con el cálculo del Punto de Reorden convierte el pronóstico en una acción concreta de compra.")
    w.p("Desde la perspectiva legal, el proyecto contribuye a que la empresa cumpla de manera integrada con el Régimen FEL, de modo que la emisión del documento tributario y el descuento de inventario ocurran en una misma operación. Ello fortalece la veracidad de los registros contables exigida por el Código de Comercio de Guatemala y facilita la documentación de las mermas y de la destrucción de inventario dañado ante la administración tributaria.")


def alcance(w):
    w.p("**Exclusiones del alcance:** Con el fin de delimitar con precisión el proyecto, no forman parte de su alcance los siguientes elementos:", sangria=False)
    w.viñetas([
        "La integración electrónica directa con los sistemas de los proveedores para el envío automático de órdenes de compra; la plataforma sugiere las órdenes, pero su envío continúa siendo gestionado por la gerencia.",
        "El desarrollo de aplicaciones móviles nativas; el acceso se realiza mediante navegador web desde cualquier dispositivo.",
        "La contabilidad general, la planilla y los módulos financieros distintos de la facturación, las compras y el inventario.",
        "El pronóstico de productos con menos de doce meses de historial, que se gestionan mediante revisión manual conforme a la limitación de arranque en frío.",
    ])
    w.p("**Entregables:** Al finalizar el proyecto se entregan la plataforma web desplegada, el microservicio predictivo entrenado, la base de datos centralizada con el histórico depurado, el manual técnico de implementación (Anexo B), el manual de usuario (Anexo C) y el presente informe de investigación.", sangria=False)


def limitaciones(w):
    w.p("**Horizonte temporal de evaluación:** La medición del efecto de la plataforma sobre las mermas físicas requiere observar, al menos, un ciclo comercial completo, que incluya una temporada escolar. Dado que el periodo de evaluación del proyecto es menor, los resultados sobre mermas se presentan como indicadores adelantados y su confirmación definitiva queda sujeta al seguimiento posterior.", sangria=False)
    w.p("**Dependencia del certificador FEL:** La emisión de documentos tributarios depende de la disponibilidad del servicio del certificador autorizado y de la plataforma de la SAT. Las interrupciones de estos servicios externos se encuentran fuera del control del sistema, que debe gestionar los rechazos y reintentos sin comprometer la integridad del inventario.", sangria=False)


# --------------------------------------------------------------------------- #
# Capítulo 2: Marco teórico
# --------------------------------------------------------------------------- #
def base_legal(w):
    w.h2("Ley del Impuesto al Valor Agregado")
    w.p("El Decreto 27-92 del Congreso de la República, Ley del Impuesto al Valor Agregado, establece en su artículo 10 una tarifa única del 12 % sobre la base imponible de la venta de bienes y la prestación de servicios. En consecuencia, el sistema de facturación debe calcular y desglosar el impuesto con esta tasa en cada documento emitido, y los reportes de ventas deben permitir conciliar el impuesto cobrado con los montos declarados.")
    w.h2("Régimen de Factura Electrónica en Línea (FEL)")
    w.p("El Acuerdo de Directorio 13-2018 de la SAT regula el Régimen de Factura Electrónica en Línea, que define los tipos de Documentos Tributarios Electrónicos, el esquema de su estructura, la intervención de los certificadores autorizados y el procedimiento de anulación. Bajo este régimen, cada documento recibe un número de autorización único que acredita su validez fiscal. Para el proyecto, esto implica que la venta solo se considera concluida cuando el certificador devuelve dicha autorización, y que la anulación de un documento debe revertir el movimiento de inventario correspondiente.")
    w.h2("Ley para el Reconocimiento de las Comunicaciones y Firmas Electrónicas")
    w.p("El Decreto 47-2008 otorga validez jurídica a las comunicaciones y firmas electrónicas, siempre que se garantice la integridad de la información y la identificación del firmante. Esta ley proporciona el sustento jurídico para que los documentos tributarios generados, firmados y almacenados electrónicamente por la plataforma tengan el mismo valor probatorio que sus equivalentes en papel.")


def marco_inventarios(w):
    # ------------------------------------------------------------ inventarios
    w.h1("Modelos de gestión de inventarios")
    w.p("La teoría de inventarios estudia cómo determinar cuándo y cuánto reabastecer un artículo para equilibrar dos costos opuestos: el costo de mantener existencias, que incluye el capital inmovilizado, el almacenamiento y el riesgo de deterioro, y el costo de no tenerlas, que se manifiesta en ventas perdidas y en la insatisfacción del cliente (Silver et al., 2017). En el caso de los suministros de librería, el costo de mantener existencias adquiere especial relevancia, porque una parte del catálogo está expuesta a deterioro químico y a pérdida de vigencia comercial.")
    w.h2("Sistema de revisión continua y Punto de Reorden")
    w.p("En un sistema de revisión continua, el nivel de existencias se monitorea después de cada transacción y se emite una orden de compra cuando dicho nivel alcanza el Punto de Reorden (ROP). El ROP debe cubrir la demanda esperada durante el tiempo que tarda el proveedor en entregar el pedido, más un inventario adicional que proteja contra la variabilidad:")
    w.ecuacion("ROP = d̄ × L + SS", "2.1")
    w.p("donde d̄ es la demanda promedio por unidad de tiempo, L el tiempo de entrega en las mismas unidades y SS el stock de seguridad. En el enfoque tradicional, d̄ se calcula como un promedio histórico; en el enfoque propuesto, se sustituye por la demanda pronosticada por el modelo de aprendizaje supervisado para el periodo correspondiente, lo que permite que el ROP se ajuste anticipadamente a la estacionalidad.")
    w.h2("Stock de seguridad y nivel de servicio")
    w.p("El stock de seguridad se dimensiona en función del nivel de servicio deseado, entendido como la probabilidad de no sufrir desabastecimiento durante el ciclo de reposición. Cuando el tiempo de entrega es constante y la demanda presenta una desviación estándar σ_d, el stock de seguridad se calcula como:")
    w.ecuacion("SS = z × σ_d × √L", "2.2")
    w.p("donde z es el valor de la distribución normal estándar asociado al nivel de servicio (por ejemplo, z = 1.65 para un 95 %). Esta expresión evidencia la relación entre la precisión del pronóstico y el inventario necesario: cuanto menor es el error del pronóstico, menor es la incertidumbre que debe cubrirse y, por tanto, menor el capital inmovilizado en stock de seguridad (Silver et al., 2017).")
    w.h2("Cantidad económica de pedido")
    w.p("El modelo de cantidad económica de pedido (EOQ) determina el tamaño de lote que minimiza la suma de los costos de ordenar y de mantener inventario:")
    w.ecuacion("EOQ = √(2DS / H)", "2.3")
    w.p("donde D es la demanda anual, S el costo de emitir una orden y H el costo anual de mantener una unidad. Aunque sus supuestos de demanda constante no se cumplen en un entorno estacional, el EOQ ofrece una referencia útil para fijar cantidades mínimas de compra en los periodos de demanda estable.")
    w.h2("Clasificación ABC del inventario")
    w.p("La clasificación ABC, derivada del principio de Pareto, agrupa los artículos según su participación en el valor de las ventas: la clase A concentra aproximadamente el 80 % del valor con alrededor del 20 % de los artículos; la clase B, un valor intermedio; y la clase C, un gran número de artículos de bajo valor. Esta clasificación permite asignar mayor esfuerzo de control y de pronóstico a los artículos de clase A, y orientar las auditorías físicas con criterios de prioridad.")
    w.h2("Método Primeras Entradas, Primeras Salidas (PEPS)")
    w.p("El método PEPS establece que las unidades que ingresaron primero al inventario deben ser las primeras en despacharse. En los productos con caducidad técnica, como pegamentos, silicones y marcadores, este método es la principal medida para evitar que las unidades antiguas permanezcan en bodega hasta deteriorarse. Su aplicación efectiva requiere conocer con exactitud la antigüedad de cada lote, lo cual solo es posible cuando los ingresos se registran de manera oportuna en el sistema.")

    # ------------------------------------------------------------ indicadores
    w.h1("Indicadores aplicables a la gestión de inventarios")
    w.p("La evaluación de la gestión de inventarios requiere indicadores cuantitativos que permitan comparar la situación antes y después de una intervención. La tabla siguiente resume los indicadores utilizados en la presente investigación.")
    w.tabla("Indicadores de gestión de inventarios y de precisión del pronóstico",
            ["Indicador", "Fórmula", "Interpretación"],
            [
                ["Rotación de inventario", "Costo de ventas / Inventario promedio", "Número de veces que el inventario se renueva en el periodo"],
                ["Días de inventario", "365 / Rotación", "Días promedio que un artículo permanece en bodega"],
                ["Exactitud del registro de inventario (ERI)", "Artículos sin diferencia / Artículos auditados × 100", "Porcentaje de artículos cuyo saldo digital coincide con el físico"],
                ["Tasa de mermas", "Valor de mermas / Valor del inventario × 100", "Proporción del inventario perdida por deterioro, daño o faltante"],
                ["Nivel de servicio", "Pedidos atendidos completos / Pedidos totales × 100", "Capacidad de satisfacer la demanda sin quiebres"],
                ["MAPE", "(100 / n) Σ |(yₜ − ŷₜ) / yₜ|", "Error porcentual promedio del pronóstico"],
                ["MAE", "(1 / n) Σ |yₜ − ŷₜ|", "Error promedio en unidades"],
                ["RMSE", "√[(1 / n) Σ (yₜ − ŷₜ)²]", "Error que penaliza más las desviaciones grandes"],
            ],
            nota="Elaboración propia con base en Silver et al. (2017) y Hyndman y Koehler (2006).")
    w.p("Entre estos indicadores, la exactitud del registro de inventario (ERI) merece especial atención, porque es una condición previa para todos los demás: si el saldo registrado no corresponde al físico, el cálculo del Punto de Reorden se basa en una cantidad inexistente, y el sistema puede dejar de emitir alertas cuando el producto ya se agotó o emitirlas cuando aún hay existencias suficientes.")

    # ------------------------------------------------------------ factores
    w.h1("Factores internos y externos que afectan la demanda")
    w.p("La demanda de una librería no se distribuye uniformemente a lo largo del año, sino que responde a factores externos al negocio y a decisiones internas. Su identificación es necesaria para seleccionar las variables que alimentan el modelo predictivo.")
    w.h2("Factores externos")
    w.viñetas([
        "**Ciclo escolar:** en Guatemala, el ciclo escolar del sector público inicia en enero y concluye en octubre, de modo que la mayor demanda de útiles se concentra entre diciembre y febrero, con un repunte menor a mitad de año.",
        "**Listas oficiales de útiles y disposiciones educativas:** los cambios en los requerimientos de los centros educativos modifican la composición de la demanda.",
        "**Fechas comerciales:** celebraciones como el Día del Maestro (25 de junio) y la temporada navideña generan picos en artículos de regalo y papelería decorativa.",
        "**Condiciones económicas y competencia:** el poder adquisitivo de las familias y la presencia de grandes distribuidores influyen en el volumen y en la sensibilidad al precio.",
    ])
    w.h2("Factores internos")
    w.viñetas([
        "**Surtido y disponibilidad:** un artículo agotado no registra ventas, lo que puede subestimar su demanda real en el histórico.",
        "**Precios y promociones:** las rebajas trasladan demanda entre periodos y entre productos sustitutos.",
        "**Tiempos de entrega de proveedores:** determinan con cuánta anticipación debe emitirse cada orden.",
        "**Distribución entre sucursales:** la reasignación de existencias desde la matriz modifica la disponibilidad local.",
    ])


def marco_tecnico(w):
    # ------------------------------------------------------------ pronóstico
    w.h1("Pronóstico de la demanda")
    w.p("Un pronóstico es una estimación cuantitativa de la demanda futura basada en información del pasado y en el conocimiento del contexto. Su propósito no es eliminar la incertidumbre, sino cuantificarla para tomar mejores decisiones (Hyndman y Athanasopoulos, 2021).")
    w.h2("Componentes de una serie temporal")
    w.p("Una serie de ventas puede descomponerse en cuatro componentes: la tendencia, que representa la dirección de largo plazo; la estacionalidad, que corresponde a patrones que se repiten con periodicidad fija, como la temporada escolar; el ciclo, asociado a fluctuaciones de mayor duración vinculadas a la economía; y el componente irregular, que agrupa las variaciones aleatorias no explicables. La serie de ventas de una librería se caracteriza por una estacionalidad anual dominante.")
    w.h2("Métodos estadísticos clásicos")
    w.p("Entre los métodos clásicos se encuentran los promedios móviles, que suavizan la serie promediando las observaciones recientes; el suavizamiento exponencial, que asigna pesos decrecientes a las observaciones más antiguas, y su extensión de Holt-Winters, que incorpora tendencia y estacionalidad; y los modelos ARIMA, que representan la serie como una combinación de sus valores y errores pasados (Box et al., 2015). Estos métodos son interpretables y eficientes, pero modelan cada serie de forma aislada y no incorporan fácilmente variables explicativas como la categoría del producto o el calendario escolar.")
    w.h2("Métodos de aprendizaje automático")
    w.p("Los métodos de aprendizaje automático abordan el pronóstico como un problema de regresión, en el que la demanda de un periodo se predice a partir de un vector de características. Esta formulación permite entrenar un único modelo sobre muchos artículos a la vez, compartir patrones entre productos similares e incorporar variables de calendario y de negocio. La evidencia de la competencia M5 mostró que los métodos basados en árboles de decisión dominaron las primeras posiciones en precisión, lo que confirma su idoneidad para datos de comercio minorista con estacionalidad y efectos de calendario (Makridakis et al., 2022).")

    # ------------------------------------------------------------ ML
    w.h1("Fundamentos del aprendizaje supervisado")
    w.h2("Proceso de modelado")
    w.p("El desarrollo de un modelo supervisado sigue un proceso que comprende la recolección y depuración de los datos, la ingeniería de características, la partición en conjuntos de entrenamiento y de prueba, el entrenamiento, la evaluación con métricas apropiadas y, finalmente, el despliegue y el monitoreo en producción (James et al., 2021). Cada etapa condiciona la siguiente: un error en la depuración o una partición inadecuada pueden producir métricas aparentemente excelentes que no se sostienen con datos reales.")
    w.h2("Sesgo, varianza y sobreajuste")
    w.p("El error de un modelo sobre datos nuevos puede descomponerse en sesgo, que refleja la incapacidad del modelo para representar la relación real, y varianza, que refleja su sensibilidad a las particularidades de la muestra de entrenamiento. Un modelo demasiado simple presenta alto sesgo; uno demasiado complejo memoriza el ruido de los datos de entrenamiento y presenta alta varianza, fenómeno conocido como sobreajuste (Hastie et al., 2009). Por esta razón, la precisión de un modelo nunca debe evaluarse sobre los mismos datos con los que fue entrenado.")
    w.h2("Validación en series temporales")
    w.p("En datos con dependencia temporal, la partición aleatoria permite que el modelo aprenda de observaciones posteriores a las que debe predecir, lo que produce una estimación optimista del error. La práctica recomendada es la partición cronológica, en la que el conjunto de prueba está formado por los periodos más recientes, y la validación cruzada de origen móvil, en la que cada iteración entrena con el pasado y evalúa con el periodo inmediatamente siguiente (Hyndman y Athanasopoulos, 2021).")
    w.h2("Árboles de decisión y Random Forest")
    w.p("Un árbol de regresión divide recursivamente los datos en grupos cada vez más homogéneos según los valores de las variables explicativas, y predice para cada grupo el promedio de la variable objetivo. Random Forest combina cientos de árboles entrenados sobre muestras bootstrap de los datos y con selección aleatoria de variables en cada división, y promedia sus predicciones (Breiman, 2001). Esta combinación reduce la varianza de los árboles individuales sin incrementar significativamente su sesgo, lo que lo convierte en uno de los algoritmos más robustos para datos tabulares. Su fundamentación matemática se desarrolla en el Anexo A.")

    # ------------------------------------------------------------ arquitectura
    w.h1("Arquitectura de software y tecnologías de la plataforma")
    w.h2("Arquitectura en capas y microservicios")
    w.p("La arquitectura en capas separa la presentación, la lógica de negocio y el acceso a datos, de modo que cada capa pueda modificarse sin afectar a las demás. La arquitectura de microservicios extiende esta idea al dividir el sistema en servicios pequeños, desplegables de forma independiente, que se comunican mediante interfaces bien definidas (Newman, 2021). En el proyecto, el núcleo transaccional y el motor predictivo se implementan como servicios separados, lo que permite reentrenar o sustituir el modelo sin detener la facturación.")
    w.h2("Servicios web REST y formato JSON")
    w.p("El estilo arquitectónico REST organiza la comunicación en torno a recursos identificados por URL y manipulados mediante los métodos estándar de HTTP, sin conservar estado de sesión en el servidor (Fielding, 2000). La información se intercambia en formato JSON, un formato de texto ligero e independiente del lenguaje (Bray, 2017). La autenticación se basa en JSON Web Tokens (JWT), que permiten al servidor verificar la identidad y el rol del usuario en cada solicitud mediante una firma digital (Jones et al., 2015).")
    w.h2("Tecnologías seleccionadas")
    w.tabla("Tecnologías utilizadas en la plataforma y justificación de su selección",
            ["Capa", "Tecnología", "Justificación"],
            [
                ["Presentación", "Angular", "Marco de trabajo basado en componentes y TypeScript, con enrutamiento, protección de rutas e interceptores HTTP integrados"],
                ["Lógica de negocio", "Node.js con Express", "Modelo de entrada y salida no bloqueante, adecuado para atender múltiples solicitudes concurrentes del punto de venta"],
                ["Acceso a datos", "Sequelize (ORM)", "Correspondencia entre tablas y objetos, transacciones y bloqueos de fila para garantizar la consistencia del inventario"],
                ["Persistencia", "MySQL", "Gestor relacional con transacciones ACID mediante el motor InnoDB e integridad referencial"],
                ["Analítica", "Python con FastAPI, pandas y scikit-learn", "Ecosistema de referencia en ciencia de datos; FastAPI expone el modelo como servicio REST"],
            ])
    w.h2("Modelo relacional de datos")
    w.p("El modelo relacional, propuesto por Codd (1970), representa la información en tablas compuestas por filas y columnas, y define las relaciones entre ellas mediante llaves primarias y foráneas. Su principal ventaja para el proyecto es la integridad referencial, que impide, por ejemplo, registrar el detalle de una factura asociado a un producto inexistente. La normalización del modelo evita la duplicidad de datos, que es precisamente una de las causas del descuadre entre registros.")

    # ------------------------------------------------------------ ETL
    w.h1("Procesos ETL y calidad de los datos")
    w.p("El proceso de Extracción, Transformación y Carga (ETL) traslada los datos desde los sistemas operacionales hacia un repositorio analítico, aplicando en el camino reglas de depuración, integración y agregación (Kimball y Ross, 2013). En el proyecto, el ETL extrae las ventas facturadas, las agrega por artículo y periodo, completa los periodos sin ventas, elimina registros inconsistentes y genera las variables que utiliza el modelo.")
    w.p("La utilidad de un modelo predictivo está limitada por la calidad de los datos con los que se entrena. Wang y Strong (1996) identificaron dimensiones de la calidad de datos entre las que destacan la exactitud, la completitud, la consistencia y la oportunidad. En el contexto de la empresa, la exactitud se ve afectada por errores de captura; la completitud, por ventas no facturadas; la consistencia, por registros paralelos en distintos sistemas; y la oportunidad, por el registro tardío de los ingresos de mercadería.")

    # ------------------------------------------------------------ DSS
    w.h1("Sistemas de soporte a la decisión y tableros analíticos")
    w.p("Un sistema de soporte a la decisión (DSS) es un sistema informático interactivo que ayuda a los tomadores de decisiones a utilizar datos y modelos para resolver problemas no estructurados o semiestructurados (Power, 2013). A diferencia de los sistemas transaccionales, cuyo objetivo es registrar operaciones, los DSS tienen como propósito mejorar la calidad de las decisiones. La plataforma propuesta se clasifica como un DSS orientado a modelos, porque su valor principal reside en el modelo predictivo y en el cálculo del Punto de Reorden.")
    w.p("El tablero analítico (*dashboard*) es la interfaz mediante la cual el DSS comunica la información al usuario. Few (2013) define el tablero como una presentación visual de la información más importante para alcanzar uno o más objetivos, organizada en una sola pantalla para su monitoreo de un vistazo. Su diseño debe privilegiar la claridad sobre la decoración, destacar las excepciones que requieren acción y evitar la sobrecarga de indicadores.")

    # ------------------------------------------------------------ decisión
    w.h1("Teoría de la decisión y racionalidad limitada")
    w.p("Simon (1997) planteó que las personas que toman decisiones en las organizaciones operan bajo racionalidad limitada: no disponen de toda la información, no pueden procesar todas las alternativas y, en consecuencia, adoptan soluciones satisfactorias en lugar de óptimas, apoyándose en reglas empíricas y en la experiencia. Este planteamiento explica el comportamiento observado en la gestión de compras de la empresa, donde la complejidad de más de 200 productos, múltiples marcas y cinco puntos de venta excede la capacidad de análisis manual del encargado.")
    w.p("Desde esta perspectiva, la contribución de la plataforma no consiste en reemplazar el juicio del gerente, sino en ampliar los límites de su racionalidad: el sistema procesa el histórico completo, calcula las cantidades sugeridas y presenta únicamente las excepciones que requieren atención. La decisión final permanece en manos del usuario, pero se toma con información que antes no estaba disponible.")


def ensayo(w):
    w.p("La articulación entre los tres marcos puede sintetizarse de la siguiente manera. El marco conceptual aporta las herramientas teóricas para explicar el problema: la teoría de inventarios define qué significa reabastecer correctamente, los indicadores permiten medirlo y la teoría de la decisión explica por qué la gestión empírica no alcanza ese estándar. El marco metodológico traduce esas herramientas en un procedimiento verificable: una hipótesis con metas cuantitativas, variables operacionalizadas y pruebas estadísticas para contrastarlas.")
    w.p("El proyecto tecnológico, por su parte, materializa la solución: la arquitectura centralizada atiende la asimetría de información, el modelo de Random Forest atiende la ausencia de pronósticos, el módulo de Punto de Reorden atiende la logística reactiva y el tablero analítico pone todo ello al alcance de quien toma la decisión. La coherencia entre los tres marcos es lo que permite que los resultados del Capítulo 7 puedan interpretarse no solo como el funcionamiento correcto de un software, sino como evidencia sobre la pregunta de investigación.")


# --------------------------------------------------------------------------- #
# Capítulo 3: Marco metodológico
# --------------------------------------------------------------------------- #
def diseno_investigacion(w):
    w.p("En cuanto al diseño, la investigación adopta un diseño preexperimental de preprueba y posprueba con un solo grupo (Hernández-Sampieri y Mendoza, 2018): se miden los indicadores de la variable dependiente en la situación inicial, se introduce la plataforma y se vuelven a medir los mismos indicadores. Para la precisión del pronóstico, el contraste se realiza contra un umbral de referencia; para la proyección de pedidos, se comparan, sobre los mismos artículos y periodos, las cantidades que resultan del método empírico y las que sugiere el sistema, frente a la demanda efectivamente observada.")


def factibilidad_extra(w):
    w.h2("Factibilidad cognoscitiva")
    w.p("El investigador cuenta con la formación en ingeniería de sistemas necesaria para el desarrollo web, el diseño de bases de datos y la aplicación de técnicas de aprendizaje automático, complementada con la documentación oficial de las tecnologías utilizadas. Por parte de la empresa, el Gerente General y el jefe de sucursal conocen a profundidad las reglas del negocio, los proveedores y la estacionalidad de la demanda, conocimiento indispensable para validar las sugerencias del modelo. La brecha de conocimiento del personal operativo en el uso de la plataforma se atiende mediante capacitación y el manual de usuario incluido en los anexos.")
    w.h2("Factibilidad legal")
    w.p("El proyecto es legalmente factible porque utiliza herramientas de código abierto con licencias que permiten su uso comercial, opera con datos transaccionales propiedad de la empresa con su autorización expresa y se alinea con el Régimen FEL al realizar la certificación de documentos por medio de un certificador autorizado por la SAT. Los datos personales de los clientes se limitan a los exigidos por la normativa tributaria (nombre y NIT).")


def hipotesis_extra(w):
    w.h2("Hipótesis estadísticas")
    w.p("Para su contraste, la hipótesis de investigación se expresa en dos pares de hipótesis estadísticas, uno por cada meta cuantitativa:")
    w.p("**Precisión del pronóstico.** *H₀₁*: el error porcentual absoluto medio del modelo es mayor o igual que 15 %. *H₁₁*: el error porcentual absoluto medio del modelo es menor que 15 %.", sangria=False)
    w.p("**Proyección de pedidos.** *H₀₂*: el error de las cantidades sugeridas por el sistema no es menor que el error de las cantidades definidas con el método empírico. *H₁₂*: el error de las cantidades sugeridas por el sistema es menor que el del método empírico, con una reducción de al menos 25 %.", sangria=False)
    w.h2("Operacionalización de variables")
    w.tabla("Operacionalización de las variables de la investigación",
            ["Variable", "Dimensión", "Indicador", "Instrumento"],
            [
                ["Independiente: plataforma de gestión inteligente", "Componente predictivo", "Modelo entrenado y desplegado como servicio", "Pruebas funcionales"],
                ["", "Componente transaccional", "Facturas certificadas FEL con descuento de inventario", "Pruebas de certificación en sandbox"],
                ["", "Componente analítico", "Alertas y sugerencias de compra en el tablero", "Pruebas funcionales y de aceptación"],
                ["Dependiente: eficiencia en la toma de decisiones y control de inventarios", "Precisión del pronóstico", "MAPE < 15 %", "Script de evaluación sobre el conjunto de prueba"],
                ["", "Exactitud del inventario", "ERI antes y después", "Ficha de conteo físico (Anexo D)"],
                ["", "Calidad de la proyección de pedidos", "Reducción ≥ 25 % del error de pedido", "Registro comparativo de pedidos simulados"],
            ])


def particion(w):
    w.p("La partición se realiza en orden cronológico y no aleatorio, porque en una serie temporal la partición aleatoria permitiría que el modelo aprenda de periodos posteriores a los que debe predecir, lo que produciría una estimación optimista e irreal del error (Hyndman y Athanasopoulos, 2021). De este modo, el conjunto de prueba simula fielmente la condición de uso real, en la que el modelo pronostica periodos que aún no ha observado.")
    w.tabla("Partición cronológica del conjunto de datos",
            ["Conjunto", "Proporción", "Periodo", "Uso"],
            [
                ["Entrenamiento", "80 %", "[[enero 2023 – ___ 2025]]", "Ajuste del modelo y selección de hiperparámetros mediante validación cruzada temporal"],
                ["Prueba", "20 %", "[[___ 2025 – diciembre 2025]]", "Cálculo del MAPE final; no se utiliza en ninguna etapa del entrenamiento"],
            ],
            nota="Elaboración propia. [[Complete los periodos exactos utilizados.]]")


def instrumentos(w):
    w.p("De manera complementaria, se utilizan dos instrumentos para medir los indicadores de la variable dependiente que no se obtienen directamente de la base de datos:")
    w.viñetas([
        "**Ficha de conteo físico de inventario:** formato estructurado en el que el auditor registra, para cada artículo seleccionado, la existencia física contada y la existencia que reporta el sistema, lo que permite calcular la exactitud del registro de inventario (ERI). El formato se presenta en el Anexo D.",
        "**Registro comparativo de pedidos:** matriz que contrasta, para cada artículo y periodo del conjunto de prueba, la cantidad que se habría pedido con el método empírico, la cantidad sugerida por el sistema y la demanda real observada.",
    ])


def etl(w):
    w.p("El procedimiento ETL se ejecuta en las siguientes etapas:")
    w.numerada([
        "**Extracción:** consulta SQL que obtiene, para cada línea de factura certificada, el producto, la categoría, la sucursal, la fecha y la cantidad vendida. Se excluyen los documentos anulados.",
        "**Agregación:** las ventas se agregan por producto y periodo mensual [[o semanal]], y se completan con cero los periodos sin ventas para no perder la continuidad de la serie.",
        "**Depuración:** se identifican valores atípicos, como ventas institucionales extraordinarias, y se documenta su tratamiento; se eliminan registros con producto o fecha inválidos.",
        "**Ingeniería de características:** se generan las variables de calendario (mes, temporada escolar), los rezagos de venta (1 y 12 periodos) y los promedios móviles.",
        "**Carga:** el conjunto resultante se almacena en formato tabular y se registra la fecha de extracción para garantizar la reproducibilidad del entrenamiento.",
    ])


def interpretacion_extra(w):
    w.p("Además de las métricas del modelo, la interpretación incluye el contraste estadístico de las hipótesis. Para la precisión del pronóstico se aplica la prueba t de Student para una muestra sobre los errores porcentuales absolutos del conjunto de prueba, contra el umbral de 15 %. Para la proyección de pedidos se aplica la prueba de rangos con signo de Wilcoxon para muestras relacionadas, que compara los errores del método empírico y del sistema sobre los mismos artículos y periodos (Wilcoxon, 1945). Previamente se verifica la normalidad de los datos con la prueba de Shapiro-Wilk (Shapiro y Wilk, 1965). En todos los casos se adopta un nivel de significancia de 0.05.")
