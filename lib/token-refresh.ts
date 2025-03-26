/**
 * Utility function to refresh the access token using the refresh token
 */
export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("maplexpress_refresh_token")

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    // Call your refresh token endpoint
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    // Update the stored tokens
    localStorage.setItem("maplexpress_access_token", data.accessToken)

    // If a new refresh token is provided, update it too
    if (data.refreshToken) {
      localStorage.setItem("maplexpress_refresh_token", data.refreshToken)
    }

    // Update user data if provided
    if (data.tokenExpiration) {
      const userData = JSON.parse(localStorage.getItem("maplexpress_user_data") || "{}")
      userData.tokenExpiration = data.tokenExpiration
      localStorage.setItem("maplexpress_user_data", JSON.stringify(userData))
    }

    return data.accessToken
  } catch (error) {
    // If refresh fails, log out the user
    localStorage.removeItem("maplexpress_access_token")
    localStorage.removeItem("maplexpress_refresh_token")
    localStorage.removeItem("maplexpress_user_data")
    window.location.href = "/" // Redirect to home page
    throw error
  }
}

