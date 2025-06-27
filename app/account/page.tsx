"use client"

import { useRouter } from "next/navigation";
import { useContext } from "react";

import { AuthContext } from "@/contexts/AuthContext";

import { Button } from "@heroui/button"
import { createClient } from "@/config/supabase/client"

export default function Page() {
  const router = useRouter();
  const supabase = createClient();

  const { session, user, loading } = useContext(AuthContext);

  return (
    <div>
      <h1>User: {user?.email}</h1>
      <Button onPress={() => {
        supabase.auth.signOut()
          .then( res => router.push("/login") )
      }} >Sign Out</Button>
    </div>
  )
}