import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import predict_demand as motor

RUTA_MODELO = Path(os.environ.get(
    "MODELO_RUTA", Path(__file__).resolve().parent / "modelos" / "modelo_vigente.joblib"))

app = FastAPI(
    title="Motor predictivo - Librerías El Regalito",
    version="1.0.0",
    description="Pronóstico de demanda con Random Forest y cálculo del Punto de Reorden.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_paquete: dict | None = None


def paquete_vigente() -> dict:
    global _paquete
    if _paquete is None:
        if not RUTA_MODELO.exists():
            raise HTTPException(503, "No hay un modelo entrenado. Ejecute entrenar_modelo.py.")
        _paquete = motor.cargar_modelo(RUTA_MODELO)
    return _paquete


class Venta(BaseModel):
    periodo: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Mes en formato AAAA-MM")
    cantidad: float = Field(..., ge=0)


class PronosticoRequest(BaseModel):
    sku: str
    categoria: str = "Sin categoría"
    tiempo_entrega_dias: float = Field(..., gt=0)
    z: float = Field(motor.Z_NIVEL_SERVICIO, gt=0, description="Valor z del nivel de servicio")
    historial: list[Venta]


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-engine", "modelo_cargado": RUTA_MODELO.exists()}


@app.get("/modelo")
def modelo():
    return paquete_vigente()["reporte"]


@app.post("/modelo/recargar")
def recargar():
    global _paquete
    _paquete = None
    return paquete_vigente()["reporte"]


@app.post("/pronostico")
def pronostico(payload: PronosticoRequest):
    historial = [v.model_dump() for v in payload.historial]
    return motor.pronosticar(paquete_vigente(), payload.sku, payload.categoria, historial,
                             payload.tiempo_entrega_dias, payload.z)
