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

import asyncHandler from "express-async-handler"

import { findVerification } from "../../lib/database/verifications"

const isApproved = (status: string) => status === "approved"
const isRejected = (status: string) => status === "rejected"

/**
 * GET /verifications/:id/status
 *
 * Load the Verification from the database and respond with the current status.
 *
 * If the Verification was successful, respond with the verification result.
 * If the Verification was unsuccessful, respond with the failure reason.
 */
export default asyncHandler(async (req, res) => {
  const { status, statusDetail, verificationResult, signature } =
    await findVerification(req.params.id)

  if (isApproved(status)) {
    res.status(200).json({
      status,
      verificationResult,
      signature
    })
  } else if (isRejected(status)) {
    res.status(400).json({
      status,
      message: statusDetail
    })
  } else {
    res.status(200).json({ status })
  }
})
