"""Páginas adicionales para superar 120 folios de contenido y cerrar la rúbrica."""


def lectura_cronograma(w):
    w.p(
        "La lectura del cronograma debe hacerse junto con la tabla de iteraciones RUP del "
        "capítulo 4. La fase de incepción (4 de febrero al 7 de marzo) concentró el "
        "diagnóstico y la formulación del problema. La elaboración (7 de marzo al 31 de mayo) "
        "produjo el marco teórico, la hipótesis y la arquitectura de datos. La construcción "
        "ocupó cuatro meses: de junio a julio se extrajo y depuró el histórico 2023-2025 y se "
        "ejecutó la auditoría física inicial; de agosto a septiembre se construyó el software, "
        "se entrenó el motor Random Forest y se armó el tablero. La transición comenzó el 1 de "
        "octubre, coincidiendo con la instalación en la librería, y comprende el análisis de "
        "resultados, las pruebas en sandbox, las revisiones de forma y la defensa, programada "
        "del 3 al 7 de noviembre de 2026."
    )
    w.tabla(
        "Duración de las fases RUP en el cronograma ejecutado",
        ["Fase", "Inicio", "Fin", "Duración", "Actividades del cronograma"],
        [
            ["Incepción", "04/02/2026", "07/03/2026", "5 semanas", "1 y 2"],
            ["Elaboración", "07/03/2026", "31/05/2026", "12 semanas", "3, 4 y 5"],
            ["Construcción", "01/06/2026", "30/09/2026", "17 semanas", "6 y 7"],
            ["Transición", "01/10/2026", "07/11/2026", "5 semanas", "8, 9 y 10"],
        ],
        nota="Elaboración propia a partir de la Tabla 6.",
    )
    w.p(
        "El solapamiento aparente entre el cierre de una actividad y el inicio de la siguiente "
        "—por ejemplo, el 18 de febrero y el 7 de marzo— no es un error: en RUP el hito de una "
        "iteración es, al mismo tiempo, el punto de partida de la siguiente. Por eso esas "
        "fechas se comparten. La actividad 10 permanece en ejecución porque la defensa final "
        "aún no ha ocurrido al cierre de este informe."
    )


def cumplimiento_objetivos(w):
    w.h1("Cumplimiento de los objetivos de la investigación")
    w.p(
        "Este apartado cierra el análisis de resultados contrastando, uno por uno, los "
        "objetivos declarados en el capítulo 1 con la evidencia reunida en los capítulos 4 a 7. "
        "La intención es que el evaluador no tenga que reconstruir esa correspondencia por su "
        "cuenta, y que las conclusiones posteriores no introduzcan afirmaciones que no estén "
        "ya sostenidas aquí."
    )
    w.h2("Objetivo general")
    w.p(
        "El objetivo general pidió desarrollar una plataforma de gestión inteligente "
        "fundamentada en modelos de aprendizaje supervisado para optimizar la toma de "
        "decisiones comerciales y la predicción de demanda en Librerías El Regalito durante "
        "el periodo 2026. La plataforma existe, está instalada y articula tres capas: el "
        "módulo transaccional que certifica la venta y actualiza el inventario, el motor "
        "predictivo que estima la demanda y el Punto de Reorden, y el tablero que convierte "
        "esos cálculos en alertas accionables. La optimización de la decisión no se mide por "
        "la desaparición del gerente, sino por el cambio en la calidad del insumo con el que "
        "decide: deja de partir de la observación del anaquel y parte de un error conocido "
        "(MAPE de 12.5 %) y de una lista de excepciones. Ese cambio de insumo es el que la "
        "hipótesis llama «optimizar la toma de decisiones comerciales»."
    )
    w.h2("Objetivo específico 1. Análisis de los procesos actuales")
    w.p(
        "Se cumplió mediante el modelo AS-IS, la identificación de usuarios, la matriz de "
        "causas y valores de la Tabla 1 y las reglas de negocio RN-01 a RN-06. El análisis "
        "aisló tres cuellos de botella: la notificación informal del faltante, la ausencia de "
        "traslados documentados y la compra empírica cuando el quiebre ya había ocurrido. "
        "Esos tres hallazgos son los que el modelo TO-BE y los módulos de kárdex, traslados y "
        "alertas de reorden atienden de forma explícita. Sin este diagnóstico, el software "
        "habría automatizado el mismo empirismo."
    )
    w.h2("Objetivo específico 2. Arquitectura de datos y modelo de aprendizaje supervisado")
    w.p(
        "Se cumplió en dos entregables. El primero es el esquema relacional de veintitrés "
        "tablas, con diccionario de datos conceptual y físico, que concentra en un solo "
        "repositorio lo que antes estaba fragmentado entre el POS y las libretas de bodega. "
        "El segundo es el modelo de Random Forest evaluado sobre una partición cronológica, "
        "con MAPE de 12.5 %, MAE de 4.20 unidades y RMSE de 5.85 unidades, inferior a la "
        "regresión lineal de referencia (MAPE 22.4 %). La arquitectura y el modelo no son "
        "piezas sueltas: el histórico que entrena el bosque aleatorio es el mismo que produce "
        "el módulo de facturación, y el Punto de Reorden que el modelo calcula se escribe en "
        "los umbrales que el tablero consulta."
    )
    w.h2("Objetivo específico 3. Tablero de alertas de baja rotación")
    w.p(
        "Se cumplió con las vistas de reabastecimiento y de perecederos del prototipo y con "
        "los endpoints /api/dashboard y /api/dashboard/alertas. El tablero no enumera los "
        "más de doscientos productos del catálogo: destaca los que están en o bajo el "
        "mínimo, los que alcanzaron el Punto de Reorden y los perecederos que superan el "
        "umbral de días sin venta. Esa es la interfaz que permite al Encargado de Bodega "
        "aplicar PEPS sobre pegamentos, témperas, marcadores y papelería sensible, que es "
        "exactamente el alcance declarado en el objetivo."
    )
    w.h2("Objetivo específico 4. Módulo de recomendaciones de compra")
    w.p(
        "Se cumplió con el cálculo de la cantidad sugerida —stock_maximo menos stock_actual— "
        "asociada al proveedor del artículo y presentada al Gerente General para su aprobación, "
        "ajuste o rechazo, conforme a la regla RN-03. La simulación sobre el conjunto de "
        "prueba mostró una reducción de 28.3 % en las inconsistencias de la proyección de "
        "pedidos respecto del método empírico, por encima de la meta de 25 %. El módulo no "
        "emite la orden por sí solo: produce el insumo cuantificado y deja la firma en el "
        "gerente, que es la transición segura que el proyecto se propuso desde el alcance."
    )
    w.h2("Objetivo específico 5. Evaluación del impacto sobre las mermas")
    w.p(
        "Este objetivo se cumplió solo en su parte de diseño de la evaluación, no en la "
        "medición del impacto real. La comparativa antes-después existe para el MAPE, para "
        "las inconsistencias de pedidos y para el ERI. No existe todavía para las mermas "
        "físicas ni para las ventas perdidas por quiebre, porque la plataforma se instaló a "
        "inicios de octubre de 2026 y, al cierre de este informe, acumula un mes de operación "
        "y un par de compras a proveedores. Un mes que no incluye la temporada escolar de "
        "enero no permite separar el efecto de la plataforma de la variación normal de la "
        "demanda. Por eso la quinta conclusión no afirma que las mermas ya bajaron: afirma "
        "que la plataforma creó las condiciones para bajarlas y que la confirmación exige un "
        "ciclo comercial completo. Declarar lo contrario habría sido inconsistente con los "
        "datos disponibles y habría debilitado, no reforzado, la hipótesis."
    )
    w.tabla(
        "Síntesis del cumplimiento de los objetivos de la investigación",
        ["Objetivo", "Evidencia principal", "Estado"],
        [
            ["General: plataforma de gestión inteligente",
             "Arquitectura de tres capas, instalación en octubre de 2026 y tablero en operación",
             "Cumplido"],
            ["OE1. Analizar procesos de inventario",
             "Modelo AS-IS, Tabla 1 y reglas RN-01 a RN-06",
             "Cumplido"],
            ["OE2. Diseñar datos y modelo supervisado",
             "Esquema de 23 tablas; Random Forest con MAPE 12.5 %",
             "Cumplido"],
            ["OE3. Tablero de baja rotación",
             "Alertas de perecederos y vistas de reabastecimiento",
             "Cumplido"],
            ["OE4. Recomendaciones de compra",
             "Cantidad sugerida + proveedor; reducción de 28.3 % en inconsistencias",
             "Cumplido"],
            ["OE5. Evaluar impacto en mermas",
             "Diseño de la comparativa y línea base del 10 %; medición real pendiente del ciclo escolar",
             "Parcial, en seguimiento"],
        ],
        nota="Elaboración propia.",
    )


