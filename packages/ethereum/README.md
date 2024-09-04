# Ethereum Sample Contract

This package contains a sample Ethereum contract that implements the Verite Smart Contract Patterns as designed by Centre (now Circle).

The contract is intended to demonstrate this pattern with a minimal solution. The sample `TestRegistry` simply inherits from the `VerificationRegistry` reference contract provided by Verite. Additionally, a single `validate` method is defined, allowing a Dapp to call it with a VerificationResult and the signature, both values returned from the Verifier.

If the trusted verifier is recovered from the verification result and signature, the method completes successfully. Otherwise, it'll throw an exception. A production system would need to perform these checks ahead of any privileged method call.

## E2E Demo

There are two ways to exercise this contract and demonstrate e2e acceptance:

1. The [`packages/ethereum-dapp`](https://github.com/circlefin/verifier/tree/master/packages/ethereum-dapp) can be used for e2e acceptance. This is a streamlined example that mocks out the issuer and wallet in the browser.
2. You can find instructions for how to [integrate with the Verite samples provided by Centre (now Circle)](https://github.com/circlefin/verifier/blob/master/docs/integrating_with_centre.md). Such integration demonstrates E2E of the verifier, while also demonstrating how it can be seamlessly integrated with an existing issuer, wallet, dapp, and smart contract.

## Installation

From the root of the repository:

```
npm install
```

## Tests

Hardhat will automatically spin up an Ethereum node for testing in-memory. These tests demonstrate:

1. Deploying the contract
2. Adding a trusted verifier
3. Using the Circle verifier to generate a VerificationResult and signature
4. Successfully calling the contract with the given VerificationlResult and signature.
5. Unsuccessfully calling the contract with a bad signature

```
npm test
```

## Deployment and Managing the Registry

To deploy the contract, we need a running Ethereum node and sufficient Ethereum to pay gas. Hardhat provides us both a running node and 20 accounts with 1,000 ethereum.

### Run an ethereum node

From `packages/ethereum`, run:

```sh
npx hardhat node
```

This will start an ethereum node locally and seed some accounts to use.

### Deploy

From `packages/ethereum`, run:

```sh
npx hardhat deploy --network localhost
```

This will deploy the contract to the running Ethereum network on localhost.

### Trusted Verifiers

The sample `VerificationRegistry` contract includes on-chain persistence of a list of trusted verifiers. The contract owner can add, update, and remove verifiers.

The demo contract includes a single trusted verifier hard-coded in the deploy script. The project uses the verifier as defined in the verifier package's `.env.example`.

To get started, the contract owner would need to register Circle's ethereum address as a verifier. This step maps a verifier's ethereum address to a `VerifierInfo` object that includes a name, did, url, and the signer address. The signer must match the Ethereum public key of the signer used for verification. Otherwise, the name, did, and URL are for informational purposes only.

The contract also includes accessor methods to obtain the `VerifierInfo` object for a given ethereum address. Consequently, verifiers can be contacted out-of-band by authorities in order to provide further data associated with a particular verification.

You can find more information on the [Verite docs](https://verite.id/verite/patterns/smart-contract-verite#verifier-management)
