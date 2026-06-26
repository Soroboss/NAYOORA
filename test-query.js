const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_INSFORGE_URL, process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from("member_profiles")
    .select(`id, organization_id, status, organizations(name, organization_type)`)
    .limit(5);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
