# Integrating with Centre's Open Source Verite Project

## 0. Getting Started

First, find your local IP address. For example `192.168.7.31`. You will use
this in a few places.

## 1. Clone and set up Centre's Verite project

```sh
git clone git@github.com:centrehq/verite.git
cd verite
npm run setup
```

## 1. Start the Circle Verifier on port 3001, with an updated Trusted Issuer list

Locate the `ISSUER_DID` environment variable in `packages/e2e-demo/.env.development.local`,
for example: `did:key:z6MkjFvoMQC6m5mx9ec5dTtdV84oVTxLhHALEvpXtNfzsuvz`. You will use that as the Trusted issuer below:

```sh
HOST=http://192.168.7.131:3001 \
PORT=3001 \
TRUSTED_ISSUERS="^did:key:z6MkjFvoMQC6m5mx9ec5dTtdV84oVTxLhHALEvpXtNfzsuvz$" \
npm run dev
```

NOTE: Be sure to swap in your own local IP address to the HOST parameter.

## 3. Swap the Verifier to point to Circle's Verifier

In `packages/e2e-demo/lib/verification-request.ts`

Change the body of `createVerificationOffer` to match:

```ts
export async function createVerificationOffer(
  type: string,
  subjectAddress?: string,
  contractAddress?: string,
  verifierSubmit?: boolean,
  registryAddress?: string
): Promise<VerificationRequestResponse> {
  const id = uuidv4()

  const verificationRequest = await fetch(
    "http://192.168.7.131:3001/verifications", // NOTE: Be sure to swap in your local IP here.
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        network: "ethereum",
        chainId: 1337,
        registryAddress: registryAddress || contractAddress,
        subject: subjectAddress || "0x0000000000000000000000000000000000000000"
      })
    }
  )

  const { challengeTokenUrl } = await verificationRequest.json()

  return {
    id,
    challenge: {},
    qrCodeData: challengeTokenUrlWrapper(challengeTokenUrl)
  }
}
```

In `packages/e2e-demo/components/demos/dapp/Dapp.tsx`, change the method `createVerification` to match:

```ts
const createVerification = async () => {
  try {
    // Create a Verification Request
    const resp = await fetch(`http://192.168.7.131:3001/verifications`, {
      // NOTE: Be sure to swap in your local IP here.
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        network: "ethereum",
        chainId: 1337,
        registryAddress: contractAddress,
        subject: account
      })
    })
    const { challengeTokenUrl, statusUrl } = await resp.json()
    setVerification({
      id: account,
      qrCodeData: {
        challengeTokenUrl
      },
      challenge: { statusUrl }
    })
    setIsVerifying(true)
  } catch (e) {
    setVerification(undefined)
    setIsVerifying(false)
    setStatusMessage("API call to Verifier failed. Are you running demos?")
  }
}
```

Change the `fetchVerificationStatus` method to match:

```ts
const fetchVerificationStatus = async (id: string) => {
  try {
    const resp = await fetch(verification.challenge.statusUrl as string)
    const { status, verificationResult, signature } = await resp.json()

    if (status === "approved") {
      setVerification(undefined)
      setVerificationInfoSet({ verificationResult, signature })
      setIsVerifying(false)
      setStatusMessage(
        "Verification complete. You can now transfer 10 or more THUSDC"
      )
    } else if (status === "rejected") {
      setVerification(undefined)
      setVerificationInfoSet(undefined)
      setIsVerifying(false)
      setStatusMessage("Verification failed.")
    }
  } catch (e) {
    setVerification(undefined)
    setVerificationInfoSet(undefined)
    setIsVerifying(false)

    setStatusMessage(
      "API call to Verifier failed. Are you running the demo server?"
    )
  }
}
```

And finally, in `packages/e2e-demo/pagges/demos/verifier/[type].tsx`, change the following:

```diff
-  const { data } = useSWR(
-    () => fullURL(`/api/demos/verifier/${verification.id}/status`),
-    jsonFetch,
-    {
-      refreshInterval: 1000
-    }
-  )
+  const { data } = useSWR(() => challenge.statusUrl, jsonFetch, {
+    refreshInterval: 1000
+  })
```

## 4. Now the demos should work while using the Circle Verifier

Start Centre demos:

### 1. Start an ethereum node

```sh
npm run hardhat:node
```

### 2. In a new tab, deploy the contract

```sh
npm run hardhat:deploy
```

### 3. Once the contract is deployed, you can start the demo server

```sh
npm run dev
```

This will launch the demos on `http://192.168.7:131:3000` (Replace with your local IP).

### 4. You will also need the wallet running

```sh
npm run wallet
```

Scan the QR code with the Expo Go app.

### 5. You can run through the demos

First, go through the "Issuer" demo to receive a Verifiable Credential.

Next, you can use the "Verification" demo to prove the verification worked.

NOTE: The Verite refence mobile wallet may show the credentials greyed out, but you can still tap to submit them.

You can also use the "DApp Requiring KYC" demo to show how this would work
using a real Ethereum contract.

NOTE: The "Lending" demo will not work, as this requires Verifier-submitted credentials, which is out of scope for this project.
