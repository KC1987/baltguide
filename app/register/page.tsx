"use client"

import { useState } from "react"

import { createClient } from "@/config/supabase/client"

import { Button } from "@heroui/button"
import { Input } from "@heroui/input"



export default function Page() {
  const supabase = createClient();

  const [ username, setUsername ] = useState("");
  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");

  const [ message, setMessage ] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          favourite_locations: [],
        }
      }
    }).then( res => {
      console.log(res.data);
      setMessage(JSON.stringify(res.data));
    })
  };

  function handleLoginWithGoogle() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://vlonajszwfffdquudvfa.supabase.co/auth/v1/callback"
      }
    })
  }

  return(
    <div  >
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit}>
        <Input type="text" value={username} onChange={ e => setUsername(e.target.value) } placeholder="Username" />
        <Input type="email" value={email} onChange={ e => setEmail(e.target.value) } placeholder="Email" />
        <Input type="password" value={password} onChange={ e => setPassword(e.target.value) } placeholder="Password" />
        <Button type="submit" >Register</Button>
      </form>

      <Button onPress={handleLoginWithGoogle} size="lg" color="warning" >SignIn with Google</Button>

      <p className="text-violet-500" >{message}</p>
    </div>
  )
}