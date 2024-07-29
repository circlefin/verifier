/**
 * Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { BN, Idl, Program, Provider } from "@project-serum/anchor"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  AnchorWallet,
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet
} from "@solana/wallet-adapter-react"
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui"
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter
} from "@solana/wallet-adapter-wallets"
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SYSVAR_CLOCK_PUBKEY
} from "@solana/web3.js"
import { ethers } from "ethers"
import { decodeVerifiableCredential } from "verifier"
import {
  createVerifiableCredentialJwt,
  createVerifiablePresentationJwt,
  Issuer
} from "did-jwt-vc"
import { FC, ReactNode, useMemo, useState } from "react"

import idl from "./idl.json"
import { didIssuer, signerFactory } from "./did"

require("./App.css")
require("@solana/wallet-adapter-react-ui/styles.css")

// Hardcode a connection to localhost
function getConnection() {
  const network = "http://127.0.0.1:8899"
  return new Connection(network, "processed")
}

function getProvider(wallet: AnchorWallet | undefined) {
  if (!wallet) {
    return
  }

  const provider = new Provider(
    getConnection(),
    // @ts-ignore
    wallet,
    Provider.defaultOptions()
  )
  return provider
}

const App: FC = () => {
  return (
    <Context>
      <Content />
    </Context>
  )
}
export default App

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // Note We are only using localhost and using a custom Connection, so it doesn't matter what is put here.
  const network = WalletAdapterNetwork.Devnet

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network })
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

const Content: FC = () => {
  const wallet = useAnchorWallet()
  const [issuer, setIssuer] = useState<Issuer>()
  const [subject, setSubject] = useState<Issuer>()
  const [credential, setCredential] = useState<Record<string, unknown>>()
  const [credentialJWT, setCredentialJWT] = useState<string>()
  const [verificationRequest, setVerificationRequest] =
    useState<Record<string, unknown>>()
  const [verificationOffer, setVerificationOffer] =
    useState<Record<string, unknown>>()
  const [verificationResult, setVerificationResult] =
    useState<Record<string, any>>()

  return (
    <div className="App">
      <p>
        Before you begin this demo, be sure your account has sufficient lamports
        to pay fees. You can airdrop yourself SOL by running the following
        command
      </p>
      <p>
        solana airdrop 1{" "}
        {wallet?.publicKey ? wallet.publicKey.toBase58() : <>&lt;ADDRESS&gt;</>}
      </p>
      <WalletMultiButton />

      {issuer ? <JSONComponent title="Issuer" obj={issuer} /> : null}
      {subject ? <JSONComponent title="Subject" obj={subject} /> : null}
      {credential ? (
        <JSONComponent title="Credential" obj={credential} />
      ) : null}
      {credentialJWT ? (
        <JSONComponent title="Credential JWT" obj={credentialJWT} />
      ) : null}
      {verificationRequest ? (
        <JSONComponent
          title="Create Verification Response"
          obj={verificationRequest}
        />
      ) : null}
      {verificationOffer ? (
        <JSONComponent title="Verification Offer" obj={verificationOffer} />
      ) : null}
      {verificationResult ? (
        <JSONComponent title="Verification Result" obj={verificationResult} />
      ) : null}

      {wallet && !issuer ? (
        <GenerateIssuer
          onIssuerGenerated={({ issuer }) => {
            console.log("onIssuerGenerated", issuer)
            setIssuer(issuer)
            window.scroll(0, document.body.scrollHeight)
          }}
        />
      ) : null}

      {wallet && issuer && !subject ? (
        <GenerateSubject
          onSubjectGenerated={({ subject }) => {
            console.log("onSubjectGenerated", subject)
            setSubject(subject)
            window.scroll({
              top: document.body.scrollHeight,
              behavior: "smooth"
            })
          }}
        />
      ) : null}

      {wallet && issuer && subject && !credential ? (
        <IssueCredential
          issuer={issuer}
          subject={subject?.did}
          onCredentialIssued={({
            verifiableCredential,
            decodedVerifiableCredential
          }) => {
            console.log(
              "onCredentialIssued",
              verifiableCredential,
              decodedVerifiableCredential
            )
            setCredential(decodedVerifiableCredential)
            setCredentialJWT(verifiableCredential)
            window.scroll({
              top: document.body.scrollHeight,
              behavior: "smooth"
            })
          }}
        />
      ) : null}

      {wallet && issuer && subject && credential && !verificationRequest ? (
        <CreateVerification
          subject={wallet.publicKey}
          onNewVerification={({ response }) => {
            console.log(response)
            setVerificationRequest(response)
            window.scroll({
              top: document.body.scrollHeight,
              behavior: "smooth"
            })
          }}
        />
      ) : null}

      {wallet &&
      issuer &&
      subject &&
      credential &&
      verificationRequest &&
      !verificationOffer ? (
        <FetchVerificationOffer
          challengeTokenUrl={verificationRequest.challengeTokenUrl as string}
          onNewVerificationOffer={({ response }) => {
            console.log("onNewVerificationOffer", response)
            setVerificationOffer(response)
            window.scroll({
              top: document.body.scrollHeight,
              behavior: "smooth"
            })
          }}
        />
      ) : null}

      {wallet &&
      issuer &&
      subject &&
      credentialJWT &&
      verificationRequest &&
      verificationOffer &&
      !verificationResult ? (
        <SubmitCredential
          subject={subject}
          verificationOffer={verificationOffer}
          verifiableCredential={credentialJWT}
          onNewVerificationResult={(response) => {
            console.log("onNewVerificationResult", response)
            setVerificationResult(response)
            window.scroll({
              top: document.body.scrollHeight,
              behavior: "smooth"
            })
          }}
        />
      ) : null}

      {wallet && verificationResult ? (
        <SubmitVerification verificationResult={verificationResult} />
      ) : null}
    </div>
  )
}

/**
 * Component to generate a new Issuer
 */
