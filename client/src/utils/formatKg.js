/**
 * Helper to format decimal KG values into clear weight strings.
 * e.g.,
 * 0.05 -> "50 g"
 * 0.1  -> "100 g"
 * 0.25 -> "¼ kg (250 g)"
 * 0.5  -> "½ kg (500 g)"
 * 0.75 -> "¾ kg (750 g)"
 * 1.0  -> "1 kg"
 * 1.25 -> "1 ¼ kg"
 * 1.5  -> "1 ½ kg"
 */
export const formatKgFraction = (val) => {
  const kg = parseFloat(val) || 0;
  if (kg === 0) return '0 kg';

  const totalGrams = Math.round(kg * 1000);
  if (totalGrams < 1000) {
    if (totalGrams === 50) return '50 g';
    if (totalGrams === 100) return '100 g';
    if (totalGrams === 250) return '¼ kg (250 g)';
    if (totalGrams === 500) return '½ kg (500 g)';
    if (totalGrams === 750) return '¾ kg (750 g)';
    return `${totalGrams} g`;
  }

  const whole = Math.floor(kg);
  const remGrams = Math.round((kg - whole) * 1000);

  if (remGrams === 0) return `${whole} kg`;
  if (remGrams === 250) return `${whole} ¼ kg`;
  if (remGrams === 500) return `${whole} ½ kg`;
  if (remGrams === 750) return `${whole} ¾ kg`;
  if (remGrams > 0) return `${whole} kg ${remGrams} g`;

  return `${kg.toFixed(2)} kg`;
};
