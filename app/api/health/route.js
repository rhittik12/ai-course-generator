export async function GET() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_DB_CONNECTION_STRING',
    'GEMINI_API_KEY',
  ];
  const missing = required.filter(k => !process.env[k]);
  return new Response(
    JSON.stringify({ status: 'ok', missing, timestamp: new Date().toISOString() }),
    { status: missing.length ? 206 : 200, headers: { 'Content-Type': 'application/json' } }
  );
}
