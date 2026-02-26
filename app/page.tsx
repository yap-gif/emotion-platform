import { redirect } from "next/navigation"

export default function Home() {
  // 直接进入 login，让 login 决定是否跳 dashboard
  redirect("/login")
}
