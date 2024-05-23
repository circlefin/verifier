# Verification Service

Verification API service in accordance with the Verite Smart Contract Patterns as designed by Centre (now Circle).

## Install Dependencies

Install Node through nvm. We should use the node version that matches the docker container in production boxes.

```bash
brew install nvm;
nvm install v14.20.0;
nvm use v14.20.0
````

Upgrade `npm`:

`npm install -g npm --force`

Start the dependencies including the database:

`./docker-dependencies.sh`

Migrate the database:

`./rebuild-db.sh`

## Server local setup

This repository is organized as a mono-repo, using [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) (which requires npm v7 or greater).
As such, the dependencies for all included packages are installed from the root level using npm install. Do not run npm install from a package's directory.

### For running verifier server only
This will only run the verifier server.

##### Install dependencies
From the root of the monorepo, run:
```sh
npm install -w verifier
```

If there is database schema changes, the following command is also needed in order to let Prisma to  generate codes:
```sh
npm run build -w verifier
```

##### Local Development
Start the server through `nodemon` which will auto-compile + rerun upon changes:
```sh
npm run dev -w verifier
```

##### Production
Compile the Javascript files and start the server from the Javascript files:
```sh
npm run build -w verifier
npm start -w verifier
```

##### Testing
```sh
npm test -w verifier
```

## For running the full stack
This will run all the services under the `packages` folder including starting local blockchain.

##### Setup and install dependencies
From the root of the monorepo, run:
```sh
npm run setup
```

This `setup` command only needs to be run once when the project is first being set up.

##### Local Development

```sh
npm run dev
```

##### Production

```sh
npm run build
npm start
```

##### Testing

```sh
npm test
```

## E2E Examples


The Verite Verifier is simply a verifier. At minimum, demos should demonstrate verification of an already issued credential and finally demonstrate that it could be used on chain with a minimal contract. Consequently, this project does not include an issuer or identity wallet. Instead, e2e demos create and present credentials as needed. Additionally, contracts are designed to demonstrate the verification behavior, without any particular utility.

There are automated tests demonstrating the behaviors of the service end-to-end across both [Ethereum](https://github.com/circlefin/verifier/tree/master/packages/ethereum) and [Solana](https://github.com/circlefin/verifier/tree/master/packages/solana) blockchains. These projects' test cases include VerificationResults and signatures generated from the verifier to demonstrate end-to-end success.

Additionally, we have provided several additional examples of end-to-end behavior. These include 1) an [end-to-end example of issuance and verification using generic JWT libraries](https://github.com/circlefin/verifier/tree/master/packages/examples), which can be used to port these behvaiors to other languages such as Java or Python, 2) documentation for how to [replace the Verite reference project's verifier with Circle's](https://github.com/circlefin/verifier/blob/master/docs/integrating_with_centre.md), and and finally 3) a [sample ethereum dapp](https://github.com/circlefin/verifier/tree/master/packages/ethereum-dapp) and [sample Solana dapp](https://github.com/circlefin/verifier/tree/master/packages/solana-dapp) that demonstrates E2E the behavior across both blockchains.

## E2E Examples using standard JWTs

The Verite project uses [did-jwt-vc](https://github.com/decentralized-identity/did-jwt-vc) to create VCs and VPs as JWTs. While this library is very useful, other implementations might not be written in javascript or may wish to implement their own solution.

We have provided end-to-end examples using standard JWT libaries so teams can easily recreate the expected behaviors. An end-to-end example, which simulates an Issuer and performs verification, is located in [./packages/examples](https://github.com/circlefin/verifier/tree/master/packages/examples).

## E2E Examples

The project includes several end-to-end examples. First, there are two end-to-end examples featuring a Dapp that interacts with the verifier, one for Ethereum and another for Solana. These demos feature the verifier and a minimal implementation of the verification registry using a mocked out issuer and wallet. Additionally, the project includes instructions for how to integrate the verifier with the demos found in the [Verite project](https://github.com/centrehq/verite). Integration with the verite project demonstrates full end-to-end behavior of the Circle Verifier in combination with an issuer, mobile wallet, dapp, and a smart contract. Finally, end-to-end behavior of the Circle Verifier is demonstrated using node. The node scripts specifically demonstrate how both an issuer and verifier can encode Verifiable Credentials and Verifiable Presentations to conform to the Verite spec without using specialized libraries such as did-jwt-vc. This example should be sufficient documentation if attempting to implement these demos in another language or framework, such as Java.

1. Example [Ethereum Dapp](https://github.com/circlefin/verifier/tree/master/packages/ethereum-dapp) that uses a locally deployed [Ethereum contract](https://github.com/circlefin/verifier/tree/master/packages/ethereum) to demonstrate e2e acceptance of the project on the Ethereum blockchain.
1. Example [Solana Dapp](https://github.com/circlefin/verifier/tree/master/packages/solana-dapp) that uses a locally deployed [Solana contract](https://github.com/circlefin/verifier/tree/master/packages/solana) to demonstrate e2e acceptance of the project on the Solana blockchain.
1. [Integrating with Centre (now Circle)'s Open Source Verite Project](https://github.com/circlefin/verifier/blob/master/docs/integrating_with_centre.md) documentation demonstrates how the Circle Verifier can be easily replaced within a complete ecosystem. Using Verite's issuer, wallet, dapp, and contract -- we demonstrate that the verifier can be easily substituted for the Circle implementation. This demonstrates e2e acceptance of the project on the Ethereum blockchain.
1. [Node Examples](https://github.com/circlefin/verifier/tree/master/packages/examples) that exercise the Circle Verifier while also demonstrating how to encode a Verifiable Credential and Verifiable Presentation JWTs without using a specialized library.

## Packages

This library is organized into several packages, located in the `packages` directory.

| package                                                                                          | description                                        |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [verifier](https://github.com/circlefin/verifier/tree/master/packages/verifier)                  | Verification Service API                           |
| [ethereum](https://github.com/circlefin/verifier/tree/master/packages/ethereum)                  | Ethereum Contract                                  |
| [ethereum-dapp](https://github.com/circlefin/verifier/tree/master/packages/ethereum-dapp)        | Ethereum E2E Demo                                  |
| [solana](https://github.com/circlefin/verifier/tree/master/packages/solana)                      | Solana Program                                     |
| [solana-dapp](https://github.com/circlefin/verifier/tree/master/packages/solana-dapp)            | Solana E2E Demo                                    |
| [examples](https://github.com/circlefin/verifier/tree/master/packages/examples)                  | Example code for interacting with the Verifier API |

## API Documentation

See [docs/API.md](https://github.com/circlefin/verifier/tree/master/docs/API.md)

## Integrating with Centre (now Circle) Verite open-source

See [docs/integrating_with_centre.md](https://github.com/circlefin/verifier/tree/master/docs/integrating_with_centre.md)
