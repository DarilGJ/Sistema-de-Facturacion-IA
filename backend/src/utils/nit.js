/** NIT de Guatemala: dígitos, guion opcional y dígito verificador, o CF. */
export function nitGuatemalaValido(value) {
  const nit = String(value || '').trim();
  if (/^CF$/i.test(nit)) {
    return true;
  }
  return /^\d{1,12}$/.test(nit) || /^\d{1,12}-[\dKk]$/.test(nit);
}
