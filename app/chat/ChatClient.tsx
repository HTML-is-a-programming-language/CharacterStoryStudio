"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ConversationMessage } from "../../src/pipeline/types";
import { sendChatMessage } from "./actions";

export function ChatClient({
  characterName,
  initialSuggestedLine,
}: {
  characterName: string;
  initialSuggestedLine: string | null;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState(initialSuggestedLine ?? "");
  const [finished, setFinished] = useState(initialSuggestedLine === null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    const text = input.trim();
    if (!text || finished || isPending) {
      return;
    }

    startTransition(async () => {
      const { userMessage, characterReply, nextSuggestedLine } = await sendChatMessage(messages, text);

      setMessages((prev) => (characterReply ? [...prev, userMessage, characterReply] : [...prev, userMessage]));

      if (!characterReply || nextSuggestedLine === null) {
        setFinished(true);
        setInput("");
        return;
      }
      setInput(nextSuggestedLine);
    });
  }

  return (
    <div className="mt-8">
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              message.role === "character"
                ? "bg-white/10 text-white"
                : "ml-auto bg-pink-400/20 text-pink-100"
            }`}
          >
            {message.role === "character" && (
              <p className="mb-1 text-xs text-white/50">{characterName}</p>
            )}
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      {finished ? (
        <div className="mt-6 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <p>대화를 마쳤어요.</p>
          <Link href="/" className="mt-2 inline-block font-medium text-emerald-100 hover:underline">
            이 대화로 컨셉 만들러 가기 →
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSend();
              }
            }}
            disabled={isPending}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || input.trim().length === 0}
            className="rounded-lg bg-pink-400/20 px-4 py-2 text-sm font-medium text-pink-100 hover:bg-pink-400/30 disabled:opacity-40"
          >
            {isPending ? "..." : "보내기"}
          </button>
        </div>
      )}
    </div>
  );
}
