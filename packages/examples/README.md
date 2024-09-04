# End To End Examples

## Getting Started

Before you run these examples, be sure to have the Verifier running:

From the root of the monorepo, run:

```sh
npm run dev
```

To build verifier

```sh
npm run build -w verifier
```

To run the issuer example:

```sh
npm run issuer -w examples
```

To run the verification example:

```sh
npm run verification -w examples
```

## Note on encryption algorithms

In these examples, we have set up so the Issuer uses ES256K (secp256k1), while
the Verifier uses EdDSA (ed25519).

## Issuer: Obtaining a Verifiable Credential

To get started, you will need a Verified Credential issued from an issuer.

In practice, the Issuer will follow the [Credential Manifest](https://identity.foundation/credential-manifest/) exchange for a wallet (subject) to receive a Verifiable Credential. We are skipping this as it is out of scope for a Verifier.

The issuer example will output an encoded/decoded Verifiable Credential, as well as an encoded/decoded Verifiable Presentation (Credential Fulfillment) that would be consumed by a Wallet.

A JWT-encoded Verifiable Credential from an issuer will look like this:

```text
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vdmVyaXRlLmlkL2lkZW50aXR5Il0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJLWUNBTUxBdHRlc3RhdGlvbiJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJLWUNBTUxBdHRlc3RhdGlvbiI6eyJAdHlwZSI6IktZQ0FNTEF0dGVzdGF0aW9uIiwicHJvY2VzcyI6Imh0dHBzOi8vY2lyY2xlLmNvbS9zY2hlbWFzL2RlZmluaXRpb25zLzEuMC4wL2t5Y2FtbC91c2EiLCJhcHByb3ZhbERhdGUiOiIyMDIyLTAyLTAyVDE1OjI0OjEzLjA0MloifX19LCJzdWIiOiJkaWQ6a2V5Ono2TWtrRFh0V2ZuWGI1QXdxS0xBUm10R1pLZFU4dFNnem9ERUNOZWZxNFFFVDZaTSIsIm5iZiI6MTY0MzgxNTQ1MywiaXNzIjoiZGlkOmtleTp6Nk1rZ3l2YTRWQXJhaUZRbWp4OGNad1RTZnNUWmltOHliZlllTE5KZFZIZG5NVlAifQ.XB60XN4JsU5-Ob4dwHTcFwS5nUqO2LsLuVMQLdG0BjZIcrFWMfmzpZccvcGOeRvdProlx7gyXQY-i4g3ms2SBw
```

A decoded version of the same credential would look like this:

TODO Fei: Make issuer and subject different https://circlepay.atlassian.net/browse/VR-93
```json
{
  "credentialSubject": {
    "KYCAMLAttestation": {
      "type": "KYCAMLAttestation",
      "process": "https://circle.com/schemas/definitions/1.0.0/kycaml/usa",
      "approvalDate": "2022-02-02T15:24:13.042Z"
    },
    "id": "did:key:z6MkkDXtWfnXb5AwqKLARmtGZKdU8tSgzoDECNefq4QET6ZM"
  },
  "issuer": {
    "id": "did:key:z6Mkgyva4VAraiFQmjx8cZwTSfsTZim8ybfYeLNJdVHdnMVP"
  },
  "type": ["VerifiableCredential", "KYCAMLAttestation"],
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://verite.id/identity"
  ],
  "issuanceDate": "2022-02-02T15:24:13.000Z",
  "proof": {
    "type": "JwtProof2020",
    "jwt": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vdmVyaXRlLmlkL2lkZW50aXR5Il0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJLWUNBTUxBdHRlc3RhdGlvbiJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJLWUNBTUxBdHRlc3RhdGlvbiI6eyJAdHlwZSI6IktZQ0FNTEF0dGVzdGF0aW9uIiwicHJvY2VzcyI6Imh0dHBzOi8vY2lyY2xlLmNvbS9zY2hlbWFzL2RlZmluaXRpb25zLzEuMC4wL2t5Y2FtbC91c2EiLCJhcHByb3ZhbERhdGUiOiIyMDIyLTAyLTAyVDE1OjI0OjEzLjA0MloifX19LCJzdWIiOiJkaWQ6a2V5Ono2TWtrRFh0V2ZuWGI1QXdxS0xBUm10R1pLZFU4dFNnem9ERUNOZWZxNFFFVDZaTSIsIm5iZiI6MTY0MzgxNTQ1MywiaXNzIjoiZGlkOmtleTp6Nk1rZ3l2YTRWQXJhaUZRbWp4OGNad1RTZnNUWmltOHliZlllTE5KZFZIZG5NVlAifQ.XB60XN4JsU5-Ob4dwHTcFwS5nUqO2LsLuVMQLdG0BjZIcrFWMfmzpZccvcGOeRvdProlx7gyXQY-i4g3ms2SBw"
  }
}
```

You can use the VC in JWT format or in JSON format, as long as it is not modified (e.g. the `proof` still holds true for the remainder of the credential).

An example of how to generate a VC is located in `examples/issuer.ts`. You can execute it by running:

```sh
npm run issuer -w examples
```

Once you have that credential, you are ready to use the Verifier service.

## Verifier: Verifying the Verifiable Credential

To verify a credential using the Circle Verifier, you must be first running the Circle Verifier service (as well as it's dependencies, such as Postgres):

```sh
npm run dev
```

Once the Verifier service is running, you can initiate a verification request.

An end-to-end example of how to Verify a credential is located in `examples/verification.ts`, and can be run by executing:

```sh
npm run verification -w examples
```

For a detailed breakdown, the following steps are performed. For the sake of clarity, we will write these requests as Node `fetch` commands:

### Step 1: Create a verification offer

A DApp who wants to verify a subject's credentials will first need to initialize a Verification Request with the Verifier service, and provide any relevant information regarding the verification (e.g. Which blockchain, which subject, etc).

It does this via the `POST /verifications` endpoint:

```ts
fetch("http://localhost:3000/verifications", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    network: "ethereum", // Assuming this is an Ethereum DApp
    subject: "0xB5de987Ccce0BD596c22939B6f1e2a124e62B232" // The client's Ethereum Address
  })
})
```

The response will look like the following:

```json
{
  "challengeTokenUrl": "http://localhost:3000/verifications/511bba1a-9606-4bb8-9440-47a704fac71a"
}
```

The dapp will take this response and present it to the end-user (aka "client" or "subject"), often times as a QR Code.

This `challengeTokenUrl` (as defined in Verite's [Verification Flow](https://verite.id/docs/patterns/verification-flow#verification-flow) document) contains the instructions for how the client wallet will present their required Verifiable Credentials, as described below:

### Step 2: Client Wallet fetches the challengeTokenUrl

In order to submit a credential for verification, the client needs to understand what parameters are required. The Verifier service describes this at the `challengeTokenUrl`.

It does this via the `GET /verifications/[id]` endpoint:

```ts
fetch(
  "http://localhost:3000/verifications/511bba1a-9606-4bb8-9440-47a704fac71a", // challengeTokenUrl from above
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }
)
```

The response body for this endpoint is a large Verification Offer object, which looks like the following:

```json
{
  "id": "090ea51c-6802-417e-83c3-8a77081d7a0f",
  "type": "https://circle.com/types/VerificationRequest",
  "from": "did:web:circle.com",
  "created_time": "2022-02-02T16:30:39.554Z",
  "expires_time": "2022-03-04T16:30:39.554Z",
  "reply_url": "http://localhost:3000/verifications/090ea51c-6802-417e-83c3-8a77081d7a0f",
  "body": {
    "status_url": "http://localhost:3000/verifications/090ea51c-6802-417e-83c3-8a77081d7a0f/status",
    "challenge": "043081eb-67bd-4d38-94e1-cd9c59204cc4",
    "presentation_definition": {
      "id": "090ea51c-6802-417e-83c3-8a77081d7a0f",
      "input_descriptors": [
        {
          "id": "kycaml_input",
          "name": "Proof of KYC",
          "schema": [
            {
              "uri": "https://circle.com/schemas/identity/1.0.0/KYCAMLAttestation",
              "required": true
            }
          ],
          "purpose": "Please provide a valid credential from a KYC/AML issuer",
          "constraints": {
            "fields": [
              {
                "path": ["$.issuer.id", "$.issuer", "$.vc.issuer", "$.iss"],
                "purpose": "The issuer of the credential must be trusted",
                "predicate": "required"
              },
              {
                "path": [
                  "$.credentialSubject.KYCAMLAttestation.process",
                  "$.vc.credentialSubject.KYCAMLAttestation.process",
                  "$.KYCAMLAttestation.process"
                ],
                "filter": {
                  "type": "string"
                },
                "purpose": "The process used for KYC/AML.",
                "predicate": "required"
              },
              {
                "path": [
                  "$.credentialSubject.KYCAMLAttestation.approvalDate",
                  "$.vc.credentialSubject.KYCAMLAttestation.approvalDate",
                  "$.KYCAMLAttestation.approvalDate"
                ],
                "filter": {
                  "type": "string",
                  "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$"
                },
                "purpose": "The date upon which this KYC/AML Attestation was issued.",
                "predicate": "required"
              }
            ],
            "statuses": {
              "active": {
                "directive": "required"
              },
              "revoked": {
                "directive": "disallowed"
              }
            },
            "is_holder": [
              {
                "field_id": ["subjectId"],
                "directive": "required"
              }
            ]
          }
        }
      ]
    }
  }
}
```

Once the client wallet has this response body, it has all the information it needs to construct a proper submission for verification.

### Step 3: Submitting a credential

Once the client wallet has fetched the Verification Offer, it can submit the relevant credential(s) for verification.

To submit a Verifiable Credential, the subject MUST wrap the Verifiable Credential in a Verifiable Presentation. This achieves two goals:

1. The Verifiable Credential is preserved (not tampered) with, and the signature is in tact.
2. By signing an outer Presentation, the Client can prove they hold the Verifiable Credential and that it was assigned to them.

Once the client builds this Verifiable Presentation and signs it, it can submit it for verification as a JWT string.

It does this via the `POST /verifications/[id]` endpoint:

```js
fetch(json2.reply_url, {
  method: "POST",
  headers: {
    "Content-Type": "text/plain"
  },
  body: verifiablePresentationJWT
})
```

The response for a successful submission will look like the following:

```json
{
  "status": "success",
  "verificationResult": {
    "schema": "",
    "subject": "0xB5de987Ccce0BD596c22939B6f1e2a124e62B232",
    "expiration": 1643906776
  },
  "signature": "0xccaa723d0aba24f5349d928ccfff2c8cda8592e6db9ddc3d6bb5d73a70b2205a38b6927fb068d66ef02169c6dae76263b400dbc22ccd2d65d45cb4d1928e6bfe1c"
}
```
