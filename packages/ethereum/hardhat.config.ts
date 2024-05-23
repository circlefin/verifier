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

import { task } from "hardhat/config"
import "@nomiclabs/hardhat-ethers"
import "@typechain/hardhat"

import secp256k1 from "secp256k1"

task("deploy", "Deploys the contract", async (taskArgs, hre) => {
  // Deploy contract
  const Registry = await hre.ethers.getContractFactory("TestRegistry")
  const registry = await Registry.deploy()
  console.log("Registry deployed to:", registry.address)

  // Add a verifier
  const [deployer] = await hre.ethers.getSigners()
  const address = deployer.address

  const testVerifierInfo = {
    name: hre.ethers.utils.formatBytes32String("Circle"),
    did: "did:web:circle.com",
    url: "https://circle.com/about",
    signer: address
  }

  const tx = await registry.addVerifier(address, testVerifierInfo)
  await tx.wait()
  console.log("Added verifier:", address)
})

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task(
  "secp256k1pubkey",
  "Prints the uncompressed secp256k1 public key. You can use the resulting value as the verifier in the contract."
)
  .addPositionalParam("privatekey", "the private key of a trusted verifier")
  .setAction(async (taskArgs, hre) => {
    const privateKey = hre.ethers.utils.arrayify(taskArgs.privatekey, {
      allowMissingPrefix: true
    })
    const pubkey = secp256k1.publicKeyCreate(privateKey, false)

    // The result includes a header, indentifying the pubkey as uncompressed.
    // We must strip that out, as the on-chain Solana crate requires a 64-byte
    // public key.
    console.log("Public Key (uncompressed): ", pubkey.slice(1, 65))
  })

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
}
