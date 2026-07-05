import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Register from "./Register";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import AdminApprove from "./pages/AdminApprove";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRoomRequest from "./pages/StudentRoomRequest";
import StudentMaintenanceRequest from "./pages/StudentMaintenanceRequest";
import StudentVisitorRegistration from "./pages/StudentVisitorRegistration";
import StudentIncidentReport from "./pages/StudentIncidentReport";
import StudentPaymentHub from "./pages/StudentPaymentHub";
import StudentProfileSettings from "./pages/StudentProfileSettings";
import ProtectedRoute from "./ProtectedRoute";
import WardenDashboard from "./pages/WardenDashboard";
import WardenRoomRequest from "./pages/WardenRoomRequest";
import WardenMaintenanceRequest from "./pages/WardenMaintenanceRequest";
import MaintenanceStaffDashboard from "./pages/MaintenanceStaffDashboard";
import WardenVisitorRequest from "./pages/WardenVisitorRequest";
import WardenIncidentRequest from "./pages/WardenIncidentRequest";
import AdminPaymentItems from "./pages/AdminPaymentItems";
import AdminPaymentHistory from "./pages/AdminPaymentHistory";
import StudentPaymentPage from "./pages/StudentPayment";
import AdminPaymentsDashboard from "./pages/AdminPaymentDashboard";
import AdminManageStudents from "./pages/AdminManageStudents";
import AdminStaffDirectory from "./pages/AdminStaffDirectory";
import AdminSettings from "./pages/AdminSettings";
import AdminServerLogs from "./pages/AdminServerLogs";
import WardenSettings from "./pages/WardenSettings";
import MaintenanceSettings from "./pages/MaintenanceSettings";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import WardenStaffDirectory from "./pages/WardenStaffDirectory";

export default function App() {
  const location = useLocation();
  const isAuthPage = ["/", "/login", "/register"].includes(location.pathname);

  return (
    <div>
      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminApprove />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-approve"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminApprove />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-manage-students"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-staff-directory"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminStaffDirectory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-settings"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-server-logs"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminServerLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-room-request"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentRoomRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-maintenance-request"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentMaintenanceRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-visitor-registration"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentVisitorRegistration />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-incident-report"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentIncidentReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-payment"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentPaymentHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-settings"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentProfileSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/help-center"
          element={
            <ProtectedRoute allowedRole="student">
              <HelpCenter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/privacy-policy"
          element={
            <ProtectedRoute allowedRole="student">
              <PrivacyPolicy />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-dashboard"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-settings"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance-settings"
          element={
            <ProtectedRoute allowedRole="maintenance_staff">
              <MaintenanceSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-staff-directory"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenStaffDirectory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-dashboard-rooms"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenRoomRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-maintenance-dashboard"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenMaintenanceRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance-staff-dashboard"
          element={
            <ProtectedRoute allowedRole="maintenance_staff">
              <MaintenanceStaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-visitor-dashboard"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenVisitorRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden-incident-dashboard"
          element={
            <ProtectedRoute allowedRole="warden">
              <WardenIncidentRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-payment-items"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPaymentItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-payment-history"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPaymentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-payment"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentPaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-payment"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPaymentsDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </div>
  );
}