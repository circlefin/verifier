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

const SIGN_UP_PAGE = "signup"
const LEGAL_TERMS_PAGE = "legal-terms"
const NEW_TOKEN_PAGE = "new-token"
const REVOKE_TOKEN_PAGE = "revoke-token"

// Sign up page
const signupContainer = document.getElementById("signup-container")
const signupInput = document.getElementById("signup-input")
const signupButton = document.getElementById("signup-button")
const loginButton = document.getElementById("login-button")
const signupError = document.getElementById("signup-error")
const validateDid = (did) => {
  const parts = did.split(":")
  const DOMAIN_REGEX = new RegExp(
    "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:.[a-zA-Z]{2,})+$"
  )

  return (
    parts.length === 3 &&
    parts[0] === "did" &&
    parts[1] === "web" &&
    DOMAIN_REGEX.test(parts[2])
  )
}
// Sign up page listeners
signupButton.onclick = async () => {
  signupError.textContent = ""

  const did = signupInput.value.trim()

  if (!did) {
    signupError.textContent = "Please input a DID"
    return
  }

  if (!validateDid(did)) {
    signupError.textContent = "Not a valid DID"
    return
  }

  showLegalTermsPage(did, async () => {
    const res = await postUsers(did)

    if (res.errors) {
      legalTermsError.textContent = res.errors
        .map((errObj) => errObj.message)
        .join(", ")
      return false
    }

    return true
  })
}

loginButton.onclick = async () => {
  signupError.textContent = ""

  const did = signupInput.value.trim()

  if (!did) return

  if (!validateDid(did)) {
    signupError.textContent = "Not a valid DID"
    return
  }

  const res = await getUsers(did)

  if (res.errors) {
    signupError.textContent = res.errors
      .map((errObj) => errObj.message)
      .join(", ")
    return
  }

  if (res.hasAcceptedLegalTerms) {
    showNewTokenPage(did)
  } else {
    showLegalTermsPage(did, () => true)
  }
}

// Legal terms page
const legalTermsContainer = document.getElementById("legal-terms-container")
legalTermsContainer.style.display = "none"
const agreeButton = document.getElementById("agree-button")
const legalTermsError = document.getElementById("legal-terms-error")
const legalTermsBackButton = document.getElementById("legal-terms-back-button")
// Render legal terms page
const showLegalTermsPage = (did, preReqFn) => {
  legalTermsError.textContent = ""
  _showPage(LEGAL_TERMS_PAGE)
  agreeButton.onclick = async () => {
    if (!(await preReqFn())) {
      return
    }

    showNewTokenPage(did)
  }
}
legalTermsBackButton.onclick = () => {
  _showPage(SIGN_UP_PAGE)
}

// New token page
const newTokenContainer = document.getElementById("new-token-container")
newTokenContainer.style.display = "none"
const newTokenButton = document.getElementById("new-token-button")
const currentClientsList = document.getElementById("current-clients-list")
const newTokenResultWarning = document.getElementById(
  "new-token-result-warning"
)
const newTokenResult = document.getElementById("new-token-result")
const newTokenError = document.getElementById("new-token-error")
// Render new token page
const showNewTokenPage = async (did) => {
  _showPage(NEW_TOKEN_PAGE)
  newTokenResultWarning.style.display = "none"
  newTokenResult.style.display = "none"
  newTokenResult.textContent = ""
  newTokenError.textContent = ""

  await renderCurrentClients(did)
  newTokenButton.onclick = async () => {
    newTokenResultWarning.style.display = "none"
    newTokenResult.style.display = "none"
    newTokenResult.textContent = ""
    newTokenError.textContent = ""

    const res = await postApiClients(did)

    if (res.errors) {
      newTokenError.textContent = res.errors
        .map((errObj) => errObj.message)
        .join(", ")
      return
    }

    newTokenResultWarning.style.display = "block"
    newTokenResult.style.display = "block"
    newTokenResult.textContent = `Token: ${res.id}`
    renderCurrentClients(did)
  }
}
const renderCurrentClients = async (did) => {
  currentClientsList.innerHTML = ""

  const clients = await getApiClients(did)

  clients.forEach((c) => {
    const liNode = document.createElement("li")
    liNode.classList.add("padding-5")

    const spanNode = document.createElement("span")
    spanNode.textContent = c.id
    spanNode.classList.add("padding-5")
    liNode.appendChild(spanNode)

    const buttonNode = document.createElement("button")
    buttonNode.textContent = "Revoke"
    buttonNode.classList.add("action-button")
    buttonNode.dataset.token = c.id
    buttonNode.onclick = (e) => showRevokeTokenPage(did, e.target.dataset.token)

    liNode.appendChild(buttonNode)

    currentClientsList.appendChild(liNode)
  })
}

