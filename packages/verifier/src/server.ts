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

import "dotenv/config"
import v8 from "v8"

import { app } from "./app"
import { statsd } from "./lib/monitoring"
import { logger } from "./logger"

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || `http://localhost:${PORT}`

logger.info(
  `AvailableMemoryMb=${
    v8.getHeapStatistics().total_available_size / 1024 / 1024
  }, HeapStatistics=${JSON.stringify(v8.getHeapStatistics())}`
)

// publish v8 stats
setInterval(function () {
  const memoryUsage = process.memoryUsage()
  if (memoryUsage.heapTotal) {
    statsd.gauge("heapTotalMb", memoryUsage.heapTotal / 1024 / 1024)
  }
  if (memoryUsage.heapUsed) {
    statsd.gauge("heapUsedMb", memoryUsage.heapUsed / 1024 / 1024)
  }
}, 10 * 1000)

app.listen(PORT, () => {
  logger.info(`Server started and is listening at ${HOST}`)
})
