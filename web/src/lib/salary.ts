/**
 * Utility for formatting and filtering job salaries.
 * Hides placeholder strings like "Competitive", "Market Standard", "Not disclosed", and "₹0".
 */
export const formatSalary = (salary?: string | null): string | null => {
  if (!salary || typeof salary !== 'string') return null;
  const s = salary.trim().toLowerCase();
  const placeholders = new Set([
    'competitive',
    'market standard',
    'not disclosed',
    'undisclosed',
    'competitive / market standard',
    'competitive / negotiable',
    'negotiable',
    '₹0',
    '$0',
    '0',
    'n/a',
    'na',
    'null',
    'undefined'
  ]);

  if (placeholders.has(s) || s.startsWith('₹0') || s.startsWith('$0')) {
    return null;
  }

  return salary.trim();
};

