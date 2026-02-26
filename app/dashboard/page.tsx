"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type MoodRow = {
  id: string
  mood_type: string
  intensity: number
  ai_response: string | null
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [moods, setMoods] = useState<MoodRow[]>([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const fetchMoods = async () => {
    const { data, error } = await supabase
      .from("moods")
      .select("id,mood_type,intensity,ai_response,created_at")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      alert("Fetch moods error: " + error.message)
      return
    }
    setMoods((data ?? []) as MoodRow[])
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
        return
      }
      setUser(data.user)
      await fetchMoods()
      setLoading(false)
    }

    init()
  }, [router])

  const saveMood = async (mood: string, intensity: number) => {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { error } = await supabase.from("moods").insert([
      {
        user_id: userData.user.id,
        mood_type: mood,
        intensity,
      },
    ])

    setSaving(false)

    if (error) {
      alert("Insert error: " + error.message)
    } else {
      await fetchMoods()
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }


const saveMoodWithAI = async (mood: string, intensity: number) => {
  setSaving(true)

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    setSaving(false)
    router.push("/login")
    return
  }

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mood, intensity }),
  })

  setSaving(false)

  const json = await res.json()
  if (!res.ok) {
    alert("AI error: " + (json.error ?? "unknown"))
    return
  }

  // 生成+写入已完成，刷新列表
  await fetchMoods()
}

  const stats = useMemo(() => {
    if (moods.length === 0) return null
    const avg = moods.reduce((s, m) => s + m.intensity, 0) / moods.length
    const counts: Record<string, number> = {}
    for (const m of moods) counts[m.mood_type] = (counts[m.mood_type] ?? 0) + 1
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { avg: Number(avg.toFixed(2)), top: top ?? "-" }
  }, [moods])

const avgIntensityRecent = useMemo(() => {
  if (moods.length === 0) return null
  const recent = moods.slice(0, 10) // 最近 10 条
  const avg = recent.reduce((s, m) => s + m.intensity, 0) / recent.length
  return Number(avg.toFixed(2))
}, [moods])

const dominantMoodRecent = useMemo(() => {
  if (moods.length === 0) return null
  const recent = moods.slice(0, 10)
  const counts: Record<string, number> = {}
  for (const m of recent) counts[m.mood_type] = (counts[m.mood_type] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}, [moods])

const moodColorMap: Record<string, string> = {
  happy: "#facc15",
  calm: "#22d3ee",
  sad: "#60a5fa",
  anxious: "#38bdf8",
  angry: "#fb7185",
  lost: "#a78bfa",
}

const dominantColor = dominantMoodRecent
  ? moodColorMap[dominantMoodRecent]
  : "#ffffff"

const bgStyle = useMemo(() => {
  if (avgIntensityRecent === null) {
    return {
      backgroundImage: "linear-gradient(135deg, #0b0f1a, #111827)",
      minHeight: "100vh",
    }
  }

  const t = Math.max(0, Math.min(1, avgIntensityRecent / 5))

  const moodHueMap: Record<string, number> = {
    happy: 45,
    calm: 200,
    sad: 220,
    anxious: 190,
    angry: 10,
    lost: 260,
  }

  const baseHue = dominantMoodRecent
    ? moodHueMap[dominantMoodRecent] ?? 210
    : 210

  const sat1 = 55 + 25 * t
  const sat2 = 45 + 30 * t
  const light1 = 16 + 12 * t
  const light2 = 10 + 10 * t

  const hue1 = baseHue
  const hue2 = (baseHue + 35) % 360

  return {
backgroundImage: `
  radial-gradient(circle at 20% 20%, rgba(255,255,255,0.10), transparent 35%),
  radial-gradient(circle at 80% 30%, rgba(255,255,255,0.06), transparent 40%),
  linear-gradient(135deg,
      hsl(${hue1} ${sat1}% ${light1}%),
      hsl(${hue2} ${sat2}% ${light2}%)
    )`,
    minHeight: "100vh",
  }
}, [avgIntensityRecent, dominantMoodRecent])

 
const last7DaysSeries = useMemo(() => {
  const days: { date: string; avg: number | null }[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)

    const key = d.toISOString().slice(0, 10)

    const dayItems = moods.filter(
      (m) => m.created_at.slice(0, 10) === key
    )

    // ⭐ 核心变化：没有数据 → null
    const avg =
      dayItems.length === 0
        ? null
        : Number(
            (
              dayItems.reduce((s, x) => s + x.intensity, 0) /
              dayItems.length
            ).toFixed(2)
          )

    days.push({ date: key, avg })
  }

  return days
}, [moods])

  if (loading) return <main style={{ padding: 40 }}>Loading...</main>

