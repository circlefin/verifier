# Ethereum E2E Demo

This is a [Next.js](https://nextjs.org/) project bootstrapped with Solana's [`nextjs-starter`](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/nextjs-starter). While it was bootstrapped using a Solana starter, the resulting dapp is for Ethereum.

## Installation

From the root of the repository:

```sh
npm install
```

The dapp requires an ABI of the deployed contract. It is already included at `lib/TestRegistry.json`. If you make changes to the contract's ABI, this file will need to be updated.

The dapp is hardcoded with a contract address of `0x5FbDB2315678afecb367f032d93F642f64180aa3`. This will be the correct address if it is the first contract deployed on a localhost network hosted by hardhat.

No gas is required to exercise this demo. Since no state is changed, the transaction can be simulated and is free.

## Setup

This dapp requires a running ethereum node and the contract deployed. You can find [instructions for how to do that](https://github.com/circlefin/verity-verifier/blob/master/packages/ethereum/README.md#deployment-and-managing-the-registry) in the `ethereum` package.

The issuer in this demo is `did:key:z6MknHapzEyBbfzUr6n8nxwQhAwFpPM4NBEEUwja2XtAXubF` and needs to be added as a trusted issuer in the verifier. Update `packages/verifier/.env` to include the issuer:

```
TRUSTED_ISSUERS="^did:key:z6MknHapzEyBbfzUr6n8nxwQhAwFpPM4NBEEUwja2XtAXubF$"
```

You should also start an instance of the verifier on port 3000 (the default) found in [packages/verifier](https://github.com/circlefin/verity-verifier/tree/master/packages/verifier#quick-start).

## Getting Started

It is recommended to run it on port 3001 as we'll run the verifier on port 3000.

```sh
PORT=3001 npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to try the demo. Be sure your Metamask is configured to use localhost.
