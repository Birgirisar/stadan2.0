/** Translate Sportmonks surface values to Icelandic display strings */
export function translateSurface(surface: string | null | undefined): string {
  if (!surface) return '—';
  const s = surface.toLowerCase().trim();
  if (s === 'grass') return 'Gras';
  if (s === 'artificial' || s === 'artificial_grass') return 'Gervi';
  if (s === 'hybrid') return 'Blandað';
  // Capitalize others as-is
  return surface.charAt(0).toUpperCase() + surface.slice(1);
}

/** Format capacity with is-IS locale thousand separator */
export function formatCapacity(capacity: number | null | undefined): string {
  if (capacity == null || capacity === 0) return '—';
  return capacity.toLocaleString('is-IS');
}
