# BillBuster × Midnight

`contracts/bill-attestation.compact` lets a user prove a medical bill was checked
(and whether an overcharge was flagged) without revealing the diagnosis, provider,
or line items. Bill data is a private witness; the public ledger only stores a
hiding commitment, a boolean verdict, and a coarse overcharge bucket.

Compile (Linux/macOS/WSL, compiler 0.31.1):

    compact update 0.31.1
    compact compile contracts/bill-attestation.compact managed/bill-attestation

Test (simulates `attestBill` for every bucket and the invalid inputs):

    npm install
    npm test

CI compiles and tests the contract on every push. License: Apache-2.0.
