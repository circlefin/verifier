# API Routes

The API routes are defined in [`packages/verifier/src/lib/routes.ts`](https://github.com/circlefin/verifier/blob/master/packages/verifier/src/lib/routes.ts).

## General

Unless otherwise stated, all API endpoints accept and respond with JSON.

All endpoints include security-focused headers provided by [helmet](https://helmetjs.github.io/). Specifically, helmet adds the following response headers:

| Header                            | Value                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content-Security-Policy           | `default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests` |
| X-DNS-Prefetch-Control            | `off`                                                                                                                                                                                                                                                              |
| Expect-CT                         | `max-age=0`                                                                                                                                                                                                                                                        |
| X-Frame-Options                   | `SAMEORIGIN`                                                                                                                                                                                                                                                       |
| Strict-Transport-Security         | `max-age=15552000; includeSubDomains`                                                                                                                                                                                                                              |
| X-Download-Options                | `noopen`                                                                                                                                                                                                                                                           |
| X-Content-Type-Options            | `nosniff`                                                                                                                                                                                                                                                          |
| X-Permitted-Cross-Domain-Policies | `none`                                                                                                                                                                                                                                                             |
| Referrer-Policy                   | `no-referrer`                                                                                                                                                                                                                                                      |
| X-XSS-Protection                  | `0`                                                                                                                                                                                                                                                                |

## Error Formats

All error responses are in the following format, which supports multiple errors per response:

```json
{
  "status": "400",
  "errors": [
    {
      "message": "A human readable error message",
      "details": "Optional human readable explanation of the error"
    }
  ]
}
```

## Endpoints

- [GET /ping](https://github.com/circlefin/verifier/blob/master/docs/API.md#get-ping)
- [POST /verifications](https://github.com/circlefin/verifier/blob/master/docs/API.md#post-verifications)
- [GET /verifications/:id](https://github.com/circlefin/verifier/blob/master/docs/API.md#get-verificationsid)
- [POST /verifications/:id](https://github.com/circlefin/verifier/blob/master/docs/API.md#post-verificationsid)
- [GET /verifications/:id/status](https://github.com/circlefin/verifier/blob/master/docs/API.md#get-verificationsidstatus)

---

### `GET /ping`

**Description:** Health Check. This endpoint provides a general health-check, responding with “ok” when the service is running.

**Sample route:** `https://verifier.circle.com/ping`

#### Response

- Content-Type: `application/json`
- Sample Response Body:

```json
{ "status": "ok" }
```

---

### `POST /verifications`

**Description:** Create a new verification offer. This is the first step in the [verification flow](https://verite.id/docs/patterns/verification-flow#verification-flow). This endpoint is called by a 3rd party service (for example, a dApp) and returns a `challengeTokenUrl` , which will be presented to the end-user (for example, as a QR code). The `challengeTokenUrl` will contain the verification offer for the end-user to access. The response also contains `statusUrl` which the dApp can poll to check the status of the verification.

There are four optional parameters: chainId, name, version, and registryAddress. These correspond to the [EIP-712 domain separator](https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator). While these parameters are optional, their necessity is dependent on the specific implementation of the smart contract you intend to interact with. To provide the most support, the Verifier API allows you to set them as needed. However, if using the sample Verite smart contracts, e.g. as is the [TestRegistry](https://github.com/circlefin/verifier/blob/master/packages/ethereum/contracts/TestRegistry.sol), all the parameters will be required.

This endpoint requires the dApp to know the end-user’s address, so it will likely be called after the end-user’s wallet is connected.

**Sample route:** `https://verifier.circle.com/verifications`

#### Request

- Content-Type: `application/json`
- Parameters:
  | Parameter | Required? | Description |
  |-------------------|-----------|--------------------------------------------------------------|
  | `network` | Yes | The network where the verification result will be used. Can be either `ethereum` or `solana`. |
  | `subject` | Yes | The end-user’s address on the `network`, either an Ethereum address or a Solana address. |
  | `chainId` | No | For ethereum, the chainId used in the contract's EIP-712 domain separator, e.g. `1` for mainnet. If using localhost, you will use `1337` with hardhat. See [a list of chain IDs](https://docs.metamask.io/guide/ethereum-provider.html#chain-ids). For solana, this value can be `mainnet-beta`, `devnet`, `testnet`, or `localnet`. |
  | `name` | No | The name used in the contract's EIP-712 domain separator. Defaults to "VerificationRegistry" as found in the Verite reference contracts.
  | `version` | No | The version used in the contract's EIP-712 domain separator. Defaults to "1.0" as found in the Verite reference contracts.
  | `registryAddress` | No | The verifyingContract used in the contractor's EIP-712 domain separator. This is the address of the deployed registry. Only used for `ethereum` |
- Sample Ethereum Body using [TestRegistry](https://github.com/circlefin/verifier/blob/master/packages/ethereum/contracts/TestRegistry.sol):

```json
{
  "network": "ethereum",
  "subject": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "chainId": 1337,
  "name": "VerificationRegistry",
  "version": "1.0",
  "registryAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}
```

- Sample Solana Body using [verite program](https://github.com/circlefin/verifier/blob/master/packages/solana/programs/verity/src/lib.rs):

```json
{
  "network": "solana",
  "subject": "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV",
  "chainId": "localnet",
  "name": "VerificationRegistry",
  "version": "1.0"
}
```

#### Response

- Content-Type: `application/json`
- Response Body:
  | Parameter | Description |
  |---------------------|--------------------------------------------------------------|
  | `challengeTokenUrl` | The endpoint containing the Verification Offer for the end-user’s wallet. A dApp will provide this URL to an end-user, for example as part of a QR Code. |
  | `statusUrl` | An endpoint to check the status of the Verification, since the Verification is asynchronous from the dApp. This URL can be used by the dApp to check the status of the Verification and to update the UI accordingly. |
- Sample Body:

```json
{
  "challengeTokenUrl": "https://verifier.circle.com/verifications/a678bf0f-7f72-424d-b920-0af3f040b620",
  "statusUrl": "https://verifier.circle.com/verifications/a678bf0f-7f72-424d-b920-0af3f040b620/status"
}
```

---

### `GET /verifications/:id`

**Description:** This endpoint presents the Verification Offer to the end-user. The Verification Offer describes to an end-user’s Wallet which type of Verifiable Credential is required. This is not intended for human consumption.

**Sample route:** `https://verifier.circle.com/verifications/a678bf0f-7f72-424d-b920-0af3f040b620`

#### Request

| Parameter | Required? | Description                 |
| --------- | --------- | --------------------------- |
| `id`      | Yes       | The id of the Verification. |

#### Response

- Content-Type: `application/json`
- Sample Body:

```json
{
  "id": "74c9e731-bbe6-42a9-9760-51da72b79c32",
  "type": "https://circle.com/types/VerificationRequest",
  "from": "did:web:circle.com",
  "created_time": "2022-02-16T15:21:10.520Z",
  "expires_time": "2022-03-18T15:21:10.520Z",
  "reply_url": "http://localhost:3000/verifications/74c9e731-bbe6-42a9-9760-51da72b79c32",
  "body": {
    "status_url": "http://localhost:3000/verifications/74c9e731-bbe6-42a9-9760-51da72b79c32/status",
    "challenge": "16da1ec8-4817-4cf0-bf2d-66300d425400",
    "presentation_definition": {
      "id": "74c9e731-bbe6-42a9-9760-51da72b79c32",
      "format": {
        "jwt": {
          "alg": ["EdDSA", "ES256K"]
        },
        "jwt_vc": {
          "alg": ["EdDSA", "ES256K"]
        },
        "jwt_vp": {
          "alg": ["EdDSA", "ES256K"]
        }
      },
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
                "filter": {
                  "type": "string",
                  "pattern": "^did:web:circle.com$"
                },
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

---

### POST /verifications/:id

**Description:** This endpoint is where an end-user will submit their Verifiable Credentials. These credentials are submitted as a signed JWT string. The decoded version of this adheres to the [Presentation Submission](https://verite.id/docs/appendix/messages#presentation-submission) definition.

**Sample route:** `https://verifier.circle.com/verifications/a678bf0f-7f72-424d-b920-0af3f040b620`

#### Request

- Content-Type: `text/plain`
- URL parameters:
  | Parameter | Required? | Description |
  |-----------|-----------|-----------------------------|
  | `id` | Yes | The id of the Verification. |

- Request Body: A JWT-encoded payload containing a response to the Verification Offer. This JWT is a Verifiable Presentation containing the requested Verifiable Credential(s).

- Sample Body:

```text
eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iLCJDcmVkZW50aWFsRnVsZmlsbG1lbnQiXSwiaG9sZGVyIjoiZGlkOmtleTp6UTNzaHZaTlBCUm44blZ2Z3plSzlSb2V4ZTdTM2JqRDU1dnMyTWVSWWVEMnhTOGdWIiwidmVyaWZpYWJsZUNyZWRlbnRpYWwiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjJZeUk2ZXlKQVkyOXVkR1Y0ZENJNld5Sm9kSFJ3Y3pvdkwzZDNkeTUzTXk1dmNtY3ZNakF4T0M5amNtVmtaVzUwYVdGc2N5OTJNU0lzSW1oMGRIQnpPaTh2ZG1WeWFYUmxMbWxrTDJsa1pXNTBhWFI1SWwwc0luUjVjR1VpT2xzaVZtVnlhV1pwWVdKc1pVTnlaV1JsYm5ScFlXd2lMQ0pMV1VOQlRVeEJkSFJsYzNSaGRHbHZiaUpkTENKamNtVmtaVzUwYVdGc1UzVmlhbVZqZENJNmV5SkxXVU5CVFV4QmRIUmxjM1JoZEdsdmJpSTZleUpBZEhsd1pTSTZJa3RaUTBGTlRFRjBkR1Z6ZEdGMGFXOXVJaXdpY0hKdlkyVnpjeUk2SW1oMGRIQnpPaTh2WTJseVkyeGxMbU52YlM5elkyaGxiV0Z6TDJSbFptbHVhWFJwYjI1ekx6RXVNQzR3TDJ0NVkyRnRiQzkxYzJFaUxDSmhjSEJ5YjNaaGJFUmhkR1VpT2lJeU1ESXlMVEF5TFRFMlZERTJPakF5T2pJeUxqYzBOMW9pZlgxOUxDSnpkV0lpT2lKa2FXUTZhMlY1T25wUk0zTm9kbHBPVUVKU2JqaHVWblpuZW1WTE9WSnZaWGhsTjFNelltcEVOVFYyY3pKTlpWSlpaVVF5ZUZNNFoxWWlMQ0p1WW1ZaU9qRTJORFV3TWpjek5ESXNJbWx6Y3lJNkltUnBaRHByWlhrNmVqWk5hMmt6VGsxbGMzTnlUSFJMUjJab2VsY3pORnAyU2xjeFJETlViVlkyVEZsWU9WQk5Xbk5TUTBOYVYzRTFJbjAuc1cxaUdUYUlzZFEyVWlMSElmbTVEOFZZN09TNWRCOUxWdVFqai1rZF9OclR5X3RkYXdUeWQtTThPUGt4R25NWkY3ckRaaWxna3IxN01pZVlTNlBqQlEiXX0sInN1YiI6ImRpZDprZXk6elEzc2h2Wk5QQlJuOG5Wdmd6ZUs5Um9leGU3UzNiakQ1NXZzMk1lUlllRDJ4UzhnViIsInByZXNlbnRhdGlvbl9zdWJtaXNzaW9uIjp7ImlkIjoiZjA1NzViZDgtMzE2Mi00YzYyLWE0OWUtN2QyZDJlMWVjNjBkIiwiZGVmaW5pdGlvbl9pZCI6IktZQ0FNTEF0dGVzdGF0aW9uLTJkM2IxYTM1LWZjMmMtNDRhMy04YzE0LTcwMGUxMjI1MGNlYiIsImRlc2NyaXB0b3JfbWFwIjpbeyJmb3JtYXQiOiJqd3RfdmMiLCJpZCI6Imt5Y2FtbF9pbnB1dCIsInBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsWzBdIn1dfSwibm9uY2UiOiJiNDdiNTI1My03OTkwLTQyMjUtODhkOC0wMTg0YjQ2ZDQ0M2QiLCJpc3MiOiJkaWQ6a2V5OnpRM3NodlpOUEJSbjhuVnZnemVLOVJvZXhlN1MzYmpENTV2czJNZVJZZUQyeFM4Z1YifQ.yi0lbvHdtDxGqDFQQv7OTIgkwOEnL0PJDlKuo5Nhyhbvj58yNFNtPvrQqv9MYGFrgUKSN9PxJ1WWLaqaEO5XqA
```

#### Response

- Content-Type: `application/json`
- Sample Body:

```json
{
  "status": "approved",
  "verificationResult": {
    "schema": "",
    "subject": "0xB5de987Ccce0BD596c22939B6f1e2a124e62B232",
    "expiration": 1645113992
  },
  "signature": "0x5a23eb407135554c7cfd649ab9b6121370190183bc0c9b3c377c7fa192d098282cc7df3f13fe9d2eec4ed7013658bff8452a90af1bcfc358e734ac366bee7ec81b"
}
```

---

### `GET /verifications/:id/status`

**Description:** This endpoint provides the status of a verification. Once the verification is complete, the response will contain the verificationResult as well as the signature. Upon verification failure, the endpoint will contain a reason for failure.

**Sample route:** `https://verifier.circle.com/verifications/a678bf0f-7f72-424d-b920-0af3f040b620/status`

#### Request

| Parameter | Required? | Description                 |
| --------- | --------- | --------------------------- |
| `id`      | Yes       | The id of the Verification. |

#### Response

- Content-Type: `application/json`
- Sample Bodies:

```json
{
  "status": "created"
}
```

```json
{
  "status": "approved",
  "verificationResult": {
    "schema": "",
    "subject": "0xB5de987Ccce0BD596c22939B6f1e2a124e62B232",
    "expiration": 1645113992
  },
  "signature": "0x5a23eb407135554c7cfd649ab9b6121370190183bc0c9b3c377c7fa192d098282cc7df3f13fe9d2eec4ed7013658bff8452a90af1bcfc358e734ac366bee7ec81b"
}
```
