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

export async function createClient(accessToken?: string): Promise<any> {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey || anonKey === "your-anon-key") throw new Error("InsForge n’est pas configuré.");
  return withLegacyQueryShape(createSdkClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken ?? cookieStore.get("insforge_access_token")?.value,
  }));
}

export async function createAdminClient(): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const serviceKey = process.env.INSFORGE_SERVICE_KEY;
  
  if (!baseUrl || !serviceKey) {
    console.warn("WARNING: createAdminClient used but no service key found in environment variables. Falling back to anon key.");
    return createClient(); // fallback if not configured
  }
  
  return withLegacyQueryShape(createSdkClient({
    baseUrl,
    anonKey: serviceKey, // The Insforge SDK uses the anonKey parameter to pass the bearer token, whether anon or service role
    isServerMode: true,
  }));
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const activeOrganizationCookie = "nayoora_active_organization_id";
