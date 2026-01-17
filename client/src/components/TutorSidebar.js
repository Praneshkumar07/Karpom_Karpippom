import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  CalendarCheck, 
  ClipboardList, 
  BookOpen, 
  FilePlus, 
  LogOut,
  LayoutDashboard, 
  Mail
} from 'lucide-react';
import './StudentSidebar.css'; 

const TutorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Add your logout logic here
    console.log("Logging out...");
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/tutor/dashboard', icon: LayoutDashboard }, // Added Dashboard
    { name: 'My Profile', path: '/tutor/profile', icon: User },
    { name: 'Attendance', path: '/tutor/attendance', icon: CalendarCheck },
    { name: 'Syllabus Tracker', path: '/tutor/syllabus', icon: BookOpen },
    { name: 'Assignments', path: '/tutor/assignments', icon: FilePlus },
    { name: 'Upload Material', path: '/tutor/upload-material', icon: BookOpen },
    { name: 'Tutor-Request', path: '/tutor/requests', icon: Mail},

  ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2 className="header-title">KK Platform</h2>
        <span className="header-subtitle">Tutor Portal</span>
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
              <span className="icon-wrapper"><IconComponent size={20} /></span>
              {item.name}
            </Link>
          );
        })}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={20} className="logout-icon" /> Logout
      </button>
    </div>
  );
};

export default TutorSidebar;