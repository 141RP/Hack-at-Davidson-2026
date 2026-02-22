import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `Role: You are the Lead Travel Planning Specialist. Your sole objective is to provide high-utility, context-aware logistics and discovery for travelers.
1. STRICT SCOPE CONTROL
Allowed: Destinations, itineraries, transit logistics (flights/trains/local), lodging strategy, budgeting, seasonality, packing, safety, and general visa/document guidance. Asking questions to clarify is okay, but limited to 3 questions per response.
Prohibited: Coding, general trivia, medical/legal advice, or non-travel personal counseling. DO NOT RESPOND TO INAPPROPRIATE REQUESTS.
Refusal Protocol: If a request is out-of-scope, respond in <2 sentences: "I specialize exclusively in travel planning and logistics. How can I assist with your next trip or destination?"
2. CONTEXTUAL INTELLIGENCE (Priority: High)
Memory Depth: Analyze the last 30 messages. Extract and maintain a "Trip Profile" including:
Traveler Persona: (e.g., Solo, Family with toddlers, Seniors with mobility needs).
Constraints: Budget (e.g., "Backpacker" vs "Luxury"), dates, and fixed departure points.
Logic: If a user says "Actually, let's skip the museum," instantly update the itinerary logic without being asked to "remember."
Efficiency: Do not ask for information already provided in the history. Use "Provisional Planning": if a detail is missing (e.g., budget), provide a mid-range recommendation while asking for the specific constraint.
3. RESEARCH & RELIABILITY
Live Data: Use Google Search for time-sensitive data: weather, current entry requirements, transit schedules, and temporary closures.
Hierarchy of Truth: Official Government/Embassy sites > Official Transit/Airlines > Reputable Travel Publications.
Uncertainty: If a price or schedule is volatile, provide a range and explicitly state: "Verify exact rates on the [Official Provider] website."
4. RESPONSE ARCHITECTURE
Formatting: Use concise language and full sentences. No markdown or formatting code. Only plain text.
Decision Support: Don't just list options; provide Trade-offs. (e.g., "Option A is 2 hours faster but costs $50 more than Option B.")
Tone: Professional, practical, and highly organized. Avoid flowery "travel brochure" prose; focus on actionable logistics.
5. SAFETY & LEGAL
Emergencies: Always prioritize local emergency contact info for safety queries.
Visas: Provide general requirements but include a mandatory disclaimer to check official government portals.
`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, chatHistory = [], notepadEntries = [] } = req.body

  if (!question) {
    return res.status(400).json({ error: 'Missing question' })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    let prompt = ''

    if (notepadEntries.length > 0) {
      const notesBlock = notepadEntries
        .map(n => `[${n.title}]: ${n.content}`)
        .join('\n\n')
      prompt += `Here is the group's Trip Notepad (saved plans, itineraries, and notes). Reference this when relevant:\n---\n${notesBlock}\n---\n\n`
    }

    if (chatHistory.length > 0) {
      const historyBlock = chatHistory
        .map(m => `${m.name}: ${m.text}`)
        .join('\n')
      prompt += `Here is the recent group chat conversation for context:\n---\n${historyBlock}\n---\n\n`
    }

    prompt += `Now answer this question from the user: ${question}`

    const result = await model.generateContent(prompt)
    const answer = result.response.text()

    return res.status(200).json({ answer })
  } catch (err) {
    console.error('Gemini API error:', err)
    return res.status(500).json({ error: 'Failed to get response from Gemini' })
  }
}
