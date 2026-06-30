import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {

  return (
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/dashboard" element={<ProtectedRoute> <Dashboard/> </ProtectedRoute>}/>
          <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
          />
          <Route 
              path="*" 
              element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </AuthProvider>
      </BrowserRouter>
    )
  }

export default App