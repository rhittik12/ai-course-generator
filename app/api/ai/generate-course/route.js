import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const PRIMARY_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash'
const FALLBACK_MODEL = process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash-8b'

function isQuotaError(err) {
  const msg = (err && (err.message || err.toString())) || ''
  const status = err && (err.status || err.code)
  return status === 429 || /quota|rate limit/i.test(msg)
}

function parseRetryDelayMs(err) {
  try {
    const retry = err?.errorDetails?.find?.(d => d['@type']?.includes('RetryInfo'))
      || (Array.isArray(err) ? err : []).find?.(d => d['@type']?.includes?.('RetryInfo'))
    const delay = retry?.retryDelay
    if (typeof delay === 'string' && delay.endsWith('s')) {
      return Math.max(0, Math.round(parseFloat(delay) * 1000))
    }
  } catch {}
  return 3000
}

async function sendWithRetry(chat, prompt, { maxRetries = 2 } = {}) {
  let attempt = 0
  while (true) {
    try {
      return await chat.sendMessage(prompt)
    } catch (err) {
      if (attempt >= maxRetries || !isQuotaError(err)) throw err
      const backoff = parseRetryDelayMs(err) * Math.pow(2, attempt)
      await new Promise(res => setTimeout(res, backoff))
      attempt += 1
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const prompt = body?.prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter(Boolean)
    let lastErr
    for (let i = 0; i < models.length; i++) {
      const m = genAI.getGenerativeModel({ model: models[i] })
      const chat = m.startChat({
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      })
      try {
        const result = await sendWithRetry(chat, prompt, { maxRetries: 2 })
        const text = await result.response.text()
        try {
          const json = JSON.parse(text || '{}')
          return NextResponse.json(json, { status: 200 })
        } catch {
          return NextResponse.json({ raw: text }, { status: 200 })
        }
      } catch (err) {
        lastErr = err
        if (isQuotaError(err) && i < models.length - 1) continue
        break
      }
    }
    const message = 'AI request failed due to quota. Please retry later, switch models, or add billing.'
    const status = isQuotaError(lastErr) ? 429 : 500
    return NextResponse.json({ error: message }, { status })
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
