import postgres from 'postgres';
import 'dotenv/config';

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  
  console.log("Testing connection to:", url.replace(/:[^:@]+@/, ':***@'));
  
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 5 });
    const result = await sql`SELECT 1 as connected`;
    console.log("Connection successful!", result);
    process.exit(0);
  } catch (error) {
    console.error("Connection failed!");
    console.error(error);
    process.exit(1);
  }
}

testConnection();
