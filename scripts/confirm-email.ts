import postgres from 'postgres';
import 'dotenv/config';

async function confirmEmail() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  
  try {
    const sql = postgres(url, { max: 1 });
    console.log("Updating auth.users to confirm emails...");
    
    // Auto-confirm the new admin user
    const result = await sql`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email = 'admin_1789287202704@rklabs.com'
    `;
    
    // Also auto-confirm the original user just in case
    await sql`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email = 'srujansinhaparasa@gmail.com'
    `;
    
    console.log("Success! Emails have been forced to confirmed status in the database.");
    process.exit(0);
  } catch (error) {
    console.error("Failed!");
    console.error(error);
    process.exit(1);
  }
}

confirmEmail();
