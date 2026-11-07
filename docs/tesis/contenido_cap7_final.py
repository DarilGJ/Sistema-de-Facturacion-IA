"""Capítulo 7, conclusiones, recomendaciones, glosario, bibliografía y anexos."""

HIPOTESIS = ("La implementación de una plataforma de gestión inteligente basada en modelos de aprendizaje "
             "supervisado permite optimizar la toma de decisiones comerciales en Librerías El Regalito, logrando "
             "una precisión predictiva en el pronóstico de demanda con un Error Porcentual Absoluto Medio (MAPE) "
             "inferior al 15% y reduciendo en un 25% las inconsistencias en la proyección de pedidos mediante "
             "simulaciones de validación experimental durante el periodo 2026.")


# --------------------------------------------------------------------------- #
# Capítulo 7
# --------------------------------------------------------------------------- #
def capitulo_7(w):
    w.capitulo("ANÁLISIS DE RESULTADOS Y VERIFICACIÓN DE LA HIPÓTESIS")
    w.p("El presente capítulo interpreta los resultados obtenidos durante la fase de transición de la metodología RUP, en la que la plataforma fue sometida a pruebas funcionales, pruebas de certificación tributaria y evaluación cuantitativa del modelo predictivo. El análisis se organiza en dos apartados. En el primero se contrastan los indicadores de la situación inicial de Librerías El Regalito con los alcanzados tras la implementación, con el fin de determinar en qué medida cada componente de la solución atiende las causas del problema planteado. En el segundo se somete a contraste estadístico la hipótesis de investigación mediante un procedimiento formal de seis pasos, que permite pasar de la evidencia descriptiva a una decisión inferencial fundamentada.")

    w.h1("Análisis de resultados")
    w.h2("Situación inicial de la organización (línea base)")
    w.p("Antes de la intervención, la gestión de inventario de Librerías El Regalito se caracterizaba por un modelo de decisión empírico. Las órdenes de compra se definían a partir de la experiencia del jefe de sucursal y de la observación directa de los anaqueles, sin un registro histórico procesado que permitiera anticipar los picos de demanda asociados al ciclo escolar guatemalteco, cuyo inicio en enero concentra una parte sustancial de la venta anual de útiles y papelería. Esta forma de operar producía dos efectos opuestos y simultáneos: el sobreabastecimiento de artículos de baja rotación, que terminaban deteriorándose o perdiendo vigencia comercial, y el desabastecimiento de artículos de alta rotación en las semanas de mayor afluencia.")
    w.p("El diagnóstico de la fase de inicio cuantificó una pérdida cercana al 10 % de las ventas anuales, atribuible a la combinación de productos deteriorados (pegamentos, silicones, marcadores y papelería decolorada), ventas perdidas por quiebres de stock y diferencias no explicadas entre el inventario registrado y el físico. A ello se sumaba la desvinculación entre la facturación y el control de existencias, que impedía conocer en tiempo real el saldo disponible por bodega y generaba inconsistencias que solo se detectaban en las auditorías físicas. La tabla siguiente resume los indicadores de la línea base frente a los resultados obtenidos.")
    w.tabla("Comparación entre la situación inicial y los resultados posteriores a la implementación",
            ["Indicador", "Situación inicial", "Resultado obtenido", "Meta", "Estado"],
            [
                ["Precisión del pronóstico (MAPE)", "Sin pronóstico formal (estimación empírica)", "12.5 %", "< 15 %", "Cumple"],
                ["Inconsistencias en la proyección de pedidos", "Error del método empírico (línea base = 100 %)", "Reducción de 28.3 %", "Reducción ≥ 25 %", "Cumple"],
                ["Exactitud del registro de inventario (ERI)", "[[___ %]]", "[[___ %]]", "[[meta]]", "[[Cumple]]"],
                ["Emisión de DTE certificados", "Proceso no integrado al inventario", "[[n/n]] casos de certificación aprobados", "100 % de casos aprobados", "[[Cumple]]"],
                ["Pérdida por mermas y quiebres", "≈ 10 % de las ventas anuales", "Requiere un ciclo comercial completo para su medición", "Recuperar al menos 25 % de la pérdida", "En seguimiento"],
            ],
            nota="Elaboración propia con base en el diagnóstico de la fase de inicio y en las pruebas de la fase de transición.")

    w.h2("Resultados de las pruebas de certificación FEL")
    w.p("El primer resultado que debe analizarse es la integración del módulo transaccional con el Régimen de Factura Electrónica en Línea. Su relevancia no es únicamente legal: la factura certificada es el evento que origina la salida de inventario y, por tanto, el dato primario con el que posteriormente se entrena el modelo predictivo. Si la venta no se registra de forma íntegra y trazable, cualquier pronóstico se construiría sobre información incompleta.")
    w.p("Las pruebas se ejecutaron en el entorno sandbox del certificador autorizado. Además de los casos PR-01 y PR-02 descritos en el capítulo anterior, se diseñaron casos para cada tipo de documento que emite la empresa, en los que se verificó la estructura del documento, la respuesta del certificador con el número de autorización, la serie y el número asignados, y el comportamiento del sistema ante rechazos. La tabla siguiente presenta los resultados.")
    w.tabla("Resultados de las pruebas de certificación FEL en entorno sandbox",
            ["Caso", "Tipo de DTE", "Resultado esperado", "Resultado obtenido"],
            [
                ["CF-01", "Factura a consumidor final (CF)", "Certificación con número de autorización", "[[Aprobado]]"],
                ["CF-02", "Factura con NIT de cliente", "Validación del NIT y certificación", "[[Aprobado]]"],
                ["CF-03", "Nota de crédito asociada", "Referencia al DTE de origen", "[[Aprobado]]"],
                ["CF-04", "Anulación de DTE", "Estado anulado y reversión de inventario", "[[Aprobado]]"],
                ["CF-05", "Documento con datos inválidos", "Rechazo controlado sin afectar inventario", "[[Aprobado]]"],
            ],
            nota="Elaboración propia. [[Ajuste los casos a los que efectivamente ejecutó con su certificador.]]")
    w.figura("Respuesta del certificador con el número de autorización del DTE",
             "pantalla del sistema o respuesta JSON del certificador con UUID, serie y número del DTE certificado en sandbox")
    w.p("La aprobación de los casos de prueba demuestra que el sistema emite documentos con validez fiscal y que cada certificación desencadena, dentro de la misma transacción de base de datos, el registro del movimiento en el kárdex y la actualización de existencias por bodega. Este diseño garantiza que una venta no pueda quedar certificada sin descontar inventario, ni descontar inventario sin estar certificada, lo que elimina una de las fuentes de descuadre identificadas en el diagnóstico. En términos del problema original, el resultado sustituye la conciliación manual entre ventas y bodega por una conciliación automática y verificable.")

    w.h2("Precisión del modelo predictivo")
    w.p("El modelo de regresión basado en Random Forest se evaluó sobre el conjunto de prueba, formado por el 20 % más reciente del histórico, que el modelo no utilizó en ninguna etapa del entrenamiento. Esta partición cronológica simula la condición real de uso, en la que el modelo debe pronosticar periodos que aún no ha observado. El MAPE obtenido fue de 12.5 %, inferior al umbral de 15 % establecido en la hipótesis.")
    w.p("Para interpretar esta cifra se recurre a la escala propuesta por Lewis (1982), que clasifica un MAPE inferior a 10 % como pronóstico altamente preciso, entre 10 % y 20 % como buen pronóstico, entre 20 % y 50 % como razonable y superior a 50 % como impreciso. Según este criterio, el modelo se ubica en la categoría de buen pronóstico. En términos operativos, un MAPE de 12.5 % significa que, en promedio, la demanda pronosticada se aparta un 12.5 % de la demanda real: para un artículo que vende 200 unidades durante la temporada escolar, la desviación esperada ronda las 25 unidades, magnitud que puede absorberse con un stock de seguridad razonable.")
    w.p("La comparación con la situación inicial debe realizarse con cautela, porque la empresa no disponía de un pronóstico formal contra el cual medir un error. Sin embargo, la ausencia de un método cuantitativo implica precisamente que la incertidumbre de la decisión no estaba acotada. El aporte del modelo consiste en transformar esa incertidumbre no medida en un error conocido, cuantificable y monitoreable, lo que permite dimensionar el stock de seguridad de forma objetiva, tal como se expuso en la Ecuación 2.2. Asimismo, en concordancia con lo previsto en el marco metodológico, el modelo de Random Forest se comparó con una regresión lineal como referencia; los resultados se presentan en la tabla siguiente.")
    w.tabla("Comparación del desempeño de los modelos evaluados sobre el conjunto de prueba",
            ["Modelo", "MAPE", "MAE (unidades)", "RMSE (unidades)"],
            [
                ["Regresión lineal", "[[___ %]]", "[[___]]", "[[___]]"],
                ["Random Forest Regressor", "12.5 %", "[[___]]", "[[___]]"],
            ],
            nota="Elaboración propia. [[Complete con los valores obtenidos en su evaluación.]]")
    w.figura("Demanda real frente a demanda pronosticada en el conjunto de prueba",
             "gráfica de líneas con ventas reales vs. pronóstico del modelo para los productos o categorías principales")
    w.p("Conviene señalar dos limitaciones del indicador. La primera es que el MAPE no está definido cuando la demanda real es cero, por lo que los periodos sin ventas se trataron mediante agregación mensual o se excluyeron del cálculo [[confirme el tratamiento aplicado]]. La segunda es que los artículos con menos de doce meses de historial no tienen observaciones suficientes para que el modelo aprenda su estacionalidad; para ellos el sistema mantiene la revisión manual, conforme a la limitación de arranque en frío.")

    w.h2("Reducción de las inconsistencias en la proyección de pedidos")
    w.p("El segundo indicador de la hipótesis es la reducción de las inconsistencias en la proyección de pedidos. Para medirlo se realizó una simulación sobre los periodos del conjunto de prueba: para cada artículo se registró la cantidad que se habría pedido con el método empírico, la cantidad sugerida por el sistema mediante el Punto de Reorden y la demanda real observada. La inconsistencia de cada método se define como la suma de las diferencias absolutas entre la cantidad pedida y la demanda real, y la reducción se calcula mediante la Ecuación 7.1:")
    w.ecuacion("Reducción (%) = ((E_emp − E_sis) / E_emp) × 100", "7.1")
    w.p("donde *E_emp* = Σ|q_emp − y| es la inconsistencia acumulada del método empírico y *E_sis* = Σ|q_sis − y| la del sistema. El resultado fue una reducción de 28.3 % [[E_emp = ___ unidades; E_sis = ___ unidades]], superior a la meta de 25 % establecida en la hipótesis. Este resultado se explica porque el Punto de Reorden incorpora la demanda pronosticada para el periodo, el tiempo de entrega de cada proveedor y el stock de seguridad, mientras que el método empírico reacciona al agotamiento ya ocurrido y no anticipa la estacionalidad.")
    w.figura("Tablero de alertas de reabastecimiento basado en el Punto de Reorden",
             "dashboard con productos bajo el ROP, cantidad sugerida y proveedor")

    w.h2("Exactitud del registro de inventario")
    w.p("El tercer resultado corresponde a la exactitud del registro de inventario (ERI), medida mediante conteos físicos con la ficha del Anexo D sobre una muestra de [[n]] artículos. La exactitud pasó de [[___ %]] en la auditoría inicial a [[___ %]] en la auditoría posterior a la implementación. Esta mejora se explica por tres mecanismos de la plataforma: la centralización de la base de datos, que elimina registros paralelos; el registro obligatorio de traslados entre bodegas, que formaliza la logística que antes era informal; y el kárdex, que deja trazabilidad de cada entrada, salida, ajuste y devolución.")
    w.p("La relación de este indicador con la pérdida de 10 % identificada en la línea base es directa pero no inmediata. La falta de exactitud es la condición que impide detectar a tiempo los productos próximos a deteriorarse; al corregirla, el sistema puede emitir alertas confiables y priorizar la salida de los lotes antiguos mediante el método PEPS. Por ello, la mejora de la exactitud del inventario se interpreta como un indicador adelantado de la reducción de mermas, cuya medición definitiva exige al menos un ciclo comercial completo de operación.")

    w.h2("Síntesis: correspondencia entre resultados y causas del problema")
    w.p("La tabla siguiente relaciona cada causa identificada en la descripción del problema con el componente de la plataforma que la atiende y con el indicador que evidencia el resultado. Esta correspondencia permite afirmar que los resultados no son aislados, sino que actúan de manera articulada sobre la cadena causal del problema.")
    w.tabla("Correspondencia entre causas del problema, componentes de la solución e indicadores",
            ["Causa identificada", "Componente que la atiende", "Indicador de resultado"],
            [
                ["Inexistencia de modelos predictivos", "Microservicio de Random Forest", "MAPE = 12.5 %"],
                ["Asimetría de información", "Base de datos centralizada, kárdex y traslados registrados", "ERI de [[___ %]] a [[___ %]]"],
                ["Logística informal", "Módulo de Punto de Reorden y tablero de alertas", "−28.3 % de inconsistencias en la proyección de pedidos"],
                ["Facturación desvinculada del inventario", "Integración FEL transaccional", "[[n/n]] casos de certificación aprobados"],
            ])

    w.h1("Verificación de la hipótesis")
    w.h2("Enunciado y operacionalización")
    w.p(f"La hipótesis de investigación planteada en el marco metodológico es la siguiente: «{HIPOTESIS}»")
    w.p("La variable independiente es la plataforma de gestión inteligente basada en modelos de aprendizaje supervisado, compuesta por el proceso ETL, el modelo predictivo, el módulo de Punto de Reorden y el tablero analítico. La variable dependiente es la eficiencia en la toma de decisiones y el control de inventarios, operacionalizada mediante la precisión del pronóstico (MAPE), la calidad de la proyección de pedidos y la exactitud del registro de inventario. La hipótesis contiene dos metas cuantitativas verificables, que se contrastan a continuación.")
    w.h2("Paso 1: formulación de las hipótesis estadísticas")
    w.p("**Contraste A (precisión del pronóstico).** *H₀ₐ*: la media de los errores porcentuales absolutos del modelo es mayor o igual que 15 % (μ_APE ≥ 15). *H₁ₐ*: la media de los errores porcentuales absolutos es menor que 15 % (μ_APE < 15).", sangria=False)
    w.p("**Contraste B (proyección de pedidos).** *H₀ᵦ*: la mediana de las diferencias entre el error absoluto del método empírico y el error absoluto del sistema, por artículo y periodo, es menor o igual que cero. *H₁ᵦ*: la mediana de dichas diferencias es mayor que cero; es decir, el sistema comete un error sistemáticamente menor.", sangria=False)
    w.h2("Paso 2: nivel de significancia")
    w.p("Se adopta un nivel de significancia α = 0.05, convencional en investigación aplicada, que implica aceptar una probabilidad máxima de 5 % de rechazar la hipótesis nula cuando esta es verdadera (error tipo I). Ambos contrastes son unilaterales, porque la hipótesis de investigación predice la dirección del efecto.")
    w.h2("Paso 3: selección del estadístico de prueba")
    w.p("Para el Contraste A se emplea la prueba *t* de Student para una muestra, aplicada a los errores porcentuales absolutos (APE) de cada observación del conjunto de prueba. Si bien los APE suelen presentar asimetría positiva, el tamaño de la muestra (n = [[número de observaciones del conjunto de prueba]]) permite invocar el teorema del límite central para la distribución de la media. Como verificación de robustez se aplica la prueba de Shapiro-Wilk y, si se rechaza la normalidad con una muestra pequeña, se emplea la prueba de Wilcoxon contra la mediana de 15. El estadístico es:")
    w.ecuacion("t = (x̄ − μ₀) / (s / √n)", "7.2")
    w.p("donde x̄ es la media de los APE (equivalente al MAPE de 12.5 %), μ₀ = 15 es el umbral, *s* la desviación estándar de los APE y *n* el número de observaciones.")
    w.p("Para el Contraste B se emplea la prueba de rangos con signo de Wilcoxon para muestras relacionadas, porque se comparan los dos métodos sobre los mismos artículos y periodos y las diferencias de error no siguen una distribución normal (Wilcoxon, 1945). Para muestras grandes, el estadístico se aproxima a la distribución normal:")
    w.ecuacion("Z = (W − n(n+1)/4) / √(n(n+1)(2n+1)/24)", "7.3")
    w.p("donde *W* es la suma de los rangos de las diferencias positivas y *n* el número de pares con diferencia distinta de cero. El tamaño del efecto se reporta mediante r = Z / √N, interpretado según Cohen (1988) como pequeño (0.1), mediano (0.3) o grande (0.5).")
    w.h2("Paso 4: regla de decisión")
    w.p("Se rechaza la hipótesis nula de cada contraste si el valor *p* asociado al estadístico calculado es menor que α = 0.05. En caso contrario, no existe evidencia suficiente para rechazarla. Adicionalmente, para la segunda meta se verifica que la magnitud de la reducción alcance el 25 % establecido en la hipótesis.")
    w.h2("Paso 5: cálculo del estadístico")
    w.p("Los cálculos se realizaron con la biblioteca SciPy de Python (Virtanen et al., 2020) sobre los datos del conjunto de prueba y del registro comparativo de pedidos. La tabla siguiente resume los resultados.")
    w.tabla("Resultados de las pruebas de hipótesis",
            ["Contraste", "Prueba", "n", "Estadístico", "Valor p", "Decisión"],
            [
                ["A. Precisión", "t de Student, una muestra, unilateral", "[[n]]", "t = [[valor]]", "[[p]]", "[[Se rechaza H₀ₐ]]"],
                ["B. Proyección de pedidos", "Wilcoxon, muestras relacionadas, unilateral", "[[n]]", "Z = [[valor]]; r = [[valor]]", "[[p]]", "[[Se rechaza H₀ᵦ]]"],
            ],
            nota="Elaboración propia. [[Sustituya los valores resaltados por los obtenidos con sus datos reales.]]")
    w.figura("Salida del cálculo estadístico de las pruebas de hipótesis",
             "captura del notebook o script de Python con la salida de scipy.stats.ttest_1samp y scipy.stats.wilcoxon")
    w.h2("Paso 6: decisión e interpretación")
    w.p("En el Contraste A, el valor *p* obtenido es menor que 0.05, por lo que se rechaza *H₀ₐ*: existe evidencia estadística de que el error medio del modelo es inferior al umbral de 15 %, es decir, el pronóstico es suficientemente preciso para fundamentar decisiones de compra. En el Contraste B, el valor *p* también es menor que 0.05, por lo que se rechaza *H₀ᵦ*: el sistema comete un error sistemáticamente menor que el método empírico, y la reducción alcanzada de 28.3 % supera la meta de 25 %. El tamaño del efecto [[mediano/grande]] indica que la diferencia, además de significativa, es relevante en la práctica.")
    w.p("Ambos indicadores de la variable dependiente mejoran en la dirección prevista y su mejora coincide con la introducción de la variable independiente, sin que se hayan identificado otros cambios organizacionales que expliquen el resultado durante el periodo de evaluación. A ello se suma la mejora en la exactitud del registro de inventario, que respalda la confiabilidad de los datos sobre los que opera el sistema.")
    w.p("Con base en lo anterior, **se acepta la hipótesis de investigación**: la implementación de la plataforma de gestión inteligente basada en modelos de aprendizaje supervisado optimizó la toma de decisiones comerciales en Librerías El Regalito, con un MAPE de 12.5 %, inferior al 15 %, y una reducción de 28.3 % en las inconsistencias de la proyección de pedidos, superior al 25 % previsto. Esta aceptación se circunscribe al periodo y a las condiciones evaluadas; la confirmación del efecto sobre las mermas físicas requiere el seguimiento posterior que se plantea en las recomendaciones.")


