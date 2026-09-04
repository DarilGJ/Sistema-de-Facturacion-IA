import { Factura } from '../models/factura.model';
import { formatGtq, money, montoEnLetras, padDoc } from './money-letras';

export interface EmisorDte {
  nombre: string;
  razonSocial: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
}

const EMISOR_DEFAULT: EmisorDte = {
  nombre: 'FacturaAI',
  razonSocial: 'FacturaAI',
  nit: 'N/D',
  telefono: 'N/D',
  email: 'N/D',
  direccion: 'Guatemala',
};

export function tipoFacturaLabel(tipo?: string): string {
  if (tipo === 'factura_especial') {
    return 'Factura Especial';
  }
  if (tipo === 'factura_cambiaria') {
    return 'Factura Cambiaria';
  }
  if (tipo === 'recibo') {
    return 'Recibo';
  }
  return 'Factura Electrónica';
}

export function metodoPagoLabel(metodo?: string): string {
  if (metodo === 'tarjeta') {
    return 'Tarjeta';
  }
  if (metodo === 'transferencia') {
    return 'Transferencia';
  }
  return 'Efectivo';
}

export function condicionLabel(condicion?: string): string {
  return condicion === 'credito' ? 'Crédito' : 'Contado';
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fechaLarga(iso: string): string {
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

function qrSvg(seed: string): string {
  const cells = 21;
  const size = 132;
  const cell = size / cells;
  let rects = '';
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const finder =
        (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
      const onFinderBorder =
        finder && (x === 0 || y === 0 || x === 6 || y === 6 || x === cells - 1 || y === cells - 1 || x === cells - 7 || y === cells - 7);
      const onFinderCore =
        finder && x >= 2 && x <= 4 && y >= 2 && y <= 4
          ? true
          : finder && x >= cells - 5 && x <= cells - 3 && y >= 2 && y <= 4
            ? true
            : finder && x >= 2 && x <= 4 && y >= cells - 5 && y <= cells - 3;
      let on = false;
      if (finder) {
        on = onFinderBorder || onFinderCore;
      } else {
        h = Math.imul(h ^ (x * 31 + y * 17), 16777619);
        on = (h >>> 0) % 3 !== 0;
      }
      if (on) {
        rects += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell + 0.2}" height="${cell + 0.2}" fill="#0f172a"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${rects}</svg>`;
}

const DTE_CSS = `
  @page { size: letter; margin: 0; }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    min-height: 100%;
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
    background: #5c6570;
  }
  .stage {
    padding: 28px 20px 40px;
    display: flex;
    justify-content: center;
  }
  .dte {
    position: relative;
    width: 8.5in;
    min-height: 11in;
    padding: 0.48in 0.52in 0.4in;
    margin: 0;
    background: #fff;
    box-shadow: 0 10px 32px rgba(15, 23, 42, 0.28);
    overflow: hidden;
  }
  .watermark {
    position: absolute;
    inset: 18%;
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 8;
    font-size: 92px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: rgba(220, 38, 38, 0.28);
    transform: rotate(-28deg);
    text-transform: uppercase;
    user-select: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .dte-top { display: grid; grid-template-columns: 1.05fr 1.35fr; gap: 1.1rem; align-items: start; }
  .logo { width: 92px; height: 92px; background: #facc15; color: #b91c1c; display: grid; place-items: center; text-align: center; font-weight: 800; font-size: 11px; line-height: 1.15; border: 1px solid #eab308; }
  .meta-pay { margin-top: 12px; font-size: 12px; line-height: 1.5; }
  .meta-pay strong { display: inline-block; min-width: 128px; color: #334155; font-weight: 700; }
  .head-right { text-align: right; }
  .head-right h1 { margin: 0; font-size: 13px; letter-spacing: 0.06em; color: #64748b; font-weight: 700; }
  .head-right h2 { margin: 6px 0 12px; font-size: 18px; font-weight: 800; color: #0f172a; }
  .head-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 18px; font-size: 11.5px; text-align: left; margin-left: auto; max-width: 380px; }
  .head-grid span { color: #64748b; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; border-top: 1px solid #94a3b8; border-bottom: 1px solid #94a3b8; padding: 12px 0; margin: 14px 0; font-size: 11.5px; line-height: 1.45; }
  .parties h3 { margin: 0 0 6px; font-size: 12px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.04em; }
  .ref-box { margin: 0 0 12px; font-size: 11.5px; color: #7f1d1d; }
  table.items { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  table.items th { background: #1e3a5f; color: #fff; padding: 8px 7px; font-weight: 700; text-align: left; }
  table.items td { padding: 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  table.items td:nth-child(4) { white-space: normal; word-break: break-word; }
  .num { text-align: right; white-space: nowrap; }
  .totales { width: 280px; margin-left: auto; margin-top: 14px; border-collapse: collapse; font-size: 12px; }
  .totales th { background: #1e3a5f; color: #fff; text-align: left; padding: 7px 9px; }
  .totales td { padding: 6px 9px; border: 1px solid #e2e8f0; }
  .totales tr.pay td { background: #1e3a5f; color: #fff; font-weight: 700; font-size: 13px; }
  .legal { display: grid; grid-template-columns: 1fr 148px; gap: 14px; align-items: center; border: 1px solid #94a3b8; padding: 12px; margin-top: 16px; font-size: 11px; }
  .qr { width: 132px; height: 132px; }
  .cert { margin-top: 14px; font-size: 10.5px; line-height: 1.5; color: #334155; }
  .foot { margin-top: 12px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
  @media print {
    html, body { background: #fff; }
    .stage { padding: 0; }
    .dte { box-shadow: none; width: 8.5in; min-height: 11in; }
  }
`;

export function buildFacturaDteHtml(factura: Factura, emisor: Partial<EmisorDte> = {}): string {
  const e = { ...EMISOR_DEFAULT, ...emisor };
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
  const rows = items
    .map((linea, i) => {
      const sku = linea.producto?.sku || '—';
      const bs = linea.producto?.tipo === 'servicio' ? 'S' : 'B';
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(sku)}</td>
        <td class="num">${esc(linea.cantidad)}</td>
        <td>${esc(linea.descripcion)}</td>
        <td>${bs}</td>
        <td class="num">${formatGtq(linea.precio_unitario)}</td>
        <td class="num">${formatGtq(linea.subtotal)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${esc(tipoFacturaLabel(factura.tipo_factura))} # ${numero}</title>
  <style>${DTE_CSS}</style>
</head>
<body>
  <div class="stage">
  <article class="dte">
    ${anulada ? '<div class="watermark">ANULADA</div>' : ''}
    <div class="dte-top">
      <div>
        <div class="logo">${esc(e.nombre)}</div>
        <div class="meta-pay">
          <div><strong>Forma de Pago:</strong> ${esc(condicionLabel(factura.condicion_venta))}</div>
          <div><strong>Métodos de Pago:</strong> ${esc(metodoPagoLabel(factura.metodo_pago))}: ${formatGtq(total)}</div>
          <div><strong>Moneda:</strong> ${esc(factura.moneda || 'Quetzal')}</div>
        </div>
      </div>
      <div class="head-right">
        <h1>DOCUMENTO TRIBUTARIO ELECTRÓNICO</h1>
        <h2>${esc(tipoFacturaLabel(factura.tipo_factura))} # ${numero}</h2>
        <div class="head-grid">
          <span>Serie</span><strong>${esc(serie)}</strong>
          <span>No</span><strong>${esc(noSat)}</strong>
          <span>Fecha de Emisión</span><strong>${esc(fechaLarga(factura.fecha))}</strong>
          <span>Vendedor</span><strong>${esc(factura.vendedor || 'N/D')}</strong>
        </div>
      </div>
    </div>
    <div class="parties">
      <div>
        <h3>Emisor</h3>
        <div>${esc(e.nombre)}</div>
        <div>Razón Social: ${esc(e.razonSocial)}</div>
        <div>NIT: ${esc(e.nit)}</div>
        <div>Tel: ${esc(e.telefono)}</div>
        <div>Email: ${esc(e.email)}</div>
        <div>${esc(e.direccion)}</div>
        <div>Establecimiento: 1</div>
      </div>
      <div>
        <h3>Receptor</h3>
        <div>${esc(cliente?.nombre || 'CONSUMIDOR FINAL')}</div>
        <div>NIT: ${esc(cliente?.nit || '0')}</div>
        <div>Tel: ${esc(cliente?.telefono || 'N/D')}</div>
        <div>Email: ${esc(cliente?.email || 'N/D')}</div>
        <div>${esc(cliente?.direccion || 'N/D')}</div>
      </div>
    </div>
    ${
      anulada
        ? `<div class="ref-box"><strong>Tipo Referencia:</strong> Nota de Anulación</div>`
        : ''
    }
    <table class="items">
      <thead>
        <tr>
          <th>#</th><th>Cód</th><th>Cant</th><th>Detalle</th><th>B/S</th><th>P.Unit</th><th>Total</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7">Sin líneas</td></tr>`}</tbody>
    </table>
    <table class="totales">
      <thead><tr><th colspan="2">Detalle de Venta</th></tr></thead>
      <tbody>
        <tr><td>Precio</td><td class="num">Q ${formatGtq(precio)}</td></tr>
        <tr><td>Descuento</td><td class="num">Q ${formatGtq(descuento)}</td></tr>
        <tr><td>Monto Gravable</td><td class="num">Q ${formatGtq(gravable)}</td></tr>
        <tr><td>Monto IVA</td><td class="num">Q ${formatGtq(iva)}</td></tr>
        <tr><td>Total Venta</td><td class="num">Q ${formatGtq(total)}</td></tr>
        <tr class="pay"><td>Total a Pagar</td><td class="num">Q ${formatGtq(total)}</td></tr>
      </tbody>
    </table>
    <div class="legal">
      <div>
        <div><strong>Detalles</strong></div>
        <div>${esc(montoEnLetras(total))}</div>
        <div>Sujeto a pagos trimestrales ISR</div>
        <div>${esc(factura.notas || 'Frases SAT')}</div>
      </div>
      <div class="qr">${qrSvg(aut)}</div>
    </div>
    <div class="cert">
      <div><strong>Número de Autorización:</strong> ${esc(aut)}</div>
      <div><strong>Serie SAT:</strong> ${esc(serie)} &nbsp; <strong>Fecha de Certificación:</strong> ${esc(fechaLarga(factura.fecha))}</div>
      <div><strong>Datos Certificador:</strong> FacturaAI</div>
    </div>
    <div class="foot">
      <span>Representación impresa de la Factura Electrónica</span>
      <span>Página 1 de 1</span>
    </div>
  </article>
  </div>
</body>
</html>`;
}

export function ivaPorcentaje(factura: Factura): number {
  const gravable = money(factura.subtotal);
  const iva = money(factura.itbis);
  if (!gravable) {
    return 12;
  }
  return Math.max(0, Math.round((iva / gravable) * 100));
}

export function buildFacturaPosHtml(factura: Factura, emisor: Partial<EmisorDte> = {}): string {
  const e = { ...EMISOR_DEFAULT, ...emisor };
  const cliente = factura.cliente;
  const total = money(factura.total);
  const descuento = money(factura.descuento);
  const gravable = money(factura.subtotal);
  const iva = money(factura.itbis);
  const precio = money(gravable + iva + descuento);
  const pct = ivaPorcentaje(factura);
  const numero = padDoc(factura.id);
  const aut = factura.autorizacion || `FAC-${factura.id}`;
  const serie = factura.serie || aut.replace(/-/g, '').slice(0, 8);
  const noSat = factura.numero_dte || String(factura.id).padStart(10, '0');
  const anulada = factura.estado === 'anulada';
  const lineas = (factura.items || [])
    .map((linea) => {
      const sku = esc(linea.producto?.sku || '—');
      const cant = Number(linea.cantidad).toFixed(2);
      const unit = formatGtq(linea.precio_unitario);
      const ivaLinea = gravable ? money((Number(linea.subtotal) / gravable) * iva) : 0;
      return `<tr>
        <td class="cod">${sku}</td>
        <td>
          <strong>${esc(linea.descripcion)}</strong>
          <div class="sub">${cant} x Q ${unit} | IVA (${pct}%) ${formatGtq(ivaLinea)}</div>
        </td>
        <td class="num">${formatGtq(linea.subtotal)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>POS ${numero}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; }
  .ticket { width: 74mm; margin: 0 auto; padding: 4px 2px 8px; position: relative; font-size: 11px; }
  .watermark {
    position: absolute; inset: 30%; display: grid; place-items: center; pointer-events: none;
    font-size: 28px; font-weight: 800; letter-spacing: 0.08em; color: rgba(220,38,38,0.28);
    transform: rotate(-28deg);
  }
  .c { text-align: center; }
  .logo { width: 52px; height: 52px; margin: 0 auto 6px; background: #facc15; color: #b91c1c;
    display: grid; place-items: center; font-weight: 800; font-size: 8px; line-height: 1.1; border: 1px solid #eab308; }
  .biz { font-size: 11px; line-height: 1.35; }
  .biz strong { display: block; font-size: 12px; }
  .dash { border: 0; border-top: 1px dashed #111; margin: 7px 0; }
  .solid { border: 0; border-top: 2px solid #111; margin: 7px 0; }
  h1, h2 { margin: 0; font-size: 12px; }
  .num-big { font-size: 16px; font-weight: 800; margin: 2px 0 4px; }
  .kv { margin: 2px 0; }
  .kv b { display: inline-block; min-width: 92px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; padding: 0 0 4px; }
  th.num, td.num { text-align: right; white-space: nowrap; }
  td { vertical-align: top; padding: 4px 0; border-bottom: 1px solid #d4d4d4; font-size: 11px; }
  td.cod { width: 18%; word-break: break-all; }
  .sub { font-size: 9.5px; font-weight: 400; margin-top: 1px; }
  .sum { width: 100%; }
  .sum td { border: 0; padding: 2px 0; }
  .pay { font-size: 14px; font-weight: 800; }
  .qr { width: 120px; height: 120px; margin: 8px auto 0; }
  .foot { font-size: 9px; margin-top: 8px; }
</style>
</head>
<body>
  <article class="ticket">
    ${anulada ? '<div class="watermark">ANULADA</div>' : ''}
    <div class="logo">${esc(e.nombre)}</div>
    <div class="c biz">
      <strong>${esc(e.nombre).toUpperCase()}</strong>
      <div>${esc(e.razonSocial)}</div>
      <div>NIT: ${esc(e.nit)}</div>
      <div>${esc(e.direccion)}</div>
      <div>Tel: ${esc(e.telefono)} Correo: ${esc(e.email)}</div>
      <div>Cod. Establecimiento: 1</div>
    </div>
    <hr class="dash"/>
    <div class="c">
      <h1>DOCUMENTO TRIBUTARIO ELECTRONICO</h1>
      <h2>FACTURA ELECTRONICA</h2>
      <div class="num-big"># ${esc(numero)}</div>
      <div>General</div>
    </div>
    <hr class="dash"/>
    <div class="kv"><b>Serie:</b> ${esc(serie)}</div>
    <div class="kv"><b>No:</b> ${esc(noSat)}</div>
    <div class="kv"><b>Fecha Emision:</b> ${esc(fechaLarga(factura.fecha))}</div>
    <div class="kv"><b>Forma Pago:</b> ${esc(condicionLabel(factura.condicion_venta))}</div>
    <div class="kv"><b>Vendedor:</b> ${esc(factura.vendedor || 'N/D')}</div>
    <div class="kv"><b>Moneda:</b> GTQ</div>
    <hr class="dash"/>
    <div class="kv"><b>Receptor:</b> ${esc((cliente?.nombre || 'CONSUMIDOR FINAL').toUpperCase())}</div>
    <div class="kv"><b>NIT:</b> ${esc(cliente?.nit || 'CF')}</div>
    <div class="kv"><b>Telefono:</b> ${esc(cliente?.telefono || '00000000')}</div>
    <div class="kv"><b>Correo:</b> ${esc(cliente?.email || 'consumidorfinal@sincorreo.com')}</div>
    <div class="kv"><b>Direccion:</b> ${esc(cliente?.direccion || 'N/D')}</div>
    <hr class="dash"/>
    <table>
      <thead>
        <tr><th>Cod</th><th>Detalle</th><th class="num">Total</th></tr>
      </thead>
      <tbody>${lineas}</tbody>
    </table>
    <hr class="dash"/>
    <table class="sum">
      <tr><td>Precio</td><td class="num">Q ${formatGtq(precio)}</td></tr>
      <tr><td>Descuento</td><td class="num">Q ${formatGtq(descuento)}</td></tr>
      <tr><td>Monto Gravable</td><td class="num">Q ${formatGtq(gravable)}</td></tr>
      <tr><td>Monto IVA</td><td class="num">Q ${formatGtq(iva)}</td></tr>
      <tr><td>Total Venta</td><td class="num">Q ${formatGtq(total)}</td></tr>
    </table>
    <hr class="solid"/>
    <table class="sum pay">
      <tr><td>Total a Pagar</td><td class="num">Q ${formatGtq(total)}</td></tr>
    </table>
    <hr class="dash"/>
    <table class="sum">
      <tr><td>${esc(metodoPagoLabel(factura.metodo_pago))}</td><td class="num">Q ${formatGtq(total)}</td></tr>
    </table>
    <hr class="dash"/>
    <div>Retencion del ISR - Sujeto a pagos trimestrales ISR - 1</div>
    <hr class="dash"/>
    <div>Frases SAT: ${esc(factura.notas || 'Sujeto a pagos trimestrales ISR')}</div>
    <hr class="dash"/>
    <div class="c">
      <div><b>Numero de Autorizacion:</b></div>
      <div>${esc(aut)}</div>
      <div><b>Serie SAT:</b> ${esc(noSat)}</div>
      <div><b>Fecha de Certificacion:</b> ${esc(fechaLarga(factura.fecha))}</div>
      <div><b>Datos Certificador:</b> FacturaAI</div>
      <div style="margin-top:8px">Consulte en SAT</div>
      <div class="qr">${qrSvg(aut)}</div>
    </div>
    <div class="c foot">Representacion impresa de la Factura Electronica</div>
  </article>
</body>
</html>`;
}

export function abrirHtml(html: string, options?: { print?: boolean; width?: number; height?: number }): void {
  const width = options?.width || 920;
  const height = options?.height || 1100;
  const w = window.open('', '_blank', `noopener,noreferrer,width=${width},height=${height}`);
  if (!w) {
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  if (options?.print) {
    setTimeout(() => w.print(), 300);
  }
}

export function abrirImpresion(html: string): void {
  abrirHtml(html, { print: true });
}
