import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider"

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export function createCognitoClient() {
  return new CognitoIdentityProviderClient({
    region: requireEnv("NEXT_PUBLIC_COGNITO_REGION"),
  })
}

function appClientId() {
  return requireEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID")
}

export async function cognitoInitiateAuth(email: string, password: string) {
  const client = createCognitoClient()
  return client.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: appClientId(),
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  )
}

export async function cognitoSignUp(email: string, password: string) {
  const client = createCognitoClient()
  return client.send(
    new SignUpCommand({
      ClientId: appClientId(),
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    }),
  )
}

export async function cognitoConfirmSignUp(email: string, code: string) {
  const client = createCognitoClient()
  return client.send(
    new ConfirmSignUpCommand({
      ClientId: appClientId(),
      Username: email,
      ConfirmationCode: code,
    }),
  )
}

export async function cognitoResendSignUpCode(email: string) {
  const client = createCognitoClient()
  return client.send(
    new ResendConfirmationCodeCommand({
      ClientId: appClientId(),
      Username: email,
    }),
  )
}

export async function cognitoForgotPassword(email: string) {
  const client = createCognitoClient()
  return client.send(
    new ForgotPasswordCommand({
      ClientId: appClientId(),
      Username: email,
    }),
  )
}

export async function cognitoForgotPasswordSubmit(email: string, code: string, newPassword: string) {
  const client = createCognitoClient()
  return client.send(
    new ConfirmForgotPasswordCommand({
      ClientId: appClientId(),
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }),
  )
}
