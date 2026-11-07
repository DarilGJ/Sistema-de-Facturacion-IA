"""Casos de prueba de caja negra contra la API de FacturaAI.

Uso: python docs/calidad/pruebas_api.py [URL_API]

Requiere el backend levantado. Crea clientes, productos, facturas y un usuario
vendedor de prueba por la API. El resultado queda en docs/calidad/resultados_pruebas.json.
"""

import json
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

import re
import requests

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000/api"
ADMIN = {"email": "admin@demo.com", "password": "Admin123!"}
VENDEDOR = {"email": "vendedor.qa@demo.com", "password": "Admin123!"}
SUFIJO = uuid.uuid4().hex[:6]
SALIDA = Path(__file__).with_name("resultados_pruebas.json")

resultados = []


def registrar(cp, funcion, tecnica, cuadrante, entrada, esperado, obtenido, ok):
    resultados.append({
        "id": cp, "funcion": funcion, "tecnica": tecnica, "cuadrante": cuadrante,
        "entrada": entrada, "esperado": esperado, "obtenido": obtenido,
        "resultado": "PASA" if ok else "FALLA",
    })
    print(f"{cp:6} {'PASA ' if ok else 'FALLA'} {funcion}: {obtenido}")


def h(token):
    return {"Authorization": f"Bearer {token}"}


def login(cred):
    r = requests.post(f"{API}/auth/login", json=cred, timeout=15)
    return r, (r.json().get("token") if r.ok else None)


def crear_vendedor(tk):
    r = requests.post(
        f"{API}/auth/usuarios",
        json={"nombre": "Vendedor QA", "email": VENDEDOR["email"], "password": VENDEDOR["password"], "rol": "vendedor"},
        headers=h(tk),
        timeout=15,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"No se pudo crear el vendedor: {r.status_code} {r.text[:200]}")


def nit_gt(verificador="1"):
    base = f"{int(SUFIJO, 16) % 10_000_000:07d}"
    return f"{base}-{verificador}"


def crear_cliente(tk, nit, nombre=None):
    body = {"tipo_identificacion": "nit", "nombre": nombre or f"Cliente QA {SUFIJO}", "nit": nit,
            "direccion": "Salamá, Baja Verapaz"}
    return requests.post(f"{API}/clientes", json=body, headers=h(tk), timeout=15)


def crear_producto(tk, stock, precio=100, tipo="producto"):
    body = {"sku": f"QA-{uuid.uuid4().hex[:8]}", "nombre": f"Producto QA {uuid.uuid4().hex[:4]}",
            "tipo": tipo, "precio_venta": precio, "costo_compra": 60, "stock_actual": stock,
            "impuesto_porcentaje": 12, "categoria": "Útiles escolares"}
    r = requests.post(f"{API}/productos", json=body, headers=h(tk), timeout=15)
    r.raise_for_status()
    return r.json()


def stock(tk, id_producto):
    return requests.get(f"{API}/productos/{id_producto}", headers=h(tk), timeout=15).json()["stock_actual"]


def facturar(tk, id_cliente, items, **extra):
    body = {"id_cliente": id_cliente, "metodo_pago": "efectivo", "condicion_venta": "contado",
            "tipo_factura": "factura", "items": items, **extra}
    return requests.post(f"{API}/facturas", json=body, headers=h(tk), timeout=90)


def config_inventario(tk, bloquear):
    return requests.put(f"{API}/inventario/config", json={"bloquear_ventas_sin_stock": bloquear},
                        headers=h(tk), timeout=15)


