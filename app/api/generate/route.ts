import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🌙 Mock AI 文案库
const mockResponses: Record<string, string[]> = {
  happy: [
    "Your energy feels light today. Stay present and enjoy it.",
    "Joy is a signal — notice what created it.",
  ],
  sad: [
    "It’s okay to slow down. Emotions move like waves.",
    "Give yourself permission to rest and reflect.",
  ],
  anxious: [
    "Take one slow breath. You are safe in this moment.",
    "Focus on what is within your control right now.",
  ],
  calm: [
    "Stillness is strength. Let this moment expand.",
  ],
  angry: [
    "Strong emotions carry information. Listen before reacting.",
  ],
  lost: [
    "Not knowing is part of becoming. Stay curious.",
  ],
}

export async function POST(req: Request) {
  try {
    const { mood, intensity } = await req.json()

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (!userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // 🧠 生成 Mock AI 回复
    const list = mockResponses[mood] || ["Observe your feelings gently."]
    const aiText = list[Math.floor(Math.random() * list.length)]

    await supabaseAdmin.from("moods").insert([
      {
        user_id: userData.user.id,
        mood_type: mood,
        intensity,
        ai_response: aiText,
      },
    ])

    return NextResponse.json({ ai: aiText })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}