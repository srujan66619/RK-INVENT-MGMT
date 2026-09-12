import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set in environment variables. Falling back to mock DB.");
}

const connectionString = process.env.DATABASE_URL || "postgresql://mock:mock@mock.supabase.co/mock";
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient);