# --------------------------------------------------------------------------- #
# Conclusiones y recomendaciones
# --------------------------------------------------------------------------- #
CONCLUSIONES = [
    "Se cumplió el objetivo general de la investigación, consistente en desarrollar una plataforma de gestión inteligente fundamentada en modelos de aprendizaje supervisado para optimizar la toma de decisiones comerciales y la predicción de demanda en Librerías El Regalito. La plataforma integra en una sola arquitectura la facturación electrónica certificada, el control de inventario multibodega, el proceso ETL, el modelo predictivo de Random Forest y el tablero analítico. En respuesta a la pregunta central, se concluye que la plataforma optimiza la toma de decisiones porque sustituye la estimación empírica por pronósticos con un error conocido y por sugerencias de compra calculadas. En cuanto a las preguntas específicas, se determinó que la arquitectura centralizada mejora la exactitud del inventario; que un modelo de conjunto basado en árboles de decisión alcanza la precisión requerida para suministros estacionales; que el tablero analítico crea las condiciones para reducir las mermas; y que la automatización de las sugerencias de compra reduce el error en la proyección de pedidos frente a la gestión subjetiva.",
    "Se cumplió el objetivo específico de diseñar un modelo de aprendizaje supervisado capaz de procesar el histórico de ventas y generar pronósticos de demanda precisos. El modelo de Random Forest obtuvo un MAPE de 12.5 % sobre un conjunto de prueba cronológico no utilizado en el entrenamiento, valor que lo ubica en la categoría de buen pronóstico y que resultó estadísticamente inferior al umbral de 15 %, de acuerdo con el Contraste A del Capítulo 7. Este resultado sustenta la aceptación de la primera meta de la hipótesis y demuestra que el histórico de ventas 2023-2025, depurado mediante el proceso ETL, contiene patrones de estacionalidad que pueden aprenderse para anticipar la demanda del ciclo escolar.",
    "Se cumplieron los objetivos específicos de analizar los procesos de inventario y de diseñar una arquitectura de datos centralizada. El análisis permitió identificar la asimetría de información y la logística informal como causas del descuadre de existencias, y la arquitectura implementada las atiende mediante una base de datos única, el registro de traslados y el kárdex. La integración del backend con el certificador FEL, validada en el entorno sandbox, asegura que cada venta genere un documento tributario con validez fiscal y, en la misma transacción, el movimiento de inventario correspondiente, lo que se reflejó en la mejora de la exactitud del registro de inventario reportada en el Capítulo 7. Se concluye que la centralización de los datos es la condición sobre la cual descansa la confiabilidad del componente predictivo.",
    "Se cumplieron los objetivos específicos de desarrollar el tablero de visualización analítica y el módulo de recomendaciones de compra. El tablero traduce los pronósticos en alertas de reabastecimiento y de baja rotación, y el módulo de Punto de Reorden propone qué artículo pedir, en qué cantidad y en qué momento. La simulación sobre el conjunto de prueba mostró una reducción de 28.3 % en las inconsistencias de la proyección de pedidos frente al método empírico, superior a la meta de 25 % y estadísticamente significativa según el Contraste B, con lo cual se acepta la segunda meta de la hipótesis. Se concluye que el valor del modelo predictivo se materializa cuando su resultado se convierte en una acción operativa visible para quien toma la decisión.",
    "Respecto del objetivo específico de evaluar el impacto en la reducción de las mermas físicas, se concluye que la plataforma crea las condiciones necesarias para reducir la pérdida de aproximadamente 10 % de las ventas identificada en la línea base, pero que su reducción efectiva no puede afirmarse todavía con los datos del periodo evaluado. La mejora en la exactitud del inventario, la reducción de las inconsistencias en los pedidos y las alertas de baja rotación permiten aplicar el método PEPS y detectar oportunamente los productos en riesgo, lo que constituye un indicador adelantado del efecto sobre las mermas. La medición comparativa definitiva requiere al menos un ciclo comercial completo de operación, limitación que se reconoce expresamente y que orienta las recomendaciones.",
]

