/** Public API origin. NEXT_PUBLIC_* values are embedded at build time by Next.js. */
export function baseUrlApi(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/+$/, "");
}

export function apiHabilitada(): boolean {
  return baseUrlApi() !== null;
}
