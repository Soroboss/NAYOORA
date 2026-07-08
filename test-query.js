require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('tontine_collections').select('id, amount_paid, cycle:tontine_cycles(cycle_number)').limit(1);
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
run();
