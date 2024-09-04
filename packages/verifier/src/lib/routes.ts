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

import { randomBytes } from "crypto"
import path from "path"

import { Router } from "express"

import createApiClient from "../api/apiClients/createApiClient"
import getClients from "../api/apiClients/getClients"
import revoke from "../api/apiClients/revoke"
import ping from "../api/ping"
import createUser from "../api/users/createUser"
import getUser from "../api/users/getUser"
import create from "../api/verifications/create"
import show from "../api/verifications/show"
import status from "../api/verifications/status"
import submit from "../api/verifications/submit"

import apiAuth from "./apiAuth"

export const routes = Router()
const PING_ROUTE = "/ping"
const CREATE_VERIFICATIONS_ROUTE = "/api/v1/verifications"
const SHOW_VERIFICATIONS_ROUTE = "/api/v1/verifications/:id"
const SUBMIT_VERIFICATIONS_ROUTE = "/api/v1/verifications/:id"
const VERIFICATIONS_STATUS_ROUTE = "/api/v1/verifications/:id/status"
const CREATE_USERS_ROUTE = "/api/v1/users"
const GET_USERS_ROUTE = "/api/v1/users/:did"
const API_CLIENTS_ROUTE = "/api/v1/apiClients"

interface RouteNameMap {
  [name: string]: string
}

// Express does not provide this out of box
// Cannot rely on handler name since they are wrapped async handlers
export const routeNameMapping: RouteNameMap = {
  [`post_${CREATE_VERIFICATIONS_ROUTE}`]: "create",
  [`get_${SHOW_VERIFICATIONS_ROUTE}`]: "show",
  [`post_${SUBMIT_VERIFICATIONS_ROUTE}`]: "submit",
  [`get_${VERIFICATIONS_STATUS_ROUTE}`]: "status",
  [`post_${CREATE_USERS_ROUTE}`]: "createUser",
  [`get_${GET_USERS_ROUTE}`]: "getUser",
  [`post_${API_CLIENTS_ROUTE}`]: "createApiClient",
  [`patch_${API_CLIENTS_ROUTE}`]: "revoke",
  [`get_${API_CLIENTS_ROUTE}`]: "getClients",
  [`get_${PING_ROUTE}`]: "ping"
}

routes.get(PING_ROUTE, ping)
routes.post(CREATE_VERIFICATIONS_ROUTE, create)
routes.get(SHOW_VERIFICATIONS_ROUTE, show)
routes.post(SUBMIT_VERIFICATIONS_ROUTE, submit)
routes.get(VERIFICATIONS_STATUS_ROUTE, status)
routes.post(CREATE_USERS_ROUTE, createUser)
routes.get(GET_USERS_ROUTE, getUser)
routes.post(API_CLIENTS_ROUTE, createApiClient)
routes.get(API_CLIENTS_ROUTE, getClients)
routes.patch(API_CLIENTS_ROUTE, apiAuth, revoke)

routes.get("/", (_req, res) => {
  if (["prod", "sandbox"].includes(process.env.ENV || "")) {
    res.end()
    return
  }

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
  const nonce = randomBytes(16).toString("base64")
  res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`)
  res.render(path.join(__dirname + "/../views/pages/index.ejs"), {
    nonce,
    baseUrl: process.env.HOST
  })
})