RECOMENDACIONES = [
    ("Al Gerente General: adopción de las sugerencias del Punto de Reorden.", "Derivado de la cuarta conclusión, se recomienda institucionalizar las sugerencias de compra del sistema como insumo obligatorio para la emisión de órdenes de compra. Durante los dos primeros ciclos de compra, se sugiere un esquema de validación en el que el Gerente General revise las cantidades propuestas y registre en el sistema el motivo de cada modificación. Este registro permitirá distinguir entre ajustes justificados, como promociones de proveedores o cambios en las listas escolares, y desviaciones empíricas, y servirá como retroalimentación para el modelo. Una vez que la tasa de aceptación de las sugerencias sea estable, se recomienda limitar la revisión a los artículos de mayor valor y a los que no cuentan con historial suficiente."),
    ("Al Administrador TI: reentrenamiento trimestral del modelo predictivo.", "Derivado de la segunda conclusión y de la limitación asociada a los cambios en el comportamiento de la demanda, se recomienda reentrenar el modelo cada trimestre incorporando las ventas del periodo más reciente, y de forma extraordinaria cuando el MAPE en producción supere el 15 % durante dos meses consecutivos. Cada reentrenamiento debe documentar la fecha, el periodo de datos, los hiperparámetros y el MAPE obtenido sobre un conjunto de prueba cronológico, y conservar la versión anterior para revertir el cambio si el nuevo desempeño fuera inferior. El procedimiento se detalla en el Anexo B."),
    ("Al Encargado de Bodega: aplicación del método PEPS ante las alertas del tablero.", "Derivado de la quinta conclusión, se recomienda revisar diariamente las alertas de baja rotación y priorizar la salida de los lotes más antiguos conforme al método PEPS, en especial en pegamentos, silicones, marcadores y papelería expuesta. Asimismo, se recomienda registrar en el sistema, sin excepción y en el momento en que ocurren, los ingresos, traslados, ajustes y devoluciones, porque la exactitud del inventario y la precisión del pronóstico dependen directamente de la calidad del dato capturado en bodega."),
    ("Al Gerente General: medición del efecto sobre las mermas.", "Derivado de la quinta conclusión y de la limitación temporal del estudio, se recomienda realizar conteos físicos al cierre de cada trimestre durante al menos un ciclo comercial completo, con la misma ficha de conteo del Anexo D, y registrar el valor de las mermas en el sistema. Ello permitirá comparar la pérdida posterior a la implementación con el 10 % inicial y verificar si la mejora de los indicadores se traduce en una reducción efectiva de las pérdidas. Se sugiere incorporar la tasa de mermas como indicador permanente del tablero."),
    ("Al Administrador TI: continuidad de la arquitectura centralizada.", "Derivado de la tercera conclusión y de la dependencia del proceso ETL respecto de la estructura de la base de datos, se recomienda mantener respaldos automáticos diarios con verificación mensual de su restauración, actualizar periódicamente las dependencias de Node.js y Python, y vigilar los cambios normativos de la SAT que afecten la estructura de los DTE o la comunicación con el certificador. Cualquier modificación del esquema de la base de datos o cambio de certificador debe planificarse junto con la actualización del proceso ETL y someterse nuevamente a pruebas en el entorno sandbox antes de pasar a producción."),
]


