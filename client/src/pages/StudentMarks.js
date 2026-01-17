import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';
import { Award, TrendingUp, CheckSquare, Calendar, FileText } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';

// --- INTERNAL MOCK AUTH ---
// (Kept this wrapper so the file runs standalone. 
// If you already have a global AuthContext, you can remove this part 
// and import { useAuth } from '../context/AuthContext' instead.)
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// --- MAIN CONTENT COMPONENT ---
const MarksContent = () => {
    const { currentUser } = useAuth();
    
    // State Management
    const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'assignments'
    const [exams, setExams] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Default to ID 4 for testing if no user is logged in
        const userId = currentUser?.id || 4;
        setLoading(true);

        console.log("Fetching marks for User ID:", userId);

        Promise.all([
            // 1. Fetch Exam Results (Your existing exam_results table)
            axios.get(`http://localhost:8081/student/marks/exams/${userId}`),
            
            // 2. Fetch Assignment Grades (The NEW route pointing to student_submissions)
            // MAKE SURE you added the '/student/assignment-grades/:userId' route to server.js
            axios.get(`http://localhost:8081/student/assignment-grades/${userId}`)
        ])
        .then(([examRes, assignRes]) => {
            console.log("Exams Loaded:", examRes.data);
            console.log("Assignments Loaded:", assignRes.data);

            setExams(examRes.data);
            setAssignments(assignRes.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            setLoading(false);
        });
    }, [currentUser]);

    // Helper: Calculate Average Score (Exams only)
    const calculateAverage = () => {
        if(exams.length === 0) return 0;
        const total = exams.reduce((acc, curr) => acc + (curr.marks_obtained / curr.total_marks) * 100, 0);
        return Math.round(total / exams.length);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Sidebar */}
            <StudentSidebar />
            
            {/* Main Scrollable Area */}
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                
                {/* Header */}
                <h1 style={{ color: '#0f172a', marginBottom: '10px', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    Performance & Grades
                </h1>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>
                    View your term exam results and graded assignments.
                </p>

                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    {/* Card 1: Avg Score */}
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Average Exam Score</p>
                                <h2 style={{ margin: '8px 0 0', fontSize: '2.2rem', color: '#1e293b', fontWeight: '700' }}>
                                    {calculateAverage()}%
                                </h2>
                            </div>
                            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '50%' }}>
                                <TrendingUp size={24} color="#3b82f6" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Assignments Graded */}
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Assignments Graded</p>
                                <h2 style={{ margin: '8px 0 0', fontSize: '2.2rem', color: '#1e293b', fontWeight: '700' }}>
                                    {assignments.length}
                                </h2>
                            </div>
                            <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '50%' }}>
                                <CheckSquare size={24} color="#10b981" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '30px' }}>
                    <button 
                        onClick={() => setActiveTab('exams')}
                        style={{ 
                            padding: '12px 0', 
                            borderBottom: activeTab === 'exams' ? '3px solid #2563eb' : '3px solid transparent',
                            color: activeTab === 'exams' ? '#2563eb' : '#64748b',
                            backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} /> Term Exams
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveTab('assignments')}
                        style={{ 
                            padding: '12px 0', 
                            borderBottom: activeTab === 'assignments' ? '3px solid #2563eb' : '3px solid transparent',
                            color: activeTab === 'assignments' ? '#2563eb' : '#64748b',
                            backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} /> Assignment Grades
                        </div>
                    </button>
                </div>

                {/* Table Content Area */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div className="spinner" style={{ marginBottom: '10px' }}>Loading...</div>
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        
                        {/* --- EXAMS TABLE --- */}
                        {activeTab === 'exams' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={thStyle}>Exam Name</th>
                                        <th style={thStyle}>Subject</th>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Score</th>
                                        <th style={thStyle}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length > 0 ? exams.map((exam) => (
                                        <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: '600', color: '#334155' }}>{exam.exam_name}</span>
                                            </td>
                                            <td style={tdStyle}>{exam.subject}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                    <Calendar size={14} />
                                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{exam.marks_obtained}</span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> / {exam.total_marks}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <ExamBadge grade={exam.grade} />
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No exam results found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* --- ASSIGNMENTS TABLE (UPDATED) --- */}
                        {activeTab === 'assignments' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={thStyle}>Assignment</th>
                                        <th style={thStyle}>Subject</th>
                                        <th style={thStyle}>Score</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.length > 0 ? assignments.map((task, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: '600', color: '#334155' }}>
                                                    {task.title || `Assignment #${task.assignment_id}`}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>{task.subject || 'General'}</td>
                                            
                                            {/* Marks Column */}
                                            <td style={tdStyle}>
                                                {task.marks_obtained != null ? (
                                                    <span style={{ color: '#01050f', fontWeight: 'bold' }}>
                                                        {task.marks_obtained}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>-</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td style={tdStyle}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                                    backgroundColor: task.status === 'Graded' ? '#dcfce7' : '#f1f5f9',
                                                    color: task.status === 'Graded' ? '#166534' : '#64748b'
                                                }}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            
                                            {/* Remarks */}
                                            <td style={tdStyle}>
                                                <span style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.9rem' }}>
                                                    {task.remarks || 'No remarks provided'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No graded assignments found.</td></tr>
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

// --- STYLES & HELPERS ---
const thStyle = {
    padding: '16px',
    textAlign: 'left',
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const tdStyle = {
    padding: '16px',
    color: '#334155',
    fontSize: '0.95rem'
};

// Badge Component for Exam Grades
const ExamBadge = ({ grade }) => {
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
            {grade || 'N/A'}
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