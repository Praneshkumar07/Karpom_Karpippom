import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- CHANGED THIS LINE
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { 
    Download, Filter, Users, TrendingUp, AlertCircle, BookOpen, X 
} from 'lucide-react'; 

import LeadSidebar from './LeadSidebar'; 

const StudentPerformance = () => {
    // --- State ---
    const [stats, setStats] = useState({ avg: 0, top: '-', atRisk: 0 });
    const [subjectData, setSubjectData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('KK_01');
    const [loading, setLoading] = useState(true);
    
    // MODAL STATE
    const [selectedStudent, setSelectedStudent] = useState(null);

    // --- Effects ---
    useEffect(() => {
        fetchDashboardData();
    }, [selectedBatch]);

    // --- Data Fetching ---
    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [subjectsRes, examsRes, studentsRes] = await Promise.all([
                axios.get('http://localhost:8081/lead/performance/subject-averages'),
                axios.get('http://localhost:8081/lead/performance/exam-compare'),
                axios.get('http://localhost:8081/lead/performance/student-overview')
            ]);

            // 1. Subject Data
            const formattedSubjects = subjectsRes.data.map(item => ({
                subject: item.subject,
                avg: item.avg_marks,
                target: 85
            }));
            setSubjectData(formattedSubjects);

            // 2. Trend Data
            if (examsRes.data && examsRes.data.length > 0) {
                const cleanTrendData = examsRes.data.map(d => ({
                    name: d.name || d.exam_type,
                    classAvg: d.classAvg || d.avg_marks 
                }));
                setTrendData(cleanTrendData);
            } else {
                setTrendData([
                    { name: 'Quarterly', classAvg: 0 },
                    { name: 'Half Yearly', classAvg: 0 },
                    { name: 'Public', classAvg: 0 }
                ]);
            }

            // 3. Student List
            const formattedStudents = studentsRes.data.map((s) => {
                let status = 'At Risk';
                const avg = parseFloat(s.overall_avg);
                if (avg >= 85) status = 'Excellent';
                else if (avg >= 60) status = 'Good';
                else if (avg >= 40) status = 'Average';

                return {
                    id: s.user_id,
                    name: s.student_name || s.full_name, 
                    batch: s.batch,
                    avg: s.overall_avg,
                    attendance: s.attendance_percentage || 90, 
                    status: status
                };
            });
            setStudentList(formattedStudents);

            // 4. KPI Calculations
            if (formattedStudents.length > 0) {
                const totalAvg = formattedStudents.reduce((sum, s) => sum + parseFloat(s.avg), 0);
                const classAverage = (totalAvg / formattedStudents.length).toFixed(1);
                const riskCount = formattedStudents.filter(s => s.status === 'At Risk').length;
                const topStudent = formattedStudents[0].name; 

                setStats({
                    avg: classAverage,
                    top: topStudent,
                    atRisk: riskCount
                });
            }
            setLoading(false);

        } catch (error) {
            console.error("Data fetch error:", error);
            setLoading(false);
        }
    };

    // --- Modal Logic ---
    const handleViewStudent = (student) => {
        const mockSubjectMarks = [
            { subject: 'Mathematics', marks: Math.min(100, Math.round(student.avg * 1.1)) },
            { subject: 'Physics', marks: Math.min(100, Math.round(student.avg * 0.9)) },
            { subject: 'Chemistry', marks: Math.min(100, Math.round(student.avg * 0.95)) },
            { subject: 'English', marks: Math.min(100, Math.round(student.avg * 1.05)) },
            { subject: 'Computer', marks: Math.min(100, Math.round(student.avg * 1.0)) },
        ];
        
        setSelectedStudent({ ...student, details: mockSubjectMarks });
    };

    const closeModal = () => {
        setSelectedStudent(null);
    };

    // --- Export Function (FIXED) ---
    const generateReport = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Academic Performance Report: ${selectedBatch}`, 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // FIX: Using functional call instead of doc.autoTable
        autoTable(doc, {
            startY: 35,
            head: [['Rank', 'Student Name', 'Marks (%)', 'Attendance', 'Status']],
            body: studentList.map((s, i) => [i+1, s.name, `${s.avg}%`, `${s.attendance}%`, s.status]),
            theme: 'grid',
            headStyles: { fillColor: [41, 50, 65] }
        });
        
        doc.save(`${selectedBatch}_Performance.pdf`);
    };

    return (
        <div className="layout-wrapper">
            
            {/* Sidebar */}
            <div className="sidebar-area">
                <LeadSidebar />
            </div>

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    
                    {/* Header */}
                    <header className="page-header">
                        <div>
                            <h1 className="page-title">Academic Performance</h1>
                            <p className="page-subtitle">Overview for Batch {selectedBatch}</p>
                        </div>
                        <div className="controls">
                            <div className="select-wrapper">
                                <Filter size={14} className="icon-subtle" />
                                <select 
                                    value={selectedBatch} 
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value="KK_01">Batch KK_01</option>
                                    <option value="KK_02">Batch KK_02</option>
                                </select>
                            </div>
                            <button onClick={generateReport} className="btn-primary">
                                <Download size={16} /> Export Report
                            </button>
                        </div>
                    </header>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <span>Analyzing Performance Data...</span>
                        </div>
                    ) : (
                        <>
                            {/* KPI Section */}
                            <div className="kpi-grid">
                                <KpiCard label="Class Average" value={`${stats.avg}%`} subtext="Across all subjects" icon={<TrendingUp size={20} />} />
                                <KpiCard label="Top Performer" value={stats.top} subtext="Highest Cumulative Score" icon={<Users size={20} />} />
                                <KpiCard label="Students At Risk" value={stats.atRisk} subtext="Need academic intervention" icon={<AlertCircle size={20} />} isWarning={true} />
                            </div>

                            {/* Charts Section */}
                            <div className="charts-grid">
                                <div className="card">
                                    <div className="card-header">
                                        <h3>Subject Performance</h3>
                                        <span className="info-tag">Current Term</span>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={subjectData} barSize={32}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{border: '1px solid #e2e8f0', borderRadius: '6px'}} />
                                                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Marks" />
                                                <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <h3>Growth Trajectory</h3>
                                        <span className="info-tag">Year to Date</span>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={trendData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10}/>
                                                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                                <Tooltip contentStyle={{border: '1px solid #e2e8f0', borderRadius: '6px'}}/>
                                                <Line type="monotone" dataKey="classAvg" stroke="#0f172a" strokeWidth={2} dot={{r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff'}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Student List */}
                            <div className="card">
                                <div className="card-header">
                                    <h3>Student Leaderboard</h3>
                                </div>
                                <div className="table-wrapper">
                                    <table className="clean-table">
                                        <thead>
                                            <tr>
                                                <th style={{width: '60px'}}>Rank</th>
                                                <th>Student Name</th>
                                                <th>Batch</th>
                                                <th>Performance</th>
                                                <th>Status</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentList.map((s, i) => (
                                                <tr key={s.id}>
                                                    <td className="rank-cell">#{i + 1}</td>
                                                    <td className="name-cell">
                                                        <div className="student-avatar">{s.name.charAt(0)}</div>
                                                        <span>{s.name}</span>
                                                    </td>
                                                    <td><span className="batch-pill">{s.batch}</span></td>
                                                    <td className="grade-cell">
                                                        <strong>{s.avg}%</strong>
                                                        <span className="grade-bar-bg">
                                                            <span className="grade-bar-fill" style={{width: `${s.avg}%`}}></span>
                                                        </span>
                                                    </td>
                                                    <td><StatusDot status={s.status} /></td>
                                                    <td className="text-right">
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={() => handleViewStudent(s)}
                                                            title="View Detailed Marks"
                                                        >
                                                            <BookOpen size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* --- STUDENT DETAILS MODAL --- */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{selectedStudent.name}</h2>
                                <p>Batch: {selectedStudent.batch}</p>
                            </div>
                            <button className="btn-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-stats">
                                <div className="stat-box">
                                    <span className="label">Overall Avg</span>
                                    <span className="value">{selectedStudent.avg}%</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Attendance</span>
                                    <span className="value">{selectedStudent.attendance}%</span>
                                </div>
                                <div className="stat-box">
                                    <span className="label">Status</span>
                                    <StatusDot status={selectedStudent.status} />
                                </div>
                            </div>

                            <h3>Subject Breakdown</h3>
                            <div className="subject-grid">
                                {selectedStudent.details.map((sub, idx) => (
                                    <div key={idx} className="subject-row">
                                        <span className="sub-name">{sub.subject}</span>
                                        <div className="sub-bar-container">
                                            <div className="sub-bar" style={{width: `${sub.marks}%`, backgroundColor: sub.marks < 40 ? '#ef4444' : '#3b82f6'}}></div>
                                        </div>
                                        <span className="sub-mark">{sub.marks}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PROFESSIONAL CSS SYSTEM */}
            <style>{`
                :root {
                    --bg-body: #f8fafc;
                    --bg-card: #ffffff;
                    --primary: #0f172a;
                    --secondary: #64748b;
                    --accent: #2563eb;
                    --border: #e2e8f0;
                    --danger: #ef4444;
                    --success: #10b981;
                    --warning: #f59e0b;
                }

                /* Layout */
                .layout-wrapper { display: flex; height: 100vh; overflow: hidden; background-color: var(--bg-body); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .sidebar-area { width: 250px; flex-shrink: 0; background: #1e293b; color: white; height: 100%; overflow-y: auto; }
                .main-content { flex-grow: 1; height: 100%; overflow-y: auto; padding: 40px; }
                .container { max-width: 1200px; margin: 0 auto; }

                /* Header */
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
                .page-title { font-size: 24px; font-weight: 700; color: var(--primary); margin: 0 0 4px 0; }
                .page-subtitle { color: var(--secondary); font-size: 14px; margin: 0; }
                
                .controls { display: flex; gap: 12px; }
                .select-wrapper { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; }
                .select-wrapper select { border: none; background: transparent; font-size: 14px; color: var(--primary); outline: none; cursor: pointer; }
                .btn-primary { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; }
                .btn-primary:hover { background: #1e293b; }

                /* KPI Grid */
                .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
                .kpi-card { background: var(--bg-card); padding: 24px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; height: 140px; }
                .kpi-top { display: flex; justify-content: space-between; align-items: start; }
                .kpi-label { color: var(--secondary); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .kpi-icon { color: var(--secondary); opacity: 0.7; }
                .kpi-value { font-size: 28px; font-weight: 700; color: var(--primary); margin: 12px 0 4px 0; }
                .kpi-subtext { font-size: 13px; color: var(--secondary); }
                .kpi-card.warning .kpi-value { color: var(--danger); }

                /* Cards */
                .card { background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 24px; overflow: hidden; }
                .card-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                .card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--primary); }
                .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .chart-container { padding: 20px; }
                .info-tag { background: #f1f5f9; color: var(--secondary); font-size: 12px; padding: 4px 8px; border-radius: 4px; font-weight: 500; }

                /* Table */
                .table-wrapper { width: 100%; overflow-x: auto; }
                .clean-table { width: 100%; border-collapse: collapse; text-align: left; }
                .clean-table th { background: #f8fafc; color: var(--secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 14px 24px; border-bottom: 1px solid var(--border); }
                .clean-table td { padding: 16px 24px; border-bottom: 1px solid var(--border); color: var(--primary); font-size: 14px; vertical-align: middle; }
                .clean-table tr:last-child td { border-bottom: none; }
                
                .name-cell { display: flex; align-items: center; gap: 12px; font-weight: 500; }
                .student-avatar { width: 32px; height: 32px; background: #e2e8f0; color: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
                
                .batch-pill { font-size: 12px; border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px; color: var(--secondary); }
                .grade-cell { display: flex; flex-direction: column; gap: 4px; width: 120px; }
                .grade-bar-bg { width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; }
                .grade-bar-fill { display: block; height: 100%; background: var(--primary); border-radius: 2px; }

                /* Status & Buttons */
                .status-dot-container { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--secondary); }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot.excellent { background: var(--success); }
                .dot.good { background: var(--accent); }
                .dot.average { background: var(--warning); }
                .dot.risk { background: var(--danger); }
                .btn-icon { background: transparent; border: 1px solid var(--border); border-radius: 4px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--secondary); transition: 0.2s; }
                .btn-icon:hover { border-color: var(--primary); color: var(--primary); background: #f1f5f9; }
                .text-right { text-align: right; }

                /* Loading */
                .loading-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--secondary); }
                .spinner { width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Modal */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .modal-content {
                    background: white; width: 500px; max-width: 90%;
                    border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    overflow: hidden; animation: slideUp 0.3s ease-out;
                }
                .modal-header { padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: start; background: #f8fafc; }
                .modal-header h2 { margin: 0 0 4px 0; font-size: 20px; color: var(--primary); }
                .modal-header p { margin: 0; font-size: 13px; color: var(--secondary); }
                .btn-close { background: none; border: none; cursor: pointer; color: var(--secondary); padding: 4px; border-radius: 4px; }
                .btn-close:hover { background: #e2e8f0; color: var(--danger); }
                .modal-body { padding: 24px; }
                .modal-stats { display: flex; gap: 16px; margin-bottom: 24px; }
                .stat-box { flex: 1; border: 1px solid var(--border); padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; align-items: center; text-align: center; }
                .stat-box .label { font-size: 11px; text-transform: uppercase; color: var(--secondary); font-weight: 600; }
                .stat-box .value { font-size: 18px; font-weight: 700; color: var(--primary); }
                .subject-grid { display: flex; flex-direction: column; gap: 12px; }
                .subject-row { display: flex; align-items: center; gap: 12px; font-size: 14px; }
                .sub-name { width: 100px; color: var(--secondary); font-weight: 500; }
                .sub-bar-container { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                .sub-bar { height: 100%; border-radius: 4px; }
                .sub-mark { width: 30px; text-align: right; font-weight: 600; color: var(--primary); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

// --- Sub Components ---

const KpiCard = ({ label, value, subtext, icon, isWarning }) => (
    <div className={`kpi-card ${isWarning ? 'warning' : ''}`}>
        <div className="kpi-top">
            <span className="kpi-label">{label}</span>
            <div className="kpi-icon">{icon}</div>
        </div>
        <div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-subtext">{subtext}</div>
        </div>
    </div>
);

const StatusDot = ({ status }) => {
    let type = 'risk';
    if(status === 'Excellent') type = 'excellent';
    if(status === 'Good') type = 'good';
    if(status === 'Average') type = 'average';

    return (
        <div className="status-dot-container">
            <span className={`dot ${type}`}></span>
            <span>{status}</span>
        </div>
    );
}

export default StudentPerformance;