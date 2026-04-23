/** @type {const} */
const themeColors = {
  // ── Dark: neon green + orange on pure black (Apple-premium dark mode)
  // ── Light: kept clean for any light-mode fallback
  primary:    { light: '#22C55E', dark: '#39FF14' },   // neon green
  accent:     { light: '#F97316', dark: '#FF8C00' },   // vivid orange
  background: { light: '#FFFFFF', dark: '#000000' },   // pure black
  surface:    { light: '#F8FAFC', dark: '#0D0D0D' },   // near-black surface
  foreground: { light: '#111827', dark: '#F5F5F5' },   // near-white text
  muted:      { light: '#6B7280', dark: '#6B7280' },   // muted grey
  border:     { light: '#E5E7EB', dark: '#1C1C1E' },   // subtle dark border
  success:    { light: '#22C55E', dark: '#39FF14' },   // neon green
  warning:    { light: '#F59E0B', dark: '#FF8C00' },   // orange
  error:      { light: '#EF4444', dark: '#FF453A' },   // iOS red
  card:       { light: '#FFFFFF', dark: '#111111' },   // dark card
  protein:    { light: '#EAB308', dark: '#FFD60A' },   // yellow
  carbs:      { light: '#3B82F6', dark: '#0A84FF' },   // iOS blue
  fat:        { light: '#A855F7', dark: '#BF5AF2' },   // iOS purple
};

module.exports = { themeColors };
