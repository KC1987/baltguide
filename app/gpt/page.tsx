"use client";

import OpenAI from "openai";
import { useState } from "react";
import { Button } from "@heroui/react";
import { CircularProgress } from "@heroui/react";
import { Input } from "@heroui/react";

export default function Page() {
  const gpt = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_CHATGPT_SECRET_KEY,
    dangerouslyAllowBrowser: true,
  });

  const [thinking, setThinking] = useState(false);

  const [inp, setInp] = useState("");
  const [res, setRes] = useState("");

  async function handleQuestion(e: any) {
    e.preventDefault();
    setThinking(true);

    const response = await gpt.responses.create({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" }],
      input: inp,
    });

    try {
      setRes(response.output_text);
      // console.log(response.output_text)

      setThinking(false);
      setInp("");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl">GPT</h1>
      <form onSubmit={handleQuestion}>
        <Input value={inp} onChange={(e) => setInp(e.target.value)} />
        <div className="flex">
          <Button type="submit" variant="ghost">
            Submit
          </Button>
          {thinking && <CircularProgress />}
        </div>
        <h1 className="text-lg">{res}</h1>
      </form>
    </div>
  );
}
