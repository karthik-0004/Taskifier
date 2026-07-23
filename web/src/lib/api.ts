const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

function getTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null }
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  }
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken)
  localStorage.setItem("refreshToken", refreshToken)
}

function clearTokens() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      clearTokens()
      return null
    }

    const data = await res.json()
    setTokens(data.accessToken, data.refreshToken ?? refreshToken)
    return data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options
  const { accessToken } = getTokens()

  const headers = new Headers(fetchOptions.headers)

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (accessToken && !skipAuth) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryHeaders = new Headers(fetchOptions.headers)
      if (!retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json")
      }
      retryHeaders.set("Authorization", `Bearer ${newToken}`)

      const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: retryHeaders,
      })

      if (!retryRes.ok) {
        const errorBody = await retryRes.text()
        let errorMessage: string
        try {
          const parsed = JSON.parse(errorBody)
          errorMessage = parsed.message ?? parsed.error ?? retryRes.statusText
        } catch {
          errorMessage = errorBody || retryRes.statusText
        }
        throw new ApiError(retryRes.status, errorMessage)
      }

      if (retryRes.status === 204) return undefined as T

      return retryRes.json()
    }

    clearTokens()
    throw new ApiError(401, "Session expired. Please log in again.")
  }

  if (!res.ok) {
    const errorBody = await res.text()
    let errorMessage: string
    try {
      const parsed = JSON.parse(errorBody)
      errorMessage = parsed.message ?? parsed.error ?? res.statusText
    } catch {
      errorMessage = errorBody || res.statusText
    }
    throw new ApiError(res.status, errorMessage)
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}
