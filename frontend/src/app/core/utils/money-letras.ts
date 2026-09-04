const UNIDADES = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISEIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
  'VEINTE',
];

const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function tresDigitos(n: number): string {
  if (n === 0) {
    return '';
  }
  if (n === 100) {
    return 'CIEN';
  }
  const c = Math.floor(n / 100);
  const r = n % 100;
  const head = c ? CENTENAS[c] : '';
  if (!r) {
    return head;
  }
  if (r <= 20) {
    return `${head} ${UNIDADES[r]}`.trim();
  }
  const d = Math.floor(r / 10);
  const u = r % 10;
  if (d === 2 && u) {
    return `${head} VEINTI${UNIDADES[u]}`.trim();
  }
  const dec = DECENAS[d];
  return `${head} ${u ? `${dec} Y ${UNIDADES[u]}` : dec}`.trim();
}

function enteroEnLetras(n: number): string {
  if (n === 0) {
    return 'CERO';
  }
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const parts: string[] = [];
  if (millones) {
    parts.push(millones === 1 ? 'UN MILLON' : `${tresDigitos(millones)} MILLONES`);
  }
  if (miles) {
    parts.push(miles === 1 ? 'MIL' : `${tresDigitos(miles)} MIL`);
  }
  if (resto) {
    parts.push(tresDigitos(resto));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function montoEnLetras(value: number, moneda = 'QUETZALES'): string {
  const n = Math.max(0, Number(value) || 0);
  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  const letras = enteroEnLetras(entero);
  return `SON: ${letras} ${moneda} CON ${String(centavos).padStart(2, '0')}/100`;
}

export function money(value: number | string | null | undefined): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatGtq(value: number | string | null | undefined): string {
  return money(value).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function padDoc(id: number): string {
  return String(id).padStart(8, '0');
}
