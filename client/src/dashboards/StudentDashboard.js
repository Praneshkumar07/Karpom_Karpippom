import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import axios from 'axios';
import { AlertCircle, RefreshCw, LayoutDashboard, CheckSquare, Calendar, FileText, BookOpen, User, Bell, Megaphone, Video, Users, CalendarDays, ExternalLink } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
// --- 1. INTERNAL MOCK AUTH CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser] = useState({ id: 4, username: 'Test Student' }); 

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  return useContext(AuthContext);
};

// --- 2. INTERNAL SIDEBAR COMPONENT ---
// const StudentSidebar = () => (
//   <div style={{ width: '250px', minHeight: '100vh', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
//       <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
//         <h2 style={{ margin: 0, color: '#facc15', fontSize: '1.5rem' }}>KK Platform</h2>
//         <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Student Portal</span>
//       </div>
//       <div style={{ flex: 1, marginTop: '20px', paddingLeft: '10px' }}>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#facc15', marginBottom:'5px' }}><LayoutDashboard size={20} style={{marginRight:'12px'}}/> Dashboard</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><CheckSquare size={20} style={{marginRight:'12px'}}/> Assignments</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><Calendar size={20} style={{marginRight:'12px'}}/> Timetable</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><FileText size={20} style={{marginRight:'12px'}}/> Marks</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><BookOpen size={20} style={{marginRight:'12px'}}/> Materials</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><User size={20} style={{marginRight:'12px'}}/> Profile</div>
//       </div>
//   </div>
// );

const API_BASE_URL = 'http://localhost:8081';

// --- MOCK DATA (Fallback) ---
const MOCK_STATS = { pending: 4, completed: 12, attendance: '85%' };
const MOCK_ASSIGNMENTS = [
  { subject: 'Mathematics', title: 'Calculus Integration Worksheet', due_date: '2025-11-25', status: 'Pending' },
  { subject: 'Physics', title: 'Optics Lab Report', due_date: '2025-11-22', status: 'Completed' },
];
const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: 'Thermodynamics Class', type: 'Class', subject: 'Physics', event_date_time: '2025-11-20T18:00:00', link: 'https://meet.google.com/abc', content: 'Join for problem solving.', priority: 'High' },
  { id: 2, title: 'Alumni Talk: Career in AI', type: 'Talk', event_date_time: '2025-11-22T10:00:00', link: 'https://zoom.us/j/123', content: 'Speaker: Mr. Kumar from Google.', priority: 'Normal' },
  { id: 3, title: 'Science Fair', type: 'Event', event_date_time: '2025-11-30T09:00:00', content: 'Venue: Auditorium.', priority: 'Normal' }
];

