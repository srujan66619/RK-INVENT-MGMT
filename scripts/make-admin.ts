import 'dotenv/config';
import { db } from '../src/db/index.js';
import { profiles } from '../src/db/schema/users.js';
import { eq } from 'drizzle-orm';

async function makeAdmin() {
  const email = "srujansinhaparasa@gmail.com";
  console.log(`Updating ${email} to be an approved admin...`);
  
  await db.update(profiles)
    .set({ role: "admin", approval_status: "approved" })
    .where(eq(profiles.email, email));
    
  console.log("Done! You can now log in.");
  process.exit(0);
}

makeAdmin().catch(console.error);
