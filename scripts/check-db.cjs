const postgres = require('postgres');
const sql = postgres('postgresql://postgres.ttffgnfhkiossgoekmgv:Mithra%402026%24@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres');
async function run() {
  try {
    const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'`;
    console.log("Columns:", res);
    
    // Also check if there are any triggers on auth.users
    const triggers = await sql`
      SELECT event_object_schema as table_schema,
             event_object_table as table_name,
             trigger_schema,
             trigger_name,
             event_manipulation as event,
             action_statement as definition
      FROM information_schema.triggers
      WHERE event_object_table IN ('users', 'profiles')
    `;
    console.log("Triggers:", triggers);
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