// --- 3. MAIN DASHBOARD COMPONENT ---
const DashboardContent = () => {
  const { currentUser } = useAuth();
  const effectiveUser = currentUser && currentUser.id ? currentUser : { id: 4, username: 'Test Student' };

  const [stats, setStats] = useState({ pending: 0, completed: 0, attendance: '0%' });
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = useCallback(async () => {
    if (effectiveUser && effectiveUser.id) {
        setLoading(true);
        const userId = effectiveUser.id;

        try {
            const [statsRes, assignmentsRes, announceRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/student/stats/${userId}`),
                axios.get(`${API_BASE_URL}/student/assignments/${userId}`),
                axios.get(`${API_BASE_URL}/student/announcements`)
            ]);

            if (statsRes.data) setStats(statsRes.data);
            if (Array.isArray(assignmentsRes.data)) setAssignments(assignmentsRes.data);
            if (Array.isArray(announceRes.data)) setAnnouncements(announceRes.data);
            
            setUsingMockData(false);

        } catch (err) {
            console.warn("Backend connection failed. Switching to MOCK DATA.", err);
            setStats(MOCK_STATS);
            setAssignments(MOCK_ASSIGNMENTS);
            setAnnouncements(MOCK_ANNOUNCEMENTS);
            setUsingMockData(true); 
        } finally {
            setLoading(false);
        }
    }
  }, [effectiveUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDateTime = (isoString) => {
    if(!isoString) return null;
    const date = new Date(isoString);
    return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Filter for Pending Assignments
  const pendingAssignments = assignments.filter(task => task.status === 'Pending');

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      <StudentSidebar />
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        <header style={{ marginBottom: '30px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
                <h1 style={{ margin: 0, color: '#0f172a' }}>Welcome, {effectiveUser.username}! 👋</h1>
                <p style={{ color: '#64748b', marginTop: '5px' }}>Batch: <span style={{fontWeight:'bold', color:'#2563eb'}}>KK_01</span></p>
            </div>
            {usingMockData && (
                <div style={{ fontSize: '0.8rem', color: '#d97706', backgroundColor:'#fef3c7', padding:'5px 10px', borderRadius:'15px', fontWeight:'bold', border:'1px solid #fcd34d' }}>
                    ⚠ Offline Mode
                </div>
            )}
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <Card title="Pending Homework" value={stats.pending} color="#f59e0b" />
          <Card title="Completed" value={stats.completed} color="#10b981" />
          <Card title="Attendance" value={stats.attendance} color="#3b82f6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px' }}>
            
            {/* LEFT COLUMN: TO-DO LIST (Pending Assignments) */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#334155' }}>To-do List</h3>
                
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '10px' }}>Subject</th>
                            <th style={{ padding: '10px' }}>Title</th>
                            <th style={{ padding: '10px' }}>Due Date</th>
                            <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pendingAssignments.slice(0, 5).map((task, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{task.subject}</td>
                            <td style={{ padding: '12px' }}>{task.title}</td>
                            <td style={{ padding: '12px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                            <td style={{ padding: '12px' }}>
                                <span style={{ 
                                color: '#c2410c',
                                fontWeight: 'bold',
                                backgroundColor: '#ffedd5',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                                }}>
                                {task.status}
                                </span>
                            </td>
                            </tr>
                        ))}
                        {pendingAssignments.length === 0 && (
                             <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#64748b'}}>No pending tasks! 🎉</td></tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* RIGHT COLUMN: ANNOUNCEMENTS */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column' }}>
                 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'15px' }}>
                    <h3 style={{ margin: 0, color: '#334155', display:'flex', alignItems:'center', gap:'10px' }}>
                        <Megaphone size={20} color="#3b82f6" /> Notice Board
                    </h3>
                    <span style={{ fontSize:'0.8rem', color:'#64748b', backgroundColor:'#f1f5f9', padding:'4px 8px', borderRadius:'4px' }}>Upcoming</span>
                 </div>

                 <div style={{ flex: 1, display:'flex', flexDirection:'column', gap:'15px' }}>
                    {announcements.map((notice, idx) => {
                        const dt = formatDateTime(notice.event_date_time);
                        
                        // Determine Type Styles
                        let typeColor = '#64748b'; 
                        let typeBg = '#f1f5f9';
                        let icon = <Bell size={14} />;
                        
                        if (notice.type === 'Class') { typeColor = '#2563eb'; typeBg='#dbeafe'; icon = <Video size={14}/>; }
                        else if (notice.type === 'Talk') { typeColor = '#9333ea'; typeBg='#f3e8ff'; icon = <Users size={14}/>; }
                        else if (notice.type === 'Event') { typeColor = '#16a34a'; typeBg='#dcfce7'; icon = <CalendarDays size={14}/>; }

                        return (
                            <div key={idx} style={{ 
                                borderLeft: notice.priority === 'High' ? '4px solid #ef4444' : `4px solid ${typeColor}`,
                                backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' 
                            }}>
                                {/* Header: Type and Title */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'5px' }}>
                                    <div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                                            <span style={{ fontSize:'0.75rem', fontWeight:'bold', color:typeColor, backgroundColor:typeBg, padding:'2px 8px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'4px' }}>
                                                {icon} {notice.type}
                                            </span>
                                            {notice.subject && <span style={{ fontSize:'0.75rem', color:'#64748b' }}>• {notice.subject}</span>}
                                        </div>
                                        <h4 style={{ margin: 0, color: '#1e293b', fontSize:'1rem' }}>{notice.title}</h4>
                                    </div>
                                    {notice.priority === 'High' && <Bell size={16} color="#ef4444" />}
                                </div>

                                {/* Content */}
                                <p style={{ margin: '5px 0', color: '#475569', fontSize: '0.9rem', lineHeight:'1.4' }}>{notice.content}</p>

                                {/* Footer: Time & Link */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #e2e8f0' }}>
                                    
                                    {dt ? (
                                        <div style={{ display:'flex', flexDirection:'column' }}>
                                            <span style={{ fontSize:'0.85rem', fontWeight:'bold', color:'#334155' }}>{dt.date}</span>
                                            <span style={{ fontSize:'0.8rem', color:'#64748b' }}>{dt.time}</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize:'0.8rem', color:'#94a3b8' }}>
                                            Published: {new Date(notice.publish_date).toLocaleDateString()}
                                        </span>
                                    )}

                                    {notice.link && (
                                        <a href={notice.link} target="_blank" rel="noreferrer" style={{ 
                                            textDecoration:'none', backgroundColor: typeColor, color:'white', 
                                            padding:'6px 12px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'600',
                                            display:'flex', alignItems:'center', gap:'5px'
                                        }}>
                                            Join <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {announcements.length === 0 && (
                        <div style={{ textAlign:'center', color:'#94a3b8', padding:'20px' }}>No new notices.</div>
                    )}
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div style={{ flex: 1, minWidth:'200px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: `5px solid ${color}`, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>{title}</p>
    <h2 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>{value}</h2>
  </div>
);

const StudentDashboard = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default StudentDashboard;