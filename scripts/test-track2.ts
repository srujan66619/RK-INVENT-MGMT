import 'dotenv/config';
import { trackRepair } from '../src/lib/tracking.functions.js';

async function test() {
  const result = await trackRepair({ data: { ticket: 'TK-407942' } });
  console.log("Track result:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
