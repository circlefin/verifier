# Solana

This package contains a Solana program that demonstrates how an on-chain program can verify a Verification Result that was verified off-chain.

Similar to EIP-712, a verifier will sign a message using secp256k1, including both a Verification Result and a domain separator. The on-chain program can then recover the public key of the signer. If the recovered address is a known verifier, the given Verification Result can be trusted. The program performs several checks including 1) the subject is a signer, 2) the result is not expired, 3) the schema is for KYC, and 4) the domain separator is correct.

## Installation

From the root of the repository:

```
npm install
```

You must install rust, solana, and anchor. You can find instructions at the [Anchor Book](https://book.anchor-lang.com/chapter_2/installation.html). The Anchor Book is a new project, so if the link is broken you might try their old guide on [Installing Dependencies](https://project-serum.github.io/anchor/getting-started/installation.html). Note that the Anchor project prefers Yarn, but this project uses npm.

## Tests

```
anchor test
```

## Deployment

To deploy the program, we need a running validator and sufficient SOL to pay transaction fees.

### Run a validator

```sh
solana-test-validator
```

### Request SOL from Faucet

Deploying the program will cost SOL in transaction fees. You can only request a few at a time, so run this command a few times to get a good amount.

```sh
solana airdrop 2
```

### Deploy

Deploy the program. You can deploy repeatedly at the same address, so run this as often as you wish.

```sh
npm run deploy -w solana
```

## Trusted Verifiers

The demo program includes a single trusted verifier hard-coded in the program. A registry, at its choosing, could store a list of trusted verifiers on-chain with instructions to manage its state.

The project uses the verifier as defined in the verifier package's `.env.example`. If you wanted to use a different validator, we have provided a Hardhat task to generate an appropriate secp256k1 public key for the Solana contract. You will need to run the following command from the `/packages/ethereum` directory. Simply provide the private key, with or without the hex prefix, to the `secp256k1pubkey` task to return the result. Below is an example.

```
[/verifier/packages/ethereum] npx hardhat secp256k1pubkey 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Public Key (uncompressed):  Uint8Array(64) [
  131,  24,  83,  91,  84,  16, 93,  74, 122, 174,  96,
  192, 143, 196,  95, 150, 135, 24,  27,  79, 223, 198,
   37, 189,  26, 117,  63, 167, 57, 127, 237, 117,  53,
   71, 241,  28, 168, 105, 102, 70, 242, 243, 172, 176,
  142,  49,   1, 106, 250, 194, 62,  99,  12,  93,  17,
  245, 159,  97, 254, 245, 123, 13,  42, 165
]
```

## Expiration

Expiration is enforced using the [Clock Sysvar](https://docs.solana.com/developing/runtime-facilities/sysvars#clock). It includes an estimated wall-clock as a unix timestamp. It is important to note that javascript uses millisecond precision wheras unix timestamps are in seconds.

## Domain Separator

The sample Solana program includes a domain separator including a name, version, and cluster. The program enforces all three values, however the fields are optional and should be implemented as appropriate by contract authors. The cluster property is highly recommended so as to ensure that verification results from a test environment cannot be escalated to a production one.

EIP-712 includes the chainId in the domain descriminator to define the network. It is formally defined in [EIP-155](https://eips.ethereum.org/EIPS/eip-155). There is no formal definition of the different clusters on Solana so it is up to verifiers, program authors, and the community to define things. However, localnet, devnet, testnet, and mainnet-beta might be good choices.

You can read more about domain separators on [EIP-712](https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator).
