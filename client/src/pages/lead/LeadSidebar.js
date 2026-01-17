import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Megaphone, 
  Calendar, 
  Mail, 
  LogOut,
  Send, 
  ChartSpline
} from 'lucide-react'; 
// Import the CSS (We will create this file below)
// --- AUTH CONTEXT MOCK ---
const useAuth = () => {
  return {
    logout: () => {
      console.log("Logging out...");
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };
};

const LeadSidebarContent = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menu items specific to the Lead/Admin role
  const menuItems = [
    { name: 'Dashboard', path: '/lead/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/lead/profile', icon: User },
    { name: 'Announcements', path: '/lead/announcements', icon: Megaphone },
    { name: 'Timetable', path: '/lead/timetable', icon: Calendar },
    { name: 'User Management', path: '/lead/User-management', icon: Mail },
    { name: 'Request-Handling', path: '/lead/requests', icon: Send }, // For mailing Tutor/Student
    { name: 'Performance-Analysis', path: '/lead/student-performance', icon: ChartSpline },
  ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2 className="header-title">KK Platform</h2>
        <span className="header-subtitle">Lead Portal</span>
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

const LeadSidebar = () => {
  return <LeadSidebarContent />;
};

export default LeadSidebar;