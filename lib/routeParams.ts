// Pure route-param parsing — no React, no DB, no Expo imports.

/** Parse an expo-router [id] segment into a positive integer id, else null. */
export function parseRouteId(param: string | string[] | undefined): number | null {
  const value = Array.isArray(param) ? param[0] : param;
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}
