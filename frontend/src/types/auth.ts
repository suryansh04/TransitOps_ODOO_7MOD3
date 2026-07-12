export interface User {
  id: number
  name: string
  email: string
  role: string
  permissions: Record<string, string>
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
  role: string
}
