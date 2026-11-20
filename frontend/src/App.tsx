import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AppLayout } from "./components/AppLayout"
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public: an invited visitor must see the space before signing up. */}
            <Route path="/join/:slug" element={<JoinSpace />} />

            {/* Everything else needs an account and shares the app shell. */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/spaces" element={<Spaces />} />
              <Route path="/spaces/create" element={<CreateSpace />} />
              <Route path="/spaces/:id" element={<SpaceDetail />} />
              <Route path="/spaces/:spaceId/habits/:habitId" element={<HabitDetail />} />
              <Route path="/spaces/:id/members" element={<SpaceMembers />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
