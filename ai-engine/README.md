# Motor de IA (Python)

## Instalar

```bash
cd ai-engine
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

## Ejecutar

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

El backend Node.js proxyea hacia este servicio en `/api/ai/*`.
