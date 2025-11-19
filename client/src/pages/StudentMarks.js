import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';
import { FileText, Award, TrendingUp, LayoutDashboard, CheckSquare, Calendar, BookOpen, User } from 'lucide-react';
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
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#facc15', marginBottom:'5px', fontWeight:'bold' }}><FileText size={20} style={{marginRight:'12px'}}/> Marks</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><BookOpen size={20} style={{marginRight:'12px'}}/> Materials</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><User size={20} style={{marginRight:'12px'}}/> Profile</div>
//       </div>
//   </div>
// );

// --- MAIN CONTENT ---
const MarksContent = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'assignments'
    
    const [exams, setExams] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = currentUser?.id || 4;
        setLoading(true);

        // Fetch Exams and Assignments in parallel
        Promise.all([
            axios.get(`http://localhost:8081/student/marks/exams/${userId}`),
            axios.get(`http://localhost:8081/student/assignments/${userId}`)
        ])
        .then(([examRes, assignRes]) => {
            setExams(examRes.data);
            // Filter only graded assignments for the marks view
            const gradedAssignments = assignRes.data.filter(a => a.status === 'Graded' || a.marks_obtained != null);
            setAssignments(gradedAssignments);
            setLoading(false);
        })
        .catch(err => {
            console.log("Backend Error/Offline", err);
            // Fallback Data
            setExams([
                { id: 1, exam_name: 'Mid-Term Exam', subject: 'Maths', marks_obtained: 85, total_marks: 100, grade: 'A', exam_date: '2025-09-15' },
                { id: 2, exam_name: 'Mid-Term Exam', subject: 'Physics', marks_obtained: 78, total_marks: 100, grade: 'B+', exam_date: '2025-09-17' }
            ]);
            setAssignments([
                { title: 'Algebra Quiz 1', subject: 'Maths', marks_obtained: 10, due_date: '2025-10-01', remarks: 'Good' },
                { title: 'Newton Laws Essay', subject: 'Physics', marks_obtained: 18, due_date: '2025-10-05', remarks: 'Excellent' }
            ]);
            setLoading(false);
        });
    }, [currentUser]);

    // Calculate GPA or Avg (Simple Average)
    const calculateAverage = () => {
        if(exams.length === 0) return 0;
        const total = exams.reduce((acc, curr) => acc + (curr.marks_obtained / curr.total_marks) * 100, 0);
        return Math.round(total / exams.length);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
            <StudentSidebar />
            
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>Performance & Marks</h1>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Track your exam results and assignment scores.</p>

                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>AVG SCORE</p>
                                <h2 style={{ margin: '5px 0 0', fontSize: '2rem', color: '#1e293b' }}>{calculateAverage()}%</h2>
                            </div>
                            <TrendingUp size={32} color="#3b82f6" style={{ opacity: 0.2 }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>EXAMS TAKEN</p>
                                <h2 style={{ margin: '5px 0 0', fontSize: '2rem', color: '#1e293b' }}>{exams.length}</h2>
                            </div>
                            <Award size={32} color="#10b981" style={{ opacity: 0.2 }} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('exams')}
                        style={{ 
                            padding: '10px 20px', 
                            borderBottom: activeTab === 'exams' ? '2px solid #2563eb' : 'none',
                            color: activeTab === 'exams' ? '#2563eb' : '#64748b',
                            backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            fontWeight: '600', cursor: 'pointer' 
                        }}
                    >
                        Term Exams
                    </button>
                    <button 
                        onClick={() => setActiveTab('assignments')}
                        style={{ 
                            padding: '10px 20px', 
                            borderBottom: activeTab === 'assignments' ? '2px solid #2563eb' : 'none',
                            color: activeTab === 'assignments' ? '#2563eb' : '#64748b',
                            backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            fontWeight: '600', cursor: 'pointer' 
                        }}
                    >
                        Assignment Grades
                    </button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading scores...</div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        
                        {activeTab === 'exams' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Exam Name</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Subject</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Date</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Score</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length > 0 ? exams.map((exam) => (
                                        <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '15px', fontWeight: '500', color: '#1e293b' }}>{exam.exam_name}</td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>{exam.subject}</td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>{new Date(exam.exam_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>
                                                {exam.marks_obtained} <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'normal' }}>/ {exam.total_marks}</span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <Badge grade={exam.grade} />
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No exam results found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'assignments' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Assignment</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Subject</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Marks</th>
                                        <th style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.length > 0 ? assignments.map((task, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '15px', fontWeight: '500', color: '#1e293b' }}>{task.title}</td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>{task.subject}</td>
                                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#2563eb' }}>
                                                {task.marks_obtained || '-'}
                                            </td>
                                            <td style={{ padding: '15px', color: '#64748b', fontStyle: 'italic' }}>
                                                {task.remarks || 'No remarks'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No graded assignments yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
};

// Helper for Grade Badges
const Badge = ({ grade }) => {
    let color = '#64748b';
    let bg = '#f1f5f9';

    if (['A+', 'A', 'O'].includes(grade)) { color = '#15803d'; bg = '#dcfce7'; }
    else if (['B+', 'B'].includes(grade)) { color = '#ca8a04'; bg = '#fef9c3'; }
    else if (['C', 'D'].includes(grade)) { color = '#b91c1c'; bg = '#fee2e2'; }

    return (
        <span style={{ 
            backgroundColor: bg, color: color, 
            padding: '4px 10px', borderRadius: '6px', 
            fontWeight: 'bold', fontSize: '0.85rem' 
        }}>
            {grade}
        </span>
    );
};

// --- ROOT COMPONENT ---
const StudentMarks = () => {
  return (
    <AuthContext.Provider value={{ currentUser: { id: 4, username: 'Student User' } }}>
        <MarksContent />
    </AuthContext.Provider>
  );
};

export default StudentMarks;