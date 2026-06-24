import { createClient as createSdkClient } from "@insforge/sdk";
import { cookies } from "next/headers";

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

export async function createClient(): Promise<any> {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey || anonKey === "your-anon-key") throw new Error("InsForge n’est pas configuré.");
  return withLegacyQueryShape(createSdkClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: cookieStore.get("insforge_access_token")?.value,
  }));
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
