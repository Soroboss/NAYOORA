require('dotenv').config({ path: '.env.local' });
console.log(Object.keys(process.env).filter(k => k.includes('INSFORGE') || k.includes('SUPABASE')));
