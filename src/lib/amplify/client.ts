"use client"

import { Amplify } from "aws-amplify"

let configured = false

export function configureAmplifyClient() {
  if (configured || typeof window === "undefined") {
    return
  }

  const region = process.env.NEXT_PUBLIC_COGNITO_REGION
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

  if (!region || !userPoolId || !userPoolClientId) {
    throw new Error("Missing Cognito env vars: NEXT_PUBLIC_COGNITO_REGION, NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID")
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        signUpVerificationMethod: "code",
      },
    },
  })

  configured = true
}
