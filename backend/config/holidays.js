// Lista de días festivos bloqueados
// Formato: 'YYYY-MM-DD'
const holidays = [
  // Ejemplo: agregar festivos aquí
  '2026-01-01', // Año Nuevo
  '2026-03-19', // Fallas
  '2026-04-03', // Pascua
  '2026-04-06', // Pascua
  '2026-05-01', // Día del Trabajador
  '2026-06-24', // San Juan
  '2026-10-09', // 9 d'Octubre
  '2026-10-12', // Día de la Hispanidad
  '2026-11-01', // Todos los Santos
  '2026-12-06', // Día de la Constitución
  '2026-12-08', // Inmaculada Concepción
  '2026-12-24', // Navidad
  '2026-12-25', // Navidad
  '2026-12-31', // Nochevieja
];

/**
 * Verifica si una fecha es festivo
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {boolean}
 */
function isHoliday(date) {
  return holidays.includes(date);
}

module.exports = {
  holidays,
  isHoliday
};