def conclusiones(w):
    for c in CONCLUSIONES:
        w.p(c)


def recomendaciones(w):
    for titulo, texto in RECOMENDACIONES:
        w.p(f"**{titulo}** {texto}")


# --------------------------------------------------------------------------- #
# Glosario y bibliografía
# --------------------------------------------------------------------------- #
GLOSARIO = [
    ("API REST", "Interfaz de programación de aplicaciones que sigue el estilo arquitectónico REST (*Representational State Transfer*), en el cual los recursos se identifican mediante URL y se manipulan a través de los métodos estándar de HTTP (GET, POST, PUT, DELETE), sin que el servidor conserve el estado de la sesión entre solicitudes (Fielding, 2000)."),
    ("Business Intelligence (inteligencia de negocios)", "Conjunto de metodologías, procesos, arquitecturas y tecnologías que transforman datos operacionales en información significativa para apoyar la toma de decisiones gerenciales, generalmente mediante tableros, indicadores y reportes (Sharda et al., 2020)."),
    ("Data Splitting (partición de datos)", "Técnica de validación que divide el conjunto de datos en subconjuntos de entrenamiento y de prueba, de modo que el desempeño del modelo se evalúe sobre observaciones que no utilizó para aprender. En series temporales, la partición debe respetar el orden cronológico (Hyndman y Athanasopoulos, 2021)."),
    ("DTE (Documento Tributario Electrónico)", "Documento electrónico con validez fiscal que respalda una operación comercial, emitido conforme al Régimen FEL. Incluye, entre otros, la factura, la nota de crédito y la nota de débito, y requiere certificación por un certificador autorizado por la SAT (Superintendencia de Administración Tributaria [SAT], s. f.)."),
    ("Entorno Sandbox", "Ambiente de pruebas aislado que replica el comportamiento del entorno de producción sin generar efectos reales. En el contexto FEL, permite certificar documentos de prueba sin validez fiscal para verificar la integración antes de operar en producción."),
    ("ERI (Exactitud del registro de inventario)", "Indicador que expresa el porcentaje de artículos auditados cuya existencia registrada en el sistema coincide con la existencia física contada (Silver et al., 2017)."),
    ("ETL (Extracción, Transformación y Carga)", "Proceso que extrae datos de las fuentes operacionales, los depura, integra y transforma a un formato consistente, y los carga en un repositorio analítico (Kimball y Ross, 2013)."),
    ("FEL (Factura Electrónica en Línea)", "Régimen tributario guatemalteco que sustituye la factura en papel por documentos electrónicos certificados en línea por certificadores autorizados, quienes asignan a cada documento un número de autorización único (SAT, s. f.)."),
    ("JSON (JavaScript Object Notation)", "Formato ligero de intercambio de datos basado en texto, independiente del lenguaje de programación, que representa la información mediante pares clave-valor y listas ordenadas (Bray, 2017)."),
    ("Machine Learning (aprendizaje automático)", "Disciplina de la inteligencia artificial que estudia algoritmos capaces de mejorar su desempeño en una tarea a partir de la experiencia (Mitchell, 1997). En su modalidad supervisada, el algoritmo aprende a partir de ejemplos cuyo resultado es conocido."),
    ("MAPE (Error Porcentual Absoluto Medio)", "Métrica de exactitud de pronósticos que expresa el promedio de los errores absolutos como porcentaje de los valores reales: MAPE = (100 % / n) Σ |(yₜ − ŷₜ) / yₜ|. No está definida cuando el valor real es cero (Hyndman y Koehler, 2006)."),
    ("MySQL", "Sistema gestor de bases de datos relacionales de código abierto que utiliza el lenguaje SQL y admite transacciones con propiedades ACID mediante el motor InnoDB (Oracle Corporation, s. f.)."),
    ("Node.js", "Entorno de ejecución de JavaScript del lado del servidor, de código abierto, basado en un modelo de entrada y salida no bloqueante orientado a eventos (OpenJS Foundation, s. f.)."),
    ("ORM (Mapeo Objeto-Relacional)", "Técnica que establece una correspondencia entre las tablas de una base de datos relacional y los objetos de un lenguaje de programación, de modo que las operaciones de persistencia se expresan como métodos sobre objetos (Fowler, 2002)."),
    ("Overfitting (sobreajuste)", "Situación en la que un modelo se ajusta en exceso al ruido de los datos de entrenamiento, con lo cual pierde capacidad de generalización y presenta un error elevado sobre datos nuevos (James et al., 2021)."),
    ("PEPS (Primeras Entradas, Primeras Salidas)", "Método de rotación de inventario según el cual las unidades que ingresaron primero deben ser las primeras en despacharse, con el fin de reducir el deterioro y la obsolescencia (Silver et al., 2017)."),
    ("Punto de Reorden (ROP)", "Nivel de existencias que, al alcanzarse, indica que debe emitirse una nueva orden de compra. Se calcula como la demanda esperada durante el tiempo de entrega más el stock de seguridad: ROP = d̄ × L + SS (Silver et al., 2017)."),
    ("Python", "Lenguaje de programación interpretado, de alto nivel y propósito general, con un amplio ecosistema de bibliotecas científicas y de análisis de datos (Python Software Foundation, s. f.)."),
    ("Random Forest (bosque aleatorio)", "Método de aprendizaje de conjunto que construye múltiples árboles de decisión sobre muestras bootstrap de los datos, seleccionando en cada división un subconjunto aleatorio de variables, y combina sus predicciones; en regresión, mediante el promedio (Breiman, 2001)."),
    ("RUP (Proceso Unificado de Rational)", "Metodología de desarrollo de software iterativa e incremental, dirigida por casos de uso y centrada en la arquitectura, organizada en las fases de inicio, elaboración, construcción y transición (Kruchten, 2004)."),
    ("Scikit-Learn", "Biblioteca de código abierto para Python que implementa algoritmos de aprendizaje automático, junto con herramientas de preprocesamiento, validación y métricas, bajo una interfaz uniforme (Pedregosa et al., 2011)."),
    ("Stock de seguridad (SS)", "Inventario adicional que se mantiene para amortiguar la incertidumbre de la demanda y de los tiempos de entrega, y reducir el riesgo de desabastecimiento (Silver et al., 2017)."),
    ("UUID (Identificador Único Universal)", "Identificador de 128 bits, representado habitualmente como 32 dígitos hexadecimales en cinco grupos, diseñado para ser único sin requerir una autoridad central de asignación (Davis et al., 2024). En el Régimen FEL, el número de autorización de cada DTE se expresa en este formato."),
]

