"use client"

import {
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
} from "aws-amplify/auth"
import { configureAmplifyClient } from "@/src/lib/amplify/client"

type Tokens = { accessToken: string; idToken: string; refreshToken: string }

export async function signUp(email: string, password: string) { configureAmplifyClient(); return amplifySignUp({ username: email, password, options: { userAttributes: { email } } }) }
export async function confirmSignUp(email: string, code: string) { configureAmplifyClient(); return amplifyConfirmSignUp({ username: email, confirmationCode: code }) }
export async function resendSignUpCode(email: string) { configureAmplifyClient(); return amplifyResendSignUpCode({ username: email }) }
export async function signIn(email: string, password: string): Promise<Tokens> {
  configureAmplifyClient(); const result = await amplifySignIn({ username: email, password });
  if (result.nextStep.signInStep !== "DONE") throw new Error("Additional sign-in steps are required and are not supported in this flow.");
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString(); const idToken = session.tokens?.idToken?.toString();
  if (!accessToken || !idToken) throw new Error("Unable to resolve Cognito tokens after sign-in");
  return { accessToken, idToken, refreshToken: "managed-by-amplify" }
}
export async function forgotPassword(email: string) { configureAmplifyClient(); return resetPassword({ username: email }) }
export async function forgotPasswordSubmit(email: string, code: string, newPassword: string) { configureAmplifyClient(); return confirmResetPassword({ username: email, confirmationCode: code, newPassword }) }
export async function signOut() { configureAmplifyClient(); return amplifySignOut() }
