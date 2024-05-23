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

import { resolve } from "@transmute/did-key.js"
import type { DIDResolutionResult, DIDResolver } from "did-resolver"

/**
 * A did:key resolver factory to be used when building a `did-resolver`
 * compatible resolver, namely modifying to match types and to properly catch
 * thrown errors.
 */
const getKeyResolver = (): Record<string, DIDResolver> => {
  async function key(did: string): Promise<DIDResolutionResult> {
    try {
      const result = await resolve(did, { accept: "application/did+ld+json" })
      return result as DIDResolutionResult
    } catch (e) {
      return {
        didDocument: null,
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: "notFound",
          message: `resolver_error: ${(e as Error).message}`
        }
      }
    }
  }

  return { key }
}

/**
 * A did:key resolver that adheres to the `did-resolver` API.
 *
 * This resolver is used to verify the signature of a did:key JWT.
 */
export const didKeyResolver = getKeyResolver()
