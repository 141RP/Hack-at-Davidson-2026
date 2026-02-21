import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const SEED_USERS = [
  {
    id: 'gemini-bot',
    name: 'Gemini',
    email: 'gemini@google.com',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=gemini&backgroundColor=4285f4',
  },
  {
    id: 'seed-sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=SarahChen&backgroundColor=b6e3f4',
  },
  {
    id: 'seed-marcus',
    name: 'Marcus Johnson',
    email: 'marcus.j@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=MarcusJ&backgroundColor=c0aede',
  },
  {
    id: 'seed-emily',
    name: 'Emily Rivera',
    email: 'emily.rivera@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=EmilyR&backgroundColor=ffd5dc',
  },
  {
    id: 'seed-jake',
    name: 'Jake Thompson',
    email: 'jake.t@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JakeT&backgroundColor=d1f4d9',
  },
  {
    id: 'seed-priya',
    name: 'Priya Patel',
    email: 'priya.patel@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=PriyaP&backgroundColor=ffe4b5',
  },
  {
    id: 'seed-alex',
    name: 'Alex Kim',
    email: 'alex.kim@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=AlexK&backgroundColor=bde0fe',
  },
  {
    id: 'seed-jordan',
    name: 'Jordan Williams',
    email: 'jordan.w@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JordanW&backgroundColor=e2cfea',
  },
  {
    id: 'seed-mia',
    name: 'Mia Santos',
    email: 'mia.santos@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=MiaS&backgroundColor=fbc4ab',
  },
]

export async function seedUsers() {
  const promises = SEED_USERS.map(async (userData) => {
    const ref = doc(db, 'users', userData.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        createdAt: Date.now(),
      })
    }
  })
  await Promise.all(promises)
}
