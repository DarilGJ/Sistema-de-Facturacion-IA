from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Motor IA - Sistema de Facturación",
    version="0.1.0",
    description="Stub del motor de IA. Aquí conectarás librerías como scikit-learn, pandas, etc.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    texto: str = Field(..., min_length=1, description="Entrada a analizar")


class PredictResponse(BaseModel):
    resultado: str
    confianza: float
    modelo: str


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-engine"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    """
    Reemplaza esta lógica por tu modelo real (sklearn, transformers, etc.).
    """
    texto = payload.texto.strip().lower()

    if "factura" in texto or "invoice" in texto:
        return PredictResponse(
            resultado="documento_factura",
            confianza=0.91,
            modelo="stub-rules-v1",
        )

    return PredictResponse(
        resultado="documento_general",
        confianza=0.62,
        modelo="stub-rules-v1",
    )
