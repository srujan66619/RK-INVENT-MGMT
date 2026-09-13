const postgres = require('postgres');
const sql = postgres('postgresql://postgres.ttffgnfhkiossgoekmgv:Mithra%402026%24@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres');
sql`select id, email, approval_status, requested_role from profiles`.then(console.log).catch(console.error).finally(()=>process.exit());
