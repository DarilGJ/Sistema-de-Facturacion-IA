import { Factura } from '../models/factura.model';
import { formatGtq, money, montoEnLetras, padDoc } from './money-letras';
import {
  EmisorDte,
  condicionLabel,
  metodoPagoLabel,
  tipoFacturaLabel,
} from './factura-print';

const LETTER_W = 612;
const LETTER_H = 792;

function winAnsi(text: string): string {
  const map: Record<string, number> = {
    Á: 0xc1,
    É: 0xc9,
    Í: 0xcd,
    Ó: 0xd3,
    Ú: 0xda,
    Ü: 0xdc,
    Ñ: 0xd1,
    á: 0xe1,
    é: 0xe9,
    í: 0xed,
    ó: 0xf3,
    ú: 0xfa,
    ü: 0xfc,
    ñ: 0xf1,
    '¿': 0xbf,
    '¡': 0xa1,
    '°': 0xb0,
    '–': 0x96,
    '—': 0x97,
  };
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (ch === '\\') {
      out += '\\\\';
    } else if (ch === '(') {
      out += '\\(';
    } else if (ch === ')') {
      out += '\\)';
    } else if (map[ch] != null) {
      out += `\\${map[ch].toString(8).padStart(3, '0')}`;
    } else if (code < 32 || code > 126) {
      out += ' ';
    } else {
      out += ch;
    }
  }
  return out;
}

function wrap(text: string, maxChars: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length ? lines : [''];
}

