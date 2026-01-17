import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';

// Student Imports
import StudentDashboard from './dashboards/StudentDashboard'; 
import StudentAssignments from './pages/StudentAssignments';
import StudentProfile from './pages/StudentProfile';
import StudentMaterials from './pages/StudentMaterials';
import StudentMarks from './pages/StudentMarks';
import StudentTimetable from './pages/StudentTimetable'; 
import StudentAttendance from './pages/StudentAttendance';
import StudentMarksEntry from './pages/StudentMarksEntry';

// Tutor Imports
import TutorDashboard from './pages/tutor/TutorDashboard';
import AttendancePanel from './pages/tutor/AttendanceModule';
import SyllabusTracker from './pages/tutor/SyllabusTracker';
import AssignmentManager from './pages/tutor/AssignmentManager';
import TutorProfile from './pages/tutor/TutorProfile';
import TutorMaterialUpload from './pages/tutor/TutorMaterialUpload';
import TutorRequests from './pages/tutor/TutorRequests';
import LeadRequests from './pages/lead/LeadRequests';

// --- LEAD IMPORTS (Updated) ---
// Keep all lead files in one folder to avoid "File Not Found" errors
import LeadDashboard from './pages/lead/LeadDashboard';
import LeadProfile from './pages/lead/LeadProfile';
import Announcements from './pages/lead/Announcements';
import Timetables from './pages/lead/Timetables';
import UserManagement from './pages/lead/UserManagement';
import StudentPerformance from './pages/lead/StudentPerformance';
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login Page */}
          <Route path="/" element={<LoginPage />} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/materials" element={<StudentMaterials />} />
          <Route path="/student/marks" element={<StudentMarks />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/Attendance" element={<StudentAttendance />} />
          <Route path="/student/marksentry" element={<StudentMarksEntry />} />
          
          {/* Tutor Routes */}
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/profile" element={<TutorProfile />} />
          <Route path="/tutor/attendance" element={<AttendancePanel />} />
          <Route path="/tutor/syllabus" element={<SyllabusTracker />} />
          <Route path="/tutor/assignments" element={<AssignmentManager />} />
          <Route path="/tutor/upload-material" element={<TutorMaterialUpload />} />
          <Route path="/tutor/requests" element={<TutorRequests />} />

          {/* Lead Routes */}
          <Route path="/lead/dashboard" element={<LeadDashboard />} />
          <Route path="/lead/profile" element={<LeadProfile />} />
          {/* Add these to prevent crashes if clicking links in sidebar */}
          <Route path="/lead/create-mail" element={<div style={{padding: 20, marginLeft: 260}}><h1>Create Mail</h1></div>} />
          <Route path="/lead/announcements" element={<Announcements />} />
          <Route path="/lead/timetable" element={<Timetables />} />
          <Route path="/lead/user-management" element={<UserManagement />} />
          <Route path="/lead/requests" element={<LeadRequests />} />
          <Route path="/lead/student-performance" element={<StudentPerformance />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;