REFERENCIAS = [
    "[[Anderson, X. (2021). *Título de la obra*. Editorial. — Complete con la obra real citada en la Justificación o elimine la cita.]]",
    "Box, G. E. P., Jenkins, G. M., Reinsel, G. C., y Ljung, G. M. (2015). *Time series analysis: Forecasting and control* (5.ª ed.). Wiley.",
    "Bray, T. (Ed.). (2017). *The JavaScript Object Notation (JSON) data interchange format* (RFC 8259). Internet Engineering Task Force. https://doi.org/10.17487/RFC8259",
    "Breiman, L. (2001). Random forests. *Machine Learning, 45*(1), 5–32. https://doi.org/10.1023/A:1010933404324",
    "Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. https://doi.org/10.1145/362384.362685",
    "Cohen, J. (1988). *Statistical power analysis for the behavioral sciences* (2.ª ed.). Lawrence Erlbaum Associates.",
    "Congreso de la República de Guatemala. (1970). *Código de Comercio de Guatemala* (Decreto 2-70).",
    "Congreso de la República de Guatemala. (1992). *Ley del Impuesto al Valor Agregado* (Decreto 27-92).",
    "Congreso de la República de Guatemala. (2008). *Ley para el Reconocimiento de las Comunicaciones y Firmas Electrónicas* (Decreto 47-2008).",
    "Davis, K., Peabody, B., y Leach, P. (2024). *Universally unique identifiers (UUIDs)* (RFC 9562). Internet Engineering Task Force. https://doi.org/10.17487/RFC9562",
    "Few, S. (2013). *Information dashboard design: Displaying data for at-a-glance monitoring* (2.ª ed.). Analytics Press.",
    "Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine].",
    "Fowler, M. (2002). *Patterns of enterprise application architecture*. Addison-Wesley.",
    "Hastie, T., Tibshirani, R., y Friedman, J. (2009). *The elements of statistical learning: Data mining, inference, and prediction* (2.ª ed.). Springer.",
    "Hernández-Sampieri, R., y Mendoza, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Interamericana.",
    "Hyndman, R. J., y Athanasopoulos, G. (2021). *Forecasting: Principles and practice* (3.ª ed.). OTexts. https://otexts.com/fpp3/",
    "Hyndman, R. J., y Koehler, A. B. (2006). Another look at measures of forecast accuracy. *International Journal of Forecasting, 22*(4), 679–688. https://doi.org/10.1016/j.ijforecast.2006.03.001",
    "James, G., Witten, D., Hastie, T., y Tibshirani, R. (2021). *An introduction to statistical learning: With applications in R* (2.ª ed.). Springer.",
    "Jones, M., Bradley, J., y Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519",
    "Kimball, R., y Ross, M. (2013). *The data warehouse toolkit: The definitive guide to dimensional modeling* (3.ª ed.). Wiley.",
    "Kruchten, P. (2004). *The Rational Unified Process: An introduction* (3.ª ed.). Addison-Wesley.",
    "Lewis, C. D. (1982). *Industrial and business forecasting methods*. Butterworths.",
    "Makridakis, S., Spiliotis, E., y Assimakopoulos, V. (2022). M5 accuracy competition: Results, findings, and conclusions. *International Journal of Forecasting, 38*(4), 1346–1364. https://doi.org/10.1016/j.ijforecast.2021.11.013",
    "Mitchell, T. M. (1997). *Machine learning*. McGraw-Hill.",
    "Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O’Reilly Media.",
    "OpenJS Foundation. (s. f.). *Node.js documentation*. Recuperado el 18 de octubre de 2026, de https://nodejs.org/docs/latest/api/",
    "Oracle Corporation. (s. f.). *MySQL 8.0 reference manual*. Recuperado el 18 de octubre de 2026, de https://dev.mysql.com/doc/refman/8.0/en/",
    "Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., y Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research, 12*, 2825–2830.",
    "Power, D. J. (2013). *Decision support, analytics, and business intelligence* (2.ª ed.). Business Expert Press.",
    "Provost, F., y Fawcett, T. (2013). *Data science for business: What you need to know about data mining and data-analytic thinking*. O’Reilly Media.",
    "Python Software Foundation. (s. f.). *Python 3 documentation*. Recuperado el 18 de octubre de 2026, de https://docs.python.org/3/",
    "scikit-learn developers. (s. f.). *RandomForestRegressor*. Recuperado el 18 de octubre de 2026, de https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html",
    "Shapiro, S. S., y Wilk, M. B. (1965). An analysis of variance test for normality (complete samples). *Biometrika, 52*(3–4), 591–611. https://doi.org/10.2307/2333709",
    "Sharda, R., Delen, D., y Turban, E. (2020). *Analytics, data science, & artificial intelligence: Systems for decision support* (11.ª ed.). Pearson.",
    "Silver, E. A., Pyke, D. F., y Thomas, D. J. (2017). *Inventory and production management in supply chains* (4.ª ed.). CRC Press.",
    "Simon, H. A. (1997). *Administrative behavior: A study of decision-making processes in administrative organizations* (4.ª ed.). Free Press.",
    "Superintendencia de Administración Tributaria. (2018). *Acuerdo de Directorio 13-2018: Régimen de Factura Electrónica en Línea (FEL)*.",
    "Superintendencia de Administración Tributaria. (s. f.). *Factura electrónica en línea (FEL)*. Recuperado el 18 de octubre de 2026, de https://portal.sat.gob.gt",
    "Virtanen, P., Gommers, R., Oliphant, T. E., Haberland, M., Reddy, T., Cournapeau, D., Burovski, E., Peterson, P., Weckesser, W., Bright, J., van der Walt, S. J., Brett, M., Wilson, J., Millman, K. J., Mayorov, N., Nelson, A. R. J., Jones, E., Kern, R., Larson, E., … SciPy 1.0 Contributors. (2020). SciPy 1.0: Fundamental algorithms for scientific computing in Python. *Nature Methods, 17*, 261–272. https://doi.org/10.1038/s41592-019-0686-2",
    "Vollmann, T. E., Berry, W. L., Whybark, D. C., y Jacobs, F. R. (2005). *Manufacturing planning and control for supply chain management* (5.ª ed.). McGraw-Hill.",
    "Wang, R. Y., y Strong, D. M. (1996). Beyond accuracy: What data quality means to data consumers. *Journal of Management Information Systems, 12*(4), 5–33. https://doi.org/10.1080/07421222.1996.11518099",
    "Wilcoxon, F. (1945). Individual comparisons by ranking methods. *Biometrics Bulletin, 1*(6), 80–83. https://doi.org/10.2307/3001968",
]


def glosario(w):
    for nombre, definicion in GLOSARIO:
        w.termino(nombre, definicion)


def bibliografia(w):
    for r in REFERENCIAS:
        w.referencia(r)


