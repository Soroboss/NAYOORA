import { createClient as createSdkClient } from "@insforge/sdk";

function withLegacyQueryShape(client: any): any {
  const auth = client.auth;
  auth.getUser = async () => {
    const result = await client.auth.getCurrentUser();
    return { data: { user: result.data?.user ?? null }, error: result.error };
  };
  client.from = (table: string) => {
    const query = client.database.from(table);
    const insert = query.insert.bind(query);
    query.insert = (values: unknown) => insert(Array.isArray(values) ? values : [values]);
    return query;
  };
  client.rpc = client.database.rpc.bind(client.database);
  return client;
}

export function createInsforgeClient(): any {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey || anonKey === "your-anon-key") return null;
  return withLegacyQueryShape(createSdkClient({ baseUrl, anonKey }));
}

export function createClient(): any {
  const client = createInsforgeClient();
  if (!client) throw new Error("InsForge n’est pas configuré.");
  return client;
}
