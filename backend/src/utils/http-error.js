export function handleSequelizeError(error, res) {
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: error.errors.map((e) => e.message),
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Ya existe un registro con ese valor único',
      errors: error.errors.map((e) => e.message),
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'La referencia enviada no es válida',
    });
  }

  console.error(error);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
