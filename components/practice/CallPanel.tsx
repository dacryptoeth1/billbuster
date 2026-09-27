"use client";

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { getVoiceSession } from "@/lib/client";
import { Alert } from "@/components/Alert";

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

  const statusText = live
    ? isSpeaking
      ? "Pat is talking…"
      : "Your turn. Pat is listening."
    : connecting
      ? "Calling…"
      : "Ready when you are";

  return (
    <section className="overflow-hidden rounded-3xl bg-ink text-white shadow-xl">
      <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
        <Avatar speaking={live && isSpeaking} live={live} />
        <p className="mt-5 font-display text-2xl font-bold">Pat</p>
        <p className="text-white/70">Patient billing</p>
        <p className="mt-3 h-6 font-mono text-lg tabular-nums" aria-live="off">
          {live ? <CallTimer /> : null}
        </p>
        <p className="text-sm text-white/80" aria-live="polite">
          {statusText}
        </p>

        {live ? (
          <HangUpButton onClick={() => conversation.endSession()} />
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={connecting}
            className="btn mt-7 bg-[#0b7a45] px-8 text-white hover:bg-[#096a3b]"
          >
            <PhoneIcon />
            {connecting
              ? "Calling…"
              : error
                ? "Try again"
                : transcript.length
                  ? "Call again"
                  : "Start practice call"}
          </button>
        )}

        {error && (
          <div className="mt-5 w-full max-w-md text-left">
            <Alert tone="notice">
              {error} You can still practice: read your talking points out loud as if you were on the call.
            </Alert>
          </div>
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
    <div className="relative grid size-28 place-items-center">
      {speaking && (
        <>
          <span className="absolute inset-0 rounded-full bg-money/60 [animation:ring_1.6s_ease-out_infinite]" />
          <span className="absolute inset-0 rounded-full bg-money/60 [animation:ring_1.6s_ease-out_0.8s_infinite]" />
        </>
      )}
      <span
        className={`relative grid size-28 place-items-center rounded-full font-display text-5xl font-extrabold transition-colors ${
          live ? "bg-money text-white" : "bg-white/15 text-white/80"
        }`}
      >
        P
      </span>
    </div>
  );
}

/** mm:ss since this component mounted (it mounts when the call connects). */
function CallTimer() {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.floor((now - startedAt) / 1000);
  return <>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</>;
}

function HangUpButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn mt-7 bg-pen px-8 text-white hover:bg-[#b42318]">
      <PhoneIcon className="rotate-[135deg]" />
      End call
    </button>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={`size-5 ${className}`}>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z" />
    </svg>
  );
}

function Transcript({ lines }: { lines: Line[] }) {
  return (
    <ol className="max-h-80 space-y-2 overflow-y-auto bg-white/5 px-5 py-4 text-sm" aria-live="polite">
      {lines.map((line, i) => (
        <li key={i} className={line.role === "user" ? "text-right" : ""}>
          <span
            className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-left ${
              line.role === "user" ? "bg-white text-ink" : "bg-white/15 text-white"
            }`}
          >
            {line.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
