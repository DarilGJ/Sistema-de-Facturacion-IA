# Motor predictivo (Python)

Pronóstico de demanda mensual por producto con Random Forest y cálculo del Punto de Reorden (ROP).

## Instalar

```bash
cd ai-engine
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

## Entrenar el modelo

Desde la base del sistema (lee la conexión de las variables `DB_*` o de `backend/.env`):

```bash
python entrenar_modelo.py --mysql --desde 2023-01-01 --hasta 2026-01-01
```

Desde un export del sistema anterior (columnas `sku`, `cantidad` y `periodo` AAAA-MM o `fecha`; `categoria` opcional):

```bash
python entrenar_modelo.py --csv historico_2023_2025.csv
```

El script agrega las ventas por mes, completa con cero los meses sin ventas, descarta los productos con menos de
12 meses de historial, divide los periodos en 80 % entrenamiento y 20 % prueba en orden cronológico, ajusta los
hiperparámetros con `TimeSeriesSplit` y reporta MAPE, MAE y RMSE del Random Forest frente a una regresión lineal,
la prueba t del MAPE contra 15 % y la prueba de Wilcoxon de la reducción de inconsistencias frente al método
empírico (reponer lo vendido el mes anterior). Guarda `modelos/modelo_rf_<año>T<trimestre>.joblib`,
`modelos/modelo_vigente.joblib` y un JSON con las métricas.

## Ejecutar

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

- `GET /health`
- `GET /modelo`: métricas del modelo vigente
- `POST /modelo/recargar`: recarga el modelo después de reentrenar
- `POST /pronostico`: `{ "sku", "categoria", "tiempo_entrega_dias", "historial": [{ "periodo", "cantidad" }] }`

El backend Node.js expone estas rutas en `/api/ai/*`.

## Pruebas

```bash
python -m unittest discover tests
```

Las pruebas usan series sintéticas; sus métricas verifican el código, no reflejan la demanda real.