def pruebas_autenticacion():
    f = "Inicio de sesión"
    r, tk = login(ADMIN)
    registrar("CP-01", f, "Clases de equivalencia (válida)", "Q2", "Credenciales correctas",
              "200 y token JWT", f"{r.status_code}, token={'sí' if tk else 'no'}", r.status_code == 200 and tk)
    r, _ = login({"email": ADMIN["email"], "password": "Incorrecta1!"})
    registrar("CP-02", f, "Clases de equivalencia (inválida)", "Q2", "Contraseña incorrecta",
              "401", str(r.status_code), r.status_code == 401)
    r, _ = login({"email": "noexiste@demo.com", "password": "Admin123!"})
    registrar("CP-03", f, "Clases de equivalencia (inválida)", "Q2", "Correo no registrado",
              "401", str(r.status_code), r.status_code == 401)
    r, _ = login({"email": "", "password": ""})
    registrar("CP-04", f, "Valores frontera (cadena vacía)", "Q2", "Correo y contraseña vacíos",
              "400", str(r.status_code), r.status_code == 400)
    r = requests.post(f"{API}/auth/login", data="{email:", headers={"Content-Type": "application/json"}, timeout=15)
    registrar("CP-05", f, "Clases de equivalencia (formato inválido)", "Q4", "JSON mal formado",
              "400 (error del cliente)", str(r.status_code), r.status_code == 400)
    codigos = []
    for _ in range(20):
        r, _ = login({"email": ADMIN["email"], "password": "Fuerza1!"})
        codigos.append(r.status_code)
    bloqueado = 429 in codigos or 423 in codigos
    registrar("CP-06", f, "Riesgo (fuerza bruta)", "Q4", "20 intentos fallidos seguidos",
              "Bloqueo o 429 antes del intento 20", f"códigos={sorted(set(codigos))}, sin bloqueo" if not bloqueado
              else f"códigos={sorted(set(codigos))}", bloqueado)
    r = requests.get(f"{API}/clientes", timeout=15)
    registrar("CP-07", "Control de acceso", "Clases de equivalencia (sin token)", "Q4", "GET /clientes sin token",
              "401", str(r.status_code), r.status_code == 401)
    r = requests.get(f"{API}/clientes", headers=h(tk + "x"), timeout=15)
    registrar("CP-08", "Control de acceso", "Clases de equivalencia (token alterado)", "Q4", "Token con firma alterada",
              "401", str(r.status_code), r.status_code == 401)
    return tk


def pruebas_clientes(tk):
    f = "Registro de cliente (NIT)"
    r = crear_cliente(tk, nit_gt("3"))
    registrar("CP-09", f, "Clases de equivalencia (válida)", "Q2", "NIT con formato válido",
              "201", str(r.status_code), r.status_code == 201)
    cliente = r.json()
    r = crear_cliente(tk, f"ABC-{SUFIJO}", nombre=f"Cliente NIT inválido {SUFIJO}")
    registrar("CP-10", f, "Clases de equivalencia (inválida)", "Q2", "NIT con letras 'ABC-…'",
              "400 (NIT inválido)", str(r.status_code), r.status_code == 400)
    r = crear_cliente(tk, "", nombre=f"Cliente sin NIT {SUFIJO}")
    registrar("CP-11", f, "Valores frontera (cadena vacía)", "Q2", "NIT vacío",
              "400", str(r.status_code), r.status_code == 400)
    return cliente["id"]


def pruebas_cantidades(tk, id_cliente):
    f = "Emisión de factura (cantidad)"
    config_inventario(tk, True)
    p = crear_producto(tk, stock=10)
    casos = [("CP-12", 0, 400), ("CP-13", -1, 400), ("CP-14", 1, 201), ("CP-15", 9, 201), ("CP-16", 1, 400),
             ("CP-17", 2.5, 400)]
    descripcion = {"CP-12": "cantidad = 0 (frontera inferior inválida)", "CP-13": "cantidad = -1",
                   "CP-14": "cantidad = 1 (frontera inferior válida)", "CP-15": "cantidad = 9 = stock restante",
                   "CP-16": "cantidad = 1 con stock 0 (stock + 1)", "CP-17": "cantidad = 2.5 (no entera)"}
    for cp, cantidad, esperado in casos:
        r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": cantidad}])
        registrar(cp, f, "Valores frontera", "Q2", descripcion[cp], str(esperado),
                  f"{r.status_code}; stock={stock(tk, p['id'])}", r.status_code == esperado)
    r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 10 ** 12}])
    registrar("CP-18", f, "Valores frontera (desbordamiento)", "Q4", "cantidad = 10^12",
              "400", str(r.status_code), r.status_code == 400)


def pruebas_impuesto_precio(tk, id_cliente):
    f = "Emisión de factura (impuesto y precio)"
    p = crear_producto(tk, stock=50, precio=100)
    r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 1}])
    fac = r.json()
    imp, total = float(fac.get("itbis", 0)), float(fac.get("total", 0))
    registrar("CP-19", f, "Clases de equivalencia (cálculo)", "Q2", "1 unidad a Q100.00",
              "IVA 12 %: impuesto Q12.00, total Q112.00", f"impuesto Q{imp:.2f}, total Q{total:.2f} "
              f"(campo '{'itbis' if 'itbis' in fac else '?'}')", abs(imp - 12) < 0.01)
    autorizacion = str(fac.get("autorizacion") or "")
    local = bool(re.fullmatch(
        r"[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}",
        autorizacion,
    ))
    tributacion = fac.get("tributacion")
    pendiente = not autorizacion and tributacion in ("no_entregado", "desconocido")
    certificada = bool(autorizacion) and not local and tributacion == "aceptadas"
    registrar("CP-20", "Certificación FEL", "Riesgo (cumplimiento SAT)", "Q2",
              "Factura emitida",
              "Sin UUID local: pendiente de la API FEL o autorización del certificador",
              f"autorizacion={autorizacion or 'vacía'}, tributacion={tributacion}",
              (not local) and (pendiente or certificada))
    r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 1, "precio_unitario": 0}])
    registrar("CP-21", f, "Valores frontera (precio = 0)", "Q4", "precio_unitario = 0 enviado por el cliente",
              "400 o precio del catálogo (Q100)", f"{r.status_code}, total Q{float(r.json().get('total', 0)):.2f}"
              if r.ok else str(r.status_code), not r.ok or float(r.json().get("total", 0)) > 0)
    return p