type GenerateIssuerParams = {
  onIssuerGenerated: ({ issuer }: { issuer: Issuer }) => void
}

const GenerateIssuer: FC<GenerateIssuerParams> = ({ onIssuerGenerated }) => {
  const onClick = async () => {
    // Create an Issuer
    const issuer = await didIssuer()

    onIssuerGenerated({ issuer })
  }

  return <button onClick={onClick}>Create Issuer</button>
}

/**
 * Component to generate a new Subject
 */
type GenerateSubjectDidParams = {
  onSubjectGenerated: ({ subject }: { subject: Issuer }) => void
}

const GenerateSubject: FC<GenerateSubjectDidParams> = ({
  onSubjectGenerated
}) => {
  const onClick = async () => {
    // Create a subject
    const subject = await signerFactory()

    onSubjectGenerated({ subject })
  }

  return <button onClick={onClick}>Create subject</button>
}

/**
 * Component to issue a credential
 */
type IssueCredentialProps = {
  issuer: Issuer
  subject: string
  onCredentialIssued: ({
    verifiableCredential,
    decodedVerifiableCredential
  }: {
    verifiableCredential: string
    decodedVerifiableCredential: Record<string, unknown>
  }) => void
}

const IssueCredential: FC<IssueCredentialProps> = ({
  issuer,
  subject,
  onCredentialIssued
}) => {
  const onClick = async () => {
    // Credential Payload
    const payload = {
      sub: subject,
      nbf: Math.floor(Date.now() / 1000),
      vc: {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://verite.id/identity"
        ],
        type: ["VerifiableCredential", "KYCAMLAttestation"],
        credentialSubject: {
          id: subject,
          KYCAMLAttestation: {
            type: "KYCAMLAttestation",
            process: "https://circle.com/schemas/definitions/1.0.0/kycaml/usa",
            approvalDate: new Date()
          }
        },
        issuanceDate: new Date() // now
      }
    }

    // Create the Verifiable Credential
    const verifiableCredential = await createVerifiableCredentialJwt(
      payload,
      issuer
    )
    const decodedVerifiableCredential = await decodeVerifiableCredential(
      verifiableCredential
    )

    // Callback for the app
    onCredentialIssued({ verifiableCredential, decodedVerifiableCredential })
  }
  return (
    <>
      <button onClick={onClick}>Issue Credential</button>
    </>
  )
}

/**
 * Component to render any javascript object
 */
type JSONComponentParams = {
  title: string
  obj: unknown
}

const JSONComponent: FC<JSONComponentParams> = ({ title, obj }) => {
  return (
    <>
      <div>{title}</div>
      <pre style={{ maxWidth: "80ch", overflow: "scroll" }}>
        {JSON.stringify(obj, null, 4)}
      </pre>
    </>
  )
}

