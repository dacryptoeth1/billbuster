import { errorResponse } from "@/lib/api";

/**
 * Returns a short-lived signed URL for the ElevenLabs "Pat" agent, so the API key
 * never reaches the browser. Signed URLs use WebSocket, which tends to survive
 * restrictive venue Wi-Fi better than WebRTC.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return errorResponse("Voice practice isn't set up on this server yet.", 503);
  }

  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", agentId);

  try {
    const res = await fetch(url, { headers: { "xi-api-key": apiKey }, cache: "no-store" });
    if (!res.ok) {
      console.warn("ElevenLabs signed URL request failed:", res.status, await res.text());
      return errorResponse("Couldn't reach the practice agent. Please try again.", 502);
    }
    const { signed_url: signedUrl } = (await res.json()) as { signed_url: string };
    return Response.json({ signedUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("ElevenLabs request error:", err instanceof Error ? err.message : err);
    return errorResponse("Couldn't reach the practice agent. Please try again.", 502);
  }
}
