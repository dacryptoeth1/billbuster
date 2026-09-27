"use client";

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { getVoiceSession } from "@/lib/client";

type Props = { dynamicVariables: Record<string, string> };
type Line = { role: "user" | "agent"; text: string };

const CONNECT_TIMEOUT_MS = 15_000;

export function CallPanel(props: Props) {
  return (
    <ConversationProvider>
      <Call {...props} />
    </ConversationProvider>
  );
}

function Call({ dynamicVariables }: Props) {
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const wasConnected = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      wasConnected.current = true;
    },
    onMessage: ({ role, message }) => setTranscript((t) => [...t, { role, text: message }]),
    onError: (message) => {
      console.warn("Voice session error:", message);
      setError(wasConnected.current ? "The call dropped." : "Couldn't connect to Pat.");
    },
  });
  const { status, isSpeaking } = conversation;
  const endSession = useRef(conversation.endSession);
  useEffect(() => {
    endSession.current = conversation.endSession;
  });
  const connecting = preparing || status === "connecting";
  const live = status === "connected";

  // Don't leave the user staring at "Connecting…" forever.
  useEffect(() => {
    if (status !== "connecting") return;
    const timer = setTimeout(() => {
      endSession.current();
      setError("Couldn't connect to Pat.");
    }, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  async function start() {
    setError("");
    setTranscript([]);
    wasConnected.current = false;
    setPreparing(true);
    try {
      await requestMicrophone();
      const signedUrl = await getVoiceSession();
      conversation.startSession({ signedUrl, dynamicVariables });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the call.");
    } finally {
      setPreparing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col items-center py-6 text-center">
        <Avatar speaking={live && isSpeaking} live={live} />
        <p className="mt-4 font-semibold">Pat, Billing Department</p>
        <p className="text-sm text-slate-500">
          {live
            ? isSpeaking
              ? "Pat is speaking…"
              : "Listening to you…"
            : connecting
              ? "Connecting…"
              : "Ready when you are"}
        </p>

        {live ? (
          <button
            type="button"
            onClick={() => conversation.endSession()}
            className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
          >
            End call
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={connecting}
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
          >
            {connecting
              ? "Connecting…"
              : error
                ? "Try again"
                : transcript.length
                  ? "Call again"
                  : "Start practice call"}
          </button>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {error}
            <span className="mt-1 block">
              You can still practice: read your talking points out loud as if you were on the call.
            </span>
          </p>
        )}
      </div>

      {transcript.length > 0 && <Transcript lines={transcript} />}
    </section>
  );
}

async function requestMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    throw new Error(
      "Microphone access is needed for the practice call. Allow it in your browser and try again.",
    );
  }
}

function Avatar({ speaking, live }: { speaking: boolean; live: boolean }) {
  return (
    <div className="relative grid size-24 place-items-center">
      {speaking && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />}
      <span
        className={`relative grid size-24 place-items-center rounded-full text-3xl font-semibold text-white ${
          live ? "bg-emerald-600" : "bg-slate-400"
        }`}
      >
        P
      </span>
    </div>
  );
}

function Transcript({ lines }: { lines: Line[] }) {
  return (
    <ol
      className="max-h-80 space-y-2 overflow-y-auto border-t border-slate-200 pt-4 text-sm"
      aria-live="polite"
    >
      {lines.map((line, i) => (
        <li key={i} className={line.role === "user" ? "text-right" : ""}>
          <span
            className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-left ${
              line.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100"
            }`}
          >
            {line.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