return (
  <main
    style={{
      ...bgStyle,
      padding: 40,
      fontFamily: "sans-serif",
      color: "white",
      backgroundSize: "200% 200%",
      animation: `moodFlow ${avgIntensityRecent ? Math.max(14, 30 - avgIntensityRecent * 3) : 30}s ease-in-out infinite`,
    }}
  >
    <style>{`
      @keyframes moodFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>

    {/* 下面保持你原来的内容 */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome: {user?.email}</p>
        </div>
        <button onClick={signOut}>Log out</button>
      </div>
      <div
  style={{
    marginTop: 8,
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
    fontSize: 12,
  }}
>
  <span>Intensity (recent):</span>
  <strong>{avgIntensityRecent ?? "—"}/5</strong>
<span style={{ opacity: 0.6 }}>•</span>
<strong>
  {dominantMoodRecent
    ? dominantMoodRecent.toUpperCase()
    : "NO DATA"}
</strong>
</div>

<section style={{ marginTop: 16 }}>
  <h3>Record Mood</h3>

  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {/* HAPPY */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("happy", 3)}
      style={{
        border:
          dominantMoodRecent === "happy"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "happy"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      😊 Happy
    </button>

    {/* SAD */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("sad", 2)}
      style={{
        border:
          dominantMoodRecent === "sad"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "sad"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      😔 Sad
    </button>

    {/* ANXIOUS */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("anxious", 4)}
      style={{
        border:
          dominantMoodRecent === "anxious"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "anxious"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      😰 Anxious
    </button>

    {/* LOST */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("lost", 3)}
      style={{
        border:
          dominantMoodRecent === "lost"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "lost"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      🤍 Lost
    </button>

    {/* ANGRY */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("angry", 4)}
      style={{
        border:
          dominantMoodRecent === "angry"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "angry"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      🔥 Angry
    </button>

    {/* CALM */}
    <button
      disabled={saving}
      onClick={() => saveMoodWithAI("calm", 2)}
      style={{
        border:
          dominantMoodRecent === "calm"
            ? `2px solid ${dominantColor}`
            : "1px solid rgba(255,255,255,0.2)",
        boxShadow:
          dominantMoodRecent === "calm"
            ? `0 0 14px ${dominantColor}`
            : "none",
        borderRadius: 12,
        padding: "8px 14px",
        background: "rgba(0,0,0,0.25)",
        color: "white",
        cursor: "pointer",
      }}
    >
      🌊 Calm
    </button>
  </div>
</section>

      <section style={{ marginTop: 24 }}>
        <h3>Quick Stats</h3>
        {stats ? (
          <ul>
            <li>Average intensity: {stats.avg}</li>
            <li>Most frequent mood: {stats.top}</li>
            <li>Total records: {moods.length}</li>
          </ul>
        ) : (
          <p>No data yet.</p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
  <h3>7-Day Mood Intensity Trend</h3>

  <div
    style={{
      width: "100%",
      height: 260,
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(0,0,0,0.25)",
  backdropFilter: "blur(10px)",
    }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={last7DaysSeries}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => v.slice(5)} // 显示 MM-DD
        />
        <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
        <Tooltip />
        <Line
  type="monotone"
  dataKey="avg"
  stroke={dominantColor}
  strokeWidth={3}
  dot={{ r: 4 }}
  connectNulls={false}
/>
      </LineChart>
    </ResponsiveContainer>
  </div>

<p style={{ marginTop: 8, opacity: 0.7 }}>
  Avg intensity per day (0–5). Gaps indicate no recorded moods.
</p>
</section>

      <section style={{ marginTop: 24 }}>
        <h3>Recent History</h3>
        {moods.length === 0 ? (
          <p>No records yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {moods.map((m) => (
              <div
                key={m.id}
                style={{
border: "1px solid rgba(255,255,255,0.14)",
borderRadius: 16,
padding: 14,
background: "rgba(0,0,0,0.25)",
backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{m.mood_type.toUpperCase()}</strong>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div>Intensity: {m.intensity}/5</div>
                {m.ai_response ? (
                  <p style={{ marginTop: 8 }}>{m.ai_response}</p>
                ) : (
                  <p style={{ marginTop: 8, opacity: 0.7 }}>No AI response yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
