/**
 * Tries the migrations when the server starts. A failure only logs: the pages must stay up while
 * the DB is down, and the sign-up routes retry the migration before their first query.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set: sign-up and survey will fail");
    return;
  }
  const { migrateOnce } = await import("./db/client");
  const { errorSummary } = await import("./server/http");
  try {
    await migrateOnce();
  } catch (e) {
    console.error("migrations failed at start; will retry on the next sign-up", errorSummary(e));
  }
}
