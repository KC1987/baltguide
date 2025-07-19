"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { createClient } from "@/config/supabase/client";

export default function Page() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    supabase.auth
      .signInWithPassword({
        email,
        password,
      })
      .then((res) => {
        res.data.user && router.push("/account/profile");
      });
  }

  return (
    <div>
      <form onSubmit={handleLogin}>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button color="danger" type="submit">
          Login
        </Button>
      </form>
    </div>
  );
}
