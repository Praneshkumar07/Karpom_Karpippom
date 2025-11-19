import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';
import { Clock, Calendar, User, LayoutDashboard, CheckSquare, BookOpen, FileText, Coffee, FlaskConical } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
// --- INTERNAL MOCK AUTH & SIDEBAR ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// const StudentSidebar = () => (
//   <div style={{ width: '250px', minHeight: '100vh', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
//       <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
//         <h2 style={{ margin: 0, color: '#facc15', fontSize: '1.5rem' }}>KK Platform</h2>
//         <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Student Portal</span>
//       </div>
//       <div style={{ flex: 1, marginTop: '20px', paddingLeft: '10px' }}>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><LayoutDashboard size={20} style={{marginRight:'12px'}}/> Dashboard</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><CheckSquare size={20} style={{marginRight:'12px'}}/> Assignments</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#facc15', marginBottom:'5px', fontWeight:'bold' }}><Calendar size={20} style={{marginRight:'12px'}}/> Timetable</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><FileText size={20} style={{marginRight:'12px'}}/> Marks</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><BookOpen size={20} style={{marginRight:'12px'}}/> Materials</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><User size={20} style={{marginRight:'12px'}}/> Profile</div>
//       </div>
//   </div>
// );

// --- MAIN COMPONENT ---
const TimetableContent = () => {
    const { currentUser } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [activeDay, setActiveDay] = useState('Monday');
    const [loading, setLoading] = useState(true);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        const userId = currentUser?.id || 4;
        setLoading(true);

        axios.get(`http://localhost:8081/student/timetable/${userId}`)
            .then(res => {
                setSchedule(res.data);
                // Automatically select today if it's in the list
                const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                if (days.includes(todayName)) setActiveDay(todayName);
                setLoading(false);
            })
            .catch(err => {
                console.log("Error/Offline", err);
                // Mock Fallback
                setSchedule([
                    { day_of_week: 'Monday', time_slot: '09:00 - 10:00', subject: 'Maths', teacher_name: 'Mr. X', type: 'Class' },
                    { day_of_week: 'Monday', time_slot: '10:00 - 10:20', subject: 'Break', type: 'Break' },
                    { day_of_week: 'Monday', time_slot: '10:20 - 11:20', subject: 'Physics', teacher_name: 'Mrs. Y', type: 'Class' },
                ]);
                setLoading(false);
            });
    }, [currentUser]);

    // Filter schedule for the active tab
    const dailySchedule = schedule.filter(item => item.day_of_week === activeDay);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
            <StudentSidebar />
            
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ color: '#0f172a', margin: 0 }}>Weekly Timetable</h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Check your classes and schedule.</p>
                </div>

                {/* Day Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeDay === day ? '#2563eb' : 'white',
                                color: activeDay === day ? 'white' : '#64748b',
                                boxShadow: activeDay === day ? '0 4px 10px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                                fontWeight: '600',
                                minWidth: '100px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Schedule List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading schedule...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {dailySchedule.length > 0 ? dailySchedule.map((period, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                backgroundColor: 'white', 
                                padding: '20px', 
                                borderRadius: '12px', 
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: period.type === 'Break' ? '5px solid #f59e0b' : (period.type === 'Lab' ? '5px solid #9333ea' : '5px solid #3b82f6')
                            }}>
                                {/* Time Column */}
                                <div style={{ width: '180px', display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontWeight: '500' }}>
                                    <Clock size={18} />
                                    {period.time_slot}
                                </div>

                                {/* Subject Info */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', display:'flex', alignItems:'center', gap:'10px' }}>
                                        {period.subject}
                                        {period.type === 'Break' && <Coffee size={18} color="#f59e0b"/>}
                                        {period.type === 'Lab' && <FlaskConical size={18} color="#9333ea"/>}
                                    </h3>
                                    {period.teacher_name && (
                                        <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <User size={14} /> {period.teacher_name}
                                        </p>
                                    )}
                                </div>

                                {/* Tag */}
                                <div>
                                    <span style={{ 
                                        backgroundColor: period.type === 'Break' ? '#fef3c7' : (period.type === 'Lab' ? '#f3e8ff' : '#dbeafe'),
                                        color: period.type === 'Break' ? '#d97706' : (period.type === 'Lab' ? '#7e22ce' : '#1e40af'),
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {period.type}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '12px' }}>
                                <p>No classes scheduled for {activeDay}. Enjoy your day off! 🎉</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ROOT COMPONENT ---
const StudentTimetable = () => {
  return (
    <AuthContext.Provider value={{ currentUser: { id: 4, username: 'Student User' } }}>
        <TimetableContent />
    </AuthContext.Provider>
  );
};

export default StudentTimetable;