import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import logo from "@/assets/logo.png"

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !role) {
      setError("Please fill in all fields.")
      return
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email, password, role })
      navigate("/")
    } catch (err: any) {
      console.error(err)
      const detail = err.response?.data?.detail || "An unexpected error occurred."
      setError(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Dark theme as per implementation.md */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="space-y-4 mt-8">
          <img src={logo} alt="TransitOps Logo" className="h-28 w-auto object-contain -ml-2" />
          <p className="text-lg text-primary-foreground/80">Smart Transport Operations Platform</p>
        </div>

        <div className="space-y-6 mb-24 max-w-md">
          <h2 className="text-2xl font-semibold leading-tight">
            Manage your fleet with ease.
          </h2>
          <ul className="space-y-3 text-primary-foreground/80 pt-2">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
              Live trip dispatching
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
              Automated maintenance
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
              Cost & ROI analytics
            </li>
          </ul>
        </div>

        <div className="text-sm text-primary-foreground/60">
          TRANSITOPS &copy; 2026 - RBAC MODE
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 xl:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold">Sign in to your account</h2>
            <p className="text-muted-foreground">Enter your credentials to continue</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error state</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="raven@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs uppercase tracking-wider text-muted-foreground">
                Role (RBAC)
              </Label>
              <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fleet_manager">Fleet Manager</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="safety_officer">Safety Officer</SelectItem>
                  <SelectItem value="financial_analyst">Financial Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" disabled={isSubmitting} className="cursor-pointer" />
                <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button variant="link" type="button" className="px-0 text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
