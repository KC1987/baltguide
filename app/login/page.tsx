"use client"
import { useRouter} from "next/navigation"
import { useState } from "react"
import { createClient } from "@/config/supabase/client"

import { Button } from "@heroui/button"
import { Input } from "@heroui/input"


export default function Page() {
  const router = useRouter();
  const supabase = createClient();

  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    supabase.auth.signInWithPassword({
      email,
      password,
    }).then( (res) => {
      res.data.user && router.push("/account")
    })
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <Button type="submit" color="danger" >Login</Button>
      </form>
    </div>
  )
}