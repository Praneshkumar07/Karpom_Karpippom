import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import StudentDashboard from './dashboards/StudentDashboard'; // Import the new page
import StudentAssignments from './pages/StudentAssignments';
import StudentProfile from './pages/StudentProfile';
import StudentMaterials from './pages/StudentMaterials';
import StudentMarks from './pages/StudentMarks';
import StudentTimetable from './pages/StudentTimetable'; 
import StudentAttendance from './pages/StudentAttendance';
// import StaffDashboard from './pages/StaffDashboard'; // Uncomment when you build staff side

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login Page */}
          <Route path="/" element={<LoginPage />} />
          
          {/* Student Dashboard */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/materials" element={<StudentMaterials />} />
          <Route path="/student/marks" element={<StudentMarks />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/Attendance" element={<StudentAttendance />} />
          {/* Staff Dashboard (Placeholder for now) */}
          <Route path="/staff/dashboard" element={<h1>Staff Dashboard Coming Soon</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;