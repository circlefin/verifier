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

import {
  SSMClient,
  GetParameterCommand,
  GetParameterCommandInput,
  GetParameterCommandOutput
} from "@aws-sdk/client-ssm"

import { logger } from "../../logger"

const client = new SSMClient({ region: process.env.AWS_REGION })

async function loadSecret(name: string, withDecryption: boolean) {
  const input: GetParameterCommandInput = {
    Name: getFullKey(name),
    WithDecryption: withDecryption
  }

  logger.info(`Getting key path ${input.Name as string}`)
  const command = new GetParameterCommand(input)
  try {
    const response: GetParameterCommandOutput = await client.send(command)
    return response.Parameter?.Value
  } catch (err) {
    logger.error("Error ", err)
  }
}

// Follows https://github.com/circlefin/platform-common/blob/963d916296a2b1af1714e966a147174c10e945b3/common-utils/src/main/java/com/circle/config/SSMSecretService.java#L95
function getFullKey(name: string) {
  const env = process.env.ENV || ""
  const team = process.env.APP_TEAM || ""
  const service = process.env.SERVICE_NAME || ""

  return `/${env}/${team}/${service}/${name}`
}

export { loadSecret }