def plan_confirmacion(w):
    w.h2("Plan de confirmación posterior a la defensa")
    w.p(
        "Aunque este informe se cierra en noviembre de 2026, la investigación deja planteado "
        "el procedimiento con el que la empresa —y, si el comité lo requiere, el autor— podrá "
        "confirmar o matizar la hipótesis cuando exista un ciclo comercial completo. El plan "
        "tiene cuatro hitos y no exige rehacer la plataforma, sino usar los instrumentos ya "
        "documentados en el Anexo D."
    )
    w.p(
        "El primer hito es el conteo físico de diciembre de 2026, con la misma ficha de la "
        "Tabla 40, para disponer de un ERI de cierre de año comparable al de la auditoría "
        "inicial. El segundo es el registro, durante enero y febrero de 2027, de las órdenes "
        "sugeridas por el sistema, de las cantidades que el gerente apruebe y de la demanda "
        "real de la temporada escolar; ese registro alimenta de nuevo la fórmula de reducción "
        "de inconsistencias. El tercer hito es el recálculo del MAPE sobre los meses de "
        "octubre de 2026 a febrero de 2027, que ya son datos de producción y no del conjunto "
        "de prueba histórico. El cuarto es la valoración de las mermas registradas en ajustes "
        "con motivo de deterioro, comparada con la pérdida estimada del 10 % de la línea base. "
        "Si los tres indicadores cuantitativos se mantienen en la dirección prevista y la "
        "pérdida por mermas baja al menos 25 % de aquel 10 %, la aceptación preliminar de la "
        "hipótesis podrá convertirse en aceptación plena. Si no, el modelo deberá reentrenarse "
        "o revisarse el umbral de días de baja rotación, que es precisamente lo que recomiendan "
        "las páginas siguientes."
    )
    w.p(
        "Este plan no es un anexo improvisado para alargar el documento: es la consecuencia "
        "lógica de haber instalado la plataforma a inicios de octubre y de haber encontrado, "
        "en producción, solo un par de compras. Omitirlo habría dejado la quinta conclusión "
        "como una reserva vaga. Incluirlo convierte esa reserva en un procedimiento "
        "replicable, con instrumentos, fechas y criterios de decisión."
    )
