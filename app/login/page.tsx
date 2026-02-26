"use client"

import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading
  }, [email, password, loading])

  const submit = async () => {
    setMsg(null)
    setLoading(true)

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setMsg({ type: "error", text: error.message })
        } else {
          router.push("/dashboard")
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) {
          setMsg({ type: "error", text: error.message })
        } else {
          setMsg({
            type: "success",
            text: "Signup success. Please check your email to confirm, then log in.",
          })
          setMode("login")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(255,255,255,0.10), transparent 35%),
          radial-gradient(circle at 85% 30%, rgba(255,255,255,0.08), transparent 40%),
          linear-gradient(135deg, #0b1220, #111827)
        `,
        backgroundSize: "200% 200%",
      }}
    >
      <style>{`
        @keyframes floatBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.28)",
          backdropFilter: "blur(14px)",
          padding: 20,
          color: "white",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          animation: "floatBg 18s ease-in-out infinite",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>
            Shi Xian Mood Space
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 22, lineHeight: 1.2 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.8, fontSize: 13 }}>
            {mode === "login"
              ? "Log in to track your mood, see trends, and receive gentle AI feedback."
              : "Sign up to start your emotional tracking journey."}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => setMode("login")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: mode === "login" ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.14)",
              background: mode === "login" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Log in
          </button>
          <button
            onClick={() => setMode("signup")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: mode === "signup" ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.14)",
              background: mode === "signup" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Sign up
          </button>
        </div>

        {/* Message */}
        {msg && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: msg.type === "error" ? "rgba(255, 80, 80, 0.16)" : "rgba(80, 255, 170, 0.14)",
              color: "white",
              fontSize: 13,
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.22)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.22)",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              marginTop: 6,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.18)",
              background: canSubmit ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
              color: "white",
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log in →"
              : "Create account →"}
          </button>

          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            <div>• Your mood records are private (protected by database security rules).</div>
            <div>• Email confirmation may be required after signup.</div>
          </div>
        </div>
      </div>
    </main>
  )
}
