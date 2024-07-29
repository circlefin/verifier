# Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

ARG BASE_IMAGE=node:22.3.0-alpine

# Build
FROM ${BASE_IMAGE} AS build
ARG IS_DEV
ARG CHAIN_ID
ARG REGISTRY_ADDRESS
ARG VERIFIER_PRIVATE_KEY

WORKDIR /verifier

# clean install npm before copying code
COPY ./package-lock.json ./
COPY ./package.json ./
RUN npm ci

# copy everything
COPY ./docker /
COPY . .

RUN npm run build -w verifier

# Production Image
FROM ${BASE_IMAGE}

WORKDIR /verifier

RUN addgroup -g 9999 circle \
  && adduser circle circle

COPY --from=build /usr/local/verifier /usr/local/verifier
COPY --from=build /verifier/node_modules ./node_modules
COPY --from=build /verifier/package.json ./package.json
COPY --from=build /verifier/packages/verifier/dist ./packages/verifier/dist
COPY --from=build /verifier/packages/verifier/prisma ./packages/verifier/prisma
COPY --from=build /verifier/packages/verifier/package.json ./packages/verifier/package.json
COPY --from=build /verifier/packages/verifier/node_modules ./packages/verifier/node_modules

USER circle

# Disable npm registry for environments with restricted internet access.
# npm fails to run if it can't contact its configured registry
RUN echo "registry=http://none" > /home/circle/.npmrc

CMD [ "/usr/local/verifier/start.sh" ]
