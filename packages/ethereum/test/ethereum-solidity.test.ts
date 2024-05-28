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

import { config } from "dotenv"
config()
import { ethers } from "hardhat"
import { ethereum } from "verifier"

test("Ethereum smart contract verifying a signature", async () => {
  // Deploy the Registry contract
  const Registry = await ethers.getContractFactory("TestRegistry")
  const registry = await Registry.deploy()
  await registry.deployed()

  // Add a verifier
  const verifierPrivateKey =
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const verifier = new ethers.Wallet(verifierPrivateKey)
  const verifierPublicKey = await verifier.getAddress()

  const verifierInfo = {
    name: ethers.utils.formatBytes32String("Circle"),
    did: "did:web:circle.com",
    url: "https://circle.com",
    signer: verifierPublicKey
  }
  await registry.addVerifier(verifierPublicKey, verifierInfo)

  // Create a signature
  const name = "VerificationRegistry"
  const version = "1.0"
  const expiration = 2588551268 // Expires January 2052
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person",
    "https://raw.githubusercontent.com/centrehq/verite/d1b97b3a475aa00cf894f72213f34b7bcb8b3435/packages/docs/static/definitions/processes/kycaml/0.0.1/generic--usa-entity-accinv-all-checks"
  ]

  const { verificationResult, signature } = await ethereum({
    subject,
    registryAddress: registry.address,
    chainId: 1337,
    name,
    version,
    expiration: new Date(expiration * 1000),
    privateKey: verifierPrivateKey,
    verifier_verification_id,
    schema
  })
  // Note that contract addresses are deterministic. Since Hardhat by default
  // uses a known list of accounts, we know in advance the contract address and
  // can assert a signature here. If this assertion fails, it is possible that
  // a contract has been deployed to the network prior to the one used in this
  // test.
  expect(signature).toBe(
    "0x33909c3bba46e4b8e66854f9b65de2d0e19a0003f2c8409f26c5bd1a99c7f6ad65539c93c314f31b18e464b04427e9c386278d0fe948b43dfe1afcc202de2ed71b"
  )

  // Call _validateVerificationResult(result, signature)
  // The VerificationRegistry contract uses require statements to guarantee the
  // validity of a Verification Result. If the function resolves, we know none
  // triggered an exception and the Verification Result and signature are valid
  expect(registry.validate(verificationResult, signature)).resolves

  // Example of rejected promise with a bad signature
  const badSignature =
    "0xcf2e7d2184ee84a83fa6b2848aa895b40f46aef3cd9745e4fa964f1a38441f3e23e33b514266da8a9d6ac86bf7e1964014b6ed5f9b3ce8b0c03cfccd5ab4e41d1b"
  await expect(
    registry.validate(verificationResult, badSignature)
  ).rejects.toThrow()
})
