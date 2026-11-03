/**
 * Checks PayPal credentials by requesting an OAuth token. The token is never printed.
 * Usage: npm run paypal:check   (reads PAYPAL_* from .env; see .env.example)
 */

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    throw new Error("No .env file found. Copy .env.example to .env and fill in the PAYPAL_* values.");
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL;
  const missing = Object.entries({
    PAYPAL_CLIENT_ID: clientId,
    PAYPAL_CLIENT_SECRET: clientSecret,
    PAYPAL_BASE_URL: baseUrl,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) throw new Error(`Missing in .env: ${missing.join(", ")}`);

  const res = await fetch(`${baseUrl!.replace(/\/+$/, "")}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`);

  let token: unknown;
  try {
    token = JSON.parse(body).access_token;
  } catch {
    // Handled by the check below; a 200 that isn't JSON means the wrong host, not a good login.
  }
  if (!token) throw new Error(`HTTP ${res.status} but the response has no access_token`);

  console.log("PayPal auth OK");
}

main().catch((err) => {
  const cause = err instanceof Error && err.cause instanceof Error ? ` (${err.cause.message})` : "";
  console.error(`PayPal auth failed: ${err instanceof Error ? err.message : err}${cause}`);
  process.exit(1);
});
