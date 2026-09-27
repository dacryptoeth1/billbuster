/** Shared helpers for route handlers. */

export function errorResponse(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}