export function buildFacturaPdfBytes(factura: Factura, emisor: Partial<EmisorDte> = {}): Uint8Array {
  const e = {
    nombre: emisor.nombre || 'FacturaAI',
    razonSocial: emisor.razonSocial || 'FacturaAI',
    nit: emisor.nit || 'N/D',
    telefono: emisor.telefono || 'N/D',
    email: emisor.email || 'N/D',
    direccion: emisor.direccion || 'Guatemala',
  };
  const cliente = factura.cliente;
  const items = factura.items || [];
  const total = money(factura.total);
  const descuento = money(factura.descuento);
  const gravable = money(factura.subtotal);
  const iva = money(factura.itbis);
  const precio = money(gravable + iva + descuento);
  const numero = padDoc(factura.id);
  const aut = factura.autorizacion || `FAC-${factura.id}`;
  const serie = factura.serie || aut.replace(/-/g, '').slice(0, 8);
  const noSat = factura.numero_dte || String(factura.id).padStart(10, '0');
  const anulada = factura.estado === 'anulada';
  const fecha = fechaPdf(factura.fecha);
  const navy = '0.118 0.227 0.373';

  const ops: string[] = [];
  const text = (x: number, y: number, size: number, value: string, font = 'F1') => {
    ops.push(`BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${winAnsi(value)}) Tj ET`);
  };
  const textRight = (x: number, y: number, size: number, value: string, font = 'F1') => {
    const w = value.length * size * 0.48;
    text(x - w, y, size, value, font);
  };
  const rect = (x: number, y: number, w: number, h: number, fill: string) => {
    ops.push(`${fill} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 0 0 rg`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ops.push(`0.58 0.64 0.72 RG 0.6 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S 0 0 0 RG`);
  };

  rect(36, 708, 54, 54, '0.98 0.8 0.082');
  text(40, 728, 7, wrap(e.nombre, 12)[0], 'F2');

  text(360, 748, 9, 'DOCUMENTO TRIBUTARIO ELECTRONICO', 'F2');
  text(360, 732, 13, `${tipoFacturaLabel(factura.tipo_factura)} # ${numero}`, 'F2');
  text(360, 712, 9, `Serie  ${serie}`);
  text(360, 700, 9, `No  ${noSat}`);
  text(360, 688, 9, `Fecha de Emision  ${fecha}`);
  text(360, 676, 9, `Vendedor  ${factura.vendedor || 'N/D'}`);

  text(36, 688, 9, `Forma de Pago: ${condicionLabel(factura.condicion_venta)}`, 'F2');
  text(36, 676, 9, `Metodos de Pago: ${metodoPagoLabel(factura.metodo_pago)}: ${formatGtq(total)}`);
  text(36, 664, 9, `Moneda: ${factura.moneda || 'Quetzal'}`);

  line(36, 652, 576, 652);
  text(36, 638, 10, 'Emisor', 'F2');
  text(36, 624, 9, e.nombre);
  text(36, 612, 9, `Razon Social: ${e.razonSocial}`);
  text(36, 600, 9, `NIT: ${e.nit}`);
  text(36, 588, 9, `Tel: ${e.telefono}`);
  text(36, 576, 9, `Email: ${e.email}`);
  wrap(e.direccion, 46).forEach((ln, i) => text(36, 564 - i * 11, 9, ln));

  text(320, 638, 10, 'Receptor', 'F2');
  text(320, 624, 9, cliente?.nombre || 'CONSUMIDOR FINAL');
  text(320, 612, 9, `NIT: ${cliente?.nit || '0'}`);
  text(320, 600, 9, `Tel: ${cliente?.telefono || 'N/D'}`);
  text(320, 588, 9, `Email: ${cliente?.email || 'N/D'}`);
  wrap(cliente?.direccion || 'N/D', 42).forEach((ln, i) => text(320, 576 - i * 11, 9, ln));
  line(36, 530, 576, 530);

  let y = 512;
  rect(36, y, 540, 16, navy);
  ops.push('1 1 1 rg');
  text(40, y + 4, 8, '#', 'F2');
  text(58, y + 4, 8, 'Cod', 'F2');
  text(108, y + 4, 8, 'Cant', 'F2');
  text(150, y + 4, 8, 'Detalle', 'F2');
  text(400, y + 4, 8, 'B/S', 'F2');
  text(430, y + 4, 8, 'P.Unit', 'F2');
  text(500, y + 4, 8, 'Total', 'F2');
  ops.push('0 0 0 rg');
  y -= 16;

  items.forEach((linea, i) => {
    if (y < 220) {
      return;
    }
    const sku = linea.producto?.sku || '-';
    const bs = linea.producto?.tipo === 'servicio' ? 'S' : 'B';
    const detalle = wrap(linea.descripcion, 42);
    text(40, y, 8, String(i + 1));
    text(58, y, 8, sku);
    textRight(140, y, 8, String(linea.cantidad));
    text(150, y, 8, detalle[0]);
    text(404, y, 8, bs);
    textRight(478, y, 8, formatGtq(linea.precio_unitario));
    textRight(570, y, 8, formatGtq(linea.subtotal));
    y -= 13;
    detalle.slice(1).forEach((ln) => {
      text(150, y, 8, ln);
      y -= 11;
    });
  });

  y = Math.min(y, 250);
  rect(360, y, 216, 14, navy);
  ops.push('1 1 1 rg');
  text(368, y + 3, 8, 'Detalle de Venta', 'F2');
  ops.push('0 0 0 rg');
  const rows: Array<[string, string, boolean]> = [
    ['Precio', `Q ${formatGtq(precio)}`, false],
    ['Descuento', `Q ${formatGtq(descuento)}`, false],
    ['Monto Gravable', `Q ${formatGtq(gravable)}`, false],
    ['Monto IVA', `Q ${formatGtq(iva)}`, false],
    ['Total Venta', `Q ${formatGtq(total)}`, false],
    ['Total a Pagar', `Q ${formatGtq(total)}`, true],
  ];
  rows.forEach(([label, value, pay], i) => {
    const ry = y - 16 - i * 14;
    if (pay) {
      rect(360, ry - 3, 216, 14, navy);
      ops.push('1 1 1 rg');
    }
    text(368, ry, 9, label, pay ? 'F2' : 'F1');
    textRight(568, ry, 9, value, pay ? 'F2' : 'F1');
    ops.push('0 0 0 rg');
  });

  ops.push('0.58 0.64 0.72 RG 0.7 w 36 70 320 78 re S 0 0 0 RG');
  text(44, 132, 8, 'Detalles', 'F2');
  wrap(montoEnLetras(total), 48).forEach((ln, i) => text(44, 118 - i * 10, 8, ln));
  text(44, 88, 8, factura.notas || 'Frases SAT: Sujeto a pagos trimestrales ISR');

  text(370, 132, 8, 'Consulte en SAT', 'F2');
  drawQr(ops, 390, 78, aut);

  text(36, 56, 8, `Numero de Autorizacion: ${aut}`, 'F2');
  text(36, 44, 8, `Serie SAT: ${serie}    Fecha de Certificacion: ${fecha}`);
  text(36, 32, 8, 'Datos Certificador: FacturaAI');
  text(36, 18, 7, 'Representacion impresa de la Factura Electronica');
  textRight(576, 18, 7, 'Pagina 1 de 1');

  if (anulada) {
    ops.push('q 0.86 0.22 0.22 rg 0.28 0 rg');
    ops.push('1 0 0 1 306 420 cm 0.883 -0.469 0.469 0.883 0 0 cm');
    ops.push('BT /F2 46 Tf 1 0 0 1 -118 -12 Tm (ANULADA) Tj ET Q');
  }

  const stream = ops.join('\n');
  return assemblePdf(stream);
}

function fechaPdf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())} ${ampm}`;
}

function drawQr(ops: string[], x: number, y: number, seed: string): void {
  const cells = 21;
  const size = 72;
  const cell = size / cells;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  ops.push('0 0 0 rg');
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const finder = (col < 7 && row < 7) || (col >= cells - 7 && row < 7) || (col < 7 && row >= cells - 7);
      const border =
        finder &&
        (col === 0 ||
          row === 0 ||
          col === 6 ||
          row === 6 ||
          col === cells - 1 ||
          row === cells - 1 ||
          col === cells - 7 ||
          row === cells - 7);
      const core =
        (finder && col >= 2 && col <= 4 && row >= 2 && row <= 4) ||
        (finder && col >= cells - 5 && col <= cells - 3 && row >= 2 && row <= 4) ||
        (finder && col >= 2 && col <= 4 && row >= cells - 5 && row <= cells - 3);
      let on = finder ? border || core : false;
      if (!finder) {
        h = Math.imul(h ^ (col * 31 + row * 17), 16777619);
        on = (h >>> 0) % 3 !== 0;
      }
      if (on) {
        const px = x + col * cell;
        const py = y + (cells - 1 - row) * cell;
        ops.push(`${px.toFixed(2)} ${py.toFixed(2)} ${cell.toFixed(2)} ${cell.toFixed(2)} re f`);
      }
    }
  }
}

function assemblePdf(content: string): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LETTER_W} ${LETTER_H}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  offsets.slice(1).forEach((off) => {
    body += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) {
    bytes[i] = body.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: 'application/pdf' });
}

export function facturaPdfFilename(factura: Factura): string {
  return `Factura-${padDoc(factura.id)}.pdf`;
}

export function descargarFacturaPdf(factura: Factura, emisor: Partial<EmisorDte> = {}): void {
  const blob = pdfBlob(buildFacturaPdfBytes(factura, emisor));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = facturaPdfFilename(factura);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function abrirFacturaPdf(factura: Factura, emisor: Partial<EmisorDte> = {}): void {
  const blob = pdfBlob(buildFacturaPdfBytes(factura, emisor));
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
}
