import { env } from '../config/env.js';

/**
 * Certificación FEL únicamente contra la API del certificador.
 * No hay modo local ni UUID de respaldo: sin credenciales el documento
 * queda pendiente de autorización.
 */
export function felConfigurado() {
  return Boolean(env.fel.apiUrl && env.fel.token && env.fel.nitEmisor);
}

export function estadoFel() {
  if (!felConfigurado()) {
    return {
      modo: 'api',
      configurado: false,
      estado: 'pendiente_conexion',
      message:
        'Falta conectar la API del certificador. Define FEL_API_URL, FEL_API_TOKEN y FEL_NIT_EMISOR. El sistema no genera números de autorización locales.',
    };
  }
  return {
    modo: 'api',
    configurado: true,
    estado: 'listo',
    message: 'Las facturas se certifican solo contra la API configurada en FEL_API_URL.',
    nit_emisor: env.fel.nitEmisor,
    establecimiento: env.fel.establecimiento,
  };
}

function documentoFel(factura, cliente, items) {
  return {
    nit_emisor: env.fel.nitEmisor,
    nombre_emisor: env.fel.nombreEmisor,
    establecimiento: env.fel.establecimiento,
    tipo: 'FACT',
    numero_interno: factura.numero,
    fecha: factura.fecha,
    moneda: 'GTQ',
    receptor: {
      nit: cliente?.nit || 'CF',
      nombre: cliente?.nombre || cliente?.razon_social || 'Consumidor Final',
      direccion: cliente?.direccion || 'Guatemala',
    },
    items: (items || []).map((item) => ({
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    })),
    totales: {
      subtotal: Number(factura.subtotal),
      iva: Number(factura.itbis),
      total: Number(factura.total),
    },
  };
}

async function postFel(path, body) {
  const url = `${env.fel.apiUrl.replace(/\/$/, '')}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.fel.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const fallo = new Error(`No se pudo contactar la API FEL: ${error.message}`);
    fallo.status = 502;
    throw fallo;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallo = new Error(data.message || data.error || 'El certificador rechazó el documento');
    fallo.status = 502;
    throw fallo;
  }
  return data;
}

export async function aplicarCertificacion(factura) {
  if (!felConfigurado()) {
    return estadoFel();
  }

  const cliente = factura.cliente || (await factura.getCliente());
  const items = factura.items || (await factura.getItems());
  try {
    const data = await postFel('/dte', documentoFel(factura, cliente, items));
    const autorizacion = String(data.autorizacion || data.uuid || '').trim();
    if (!autorizacion) {
      const fallo = new Error('La API FEL no devolvió número de autorización');
      fallo.status = 502;
      throw fallo;
    }
    await factura.update({
      autorizacion,
      serie: data.serie ? String(data.serie).trim() : factura.serie,
      numero_dte: data.numero_dte ? String(data.numero_dte).trim() : factura.numero_dte,
      tributacion: 'aceptadas',
    });
    return { modo: 'api', configurado: true, estado: 'aceptadas', autorizacion };
  } catch (error) {
    await factura.update({ tributacion: 'rechazadas' });
    return {
      modo: 'api',
      configurado: true,
      estado: 'rechazadas',
      message: error.message,
    };
  }
}

export async function anularEnFel(factura, motivo) {
  if (!factura.autorizacion) {
    return { estado: 'sin_autorizacion' };
  }
  if (!felConfigurado()) {
    const error = new Error(
      'Esta factura tiene autorización FEL, pero la API del certificador no está configurada para anularla'
    );
    error.status = 409;
    throw error;
  }
  await postFel('/dte/anular', {
    nit_emisor: env.fel.nitEmisor,
    autorizacion: factura.autorizacion,
    motivo: motivo || 'Anulación solicitada por el emisor',
  });
  return { estado: 'anulada' };
}
