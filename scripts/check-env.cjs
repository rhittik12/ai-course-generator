#!/usr/bin/env node
const required = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_DB_CONNECTION_STRING',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_GEMINI_MODEL',
  'NEXT_PUBLIC_GEMINI_FALLBACK_MODEL'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('\n[env:check] Missing required env vars:\n - ' + missing.join('\n - '));
  process.exit(1);
}
console.log('[env:check] All required environment variables are present.');
