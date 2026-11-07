/** Bloquea un correo tras varios intentos fallidos. El contador vive en memoria y se reinicia con el proceso. */
const intentos = new Map();
const LIMITE = 5;
const VENTANA_MS = 15 * 60 * 1000;

function clave(email) {
  return String(email || '').trim().toLowerCase();
}

function vigente(actual) {
  return actual && Date.now() - actual.desde <= VENTANA_MS;
}

export function verificarIntento(email) {
  const actual = intentos.get(clave(email));
  if (!vigente(actual)) {
    if (actual) {
      intentos.delete(clave(email));
    }
    return;
  }
  if (actual.fallos >= LIMITE) {
    const error = new Error('Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.');
    error.status = 429;
    throw error;
  }
}

export function registrarFallo(email) {
  const key = clave(email);
  const actual = intentos.get(key);
  if (!vigente(actual)) {
    intentos.set(key, { fallos: 1, desde: Date.now() });
    return;
  }
  actual.fallos += 1;
}

export function limpiarIntentos(email) {
  intentos.delete(clave(email));
}
