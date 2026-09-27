/** Round to cents to avoid floating-point noise in money math. */
export function toCents(n: number) {
  return Math.round(n * 100) / 100;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(n: number) {
  return usd.format(n);
}
