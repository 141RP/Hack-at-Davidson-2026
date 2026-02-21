import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are a helpful travel planning assistant embedded in a group chat called WanderSwipe. Your name is Gemini. Give concise, friendly, and informative answers about travel destinations, costs, activities, restaurants, weather, logistics, flights, visas, and anything related to trip planning. Keep responses brief (2-3 short paragraphs max) since you're replying in a chat. Use a warm, casual tone like you're chatting with friends.`

export async function askGemini(question) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })
  const result = await model.generateContent(question)
  return result.response.text()
}

export const GEMINI_USER_ID = 'gemini-bot'
