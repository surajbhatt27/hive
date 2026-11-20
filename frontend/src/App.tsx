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
import SpaceMembers from "./pages/SpaceMembers"
import JoinSpace from "./pages/JoinSpace"
import HabitDetail from "./pages/HabitDetail"

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
              <Route path="/spaces/:spaceId/habits/:habitId" element={
                <ProtectedRoute>
                  <HabitDetail/>
                </ProtectedRoute>}
              />
              <Route path="/spaces/:id/members" element={
                <ProtectedRoute>
                  <SpaceMembers/>
                </ProtectedRoute>}
              />
              {/* Public: an invited visitor must see the space before signing up. */}
              <Route path="/join/:slug" element={<JoinSpace/>}/>

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