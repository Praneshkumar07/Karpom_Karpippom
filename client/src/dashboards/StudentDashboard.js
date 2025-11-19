import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import axios from 'axios';
import { AlertCircle, RefreshCw, LayoutDashboard, CheckSquare, Calendar, FileText, BookOpen, User } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
// --- 1. INTERNAL MOCK AUTH CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser] = useState({ id: 4, username: 'John' }); 

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
const MOCK_STATS = { 
  pending: 4, 
  completed: 12, 
  attendance: '85%' 
};

const MOCK_ASSIGNMENTS = [
  { subject: 'Mathematics', title: 'Calculus Integration Worksheet', due_date: '2025-11-25', status: 'Pending' },
  { subject: 'Physics', title: 'Optics Lab Report', due_date: '2025-11-22', status: 'Completed' },
  { subject: 'Computer Science', title: 'React Components Project', due_date: '2025-12-01', status: 'Pending' },
  { subject: 'English', title: 'Essay on Shakespeare', due_date: '2025-11-20', status: 'Pending' },
  { subject: 'Chemistry', title: 'Periodic Table Quiz', due_date: '2025-11-15', status: 'Completed' }
];

// --- 3. MAIN DASHBOARD COMPONENT ---
const DashboardContent = () => {
  const { currentUser } = useAuth();
  const effectiveUser = currentUser && currentUser.id ? currentUser : { id: 4, username: 'Test Student (Forced)' };

  const [stats, setStats] = useState({ pending: 0, completed: 0, attendance: '0%' });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = useCallback(async () => {
    if (effectiveUser && effectiveUser.id) {
        setLoading(true);
        const userId = effectiveUser.id;
        console.log("Frontend: Fetching data for User ID:", userId);

        try {
            // Attempt to fetch data from backend in parallel
            const [statsRes, assignmentsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/student/stats/${userId}`),
                axios.get(`${API_BASE_URL}/student/assignments/${userId}`)
            ]);

            // If successful, use real data
            if (statsRes.data) setStats(statsRes.data);
            if (Array.isArray(assignmentsRes.data)) setAssignments(assignmentsRes.data);
            setUsingMockData(false);

        } catch (err) {
            console.warn("Backend connection failed/timed out. Switching to MOCK DATA.", err);
            
            // --- FAILOVER LOGIC ---
            // Load mock data on error
            setStats(MOCK_STATS);
            setAssignments(MOCK_ASSIGNMENTS);
            setUsingMockData(true); 
        } finally {
            setLoading(false);
        }
    }
  }, [effectiveUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                    ⚠ Backend Unreachable - Showing Demo Data
                </div>
            )}
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <Card title="Pending Homework" value={stats.pending} color="#f59e0b" />
          <Card title="Completed" value={stats.completed} color="#10b981" />
          <Card title="Attendance" value={stats.attendance} color="#3b82f6" />
        </div>

        {/* Assignment List */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>Recent Assignments</h3>
          
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
                {assignments.length > 0 ? assignments.map((task, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{task.subject}</td>
                    <td style={{ padding: '12px' }}>{task.title}</td>
                    <td style={{ padding: '12px' }}>{new Date(task.due_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                        <span style={{ 
                        color: task.status === 'Pending' ? '#c2410c' : '#15803d',
                        fontWeight: 'bold',
                        backgroundColor: task.status === 'Pending' ? '#ffedd5' : '#dcfce7',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                        }}>
                        {task.status}
                        </span>
                    </td>
                    </tr>
                )) : (
                    <tr><td colSpan="4" style={{padding:'30px', textAlign:'center', color:'#64748b', fontStyle:'italic'}}>
                        No assignments found.
                    </td></tr>
                )}
                </tbody>
            </table>
          )}
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

// --- 4. ROOT APP COMPONENT ---
const StudentDashboard = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default StudentDashboard;