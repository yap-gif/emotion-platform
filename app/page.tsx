import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${cookies().get("sb-access-token")?.value ?? ""}`,
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ⭐ 已登录 → dashboard
  if (user) {
    redirect("/dashboard")
  }

  // ⭐ 未登录 → login
  redirect("/login")
}
