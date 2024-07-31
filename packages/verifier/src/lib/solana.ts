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

export const SOLANA_CHAINS = ["mainnet-beta", "testnet", "devnet", "localnet"]

export enum SolanaNetwork {
  MainnetBeta = 1,
  Devnet,
  Testnet,
  Localnet = 1337
}

/**
 * Convert a cluster string to a chainId number
 */
export const convertClusterToChainId = (
  cluster: string
): SolanaNetwork | undefined => {
  switch (cluster) {
    case "mainnet-beta":
      return SolanaNetwork.MainnetBeta
    case "devnet":
      return SolanaNetwork.Devnet
    case "testnet":
      return SolanaNetwork.Testnet
    case "localnet":
      return SolanaNetwork.Localnet
    default:
      return
  }
}

/**
 * Convert a chainId number to a solana cluster string
 */
export const convertChainIdToCluster = (
  chainId: SolanaNetwork | undefined | null
): string | undefined => {
  switch (chainId) {
    case SolanaNetwork.MainnetBeta:
      return "mainnet-beta"
    case SolanaNetwork.Devnet:
      return "devnet"
    case SolanaNetwork.Testnet:
      return "testnet"
    case SolanaNetwork.Localnet:
      return "localnet"
    default:
      return
  }
}
