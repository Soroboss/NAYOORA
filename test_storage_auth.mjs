import { createClient } from "@insforge/sdk";

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function main() {
  const email = "test_storage_" + Date.now() + "@example.com";
  const password = "password123";
  
  await client.auth.signUp({
    email,
    password
  });
  
  const bucket = client.storage.from("member-photos");
  console.log("Uploading as authenticated user...");
  const { data, error } = await bucket.upload("test/file_auth.txt", new Blob(["Hello Auth"], { type: "text/plain" }));
  
  console.log("Upload Data:", data);
  console.log("Upload Error:", error);
}

main().catch(console.error);
