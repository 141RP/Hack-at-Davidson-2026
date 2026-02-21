import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const SEED_USERS = [
  {
    id: 'gemini-bot',
    name: 'Gemini',
    email: 'gemini@google.com',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=gemini&backgroundColor=4285f4',
    bio: 'Your AI travel planning assistant.',
  },
  {
    id: 'seed-sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=SarahChen&backgroundColor=b6e3f4',
    bio: 'Beach lover and foodie. Always planning the next getaway!',
  },
  {
    id: 'seed-marcus',
    name: 'Marcus Johnson',
    email: 'marcus.j@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=MarcusJ&backgroundColor=c0aede',
    bio: 'Adventure seeker. Mountains over beaches any day.',
  },
  {
    id: 'seed-emily',
    name: 'Emily Rivera',
    email: 'emily.rivera@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=EmilyR&backgroundColor=ffd5dc',
    bio: 'Culture enthusiast and history nerd. Love exploring old cities.',
  },
  {
    id: 'seed-jake',
    name: 'Jake Thompson',
    email: 'jake.t@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JakeT&backgroundColor=d1f4d9',
    bio: 'Budget traveler. Proving you can see the world without breaking the bank.',
  },
  {
    id: 'seed-priya',
    name: 'Priya Patel',
    email: 'priya.patel@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=PriyaP&backgroundColor=ffe4b5',
    bio: 'Luxury travel lover. Life is too short for bad hotels.',
  },
  {
    id: 'seed-alex',
    name: 'Alex Kim',
    email: 'alex.kim@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=AlexK&backgroundColor=bde0fe',
    bio: 'Photographer and solo traveler. Chasing golden hours worldwide.',
  },
  {
    id: 'seed-jordan',
    name: 'Jordan Williams',
    email: 'jordan.w@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JordanW&backgroundColor=e2cfea',
    bio: 'Road trip fanatic. Give me a car and an open road.',
  },
  {
    id: 'seed-mia',
    name: 'Mia Santos',
    email: 'mia.santos@gmail.com',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=MiaS&backgroundColor=fbc4ab',
    bio: 'Scuba diver and island hopper. Happiest underwater.',
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
        bio: userData.bio || '',
        friends: [],
        createdAt: Date.now(),
      })
    }
  })
  await Promise.all(promises)
}