// Revoke token page
const revokeTokenContainer = document.getElementById("revoke-token-container")
revokeTokenContainer.style.display = "none"
const revokeMaskedToken = document.getElementById("revoke-masked-token")
const revokeTokenInput = document.getElementById("revoke-token-input")
const revokeReasonInput = document.getElementById("revoke-reason-input")
const revokeTokenButton = document.getElementById("revoke-token-button")
const revokeTokenResult = document.getElementById("revoke-token-result")
const revokeTokenError = document.getElementById("revoke-token-error")
const revokeBackButton = document.getElementById("revoke-back-button")
// Render revoke token page
const showRevokeTokenPage = (did, token) => {
  _showPage(REVOKE_TOKEN_PAGE)
  revokeTokenInput.value = ""
  revokeReasonInput.value = ""
  revokeTokenResult.textContent = ""
  revokeTokenError.textContent = ""

  revokeMaskedToken.textContent = `Token: ${token}`

  revokeTokenButton.onclick = async () => {
    revokeTokenResult.textContent = ""
    revokeTokenError.textContent = ""

    const apiToken = revokeTokenInput.value.trim()
    const revokedReason = revokeReasonInput.value.trim()

    if (!apiToken && !revokedReason) return

    if (!apiToken) {
      revokeTokenError.textContent = "Full Api Token is missing"
      return
    }

    if (token.slice(-4) !== apiToken.slice(-4)) {
      revokeTokenError.textContent =
        "Full Api Token does not match Masked Api Token"
      return
    }

    const res = await revokeApiClients(apiToken, revokedReason)

    if (res.errors) {
      revokeTokenError.textContent = res.errors
        .map((errObj) => errObj.message)
        .join(", ")
      return
    }

    revokeTokenResult.textContent = "Success!"
  }
  revokeBackButton.onclick = () => showNewTokenPage(did)
}

// APIs
async function postUsers(did) {
  const data = {
    did
  }

  const response = await fetch(`${baseUrl}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  return await response.json()
}

async function getUsers(did) {
  const response = await fetch(`${baseUrl}/api/v1/users/${did}`, {
    method: "GET"
  })

  return await response.json()
}

async function getApiClients(did) {
  const response = await fetch(
    `${baseUrl}/api/v1/apiClients?${new URLSearchParams({ did })}`,
    {
      method: "GET"
    }
  )

  return await response.json()
}

async function postApiClients(did) {
  const data = {
    did
  }
  const response = await fetch(`${baseUrl}/api/v1/apiClients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  return await response.json()
}

async function revokeApiClients(apiToken, revokedReason) {
  const options = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiToken
    }
  }

  if (revokedReason) {
    Object.assign(options, {
      body: JSON.stringify({
        revokedReason
      })
    })
  }
  const data = {
    revokedReason
  }
  const response = await fetch(`${baseUrl}/api/v1/apiClients`, options)
  return await response.json()
}

function _showPage(page) {
  signupContainer.style.display = page === SIGN_UP_PAGE ? "block" : "none"
  legalTermsContainer.style.display =
    page === LEGAL_TERMS_PAGE ? "block" : "none"
  newTokenContainer.style.display = page === NEW_TOKEN_PAGE ? "block" : "none"
  revokeTokenContainer.style.display =
    page === REVOKE_TOKEN_PAGE ? "block" : "none"
}
