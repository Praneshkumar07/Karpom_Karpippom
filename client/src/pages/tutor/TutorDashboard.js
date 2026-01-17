import React, { useState, useEffect } from 'react';
import axios from 'axios';
// NEW: Added 'X' and 'Maximize2' icons
import { Users, AlertCircle, Calendar, Clock, BookOpen, ChevronRight, Bell, Megaphone, BarChart3, X, Maximize2 } from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar';

const TutorDashboard = () => {
  const [stats, setStats] = useState({ studentCount: 0, pendingGrading: 0, syllabus: [] });
  const [fullTimetable, setFullTimetable] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [performance, setPerformance] = useState({}); 
  const [activeDay, setActiveDay] = useState('Monday');
  
  // --- NEW STATE FOR INDIVIDUAL MARKS MODAL ---
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [detailedMarks, setDetailedMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper: Get userId safely
  const getUserId = () => localStorage.getItem('userId') || 12;

  useEffect(() => {
    const storedId = getUserId(); 

    if (storedId) {
       // 1. Fetch Stats
       axios.get(`http://localhost:8081/tutor/dashboard-stats?tutor_id=${storedId}`)
       .then(res => setStats(res.data)).catch(err => console.error(err));

       // 2. Fetch Performance Data (Averages)
       axios.get(`http://localhost:8081/tutor/performance?tutor_id=${storedId}`)
       .then(res => {
          const grouped = res.data.reduce((acc, curr) => {
            if (!acc[curr.subject]) acc[curr.subject] = [];
            acc[curr.subject].push(curr);
            return acc;
          }, {});
          setPerformance(grouped);
       })
       .catch(err => console.error("Performance Error:", err));
    }

    // 3. Fetch Timetable
    axios.get('http://localhost:8081/tutor/timetable')
      .then(res => {
        setFullTimetable(res.data);
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (days.includes(todayName)) setActiveDay(todayName);
      })
      .catch(err => console.error("Timetable Error:", err));

    // 4. Fetch Announcements
    axios.get('http://localhost:8081/tutor/announcements') 
      .then(res => setAnnouncements(res.data))
      .catch(err => console.error("Announcements Error:", err));

  }, []);

  // --- NEW FUNCTION: FETCH INDIVIDUAL MARKS ---
  const handleViewDetailedMarks = () => {
    setLoadingMarks(true);
    setShowMarksModal(true);
    const storedId = getUserId();

    axios.get(`http://localhost:8081/tutor/student-marks?tutor_id=${storedId}`)
      .then(res => {
        // Transform Data for Table: Group by Student ID
        // Result format: { 'Student 4': { Quarterly: 88, HalfYearly: 67, ... }, ... }
        const processed = {};
        
        res.data.forEach(row => {
            if (!processed[row.student_id]) {
                processed[row.student_id] = { id: row.student_id, subject: row.subject };
            }
            // Add the mark under the exam type key
            processed[row.student_id][row.exam_type] = row.marks_obtained;
        });

        // Convert object back to array
        setDetailedMarks(Object.values(processed));
        setLoadingMarks(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingMarks(false);
      });
  };

  // --- FILTER LOGIC ---
  const dailySchedule = fullTimetable.filter(item => {
    const dbDay = item.day_of_week ? item.day_of_week.trim() : ''; 
    return dbDay.toLowerCase() === activeDay.toLowerCase();
  });

  const getProgressColor = (p) => p >= 75 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444';
  
  const getTypeBadgeStyle = (t) => {
    const type = t?.toLowerCase() || '';
    if (type.includes('break')) return { background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }; 
    if (type.includes('lab')) return { background: '#faf5ff', color: '#7e22ce', border: '1px solid #f3e8ff' }; 
    return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }; 
  };

  const getPriorityStyle = (priority) => {
    return priority === 'High' 
      ? { background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }
      : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-container"><TutorSidebar /></div>
      
      <div className="content-container">
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; height: 100%; }
          .content-container { flex-grow: 1; padding: 30px; overflow-y: auto; position: relative; }
          
          .welcome-banner { margin-bottom: 25px; }
          .welcome-banner h1 { font-size: 1.8rem; color: #0f172a; margin: 0 0 5px 0; font-weight: 700; letter-spacing: -0.5px; }
          .welcome-banner p { color: #64748b; margin: 0; }

          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .icon-box { width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .stat-info h3 { font-size: 1.8rem; margin: 0; font-weight: 700; color: #0f172a; line-height: 1; }
          .stat-info p { margin: 5px 0 0 0; color: #64748b; font-size: 0.85rem; font-weight: 500; }

          .dashboard-main { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
          .left-column { display: flex; flex-direction: column; gap: 25px; }
          .right-column { display: flex; flex-direction: column; gap: 25px; }

          .section-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .section-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fff; }
          .section-title { font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
          
          .action-btn { background: #f1f5f9; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; display: flex; align-items: center; transition: all 0.2s; }
          .action-btn:hover { background: #e2e8f0; color: #0f172a; }

          /* --- PERFORMANCE --- */
          .performance-container { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
          .perf-subject-row { display: flex; flex-direction: column; gap: 10px; }
          .perf-subject-title { font-size: 0.95rem; font-weight: 700; color: #334155; }
          .perf-bars { display: flex; gap: 15px; }
          
          .perf-bar-item { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
          .perf-label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .perf-value { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
          .perf-indicator { width: 100%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
          .perf-fill { height: 100%; border-radius: 99px; }

          /* --- ANNOUNCEMENTS --- */
          .announcement-list { padding: 0; list-style: none; margin: 0; }
          .announcement-item { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 15px; align-items: flex-start; transition: background 0.2s; }
          .announcement-item:last-child { border-bottom: none; }
          .announcement-item:hover { background: #f8fafc; }
          
          .announce-icon { width: 32px; height: 32px; background: #eff6ff; color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .announce-content h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #1e293b; font-weight: 600; }
          .announce-content p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
          .announce-meta { display: flex; gap: 10px; margin-top: 6px; font-size: 0.75rem; color: #94a3b8; align-items: center; }
          .priority-badge { padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }

          /* --- TABLE & TABS --- */
          .tabs-container { padding: 0 24px; display: flex; gap: 5px; width: 100%; background: white; border-bottom: 1px solid #e2e8f0; }
          .tab-btn { flex: 1; padding: 14px 0; border: none; background: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #64748b; text-align: center; border-bottom: 2px solid transparent; transition: all 0.2s ease; }
          .tab-btn:hover { color: #334155; background: #f8fafc; }
          .tab-btn.active { color: #2563eb; border-bottom: 2px solid #2563eb; background: #eff6ff; }
          .table-container { width: 100%; overflow-x: auto; }
          .timetable-table { width: 100%; border-collapse: collapse; text-align: left; }
          .timetable-table th { padding: 14px 24px; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .timetable-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9rem; font-weight: 500; vertical-align: middle; }
          .timetable-table tbody tr:hover { background-color: #f8fafc; transition: background-color 0.2s; }
          .cell-index { color: #94a3b8; font-family: monospace; }
          .cell-time { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; }
          .cell-subject { font-weight: 600; color: #0f172a; }
          .cell-teacher { color: #64748b; font-style: italic; }
          .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; letter-spacing: 0.02em; }
          
          /* Syllabus */
          .syllabus-list { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
          .syllabus-item { width: 100%; }
          .syllabus-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: #334155; }
          .progress-track { width: 100%; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

          /* --- NEW MODAL STYLES --- */
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
          .modal-content { background: white; width: 90%; max-width: 800px; max-height: 80vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
          .modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .modal-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; }
          .close-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 4px; transition: background 0.2s; }
          .close-btn:hover { background: #f1f5f9; color: #ef4444; }
          .modal-body { padding: 24px; overflow-y: auto; }
          
          .marks-table { width: 100%; border-collapse: collapse; text-align: left; }
          .marks-table th { background: #f8fafc; padding: 12px 16px; font-size: 0.8rem; font-weight: 600; color: #475569; border: 1px solid #e2e8f0; }
          .marks-table td { padding: 12px 16px; font-size: 0.9rem; color: #334155; border: 1px solid #e2e8f0; }
          .marks-table tr:nth-child(even) { background: #fcfcfc; }
          .mark-cell { font-weight: 600; }
          .mark-high { color: #16a34a; }
          .mark-avg { color: #ea580c; }
          .mark-low { color: #dc2626; }

          @media (max-width: 1024px) {
            .dashboard-main { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
            .tabs-container { overflow-x: auto; }
            .tab-btn { flex: none; min-width: 100px; }
            .perf-bars { flex-wrap: wrap; }
          }
        `}</style>

        <div className="welcome-banner">
          <h1>Welcome back, Tutor 👋</h1>
          <p>Here's your daily overview and course progress.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="icon-box" style={{background: '#eff6ff', color: '#3b82f6'}}><Users size={24} /></div>
            <div className="stat-info"><h3>{stats.studentCount}</h3><p>Active Students</p></div>
          </div>
          <div className="stat-card">
             <div className="icon-box" style={{background: '#fff7ed', color: '#f97316'}}><AlertCircle size={24} /></div>
             <div className="stat-info"><h3>{stats.pendingGrading}</h3><p>Pending Review</p></div>
          </div>
          <div className="stat-card">
             <div className="icon-box" style={{background: '#f0fdf4', color: '#22c55e'}}><Calendar size={24} /></div>
             <div className="stat-info"><h3>{dailySchedule.length}</h3><p>Classes ({activeDay})</p></div>
          </div>
        </div>

        <div className="dashboard-main">
          
          {/* LEFT COLUMN */}
          <div className="left-column">
            
            {/* TIMETABLE */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title"><Clock size={20} className="text-slate-500" /> Weekly Timetable</div>
              </div>

              <div className="tabs-container">
                {days.map(day => (
                  <button key={day} className={`tab-btn ${activeDay === day ? 'active' : ''}`} onClick={() => setActiveDay(day)}>
                    {day}
                  </button>
                ))}
              </div>
              
              <div className="table-container">
                {dailySchedule.length > 0 ? (
                  <table className="timetable-table">
                    <colgroup>
                      <col style={{width: '60px'}} />
                      <col style={{width: '140px'}} />
                      <col style={{width: '120px'}} />
                      <col style={{width: 'auto'}} />
                      <col style={{width: '180px'}} />
                    </colgroup>
                    <thead>
                      <tr><th>#</th><th>Time</th><th>Type</th><th>Subject</th><th>Teacher</th></tr>
                    </thead>
                    <tbody>
                      {dailySchedule.map((item, index) => (
                        <tr key={index}>
                          <td className="cell-index">{(index + 1).toString().padStart(2, '0')}</td>
                          <td><div className="cell-time"><Clock size={15} />{item.time_slot}</div></td>
                          <td><span className="status-badge" style={getTypeBadgeStyle(item.type)}>{item.type}</span></td>
                          <td className="cell-subject">{item.subject}</td>
                          <td className="cell-teacher">{item.teacher_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>
                    <Calendar size={48} style={{marginBottom:'15px', opacity: 0.4}} strokeWidth={1.5} />
                    <p style={{fontSize: '1rem', fontWeight: 500}}>No classes scheduled for {activeDay}.</p>
                  </div>
                )}
              </div>
            </div>

            {/* PERFORMANCE SECTION */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title"><BarChart3 size={20} className="text-slate-500" /> Student Performance (Class Avg)</div>
                
                {/* NEW: Button to trigger Modal */}
                <button className="action-btn" onClick={handleViewDetailedMarks} title="View Detailed Marks">
                  <Maximize2 size={18} />
                </button>

              </div>
              <div className="performance-container">
                {Object.keys(performance).length > 0 ? (
                   Object.keys(performance).map((subject) => (
                      <div key={subject} className="perf-subject-row">
                          <div className="perf-subject-title">{subject}</div>
                          <div className="perf-bars">
                             {performance[subject].map((exam, idx) => (
                                <div key={idx} className="perf-bar-item">
                                   <div className="perf-label">{exam.exam_type}</div>
                                   <div className="perf-value">{exam.avg_marks}%</div>
                                   <div className="perf-indicator">
                                      <div className="perf-fill" style={{
                                         width: `${Math.min(exam.avg_marks, 100)}%`, 
                                         background: getProgressColor(exam.avg_marks)
                                      }}></div>
                                   </div>
                                </div>
                             ))}
                          </div>
                      </div>
                   ))
                ) : (
                  <div style={{textAlign: 'center', color: '#94a3b8', padding: '20px'}}>No performance data available.</div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="right-column">
            
            {/* ANNOUNCEMENTS */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title"><Bell size={20} className="text-slate-500" /> Announcements</div>
                <ChevronRight size={20} color="#94a3b8" style={{cursor:'pointer'}} />
              </div>
              <ul className="announcement-list">
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <li key={ann.id} className="announcement-item">
                      <div className="announce-icon">
                        {ann.type === 'Notice' ? <Megaphone size={16} /> : <BookOpen size={16} />}
                      </div>
                      <div className="announce-content">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                           <h4>{ann.title}</h4>
                           {ann.priority && <span className="priority-badge" style={getPriorityStyle(ann.priority)}>{ann.priority}</span>}
                        </div>
                        <p>{ann.content}</p>
                        <div className="announce-meta">
                          {ann.event_date_time && (
                            <span>📅 {new Date(ann.event_date_time).toLocaleDateString()}</span>
                          )}
                          {ann.subject && <span>📚 {ann.subject}</span>}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <div style={{padding: '30px', textAlign: 'center', color: '#94a3b8'}}>
                    <p>No new announcements.</p>
                  </div>
                )}
              </ul>
            </div>

            {/* SYLLABUS */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title"><BookOpen size={20} className="text-slate-500" /> Syllabus Coverage</div>
                <ChevronRight size={20} color="#94a3b8" style={{cursor:'pointer'}} />
              </div>
              <div className="syllabus-list">
                {stats.syllabus && stats.syllabus.length > 0 ? (
                  stats.syllabus.map((sub, idx) => (
                    <div className="syllabus-item" key={idx}>
                      <div className="syllabus-header"><span>{sub.subject}</span><span style={{color: getProgressColor(sub.percent)}}>{sub.percent}%</span></div>
                      <div className="progress-track"><div className="progress-fill" style={{width: `${sub.percent}%`, background: getProgressColor(sub.percent)}}></div></div>
                    </div>
                  ))
                ) : (
                  <div style={{padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem'}}>No syllabus data found.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- NEW: DETAILED MARKS MODAL --- */}
      {showMarksModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Student Academic Marks</div>
              <button className="close-btn" onClick={() => setShowMarksModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {loadingMarks ? (
                <div style={{textAlign: 'center', padding: '20px'}}>Loading data...</div>
              ) : detailedMarks.length > 0 ? (
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Subject</th>
                      <th>Quarterly</th>
                      <th>Half Yearly</th>
                      <th>Public</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedMarks.map((student) => (
                      <tr key={student.id}>
                        <td>Student #{student.id}</td>
                        <td>{student.subject}</td>
                        <td className="mark-cell" style={{color: getProgressColor(student.Quarterly || 0)}}>{student.Quarterly || '-'}</td>
                        <td className="mark-cell" style={{color: getProgressColor(student['Half Yearly'] || 0)}}>{student['Half Yearly'] || '-'}</td>
                        <td className="mark-cell" style={{color: getProgressColor(student.Public || 0)}}>{student.Public || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{textAlign: 'center', color: '#64748b'}}>No detailed marks available.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TutorDashboard;