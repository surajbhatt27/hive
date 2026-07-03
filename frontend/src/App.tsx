import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { SpaceProvider } from "./context/SpaceContext"
import Spaces from "./pages/Spaces"
import CreateSpace from "./pages/CreateSpace"
import SpaceDetail from "./pages/SpaceDetail"

function App() {

  return (
      <BrowserRouter>
        <AuthProvider>
          <SpaceProvider>
            <Routes>
              <Route path="/login" element={<Login/>}/>
              <Route path="/register" element={<Register/>}/>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>}
              />
              <Route path="/spaces" element={
                <ProtectedRoute>
                  <Spaces/>
                </ProtectedRoute>}
              />
              <Route path="/spaces/create" element={
                <ProtectedRoute>
                  <CreateSpace/>
                </ProtectedRoute>}
              />
              <Route path="/spaces/:id" element={
                <ProtectedRoute>
                  <SpaceDetail/>
                </ProtectedRoute>}
              />

              {/* Redirects */}
              <Route 
                  path="/" 
                  element={<Navigate to="/dashboard" replace />} 
              />
              <Route 
                  path="*" 
                  element={<Navigate to="/dashboard" replace />} 
              />
            </Routes>
          </SpaceProvider>
        </AuthProvider>
      </BrowserRouter>
    )
  }

export default App