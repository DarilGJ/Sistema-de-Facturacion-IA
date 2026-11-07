"""Pruebas del motor con series sintéticas. Sus métricas verifican el código, no la hipótesis de la tesis.

Ejecutar desde ai-engine:  python -m unittest discover tests
"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import predict_demand as motor  # noqa: E402

FACTOR_MES = {1: 3.0, 2: 2.0, 12: 1.6, 6: 1.3}


def ventas_sinteticas(productos=12, desde="2023-01", hasta="2025-12", semilla=7) -> pd.DataFrame:
    rng = np.random.default_rng(semilla)
    meses = pd.period_range(desde, hasta, freq="M")
    filas = []
    for i in range(productos):
        base = rng.uniform(20, 120)
        categoria = ["Cuadernos", "Escritura", "Arte"][i % 3]
        for m in meses:
            esperado = base * FACTOR_MES.get(m.month, 1.0)
            filas.append({"sku": f"SKU-{i:03d}", "categoria": categoria, "periodo": str(m),
                          "cantidad": float(rng.poisson(esperado))})
    return pd.DataFrame(filas)


class PruebasMotor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ventas = ventas_sinteticas()
        cls.paquete = motor.entrenar_y_evaluar(cls.ventas)

    def test_particion_cronologica_sin_traslape(self):
        reporte = self.paquete["reporte"]
        self.assertLess(reporte["entrenamiento"]["hasta"], reporte["prueba"]["desde"])

    def test_arranque_en_frio_descarta_los_primeros_doce_meses(self):
        datos = motor.generar_caracteristicas(motor.completar_series(self.ventas))
        self.assertEqual(str(datos["periodo"].min()), "2024-01")

    def test_metricas_y_contrastes(self):
        reporte = self.paquete["reporte"]
        for clave in ("mape", "mae", "rmse"):
            self.assertGreaterEqual(reporte["random_forest"][clave], 0)
        self.assertIn("t", reporte["contraste_a"])
        self.assertIn("reduccion", reporte["contraste_b"])

    def test_mape_ignora_demanda_cero(self):
        m = motor.metricas([0, 100, 50], [5, 90, 55])
        self.assertAlmostEqual(m["mape"], 10.0)
        self.assertEqual(m["n_mape"], 2)

    def test_punto_reorden(self):
        rop = motor.punto_reorden(demanda_mensual=300, desviacion_mensual=60, tiempo_entrega_dias=9)
        # d = 10/día, σd = 60/√30, SS = 1.65·σd·3 ≈ 54.2 → ROP = ⌈90 + 54.2⌉
        self.assertEqual(rop["punto_reorden"], 145)
        self.assertEqual(rop["stock_seguridad"], 55)

    def test_pronostico_y_revision_manual(self):
        historial = [{"periodo": r.periodo, "cantidad": r.cantidad}
                     for r in self.ventas[self.ventas.sku == "SKU-001"].itertuples()]
        res = motor.pronosticar(self.paquete, "SKU-001", "Escritura", historial, tiempo_entrega_dias=7)
        self.assertFalse(res["revision_manual"])
        self.assertEqual(res["periodo"], "2026-01")
        self.assertGreater(res["punto_reorden"], 0)
        corto = motor.pronosticar(self.paquete, "NUEVO", "Arte", historial[:5], tiempo_entrega_dias=7)
        self.assertTrue(corto["revision_manual"])


if __name__ == "__main__":
    unittest.main()