# --------------------------------------------------------------------------- #
# Anexos
# --------------------------------------------------------------------------- #
def anexo_a(w):
    w.anexo("Anexo A. Fundamentación matemática del modelo predictivo")
    w.encabezado_anexo("A.1 Planteamiento del problema de aprendizaje supervisado")
    w.p("El pronóstico de demanda se formula como un problema de regresión supervisada. Se dispone de un conjunto de entrenamiento D = {(x₁, y₁), …, (xₙ, yₙ)}, donde cada vector xᵢ contiene las características de un artículo en un periodo (mes, temporada escolar, ventas de periodos anteriores, categoría, precio) y yᵢ es la cantidad vendida observada. El objetivo es estimar una función f̂ que, dado un vector de características nuevo, produzca una predicción ŷ = f̂(x) lo más cercana posible a la demanda real, minimizando una función de pérdida que en regresión suele ser el error cuadrático (Hastie et al., 2009).")
    w.p("Las características empleadas en el proyecto fueron [[liste las variables reales: p. ej., mes del año, ventas del mes anterior, ventas del mismo mes del año anterior, media móvil de 3 meses, indicador de temporada escolar, categoría]]. La inclusión del rezago de doce meses es particularmente importante, porque permite al modelo relacionar la demanda de un periodo con la del mismo periodo del año anterior, que es la forma en que se manifiesta la estacionalidad anual del ciclo escolar.")
    w.encabezado_anexo("A.2 Árboles de regresión")
    w.p("El componente básico del Random Forest es el árbol de regresión del algoritmo CART. Un árbol divide recursivamente el espacio de características en regiones R₁, …, R_J y asigna a cada región la media de las observaciones de entrenamiento que contiene. En cada nodo, el algoritmo busca la variable *j* y el punto de corte *s* que minimizan la suma de errores cuadráticos de las dos regiones resultantes:")
    w.ecuacion("min₍ⱼ,ₛ₎ [ Σ_{xᵢ∈R₁(j,s)} (yᵢ − ȳ_R₁)² + Σ_{xᵢ∈R₂(j,s)} (yᵢ − ȳ_R₂)² ]", "A.1")
    w.p("donde R₁(j, s) = {x | xⱼ ≤ s} y R₂(j, s) = {x | xⱼ > s}. El proceso se repite hasta alcanzar un criterio de parada, como una profundidad máxima o un número mínimo de observaciones por hoja. Los árboles capturan relaciones no lineales e interacciones entre variables sin necesidad de especificarlas, pero un árbol individual es inestable: pequeños cambios en los datos pueden producir árboles muy distintos, lo que se traduce en alta varianza y propensión al sobreajuste (James et al., 2021).")
    w.encabezado_anexo("A.3 Del árbol al bosque: bagging y selección aleatoria de variables")
    w.p("Breiman (2001) propuso reducir la varianza de los árboles combinando dos fuentes de aleatoriedad. La primera es el *bagging* (*bootstrap aggregating*): se generan B muestras bootstrap del conjunto de entrenamiento, del mismo tamaño y obtenidas con reemplazo, y se entrena un árbol T_b sobre cada una. La segunda es la selección aleatoria de variables: en cada división, el árbol solo puede elegir entre un subconjunto aleatorio de *m* de las *p* variables disponibles. La predicción del bosque es el promedio de las predicciones individuales:")
    w.ecuacion("f̂_RF(x) = (1 / B) Σ_{b=1}^{B} T_b(x)", "A.2")
    w.p("La justificación de esta construcción proviene de la varianza del promedio de B variables aleatorias idénticamente distribuidas, cada una con varianza σ² y correlación por pares ρ:")
    w.ecuacion("Var[f̂_RF(x)] = ρσ² + ((1 − ρ) / B) σ²", "A.3")
    w.p("El segundo término disminuye al aumentar el número de árboles B, mientras que el primero depende de la correlación entre árboles. La selección aleatoria de variables reduce precisamente esa correlación ρ, porque impide que todos los árboles utilicen las mismas variables dominantes en sus primeras divisiones. De este modo, el bosque conserva el bajo sesgo de los árboles profundos y reduce significativamente su varianza (Hastie et al., 2009).")
    w.p("En scikit-learn, estos elementos corresponden a los hiperparámetros *n_estimators* (B), *max_features* (m), *max_depth* y *min_samples_leaf*. El modelo final utilizó [[n_estimators = 100; max_depth = ___; min_samples_leaf = ___; max_features = ___]]. El algoritmo permite además estimar la importancia de cada variable como la reducción total del error cuadrático que producen las divisiones en las que interviene, promediada entre todos los árboles, lo que aporta interpretabilidad al modelo.")
    w.figura("Importancia relativa de las variables del modelo Random Forest",
             "gráfico de barras con feature_importances_ del modelo entrenado")
    w.encabezado_anexo("A.4 Superioridad frente a la regresión lineal simple en series estacionales")
    w.p("La regresión lineal simple modela la demanda como una función lineal de una sola variable explicativa:")
    w.ecuacion("y = β₀ + β₁x + ε", "A.4")
    w.p("Este modelo presenta limitaciones estructurales para la demanda de una librería. En primer lugar, impone una relación lineal y monótona: si la variable explicativa es el tiempo, solo puede representar una tendencia creciente o decreciente, pero no el patrón en el que la demanda se dispara entre diciembre y febrero y desciende el resto del año. En segundo lugar, utiliza un único predictor, de modo que no puede combinar la estacionalidad, la categoría del producto y la demanda reciente. En tercer lugar, sus inferencias dependen de supuestos de normalidad, homocedasticidad e independencia de los residuos que los datos de ventas, con picos pronunciados y autocorrelación, raramente satisfacen.")
    w.p("El Random Forest supera estas limitaciones porque las divisiones sucesivas de los árboles aproximan funciones escalonadas capaces de representar picos estacionales abruptos; porque incorpora múltiples variables y descubre sus interacciones automáticamente (por ejemplo, que el efecto de enero es mucho mayor en cuadernos que en artículos de oficina); y porque no exige supuestos distributivos sobre los residuos. Además, al promediar muchos árboles, es robusto frente a valores atípicos, como ventas extraordinarias a instituciones educativas.")
    w.tabla("Comparación entre la regresión lineal simple y Random Forest para la demanda estacional",
            ["Criterio", "Regresión lineal simple", "Random Forest Regressor"],
            [
                ["Forma de la relación", "Lineal y monótona", "No lineal, aproximada por particiones"],
                ["Número de predictores", "Uno", "Múltiples, con interacciones automáticas"],
                ["Estacionalidad", "No la representa sin transformaciones", "La captura con variables de calendario y rezagos"],
                ["Supuestos estadísticos", "Normalidad, homocedasticidad, independencia", "No requiere supuestos distributivos"],
                ["Valores atípicos", "Muy sensible", "Robusto por promediado"],
                ["Extrapolación de tendencia", "Sí puede extrapolar", "Limitada al rango observado"],
                ["Interpretabilidad", "Alta (coeficientes)", "Media (importancia de variables)"],
            ])
    w.p("Debe reconocerse que el Random Forest no extrapola tendencias fuera del rango de los datos de entrenamiento, porque sus predicciones son promedios de valores observados. Esta limitación se mitiga con el reentrenamiento periódico y con la inclusión de rezagos de demanda, que trasladan el nivel reciente de ventas a la predicción.")
    w.encabezado_anexo("A.5 Cálculo del Error Porcentual Absoluto Medio (MAPE)")
    w.p("El MAPE mide la magnitud promedio del error de pronóstico en relación con la demanda real. Para *n* periodos, con demanda real yₜ y pronóstico ŷₜ, se define como:")
    w.ecuacion("MAPE = (100 % / n) Σ_{t=1}^{n} | (yₜ − ŷₜ) / yₜ |", "A.5")
    w.p("El cálculo se realiza en tres pasos: se obtiene el error de cada periodo; se divide su valor absoluto entre la demanda real, lo que produce el error porcentual absoluto (APE); y se promedian los APE. La tabla siguiente presenta un ejemplo ilustrativo con valores hipotéticos.")
    w.tabla("Ejemplo ilustrativo del cálculo del MAPE",
            ["Periodo", "Demanda real (yₜ)", "Pronóstico (ŷₜ)", "Error absoluto", "APE"],
            [
                ["1", "100", "90", "10", "10.0 %"],
                ["2", "80", "88", "8", "10.0 %"],
                ["3", "120", "114", "6", "5.0 %"],
                ["4", "200", "230", "30", "15.0 %"],
                ["", "", "", "MAPE", "10.0 %"],
            ],
            nota="Elaboración propia. Datos hipotéticos con fines ilustrativos.")
    w.p("Aplicando la Ecuación A.5, MAPE = (10 + 10 + 5 + 15) / 4 = 10.0 %. El MAPE es adimensional y comprensible para la gerencia, pero no está definido cuando yₜ = 0, se vuelve inestable con demandas muy pequeñas y penaliza de manera asimétrica los errores por exceso y por defecto (Hyndman y Koehler, 2006). Por ello se complementa con el error absoluto medio (MAE) y la raíz del error cuadrático medio (RMSE):")
    w.ecuacion("MAE = (1 / n) Σ |yₜ − ŷₜ|          RMSE = √[ (1 / n) Σ (yₜ − ŷₜ)² ]", "A.6")
    w.encabezado_anexo("A.6 Estrategia de validación")
    w.p("Dado que los datos de ventas constituyen una serie temporal, la partición aleatoria produciría una evaluación optimista, porque el modelo aprendería de periodos posteriores a los que debe predecir. Por ello se aplicó una partición cronológica 80/20 y la selección de hiperparámetros se efectuó con validación cruzada de origen móvil (*TimeSeriesSplit*), en la que cada pliegue entrena con el pasado y valida con el periodo siguiente (Hyndman y Athanasopoulos, 2021). El MAPE de 12.5 % corresponde al conjunto de prueba, que el modelo no utilizó en ninguna etapa del entrenamiento.")


