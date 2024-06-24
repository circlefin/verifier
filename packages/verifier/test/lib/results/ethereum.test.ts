/**
 * Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
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

import { ethers, Wallet } from "ethers"

import { ethereum } from "../../../src/lib/results"

test("ethereum returns a signature", async () => {
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const expiration = 1641492587
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { verificationResult, signature } = await ethereum({
    subject,
    registryAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    chainId: 1337,
    name,
    version,
    expiration: new Date(expiration * 1000),
    privateKey:
      "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    verifier_verification_id,
    schema
  })

  expect(signature).toBe(
    "0xd8a234d69351028abcc3da5c56329cdfc67ada9d97e8b93fd714c243ec58fd8c6f52d6290de1d2bad2e28e29f11c33b0ac41e2b219a616c35a9425c1672ce7de1c"
  )
  expect(verificationResult).toEqual({
    schema,
    subject,
    expiration,
    verifier_verification_id
  })
})

test("ethereum returns a different signature for a different chainId", async () => {
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const expiration = 1641492587
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { signature, verificationResult } = await ethereum({
    subject,
    registryAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    chainId: 9000,
    name,
    version,
    expiration: new Date(expiration * 1000),
    privateKey:
      "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    verifier_verification_id,
    schema
  })

  expect(signature).toBe(
    "0x8b4b9ee3088bbd1c07b45fed91386e5d13c4345d515e54bcfd8a5b964d618a1802e1d3c36198119dde73deace2bc55ce8ead56a7e2a52ddc3450a8177375b05e1c"
  )
  expect(verificationResult).toEqual({
    schema,
    subject,
    expiration,
    verifier_verification_id
  })
})

test("ethereum returns a different signature for a different contract", async () => {
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const expiration = 1641492587
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { signature, verificationResult } = await ethereum({
    subject,
    registryAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chainId: 1337,
    name,
    version,
    expiration: new Date(expiration * 1000),
    privateKey:
      "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    verifier_verification_id,
    schema
  })

  expect(signature).toBe(
    "0x3011814067b53522001eebaa8608cfb42ee56b96b86497c40bb902e98c9db0a77a23e959c55bc5f5c1caffd98dfe0bc8d8bfdfed9cb8ef05c3a758c3d489b2261b"
  )
  expect(verificationResult).toEqual({
    schema,
    subject,
    expiration,
    verifier_verification_id
  })
})

test("ethereum returns a different signature with a different private key", async () => {
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const expiration = 1641492587
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { signature, verificationResult } = await ethereum({
    subject,
    registryAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chainId: 1337,
    name,
    version,
    expiration: new Date(expiration * 1000),
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    verifier_verification_id,
    schema
  })

  expect(signature).toBe(
    "0xc120fe7b8340f60d7311bfc9a43bb9bdae871c5f3e2d81def6abd0974e6cc22561015120ee6430af4e964568b0e1b44ed2e3ddf96f8d5b519e62c843812156b71b"
  )
  expect(verificationResult).toEqual({
    schema,
    subject,
    expiration,
    verifier_verification_id
  })
})

test("recovering verifier address used to create the signature", () => {
  const signature =
    "0xc6fc48878f00b18b54e3c644b073e308f4bdfc54a5d1b138f57e9c89dd99414234993525bcce84a73db58d4418903b0ee0b959b419a82e565cf33ca8e2a5932b1c"
  const expiration = 1641492587

  const domain = {
    name: "VerificationRegistry",
    version: "1.0",
    chainId: 1337,
    verifyingContract: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  }
  const types = {
    VerificationResult: [
      { name: "schema", type: "string" },
      { name: "subject", type: "address" },
      { name: "expiration", type: "uint256" }
    ]
  }
  const verificationResult = {
    schema: "",
    subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    expiration: expiration
  }

  const recoveredAddress = ethers.utils.verifyTypedData(
    domain,
    types,
    verificationResult,
    signature
  )

  // Get public key from the private key used to create the signature
  const signer: Wallet = new ethers.Wallet(
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  )
  const address = signer.address

  expect(recoveredAddress).toEqual(address)
})
