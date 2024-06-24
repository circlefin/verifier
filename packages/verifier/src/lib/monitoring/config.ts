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

import { ClientOptions } from "hot-shots"

export const statsDConfig: ClientOptions = {
  host: process.env.STATSD_HOST || "localhost",
  port: 8125,
  prefix: "verite.verifier.",
  mock: !["prod", "sandbox", "stg", "smokebox", "testing"].includes(
    process.env.ENV || ""
  ),
  globalTags: {
    app_name: process.env.SERVICE_NAME || "unknown"
  },
  cacheDns: true,
  cacheDnsTtl: 5000,
  tcpGracefulRestartRateLimit: 90000,
  udsGracefulRestartRateLimit: 90000
}
