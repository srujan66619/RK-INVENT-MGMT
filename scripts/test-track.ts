import 'dotenv/config';
import { db } from '../src/db/index.js';
import { repairs } from '../src/db/schema/repairs.js';

async function test() {
  const allRepairs = await db.select().from(repairs);
  console.log("Found repairs:", allRepairs.length);
  if (allRepairs.length > 0) {
     console.log("First repair ticket:", allRepairs[0].ticket_no);
  }
}

test().catch(console.error);
