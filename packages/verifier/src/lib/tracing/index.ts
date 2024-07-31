/**
 * Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 * SPDX-License-Identifier: Apache-2.0
 */

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { Resource } from "@opentelemetry/resources/build/src/Resource"
import { node, NodeSDK, tracing } from "@opentelemetry/sdk-node"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import { PrismaInstrumentation } from "@prisma/instrumentation"

import { logger } from "../../logger"

/**
 * Guided by {@link https://github.com/circlefin/circle-iris/pull/79}, which in turn guided by {@link https://logz.io/blog/nodejs-javascript-opentelemetry-auto-instrumentation/}.
 *
 * This file defines and instantiates the OpenTelemetry sdk and connection.
 * This internal guide can be followed to test the connection locally: {@link https://circlepay.atlassian.net/wiki/spaces/~394410255/pages/386170966/HOWTO+-+distributed+tracing+in+a+local+environment}.
 * This should be called by using the `--require '.../tracing/index.js` flag in the start script, so it is included before all other files.
 */

// Default to 10%, can be overridden with TELEMETRY_SAMPLER_RATIO env variable. When testing locally, be aware of that it is sampled.
const DEFAULT_SAMPLER_RATIO = 1 / 10

// OTEL_EXPORTER_OTLP_ENDPOINT is set on k8s pods
const otlpUrl =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317"
const serviceName = process.env.SERVICE_NAME || "verity-issuer"
const traceRatio = Number(
  process.env.TELEMETRY_SAMPLER_RATIO ?? DEFAULT_SAMPLER_RATIO
)

if (otlpUrl && serviceName && traceRatio) {
  logger.info("Enabling tracing.", { otlpUrl, serviceName, traceRatio })
  // Export to the agent that lives in the k8s cluster. URL is from the environment variable.
  const exporter = new OTLPTraceExporter({
    url: otlpUrl
  })

  // Trace Provider. Here we specify a ratio based sampler, meaning only send a sample % (traceRatio) of spans.
  const provider = new node.NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName
    }),
    sampler: new tracing.ParentBasedSampler({
      root: new tracing.TraceIdRatioBasedSampler(traceRatio)
    })
  })

  // Export spans to opentelemetry collector
  provider.addSpanProcessor(new tracing.BatchSpanProcessor(exporter))
  provider.register()

  // Instantiate and start the telemetry sdk
  const telemetrySdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: getNodeAutoInstrumentations().concat(
      new PrismaInstrumentation()
    )
  })
  telemetrySdk
    .start()
    .then(() => {
      logger.info("Tracing initialized")
    })
    .catch((error) => logger.error("Error initializing tracing", error))

  // Graceful shutdown
  process.on("SIGTERM", () => {
    telemetrySdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
  })
} else {
  logger.error("Tracing disabled.", { otlpUrl, serviceName })
}
