import { createClient } from "@insforge/sdk";

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function main() {
  const bucket = client.storage.from("member-photos");
  
  // We need an authenticated session, but let's try with anon first
  const { data, error } = await bucket.upload("test/file.txt", new Blob(["Hello"], { type: "text/plain" }));
  
  console.log("Upload Data:", data);
  console.log("Upload Error:", error);
}

main().catch(console.error);