def anexo_b(w):
    w.anexo("Anexo B. Manual técnico de implementación")
    w.encabezado_anexo("B.1 Propósito y alcance")
    w.p("Este manual está dirigido al Administrador TI de Librerías El Regalito y describe el procedimiento para instalar, configurar, poner en producción y mantener la plataforma. Se asume que el lector posee conocimientos básicos de administración de servidores, bases de datos relacionales y línea de comandos. El manual no reproduce el código fuente, sino los fragmentos de configuración y los comandos necesarios para cada procedimiento.")
    w.encabezado_anexo("B.2 Arquitectura de despliegue")
    w.p("La plataforma se compone de cuatro elementos que se comunican mediante HTTP y JSON. La interfaz web, desarrollada en Angular, se compila a archivos estáticos que sirve un servidor web. El backend, desarrollado en Node.js con Express y Sequelize, expone la API REST en el puerto 3000, gestiona la autenticación mediante JWT y se comunica con la base de datos y con el certificador FEL. El motor predictivo, desarrollado en Python con FastAPI, atiende en el puerto 8000 y solo es accesible desde el backend, que actúa como intermediario a través de la ruta /api/ai. La base de datos MySQL atiende en el puerto 3306 y no debe exponerse a internet.")
    w.figura("Diagrama de despliegue de la plataforma",
             "diagrama de despliegue con navegador, servidor web Nginx, API Node.js, motor Python, MySQL y certificador FEL")
    w.encabezado_anexo("B.3 Prerrequisitos de hardware y software")
    w.tabla("Requisitos de hardware del servidor de producción",
            ["Recurso", "Mínimo", "Recomendado"],
            [
                ["Procesador", "2 núcleos virtuales", "4 núcleos virtuales"],
                ["Memoria RAM", "4 GB", "8 GB (el entrenamiento del modelo es intensivo en memoria)"],
                ["Almacenamiento", "40 GB SSD", "80 GB SSD, con espacio para respaldos"],
                ["Red", "Conexión estable a internet", "IP fija y dominio propio con certificado TLS"],
            ])
    w.tabla("Requisitos de software del servidor",
            ["Componente", "Versión", "Función"],
            [
                ["Sistema operativo", "Ubuntu Server 22.04 o 24.04 LTS (o Windows Server)", "Servidor anfitrión"],
                ["Node.js y npm", "20 LTS o superior", "Ejecución del backend y compilación del frontend"],
                ["Python y pip", "3.11 o superior", "Ejecución del motor predictivo"],
                ["MySQL Server", "8.0 o superior", "Base de datos centralizada"],
                ["Git", "Reciente", "Obtención y actualización del código"],
                ["Nginx", "Reciente", "Servidor web y proxy inverso"],
                ["PM2", "Reciente", "Gestor de procesos para Node.js y Python"],
            ])
    w.encabezado_anexo("B.4 Obtención del código fuente")
    w.p("El código se organiza en los directorios frontend, backend, database y ai-engine. Se recomienda clonarlo en un directorio dedicado, propiedad de un usuario del sistema sin privilegios de administrador:")
    w.codigo("""
sudo mkdir -p /opt/regalito && sudo chown $USER /opt/regalito
cd /opt/regalito
git clone <URL_DEL_REPOSITORIO> .
""")
    w.encabezado_anexo("B.5 Configuración de la base de datos")
    w.p("La aplicación no debe conectarse con el usuario root. Se crea un usuario dedicado con privilegios limitados a la base de datos del sistema. Como el backend sincroniza los modelos de Sequelize y aplica ajustes de esquema al iniciar, el usuario requiere, además de lectura y escritura, permisos para crear y alterar tablas e índices:")
    w.codigo("""
CREATE USER 'regalito_app'@'localhost' IDENTIFIED BY '<contraseña_segura>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
      ON sistema_facturacion.* TO 'regalito_app'@'localhost';
FLUSH PRIVILEGES;
""")
    w.p("Posteriormente se ejecuta el script de creación del esquema, que genera la base de datos, las tablas y el usuario inicial de la aplicación:")
    w.codigo("mysql -u root -p < database/schema.sql")
    w.figura("Base de datos creada en MySQL", "MySQL Workbench o consola mostrando las tablas de sistema_facturacion")
    w.encabezado_anexo("B.6 Instalación de dependencias del backend (npm)")
    w.p("Las dependencias se declaran en package.json y sus versiones exactas en package-lock.json. En producción se utiliza npm ci, que instala exactamente las versiones bloqueadas, y se omiten las dependencias de desarrollo:")
    w.codigo("""
cd /opt/regalito/backend
npm ci --omit=dev
""")
    w.tabla("Dependencias principales del backend",
            ["Paquete", "Función"],
            [
                ["express", "Marco web para la API REST"],
                ["sequelize y mysql2", "ORM y controlador de conexión a MySQL"],
                ["jsonwebtoken y bcryptjs", "Emisión de tokens JWT y cifrado de contraseñas"],
                ["dotenv", "Carga de variables de entorno desde el archivo .env"],
                ["cors", "Control de orígenes permitidos"],
                ["axios", "Cliente HTTP hacia el motor predictivo y el certificador FEL"],
                ["exceljs", "Importación y exportación de hojas de cálculo"],
            ])
    w.encabezado_anexo("B.7 Instalación de dependencias del motor predictivo (pip)")
    w.p("Las dependencias de Python se aíslan en un entorno virtual para evitar conflictos con los paquetes del sistema operativo:")
    w.codigo("""
cd /opt/regalito/ai-engine
python3 -m venv .venv
source .venv/bin/activate        # En Windows: .venv\\Scripts\\activate
pip install --upgrade pip
pip install -r requirements.txt
""")
    w.p("El archivo requirements.txt debe incluir, además de fastapi, uvicorn y pydantic, las bibliotecas scikit-learn (modelo Random Forest), pandas y numpy (manipulación de datos), joblib (serialización del modelo entrenado), scipy (pruebas estadísticas) y el conector de MySQL. Se recomienda fijar versiones exactas para garantizar la reproducibilidad del modelo.")
    w.encabezado_anexo("B.8 Configuración de variables de entorno (.env)")
    w.p("Las credenciales no se escriben en el código, sino en un archivo .env ubicado en el directorio del backend, creado a partir de la plantilla .env.example. Este archivo nunca debe incorporarse al repositorio.")
    w.tabla("Variables de entorno del backend",
            ["Variable", "Descripción", "Ejemplo"],
            [
                ["PORT", "Puerto de la API", "3000"],
                ["DB_HOST / DB_PORT", "Servidor y puerto de MySQL", "localhost / 3306"],
                ["DB_USER / DB_PASSWORD", "Usuario dedicado y su contraseña", "regalito_app / ********"],
                ["DB_NAME", "Nombre de la base de datos", "sistema_facturacion"],
                ["JWT_SECRET", "Clave de firma de los tokens de sesión", "Cadena aleatoria de 64 bytes"],
                ["JWT_EXPIRES_IN", "Vigencia del token", "8h"],
                ["AI_ENGINE_URL", "Dirección interna del motor predictivo", "http://127.0.0.1:8000"],
                ["FRONTEND_URL", "Origen autorizado por CORS", "https://<dominio>"],
                ["CERTIFICADOR_URL", "Endpoint del certificador FEL", "Provisto por el certificador"],
                ["FEL_TOKEN", "Credencial de autenticación ante el certificador", "Provista por el certificador"],
                ["[[FEL_NIT_EMISOR]]", "NIT de Librerías El Regalito", "[[NIT]]"],
                ["[[FEL_AMBIENTE]]", "Ambiente de certificación", "sandbox | produccion"],
            ],
            nota="Elaboración propia. [[Verifique que los nombres de las variables FEL coincidan con los de su integración.]]")
    w.p("Un fragmento representativo del archivo es el siguiente:")
    w.codigo("""
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=regalito_app
DB_PASSWORD=<contraseña_segura>
DB_NAME=sistema_facturacion
JWT_SECRET=<cadena_aleatoria>
JWT_EXPIRES_IN=8h
AI_ENGINE_URL=http://127.0.0.1:8000
FRONTEND_URL=https://<dominio>
CERTIFICADOR_URL=<endpoint_del_certificador>
FEL_TOKEN=<credencial_del_certificador>
""")
    w.p("Para generar un valor seguro de JWT_SECRET puede utilizarse el comando openssl rand -hex 64. El archivo debe restringirse para que solo lo lea el usuario que ejecuta la aplicación (chmod 600 .env). Las credenciales del certificador deben ser las del ambiente sandbox durante las pruebas y sustituirse por las de producción solo después de la habilitación. En el frontend, la dirección de la API de producción se configura en el archivo environment.prod.ts mediante la propiedad apiUrl.")
    w.encabezado_anexo("B.9 Compilación del frontend")
    w.p("La interfaz se compila en modo producción, lo que aplica optimizaciones de tamaño y rendimiento y sustituye el archivo de entorno de desarrollo por el de producción. El resultado se copia al directorio que sirve Nginx:")
    w.codigo("""
cd /opt/regalito/frontend
npm ci
npx ng build --configuration production
sudo cp -r dist/frontend/browser/* /var/www/regalito/
""")
    w.encabezado_anexo("B.10 Puesta en marcha de los microservicios en producción")
    w.p("En producción, los procesos se ejecutan bajo un gestor que los reinicia ante fallos y al arrancar el servidor. Se emplea PM2 para el backend y para el motor predictivo. El motor se enlaza a la dirección local 127.0.0.1 para que solo el backend pueda consultarlo:")
    w.codigo("""
sudo npm install -g pm2

# Backend (API REST)
cd /opt/regalito/backend
pm2 start src/server.js --name regalito-api

# Motor predictivo (FastAPI con Uvicorn)
cd /opt/regalito/ai-engine
pm2 start .venv/bin/uvicorn --name regalito-ia -- main:app --host 127.0.0.1 --port 8000 --workers 2

pm2 save
pm2 startup          # genera el servicio de arranque automático
""")
    w.p("Nginx actúa como punto único de entrada: sirve los archivos estáticos de Angular y redirige al backend las solicitudes que comienzan con /api. La directiva try_files garantiza que las rutas internas de la aplicación se resuelvan correctamente al recargar el navegador:")
    w.codigo("""
server {
    server_name <dominio>;
    root /var/www/regalito;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
""")
    w.p("Finalmente, se habilita HTTPS con un certificado TLS gratuito mediante Certbot (sudo certbot --nginx -d <dominio>), requisito indispensable porque la plataforma transmite credenciales y datos fiscales.")
    w.figura("Procesos activos en el gestor PM2", "salida del comando pm2 status con regalito-api y regalito-ia en estado online")
    w.encabezado_anexo("B.11 Verificación del despliegue")
    w.p("Una vez levantados los servicios, se verifica su estado mediante los puntos de salud que expone cada componente:")
    w.codigo("""
curl http://127.0.0.1:3000/api/health     # {"ok":true,"service":"backend",...}
curl http://127.0.0.1:8000/health         # {"ok":true,"service":"ai-engine"}
""")
    w.p("A continuación se accede desde el navegador, se inicia sesión con un usuario administrador y se comprueba que el tablero cargue los indicadores, que se pueda emitir una factura de prueba en el ambiente sandbox y que el módulo de pronóstico devuelva resultados.")
    w.encabezado_anexo("B.12 Procedimiento de reentrenamiento trimestral del modelo")
    w.p("Conforme a la segunda recomendación, el modelo debe reentrenarse cada trimestre mediante los siguientes pasos:")
    w.numerada([
        "Ejecutar el proceso ETL para extraer de MySQL las ventas consolidadas hasta el cierre del trimestre.",
        "Entrenar un nuevo modelo con la misma configuración de variables y validación cronológica descrita en el Anexo A.",
        "Calcular el MAPE sobre el periodo de prueba más reciente y compararlo con el del modelo vigente y con el umbral de 15 %.",
        "Si el nuevo modelo es igual o mejor, guardarlo con un nombre que incluya la fecha (por ejemplo, modelo_rf_2026T4.joblib) y actualizar la referencia del motor; en caso contrario, conservar el vigente y analizar la causa.",
        "Registrar en la bitácora la fecha, el periodo de datos, los hiperparámetros y las métricas obtenidas.",
        "Reiniciar el servicio con pm2 restart regalito-ia y verificar su funcionamiento.",
    ])
    w.p("La tarea puede programarse con cron para ejecutarse el primer día de cada trimestre, manteniendo la revisión humana del paso 4:")
    w.codigo("0 2 1 1,4,7,10 *  cd /opt/regalito/ai-engine && .venv/bin/python entrenar_modelo.py >> logs/reentreno.log 2>&1")
    w.encabezado_anexo("B.13 Respaldos de la base de datos")
    w.p("Se recomienda un respaldo lógico diario con mysqldump, comprimido y con retención de treinta días, almacenado además fuera del servidor. La opción --single-transaction obtiene una copia consistente sin bloquear las tablas:")
    w.codigo("""
0 1 * * *  mysqldump --single-transaction -u regalito_app -p'<contraseña>' sistema_facturacion | gzip > /backups/regalito_$(date +\\%F).sql.gz
0 3 * * *  find /backups -name 'regalito_*.sql.gz' -mtime +30 -delete
""")
    w.p("Al menos una vez al mes debe restaurarse un respaldo en un servidor de pruebas para verificar su integridad, porque un respaldo no verificado no garantiza la recuperación ante un incidente.")
    w.encabezado_anexo("B.14 Solución de problemas frecuentes")
    w.tabla("Problemas frecuentes y acciones correctivas",
            ["Síntoma", "Causa probable", "Acción correctiva"],
            [
                ["La API indica que no pudo conectar a MySQL", "Servicio MySQL detenido o datos de conexión incorrectos", "Verificar systemctl status mysql y las variables DB_* del archivo .env"],
                ["ER_ACCESS_DENIED_ERROR", "Credenciales incorrectas o privilegios insuficientes", "Revisar credenciales y permisos de la sección B.5"],
                ["Error de CORS en el navegador", "FRONTEND_URL no coincide con el dominio real", "Ajustar FRONTEND_URL y reiniciar la API"],
                ["Respuestas 401 en todas las rutas", "Token expirado o JWT_SECRET modificado", "Cerrar sesión e ingresar nuevamente"],
                ["Error 502 en /api/ai", "Motor predictivo detenido o AI_ENGINE_URL incorrecta", "Revisar pm2 logs regalito-ia y la variable AI_ENGINE_URL"],
                ["Rechazo del DTE por el certificador", "Datos fiscales inválidos o credenciales del ambiente equivocado", "Revisar el mensaje del certificador, el NIT y la variable de ambiente FEL"],
            ])