def pruebas_tabla_decision(tk, id_cliente):
    f = "Control de stock al facturar"
    reglas = [("CP-22", True, "producto", True, 201), ("CP-23", True, "producto", False, 400),
              ("CP-24", False, "producto", False, 201), ("CP-25", True, "servicio", False, 201)]
    for cp, bloquear, tipo, suficiente, esperado in reglas:
        config_inventario(tk, bloquear)
        p = crear_producto(tk, stock=5 if suficiente else 2, tipo=tipo)
        r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 3}])
        st = stock(tk, p["id"])
        regla = f"bloquear={bloquear}, tipo={tipo}, stock {'suficiente' if suficiente else 'insuficiente'}"
        ok = r.status_code == esperado
        obtenido = f"{r.status_code}; stock final={st}"
        if cp == "CP-24":
            ok = ok and st >= 0
            esperado_txt = "201 pero sin stock negativo (venta bajo pedido registrada)"
        else:
            esperado_txt = str(esperado)
        registrar(cp, f, "Tabla de decisión", "Q2", regla, esperado_txt, obtenido, ok)
    config_inventario(tk, True)
    p = crear_producto(tk, stock=6)
    r = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 5}, {"id_producto": p["id"], "cantidad": 5}])
    st = stock(tk, p["id"])
    registrar("CP-26", f, "Riesgo (líneas duplicadas)", "Q4", "Stock 6; dos líneas del mismo producto de 5",
              "400 (se piden 10 > 6)", f"{r.status_code}; stock final={st}", r.status_code == 400 and st >= 0)


def pruebas_transiciones(tk, id_cliente):
    f = "Ciclo de vida de la factura"
    p = crear_producto(tk, stock=10)
    fac = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 4}]).json()
    antes = stock(tk, p["id"])
    r = requests.patch(f"{API}/facturas/{fac['id']}", json={"estado": "anulada"}, headers=h(tk), timeout=15)
    despues = stock(tk, p["id"])
    registrar("CP-27", f, "Transición de estados (emitida → anulada)", "Q2", "Anular factura de 4 unidades",
              "200 y stock restituido (+4)", f"{r.status_code}; stock {antes} → {despues}",
              r.status_code == 200 and despues == antes + 4)
    r = requests.patch(f"{API}/facturas/{fac['id']}", json={"estado": "anulada"}, headers=h(tk), timeout=15)
    registrar("CP-28", f, "Transición de estados (anulada → anulada)", "Q2", "Anular por segunda vez",
              "400", str(r.status_code), r.status_code == 400)
    fac2 = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 1}]).json()
    r = requests.patch(f"{API}/facturas/{fac2['id']}", json={"tributacion": "aceptadas"}, headers=h(tk), timeout=15)
    registrar("CP-29", f, "Transición de estados (desconocido → aceptadas)", "Q4",
              "PATCH tributacion='aceptadas' desde el cliente", "403/400: solo el certificador cambia ese estado",
              f"{r.status_code}; tributacion={r.json().get('tributacion') if r.ok else '-'}", not r.ok)

    f = "Conversión de cotización"
    cot = requests.post(f"{API}/cotizaciones", json={"id_cliente": id_cliente, "metodo_pago": "efectivo",
                                                     "items": [{"id_producto": p["id"], "cantidad": 1}]},
                        headers=h(tk), timeout=15).json()
    r1 = requests.post(f"{API}/cotizaciones/{cot['id']}/facturar", json={}, headers=h(tk), timeout=30)
    requests.patch(f"{API}/cotizaciones/{cot['id']}", json={"generada": False, "estado": "pendiente"},
                   headers=h(tk), timeout=15)
    r2 = requests.post(f"{API}/cotizaciones/{cot['id']}/facturar", json={}, headers=h(tk), timeout=30)
    registrar("CP-30", f, "Transición de estados (facturada → pendiente → facturada)", "Q2",
              "Reabrir una cotización ya facturada y facturarla otra vez",
              "La segunda conversión se rechaza (400)", f"1.ª={r1.status_code}, 2.ª={r2.status_code}",
              r2.status_code == 400)


