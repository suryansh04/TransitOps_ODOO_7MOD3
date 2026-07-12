import React from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TransitOps Dashboard</h1>
        <Button onClick={logout} variant="outline">Log out</Button>
      </div>
      <p className="text-muted-foreground mt-4">
        Welcome, {user?.name} ({user?.role}). Auth flow completed successfully.
      </p>
    </div>
  )
}
