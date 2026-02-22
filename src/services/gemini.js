export async function askGemini(question, chatHistory = [], notepadEntries = []) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, chatHistory, notepadEntries }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Gemini request failed')
  }

  const data = await res.json()
  return data.answer
}

export const GEMINI_USER_ID = 'gemini-bot'
