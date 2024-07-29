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

import { createJWT, ES256KSigner } from "did-jwt"

/**
 * Returns a JWT
 *
 * In practice, you must secure the key passed to ES256KSigner. The key
 * provided in code below is for informational purposes only.
 *
 * Note that this snippet was drawn from the did-jwt README
 * https://github.com/decentralized-identity/did-jwt/blob/db8f93a2d3e0457ad00f8c32a3925da1a8265f93/README.md?plain=1#L36-L51
 * @returns
 */
export const jwtFactory = async () => {
  const signer = ES256KSigner(
    "278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f"
  )

  const jwt = await createJWT(
    {
      aud: "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
      exp: 10,
      name: "uPort Developer"
    },
    { issuer: "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74", signer },
    { alg: "ES256K" }
  )

  return jwt
}
