function projectRefFromUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Supabase project configuration is invalid.");
  }
  const match = /^([a-z0-9]+)\.supabase\.co$/i.exec(url.hostname);
  if (url.protocol !== "https:" || !match) {
    throw new Error("Supabase project configuration is invalid.");
  }
  return match[1].toLowerCase();
}

export function assertSupabaseProjectMatch(supabaseUrl, databaseProjectRef) {
  const authProjectRef = projectRefFromUrl(supabaseUrl);
  if (typeof databaseProjectRef !== "string" || !/^[a-z0-9]+$/i.test(databaseProjectRef)) {
    throw new Error("Database project configuration is invalid.");
  }
  const normalizedDatabaseProjectRef = databaseProjectRef.toLowerCase();
  if (authProjectRef !== normalizedDatabaseProjectRef) {
    throw new Error(`Supabase Auth and database project configuration do not match (Auth project: ${authProjectRef}; database project: ${normalizedDatabaseProjectRef}).`);
  }
}
