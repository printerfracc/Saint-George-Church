import { connect } from "@tidbcloud/serverless";

let newsImageColumnReady = false;

export async function ensureNewsImageColumn() {
  if (newsImageColumnReady) {
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return;
  }

  try {
    await connect({ url }).execute("ALTER TABLE NewsEvent ADD COLUMN imageUrls TEXT NULL");
  } catch {
    // Column may already exist.
  }

  newsImageColumnReady = true;
}
