# Solana E2E Demo

This project was bootstrapped with [Create React App Starter](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/create-react-app-starter).

## Installation

From the root of the repository:

```sh
npm install
```

## Setup

This dapp requires a running validator and the program deployed. You can find [instructions for how to do that](https://github.com/circlefin/verifier/blob/master/packages/solana/README.md#deployment) in the `solana` package.

You should also start an instance of the verifier on port 3000 (the default) found in [packages/verifier](https://github.com/circlefin/verifier/tree/master/packages/verifier).

## Anchor

The Anchor client requires an IDL of the program. It has already been included at `src/idl.json` and the project should work as-is. If you make changes to the contract interface or its program address, the file will need to be updated. If you make no changes, you can ignore these instructions.

Each time the Anchor project is built, the IDL is updated. It can be found at `/packages/solana/target/idl/verity.json` and should be copied to `/packages/solana-dapp/src/idl.json`. However, the `metadata.address` attribute, identifying the address of the program, is only included after the Anchor project is deployed. If it is not there, you'll need to manually add it back.

## Run the app

It is recommended to run it on port 3001 as we'll run the verifier on port 3000.

```sh
PORT=3001 npm start
```

Open [http://localhost:3001](http://locahost:3001) with your browser to try the demo.
