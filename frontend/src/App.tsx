import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Login } from "@/pages/Login"
import { Settings } from "@/pages/Settings"
import { AppLayout } from "@/components/layout/AppLayout"
import { Loader2 } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

// Route wrapper for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Route wrapper for unauthenticated users only
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Route wrapper for RBAC permissions
const RBACRoute: React.FC<{ children: React.ReactNode, module: string }> = ({ children, module }) => {
  const { user } = useAuth()
  
  if (module === "always") return <>{children}</>
  
  if (user?.permissions?.[module] && user.permissions[module] !== "none") {
    return <>{children}</>
  }
  
  // If user doesn't have permission, kick them to the dashboard
  return <Navigate to="/" replace />
}

// Reusable Mock Page component
const MockPage = ({ title }: { title: string }) => {
  const { user } = useAuth()
  return (
    <div>
      <h2 className="text-2xl font-bold">{title} Page</h2>
      {title === "Dashboard" ? (
        <p className="text-muted-foreground mt-4">
          Welcome, {user?.name} ({user?.role}). Auth flow completed successfully.
        </p>
      ) : (
        <p className="text-muted-foreground mt-4">This is the {title.toLowerCase()} module placeholder.</p>
      )}
    </div>
  )
}

const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        {/* Main Application Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<MockPage title="Dashboard" />} />
          <Route path="fleet" element={<RBACRoute module="fleet"><MockPage title="Fleet" /></RBACRoute>} />
          <Route path="drivers" element={<RBACRoute module="drivers"><MockPage title="Drivers" /></RBACRoute>} />
          <Route path="trips" element={<RBACRoute module="trips"><MockPage title="Trips" /></RBACRoute>} />
          <Route path="maintenance" element={<RBACRoute module="fleet"><MockPage title="Maintenance" /></RBACRoute>} />
          <Route path="fuel-expenses" element={<RBACRoute module="fuel_expenses"><MockPage title="Fuel & Expenses" /></RBACRoute>} />
          <Route path="analytics" element={<RBACRoute module="analytics"><MockPage title="Analytics" /></RBACRoute>} />
          <Route path="settings" element={<RBACRoute module="settings"><Settings /></RBACRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App