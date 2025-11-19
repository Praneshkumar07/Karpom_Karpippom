import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';
import { CalendarCheck, UserCheck, UserX, AlertTriangle, LayoutDashboard, CheckSquare, Calendar, FileText, BookOpen, User, Filter } from 'lucide-react';
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
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><Calendar size={20} style={{marginRight:'12px'}}/> Timetable</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><FileText size={20} style={{marginRight:'12px'}}/> Marks</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#facc15', marginBottom:'5px', fontWeight:'bold' }}><CalendarCheck size={20} style={{marginRight:'12px'}}/> Attendance</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><BookOpen size={20} style={{marginRight:'12px'}}/> Materials</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><User size={20} style={{marginRight:'12px'}}/> Profile</div>
//       </div>
//   </div>
// );

// --- MAIN CONTENT ---
const AttendanceContent = () => {
    const { currentUser } = useAuth();
    const [allAttendanceData, setAllAttendanceData] = useState([]); // Store raw data
    const [filteredData, setFilteredData] = useState([]);           // Store filtered view
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan, 11 = Dec
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Stats for the selected period
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026];

    useEffect(() => {
        const userId = currentUser?.id || 4;
        setLoading(true);

        axios.get(`http://localhost:8081/student/attendance/${userId}`)
            .then(res => {
                setAllAttendanceData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.log("Error/Offline", err);
                // Mock Data Fallback
                const mock = [
                    { date: '2025-11-18', status: 'Present' },
                    { date: '2025-11-17', status: 'Absent', remarks: 'Sick' },
                    { date: '2025-11-16', status: 'Present' },
                    { date: '2025-11-15', status: 'Late', remarks: 'Bus Delay' },
                    { date: '2025-11-14', status: 'Present' },
                    { date: '2025-10-20', status: 'Present' }, // Different month for testing
                ];
                setAllAttendanceData(mock);
                setLoading(false);
            });
    }, [currentUser]);

    // Filter Logic: Runs whenever Month/Year/Data changes
    useEffect(() => {
        const filtered = allAttendanceData.filter(record => {
            const d = new Date(record.date);
            return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === parseInt(selectedYear);
        });

        setFilteredData(filtered);

        // Calculate Stats for the filtered view
        const total = filtered.length;
        const present = filtered.filter(d => d.status === 'Present').length;
        const absent = filtered.filter(d => d.status === 'Absent' || d.status === 'On Leave').length;
        const late = filtered.filter(d => d.status === 'Late').length;
        // Treat late as present for percentage calculation
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        setSummary({ total, present, absent, late, percentage });

    }, [selectedMonth, selectedYear, allAttendanceData]);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
            <StudentSidebar />
            
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0 }}>Attendance Record</h1>
                        <p style={{ color: '#64748b', marginTop: '5px' }}>Monthly Report & History</p>
                    </div>
                    
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #e2e8f0', paddingRight: '15px' }}>
                            <Filter size={18} color="#64748b" />
                            <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Filters:</span>
                        </div>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={selectStyle}
                        >
                            {months.map((m, index) => (
                                <option key={index} value={index}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={selectStyle}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Cards (Dynamic based on Filter) */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <Card 
                        title={`Attendance (${months[selectedMonth]})`} 
                        value={`${summary.percentage}%`} 
                        icon={<CalendarCheck size={24} color="white"/>} 
                        bg="#3b82f6"
                    />
                    <Card 
                        title="Days Present" 
                        value={summary.present} 
                        icon={<UserCheck size={24} color="white"/>} 
                        bg="#10b981" 
                        subValue={`+ ${summary.late} Late`}
                    />
                    <Card 
                        title="Days Absent" 
                        value={summary.absent} 
                        icon={<UserX size={24} color="white"/>} 
                        bg="#ef4444" 
                    />
                </div>

                {/* Tabular Report */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '25px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#334155' }}>
                        Report for {months[selectedMonth]} {selectedYear}
                    </h3>
                    
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading records...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                        <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>DATE</th>
                                        <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>DAY</th>
                                        <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px', textAlign: 'center' }}>STATUS</th>
                                        <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}>REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? filteredData.map((record, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '15px', color: '#1e293b', fontWeight: '500' }}>
                                                {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>
                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    backgroundColor: getStatusBgColor(record.status), 
                                                    color: getStatusColor(record.status),
                                                    padding: '6px 14px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: 'bold',
                                                    display: 'inline-block',
                                                    minWidth: '90px'
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>
                                                {record.remarks ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '0.9rem' }}>
                                                        <AlertTriangle size={14} /> {record.remarks}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                                                No attendance records found for {months[selectedMonth]} {selectedYear}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- HELPER FUNCTIONS & COMPONENTS ---

const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '0.9rem'
};

const Card = ({ title, value, icon, bg, subValue }) => (
    <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px ${bg}40` }}>
            {icon}
        </div>
        <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{title}</p>
            <h2 style={{ margin: '5px 0 0', fontSize: '1.8rem', color: '#1e293b' }}>{value}</h2>
            {subValue && <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{subValue}</p>}
        </div>
    </div>
);

// Text Color
const getStatusColor = (status) => {
    switch(status) {
        case 'Present': return '#15803d';
        case 'Absent': return '#b91c1c';
        case 'Late': return '#b45309';
        case 'On Leave': return '#4338ca';
        default: return '#475569';
    }
};

// Background Badge Color
const getStatusBgColor = (status) => {
    switch(status) {
        case 'Present': return '#dcfce7';
        case 'Absent': return '#fee2e2';
        case 'Late': return '#fef3c7';
        case 'On Leave': return '#e0e7ff';
        default: return '#f1f5f9';
    }
};

const StudentAttendance = () => {
  return (
    <AuthContext.Provider value={{ currentUser: { id: 4, username: 'Student User' } }}>
        <AttendanceContent />
    </AuthContext.Provider>
  );
};

export default StudentAttendance;