def pruebas_roles(tk_admin, id_cliente):
    f = "Autorización por rol"
    crear_vendedor(tk_admin)
    _, tk = login(VENDEDOR)
    p = crear_producto(tk_admin, stock=10)
    fac = facturar(tk_admin, id_cliente, [{"id_producto": p["id"], "cantidad": 1}]).json()
    r = requests.patch(f"{API}/facturas/{fac['id']}", json={"estado": "anulada"}, headers=h(tk), timeout=15)
    registrar("CP-31", f, "Tabla de decisión (rol × operación)", "Q4", "Rol vendedor anula una factura",
              "403", str(r.status_code), r.status_code == 403)
    r = config_inventario(tk, False)
    registrar("CP-32", f, "Tabla de decisión (rol × operación)", "Q4",
              "Rol vendedor desactiva 'bloquear ventas sin stock'", "403", str(r.status_code), r.status_code == 403)
    config_inventario(tk_admin, True)


def pruebas_compras(tk):
    f = "Registro de compra"
    prov = requests.post(f"{API}/proveedores", json={"nombre": f"Proveedor QA {SUFIJO}", "nit": nit_gt("6")},
                         headers=h(tk), timeout=15)
    if not prov.ok:
        registrar("CP-33", f, "Valores frontera (precio negativo)", "Q2", "No se pudo crear proveedor",
                  "-", f"{prov.status_code} {prov.text[:80]}", False)
        return
    p = crear_producto(tk, stock=0)
    r = requests.post(f"{API}/compras", json={"id_proveedor": prov.json()["id"],
                                              "items": [{"id_producto": p["id"], "cantidad": 2,
                                                         "precio_unitario": -50}]},
                      headers=h(tk), timeout=30)
    total = r.json().get("total") if r.ok else None
    registrar("CP-33", f, "Valores frontera (precio negativo)", "Q2", "precio_unitario = -50",
              "400", f"{r.status_code}; total={total}", r.status_code == 400)


def pruebas_rendimiento(tk, id_cliente):
    tiempos = []
    for _ in range(30):
        t0 = time.perf_counter()
        requests.get(f"{API}/productos", headers=h(tk), timeout=30)
        tiempos.append((time.perf_counter() - t0) * 1000)
    tiempos.sort()
    p95 = tiempos[int(len(tiempos) * 0.95) - 1]
    registrar("CP-34", "Tiempo de respuesta", "Riesgo (rendimiento)", "Q4", "30 GET /productos secuenciales",
              "p95 < 500 ms", f"mediana {tiempos[len(tiempos) // 2]:.0f} ms, p95 {p95:.0f} ms", p95 < 500)

    p = crear_producto(tk, stock=100)

    def una(_):
        t0 = time.perf_counter()
        try:
            codigo = facturar(tk, id_cliente, [{"id_producto": p["id"], "cantidad": 1}]).status_code
        except requests.exceptions.Timeout:
            codigo = "timeout"
        return codigo, time.perf_counter() - t0

    with ThreadPoolExecutor(max_workers=10) as ex:
        respuestas = list(ex.map(una, range(10)))
    codigos = [c for c, _ in respuestas]
    lento = max(s for _, s in respuestas)
    numeros = [f["numero"] for f in requests.get(f"{API}/facturas", headers=h(tk), timeout=120).json()]
    duplicados = len(numeros) - len(set(numeros))
    st = stock(tk, p["id"])
    exitos = codigos.count(201)
    otros = sorted({str(c) for c in codigos if c != 201})
    registrar("CP-35", "Facturación concurrente", "Riesgo (concurrencia)", "Q4", "10 facturas simultáneas de 1 unidad",
              "10 × 201 en < 5 s, números únicos, stock 100 → 90",
              f"201={exitos}/10, otros={otros}, respuesta más lenta {lento:.1f} s, duplicados={duplicados}, stock={st}",
              exitos == 10 and duplicados == 0 and st == 90 and lento < 5)


def main():
    inicio = datetime.now()
    tk = pruebas_autenticacion()
    id_cliente = pruebas_clientes(tk)
    pruebas_cantidades(tk, id_cliente)
    pruebas_impuesto_precio(tk, id_cliente)
    pruebas_tabla_decision(tk, id_cliente)
    pruebas_transiciones(tk, id_cliente)
    pruebas_roles(tk, id_cliente)
    pruebas_compras(tk)
    pruebas_rendimiento(tk, id_cliente)
    resumen = {"ejecutado": inicio.isoformat(timespec="seconds"), "api": API,
               "total": len(resultados), "pasan": sum(r["resultado"] == "PASA" for r in resultados),
               "casos": resultados}
    SALIDA.write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf8")
    print(f"\n{resumen['pasan']}/{resumen['total']} casos pasan. Resultado en {SALIDA}")


if __name__ == "__main__":
    main()
