import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HRMSProvider } from './context/HRMSContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import LeaveManagement from './pages/LeaveManagement'
import Payroll from './pages/Payroll'
import Performance from './pages/Performance'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Shifts from './pages/Shifts'
import HRTickets from './pages/HRTickets'
<<<<<<< HEAD
import Recruitment from './pages/Recruitment'
=======
// import Recruitment from './pages/Recruitment'
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
import Analytics from './pages/Analytics'
import InitialRoute from './components/InitialRoute'
import { isAuthenticated } from './utils/auth'

function App() {
  return (
    <HRMSProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<InitialRoute />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="performance" element={<Performance />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="tickets" element={<HRTickets />} />
<<<<<<< HEAD
            <Route path="recruitment" element={<Recruitment />} />
=======
            {/* <Route path="recruitment" element={<Recruitment />} /> */}
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </HRMSProvider>
  )
}

// Protected Route Component
function ProtectedRoute() {
  // Check for valid JWT token, not just the flag
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  
  return <Layout />
}

export default App