/**
 * Component to start the verification flow
 */
type CreateVerificationParams = {
  subject: PublicKey
  onNewVerification: ({
    response
  }: {
    response: Record<string, unknown>
  }) => void
}
const CreateVerification: FC<CreateVerificationParams> = ({
  subject,
  onNewVerification
}) => {
  const onClick = async () => {
    const response = await fetch("http://localhost:3000/verifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        network: "solana",
        chainId: "localnet",
        name: "VerificationRegistry",
        version: "1.0",
        subject: subject.toBase58()
      })
    })
    onNewVerification({ response: await response.json() })
  }
  return (
    <>
      <button onClick={onClick}>Create Verification</button>
    </>
  )
}

/**
 * Component to fetch the challengeTokenUrl
 */
type FetchVerificationOfferParams = {
  challengeTokenUrl: string
  onNewVerificationOffer: ({
    response
  }: {
    response: Record<string, unknown>
  }) => void
}

const FetchVerificationOffer: FC<FetchVerificationOfferParams> = ({
  challengeTokenUrl,
  onNewVerificationOffer
}) => {
  const onClick = async () => {
    const response = await fetch(challengeTokenUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    onNewVerificationOffer({ response: await response.json() })
  }
  return (
    <>
      <button onClick={onClick}>Fetch Challenge Token URL</button>
    </>
  )
}

/**
 * Component to submit a credential for verification
 */
type SubmitCredentialParams = {
  subject: Issuer
  verificationOffer: any
  verifiableCredential: string
  onNewVerificationResult: ({
    response
  }: {
    response: Record<string, unknown>
  }) => void
}

const SubmitCredential: FC<SubmitCredentialParams> = ({
  subject,
  verificationOffer,
  verifiableCredential,
  onNewVerificationResult
}) => {
  const onClick = async () => {
    const payload = {
      nonce: verificationOffer.body.challenge,
      vp: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation", "CredentialFulfillment"],
        holder: subject.did,
        verifiableCredential: [verifiableCredential]
      },
      presentation_submission: {
        id: "b68fda51-21aa-4cdf-84b7-d452b1c9c3cc", // random UUID
        definition_id: verificationOffer.body.presentation_definition.id,
        descriptor_map: [verifiableCredential].flat().map((_vc, i) => ({
          format: "jwt_vc",
          id: "kycaml_input",
          path: `$.verifiableCredential[${i}]`
        }))
      }
    }

    const presentation = await createVerifiablePresentationJwt(payload, subject)

    const replyUrl = verificationOffer.reply_url as string
    const response = await fetch(replyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: presentation
    })

    onNewVerificationResult(await response.json())
  }
  return (
    <>
      <button onClick={onClick}>Submit Credential</button>
    </>
  )
}

/**
 * Component to submit a credential for verification
 */
type SubmitVerificationParams = {
  verificationResult: Record<string, any>
}

const SubmitVerification: FC<SubmitVerificationParams> = ({
  verificationResult
}) => {
  // Track status of Solana transaction
  const [status, setStatus] = useState<string>()
  const wallet = useAnchorWallet()

  /**
   * Send a Solana transaction with a Verification Result and a signature. If the program does not
   * throw an error, it was valid.
   */
  const submitVerification = async () => {
    setStatus("pending")

    // Setup Anchor
    const programId = new PublicKey(idl.metadata.address)
    const provider = getProvider(wallet)
    const program = new Program(idl as Idl, programId, provider)

    const signature = ethers.utils.arrayify(verificationResult.signature)
    const subject = new PublicKey(verificationResult.verificationResult.subject)

    try {
      const tx = new Transaction()
      tx.add(
        program.instruction.initialize(
          signature.slice(0, 64),
          signature[64] - 27,
          {
            name: "VerificationRegistry",
            version: "1.0",
            cluster: "localnet",
            subject,
            expiration: new BN(
              verificationResult.verificationResult.expiration
            ),
            schema: ""
          },
          {
            accounts: {
              subject: subject,
              clock: SYSVAR_CLOCK_PUBKEY
            }
          }
        )
      )

      await provider?.send(tx)
    } catch (e) {
      console.log(e)
      setStatus("error")
      return
    }
    setStatus("success")
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <div>
        <button onClick={submitVerification}>Submit Verification</button>
      </div>
      <div>Status: {status}</div>
    </div>
  )
}
