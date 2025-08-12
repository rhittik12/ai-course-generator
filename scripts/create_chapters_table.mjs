import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const connStr = process.env.NEXT_PUBLIC_DB_CONNECTION_STRING;
if (!connStr) {
  console.error('Missing env NEXT_PUBLIC_DB_CONNECTION_STRING');
  process.exit(1);
}

const sql = neon(connStr);

const createSql = `
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  courseid VARCHAR NOT NULL,
  chapterid INTEGER NOT NULL,
  content JSONB NOT NULL,
  videoid VARCHAR NOT NULL
);
`;

try {
  await sql(createSql);
  console.log('Ensured chapters table exists.');
  const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chapters';`;
  console.log('Verification:', res);
  process.exit(0);
} catch (err) {
  console.error('Failed to create chapters table:', err);
  process.exit(2);
}
