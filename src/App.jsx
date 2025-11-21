"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/Dashboard"
import AdminAssignTask from "./pages/QC-Lab"
import AccountDataPage from "./pages/HotCoil"
import "./index.css"
import QuickTask from "./pages/SMSRegister"
import License from "./pages/Recoiler"
import TrainingVideo from "./pages/PipeMill"
import Laddel from "./pages/Laddel";
import Tundis from "./pages/Tundis";
import { AuthProvider } from "./AuthContext/AuthContext.jsx"
import ProtectedRoute from "./AuthContext/ProtectedRout"


function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

          {/* Admin & User Dashboard route */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/laddel"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <Laddel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tundis"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <Tundis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quick-task"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <QuickTask />
              </ProtectedRoute>
            }
          />
          {/* Assign Task route - only for admin */}
          <Route
            path="/dashboard/assign-task"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAssignTask />
              </ProtectedRoute>
            }
          />

          {/* Delegation route for user */}
          <Route
            path="/dashboard/delegation"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <AccountDataPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/license"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <License />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/traning-video"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <TrainingVideo />
              </ProtectedRoute>
            }
          />

          {/* Backward compatibility redirects */}
          <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
          <Route parh="/admin/quick-task" element={<Navigate to="/dashboard/laddel" replace />} />
          <Route path="/admin/assign-task" element={<Navigate to="/dashboard/tundis" replace />} />
          <Route parh="/admin/quick-task" element={<Navigate to="/dashboard/quick-task" replace />} />
          <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
          <Route path="/admin/data/:category" element={<Navigate to="/dashboard/data/:category" replace />} />
          <Route path="/admin/license" element={<Navigate to="/dashboard/license" replace />} />
          <Route path="/admin/traning-video" element={<Navigate to="/dashboard/traning-video" replace />} />
          <Route path="/user/*" element={<Navigate to="/dashboard/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