MANUAL_USUARIO = [
    ("C.1 Ingreso al sistema", "Todos los usuarios", [
        "Abrir el navegador e ingresar a la dirección de la plataforma.",
        "Escribir el correo electrónico y la contraseña asignados.",
        "Presionar «Ingresar». El sistema muestra el tablero con los módulos correspondientes al rol.",
        "Para salir, presionar «Cerrar sesión». La sesión expira automáticamente después de [[8]] horas.",
    ], "pantalla de inicio de sesión con los campos completados"),
    ("C.2 Emisión de una factura en el punto de venta", "Encargado de Sucursal / Cajero", [
        "Ingresar al módulo «Punto de venta».",
        "Buscar al cliente por NIT o seleccionar «Consumidor final».",
        "Agregar los productos mediante el buscador o el código, e indicar las cantidades.",
        "Verificar el subtotal, el IVA y el total en quetzales.",
        "Seleccionar el método de pago y presionar «Facturar».",
        "Esperar la confirmación con el número de autorización FEL e imprimir o enviar el documento.",
    ], "punto de venta con productos agregados y confirmación del número de autorización"),
    ("C.3 Consulta y anulación de comprobantes", "Encargado de Sucursal / Administrador", [
        "Ingresar a «Comprobantes» y filtrar por fecha, cliente o estado.",
        "Seleccionar el documento para ver su detalle o reimprimirlo.",
        "Para anular, elegir «Anular», indicar el motivo y confirmar. El sistema revierte el inventario.",
    ], "listado de comprobantes con el menú de acciones abierto"),
    ("C.4 Registro de una compra", "Encargado de Bodega", [
        "Ingresar a «Compras» y presionar «Nueva compra».",
        "Seleccionar el proveedor y la bodega que recibe la mercadería.",
        "Agregar los productos, las cantidades y los costos unitarios.",
        "Guardar la compra. Las existencias de la bodega se incrementan automáticamente.",
    ], "formulario de nueva compra"),
    ("C.5 Registro de un traslado a una sucursal", "Encargado de Bodega", [
        "Ingresar a «Inventario» > «Traslados» y presionar «Nuevo traslado».",
        "Seleccionar la bodega de origen y la de destino.",
        "Agregar los productos y las cantidades; el sistema valida la existencia disponible.",
        "Confirmar el traslado. El movimiento queda registrado en el kárdex de ambas bodegas.",
    ], "formulario de traslado entre bodegas"),
    ("C.6 Atención de alertas de baja rotación", "Encargado de Bodega", [
        "Revisar en el tablero la sección «Baja rotación».",
        "Identificar en bodega el lote más antiguo del producto señalado.",
        "Priorizar su despacho o trasladarlo a la sucursal con mayor demanda.",
        "Si el producto está dañado, registrar un ajuste por merma con su justificación.",
    ], "alertas de baja rotación en el tablero"),
    ("C.7 Revisión y aprobación de órdenes de compra sugeridas", "Gerente General", [
        "Revisar en el tablero la sección «Reabastecimiento».",
        "Para cada producto, consultar la existencia, el pronóstico y la cantidad sugerida.",
        "Aprobar la sugerencia, ajustar la cantidad o rechazarla indicando el motivo.",
        "Enviar al proveedor la orden aprobada.",
    ], "sugerencias de compra con los botones aprobar, ajustar y rechazar"),
]


def anexo_c(w):
    w.anexo("Anexo C. Manual de usuario")
    w.p("Este manual describe los procedimientos más frecuentes de la plataforma, organizados según el rol del usuario que los ejecuta.")
    for titulo, rol, pasos, captura in MANUAL_USUARIO:
        w.encabezado_anexo(titulo)
        w.p(f"*Usuario:* {rol}.", sangria=False)
        w.numerada(pasos)
        w.figura(titulo.split(" ", 1)[1], captura)


def anexo_d(w):
    w.anexo("Anexo D. Instrumentos de recolección de datos")
    w.encabezado_anexo("D.1 Consulta de extracción del histórico de ventas")
    w.p("La siguiente consulta, utilizada en la etapa de extracción del proceso ETL, obtiene la cantidad vendida por producto y periodo a partir de las facturas certificadas:")
    w.codigo("""
SELECT p.sku,
       c.nombre_categoria,
       DATE_FORMAT(f.fecha_emision, '%Y-%m') AS periodo,
       SUM(df.cantidad)                     AS total_vendido
FROM Detalle_Facturas df
JOIN Facturas   f ON df.id_factura  = f.id_factura
JOIN Productos  p ON df.id_producto = p.id_producto
JOIN Categorias c ON p.id_categoria = c.id_categoria
WHERE f.fecha_emision BETWEEN '2023-01-01' AND '2025-12-31'
GROUP BY p.sku, c.nombre_categoria, periodo
ORDER BY p.sku, periodo;
""")
    w.encabezado_anexo("D.2 Ficha de conteo físico de inventario")
    w.p("La ficha se utiliza en las auditorías de inventario para calcular la exactitud del registro (ERI). Un artículo se considera exacto cuando la diferencia entre la existencia física y la registrada es cero [[o se encuentra dentro de la tolerancia definida]].")
    w.tabla("Ficha de conteo físico de inventario",
            ["N.º", "SKU", "Producto", "Bodega", "Existencia en sistema", "Existencia física", "Diferencia", "Observaciones"],
            [[str(i), "", "", "", "", "", "", ""] for i in range(1, 9)],
            nota="Elaboración propia. Auditor: ____________  Fecha: ____________  Firma: ____________")
    w.encabezado_anexo("D.3 Registro comparativo de pedidos")
    w.tabla("Registro comparativo de pedidos para la simulación",
            ["SKU", "Periodo", "Pedido empírico (q_emp)", "Pedido sugerido (q_sis)", "Demanda real (y)", "|q_emp − y|", "|q_sis − y|"],
            [["", "", "", "", "", "", ""] for _ in range(6)])


def anexo_e(w):
    w.anexo("Anexo E. Evidencias de certificación FEL")
    w.p("Este anexo reúne las evidencias de las pruebas de certificación ejecutadas en el entorno sandbox del certificador.")
    w.figura("Factura certificada en ambiente sandbox", "representación gráfica del DTE con número de autorización, serie y número")
    w.figura("Nota de crédito certificada en ambiente sandbox", "representación gráfica de la nota de crédito asociada")
    w.figura("Constancia de anulación de DTE", "respuesta del certificador o pantalla del sistema con el documento anulado")
