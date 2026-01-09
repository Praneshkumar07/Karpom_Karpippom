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
import TutorDashboard from './pages/tutor/TutorDashboard'; // New
import AttendancePanel from './pages/tutor/AttendanceModule';
import SyllabusTracker from './pages/tutor/SyllabusTracker';
import AssignmentManager from './pages/tutor/AssignmentManager';
import TutorProfile from './pages/tutor/TutorProfile';
import StudentMarksEntry from './pages/StudentMarksEntry';
import TutorMaterialUpload from './pages/tutor/TutorMaterialUpload';
// import TutorDashboard from './pages/TutorDashboard'; // Uncomment when you build tutor side
// import LeadDashboard from './pages/LeadDashboard'; // Uncomment when you build lead side
// import AdminDashboard from './pages/AdminDashboard'; // Uncomment when you build admin side
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
          <Route path="/student/marksentry" element={< StudentMarksEntry />} />
          
          {/* Staff Dashboard (Placeholder for now) */}
          {/* Tutor Routes */}
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/profile" element={<TutorProfile />} />
          <Route path="/tutor/attendance" element={<AttendancePanel />} />
          <Route path="/tutor/syllabus" element={<SyllabusTracker />} />
          <Route path="/tutor/assignments" element={<AssignmentManager />} />
          <Route path="/tutor/upload-material" element={<TutorMaterialUpload />} />

          {/* Additional routes for Lead, Admin, Staff can be added similarly */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;