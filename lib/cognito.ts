import { COGNITO_CLIENT_ID, COGNITO_REGION } from "@/lib/config"

type CognitoErrorPayload = {
  __type?: string
  message?: string
  Message?: string
}

export type CognitoRequestResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: CognitoErrorPayload }

const getCognitoEndpoint = () => {
  if (!COGNITO_REGION) {
    throw new Error("COGNITO_REGION is not configured")
  }
  return `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`
}

export const getCognitoClientId = () => {
  if (!COGNITO_CLIENT_ID) {
    throw new Error("COGNITO_CLIENT_ID is not configured")
  }
  return COGNITO_CLIENT_ID
}

export async function cognitoRequest<T>(
  target: string,
  body: Record<string, unknown>,
): Promise<CognitoRequestResult<T>> {
  const response = await fetch(getCognitoEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": target,
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as T | CognitoErrorPayload

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data as CognitoErrorPayload,
    }
  }

  return { ok: true, data: data as T }
}

export type JwtPayload = Record<string, unknown> & {
  sub?: string
  exp?: number
  email?: string
}

export const decodeJwtPayload = (token?: string): JwtPayload | null => {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const decoded = Buffer.from(normalized, "base64").toString("utf-8")
    return JSON.parse(decoded) as JwtPayload
  } catch (error) {
    console.error("Failed to decode JWT payload", error)
    return null
  }
}
