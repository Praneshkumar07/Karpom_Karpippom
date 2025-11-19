import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  FileText, 
  User, 
  LogOut 
} from 'lucide-react';

// Import the external CSS file
import './StudentSidebar.css';

// --- AUTH CONTEXT MOCK (FOR PREVIEW) ---
const useAuth = () => {
  return {
    logout: () => {
      console.log("Logging out...");
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };
};

const StudentSidebarContent = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Assignments', path: '/student/assignments', icon: CheckSquare },
    { name: 'Timetable', path: '/student/timetable', icon: Calendar },
    { name: 'Marks', path: '/student/marks', icon: FileText },
    { name: 'Materials', path: '/student/materials', icon: BookOpen },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2 className="header-title">KK Platform</h2>
        <span className="header-subtitle">Student Portal</span>
      </div>
      
      <div className="menu-container">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link 
              key={index}
              to={item.path}
              className={`menu-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon-wrapper">
                <IconComponent size={20} />
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={20} className="logout-icon" /> 
        Logout
      </button>
    </div>
  );
};

const StudentSidebar = () => {
  return <StudentSidebarContent />;
};

export default StudentSidebar;