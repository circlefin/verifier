/*
 * Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
 * All rights reserved.
 *
 * Circle Internet Financial Trading Company Limited CONFIDENTIAL
 *
 * This file includes unpublished proprietary source code of Circle Internet
 * Financial Trading Company Limited, Inc. The copyright notice above does not
 * evidence any actual or intended publication of such source code. Disclosure
 * of this source code or any related proprietary information is strictly
 * prohibited without the express written permission of Circle Internet Financial
 * Trading Company Limited.
 */

import test_config from "test_config";
import { get, post } from "loadtest-common/common";
import { generateUUID } from "loadtest-common/utils";
import { KJUR } from "jsrsasign";
import { fail } from "k6";
import jwt_decode from "jwt-decode";
import http from "k6/http";

const servicesConfig = test_config.services;

export const etherAddress = "0x5922aee21da29814adc6b33cdf9920b72963a110";

function isSuccess(statusCode) {
  const httpCode = parseInt(String(statusCode));
  return 200 <= httpCode && httpCode < 400;
}

// apply credential from the Issuer
export function getCredential() {
  const challengeTokenUrl = get(
    `${servicesConfig.issuer_api.url}/api/v1/issuance/challenge?attestation=kybpaccinv&debug=true`,
    {
      headers: {
        "X-Request-Origin-Entity-Id": generateUUID(),
        "X-Request-Origin-User-Id": "00randomUserId",
        "Content-Type": "application/json",
      },
    },
    "get challenge"
  )["data"]["challengeTokenUrl"];
  console.info(
    `Issuer request 1 succeeded: challengeTokenUrl=${challengeTokenUrl}`
  );

  const manifest = get(
    challengeTokenUrl,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
    "get manifest"
  );
  const submissionId = manifest["id"];
  const challengeId = manifest["body"]["challenge"];
  console.info(
    `Issuer request 2 succeeded: submissionId=${submissionId}, challengeId=${challengeId}`
  );

  const submissionBody = getCredentialSubmissionTemplate(
    submissionId,
    etherAddress
  );
  const submissionRequestBody = KJUR.jws.JWS.sign(
    "HS256",
    { alg: "HS256" },
    JSON.stringify(submissionBody),
    challengeId
  );

  const submissionRes = http.post(
    `${servicesConfig.issuer_api.url}/api/v1/issuance/credential/${submissionId}`,
    submissionRequestBody,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    },
    "submission"
  );
  if (!isSuccess(submissionRes.status)) {
    fail(`Error ${name}, response status code is ${submissionRes.status}`);
  }
  const vpJwt = submissionRes.body.toString();
  const vp = jwt_decode(vpJwt);
  const vc = vp["vp"]["verifiableCredential"][0];
  console.info("Issuer request 3 succeeded.");
  return vc;
}

export const getVerificationSubmissionTemplate = (nouce, vc) => {
  return {
    presentation_submission: {
      definition_id: "kybpaccinvPresentationDefinition",
      descriptor_map: [
        {
          format: "jwt_vc",
          id: "kybpaml_input",
          path: "$.verifiableCredential[0]",
        },
        {
          format: "jwt_vc",
          id: "accinv_input",
          path: "$.verifiableCredential[0]",
        },
      ],
    },
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation", "CredentialFulfillment"],
      verifiableCredential: [vc],
    },
    nonce: nouce,
  };
};

// verifier functions
export function create() {
  const creation = post(
    `${servicesConfig.verifier_api.url}/api/v1/verifications`,
    JSON.stringify({
      network: "ethereum",
      subject: "0x5922aee21da29814adc6b33cdf9920b72963a110",
      chainId: 1337,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
    "postVerification"
  );
  const challengeTokenUrl = creation["challengeTokenUrl"];
  if (!challengeTokenUrl) {
    fail("challengeTokenUrl is not defined");
  }
  return challengeTokenUrl;
}

export function offer(challengeTokenUrl) {
  const offer = get(
    challengeTokenUrl,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
    "getOffer"
  );
  const verificationId = offer["id"];
  const challenge = offer["body"]["challenge"];

  if (!verificationId) {
    fail("verificationId is not defined");
  }
  if (!challenge) {
    fail("challenge is not defined");
  }

  return { verificationId, challenge };
}

// very costly computation. Only include this in setup stage
export function generateSubmitBody(credential, verificationId, challenge) {
  const verificationBody = getVerificationSubmissionTemplate(
    challenge,
    credential
  );
  return KJUR.jws.JWS.sign(
    "none",
    { alg: "none" },
    JSON.stringify(verificationBody)
  );
}

export function submit(verificationId, verificationBodyJwt) {
  const verificationResult = post(
    `${servicesConfig.verifier_api.url}/api/v1/verifications/${verificationId}`,
    verificationBodyJwt,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    },
    "submitVerification"
  );

  if (verificationResult["status"] !== "success") {
    fail(`VerificationResult failed. status=${verificationResult["status"]}`);
  }
}

const getCredentialSubmissionTemplate = (submissionId, etherAddress) => {
  return {
    sub: `did:pkh:eip155:1337:${etherAddress}`,
    iss: `did:pkh:eip155:1337:${etherAddress}`,
    credential_application: {
      id: submissionId,
      manifest_id: "KYBPAMLACCINVAttestation",
      format: {
        jwt_vp: {
          alg: ["ES256K"],
        },
      },
    },
    presentation_submission: {
      id: submissionId,
      definition_id: "ProofOfControlPresentationDefinition",
      descriptor_map: [
        {
          id: "proofOfIdentifierControlVP",
          format: "jwt_vp",
          path: "$.presentation",
        },
      ],
    },
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation", "CredentialFulfillment"],
      holder: "did:web:circle.com",
    },
  };
};
