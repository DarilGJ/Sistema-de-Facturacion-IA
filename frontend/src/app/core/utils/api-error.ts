export function apiErrorMessage(err: unknown, fallback = 'No se pudo completar la operación.'): string {
  const error = err as { error?: { message?: string; errors?: string[] } };
  if (Array.isArray(error?.error?.errors) && error.error.errors.length) {
    return error.error.errors.join('. ');
  }
  return error?.error?.message || fallback;
}
