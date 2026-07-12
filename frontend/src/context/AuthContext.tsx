import React, { createContext, useContext, useState, useEffect } from "react"
import { api } from "@/lib/api"
import { User, TokenResponse, LoginCredentials } from "@/types/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await api.get<User>("/api/auth/me")
          setUser(response.data)
        } catch (error) {
          console.error("Failed to authenticate token", error)
          localStorage.removeItem("auth_token")
          delete api.defaults.headers.common["Authorization"]
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post<TokenResponse>("/api/auth/login", credentials)
    const { access_token, user: loggedInUser } = response.data
    
    localStorage.setItem("auth_token", access_token)
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
    setUser(loggedInUser)
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
