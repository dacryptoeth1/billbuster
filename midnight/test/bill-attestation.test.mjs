// Simulates attestBill against the compiled contract (run `npm run compile` first).
import { describe, expect, it } from "vitest";
import {
  createCircuitContext,
  createConstructorContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  OverchargeBucket,
} from "../managed/bill-attestation/contract/index.js";

const ADDRESS = "0".repeat(64);
const COIN_PUBLIC_KEY = "0".repeat(64);
const DIGEST = new Uint8Array(32).fill(7);
const RANDOMNESS = new Uint8Array(32).fill(9);

function attest(summary) {
  const contract = new Contract({
    billSummary: (ctx) => [ctx.privateState, { billDigest: DIGEST, ...summary }],
    commitmentRandomness: (ctx) => [ctx.privateState, RANDOMNESS],
  });
  const initial = contract.initialState(createConstructorContext({}, COIN_PUBLIC_KEY));
  const ctx = createCircuitContext(
    ADDRESS,
    COIN_PUBLIC_KEY,
    initial.currentContractState,
    initial.currentPrivateState,
  );
  const { context } = contract.circuits.attestBill(ctx);
  return { contract, context, state: ledger(context.currentQueryContext.state) };
}

describe("attestBill", () => {
  it.each([
    ["NONE", 0n, OverchargeBucket.NONE, false],
    ["LOW", 400n, OverchargeBucket.LOW, true], // 4% of 10000
    ["MEDIUM", 500n, OverchargeBucket.MEDIUM, true], // exactly 5%
    ["MEDIUM", 1999n, OverchargeBucket.MEDIUM, true], // just under 20%
    ["HIGH", 2000n, OverchargeBucket.HIGH, true], // exactly 20%
    ["HIGH", 10000n, OverchargeBucket.HIGH, true], // everything flagged
  ])("buckets %s (flagged=%s)", (_name, flagged, bucket, overcharge) => {
    const { state } = attest({ totalCents: 10000n, flaggedCents: flagged });
    expect(state.attested).toBe(true);
    expect(state.bucket).toBe(bucket);
    expect(state.hasOvercharge).toBe(overcharge);
    expect(state.attestationCount).toBe(1n);
  });

  it("publishes a commitment, not the bill digest or amounts", () => {
    const { state } = attest({ totalCents: 10000n, flaggedCents: 2000n });
    expect(state.commitment).toHaveLength(32);
    expect(state.commitment).not.toEqual(DIGEST);
  });

  it("hides the bill: same bill, different randomness, different commitment", () => {
    const run = (rand) => {
      const contract = new Contract({
        billSummary: (c) => [c.privateState, { billDigest: DIGEST, totalCents: 10000n, flaggedCents: 0n }],
        commitmentRandomness: (c) => [c.privateState, rand],
      });
      const init = contract.initialState(createConstructorContext({}, COIN_PUBLIC_KEY));
      const ctx = createCircuitContext(ADDRESS, COIN_PUBLIC_KEY, init.currentContractState, {});
      return ledger(contract.circuits.attestBill(ctx).context.currentQueryContext.state).commitment;
    };
    expect(run(new Uint8Array(32).fill(1))).not.toEqual(run(new Uint8Array(32).fill(2)));
  });

  it("rejects a zero bill total", () => {
    expect(() => attest({ totalCents: 0n, flaggedCents: 0n })).toThrow(/total must be positive/i);
  });

  it("rejects flagged amount above the total", () => {
    expect(() => attest({ totalCents: 100n, flaggedCents: 101n })).toThrow(/exceeds bill total/i);
  });

  it("rejects a second attestation on the same contract", () => {
    const first = attest({ totalCents: 10000n, flaggedCents: 0n });
    const ctx = createCircuitContext(
      ADDRESS,
      COIN_PUBLIC_KEY,
      first.context.currentQueryContext.state,
      first.context.currentPrivateState,
    );
    expect(() => first.contract.circuits.attestBill(ctx)).toThrow(/already holds an attestation/i);
  });
});
