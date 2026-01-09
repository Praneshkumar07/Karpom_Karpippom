import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertCircle, Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar';

const TutorDashboard = () => {
  const [stats, setStats] = useState({ studentCount: 0, pendingGrading: 0, syllabus: [] });
  const [fullTimetable, setFullTimetable] = useState([]);
  const [activeDay, setActiveDay] = useState('Monday');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // --- LOGIC (Unchanged) ---
  useEffect(() => {
    const storedId = localStorage.getItem('userId'); 

    // 1. Fetch Stats
    if (storedId) {
       axios.get(`http://localhost:8081/tutor/dashboard-stats?tutor_id=${storedId}`)
       .then(res => setStats(res.data)).catch(err => console.error(err));
    }

    // 2. Fetch Timetable
    axios.get('http://localhost:8081/tutor/timetable')
      .then(res => {
        console.log("Timetable Data:", res.data);
        setFullTimetable(res.data);
        
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (days.includes(todayName)) setActiveDay(todayName);
      })
      .catch(err => console.error("Timetable Error:", err));
  }, []);

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

  return (
    <div className="page-wrapper">
      <div className="sidebar-container"><TutorSidebar /></div>
      
      <div className="content-container">
        {/* --- IMPROVED CSS BLOCK --- */}
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; height: 100%; }
          .content-container { flex-grow: 1; padding: 30px; overflow-y: auto; }
          
          .welcome-banner { margin-bottom: 25px; }
          .welcome-banner h1 { font-size: 1.8rem; color: #0f172a; margin: 0 0 5px 0; font-weight: 700; letter-spacing: -0.5px; }
          .welcome-banner p { color: #64748b; margin: 0; }

          /* Stats Grid */
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .icon-box { width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .stat-info h3 { font-size: 1.8rem; margin: 0; font-weight: 700; color: #0f172a; line-height: 1; }
          .stat-info p { margin: 5px 0 0 0; color: #64748b; font-size: 0.85rem; font-weight: 500; }

          /* Dashboard Layout */
          .dashboard-main { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
          .section-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; height: 100%; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          
          .section-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fff; }
          .section-title { font-size: 1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }

          /* --- TABS --- */
          .tabs-container { 
            padding: 0 24px; 
            display: flex; 
            gap: 5px;
            width: 100%; 
            background: white; 
            border-bottom: 1px solid #e2e8f0;
          }
          .tab-btn { 
            flex: 1; 
            padding: 14px 0; 
            border: none; background: none; cursor: pointer; 
            font-size: 0.85rem; font-weight: 600; color: #64748b; 
            text-align: center;
            border-bottom: 2px solid transparent; 
            transition: all 0.2s ease;
          }
          .tab-btn:hover { color: #334155; background: #f8fafc; }
          .tab-btn.active { color: #2563eb; border-bottom: 2px solid #2563eb; background: #eff6ff; }

          /* --- REFINED TABLE --- */
          .table-container { width: 100%; overflow-x: auto; }
          .timetable-table { width: 100%; border-collapse: collapse; text-align: left; }
          
          .timetable-table th { 
             padding: 14px 24px;
             color: #64748b; 
             font-size: 0.75rem; 
             font-weight: 700; 
             text-transform: uppercase; 
             letter-spacing: 0.05em;
             background: #f8fafc;
             border-bottom: 1px solid #e2e8f0;
          }
          
          .timetable-table td { 
             padding: 16px 24px; 
             border-bottom: 1px solid #f1f5f9; 
             color: #334155; 
             font-size: 0.9rem; 
             font-weight: 500;
             vertical-align: middle; /* Ensures straight alignment */
          }

          /* Hover effect on rows */
          .timetable-table tbody tr:hover { background-color: #f8fafc; transition: background-color 0.2s; }
          /* Remove border from last row */
          .timetable-table tbody tr:last-child td { border-bottom: none; }

          /* Specific Cell Styles */
          .cell-index { color: #94a3b8; font-family: monospace; }
          .cell-time { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #475569; }
          .cell-subject { font-weight: 600; color: #0f172a; }
          .cell-teacher { color: #64748b; font-style: italic; }

          .status-badge { 
             display: inline-flex; 
             align-items: center; 
             padding: 4px 12px; 
             border-radius: 99px; 
             font-size: 0.75rem; 
             font-weight: 600; 
             text-transform: capitalize; 
             letter-spacing: 0.02em;
          }

          /* Syllabus */
          .syllabus-list { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
          .syllabus-item { width: 100%; }
          .syllabus-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: #334155; }
          .progress-track { width: 100%; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

          @media (max-width: 1024px) {
            .dashboard-main { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
            .tabs-container { overflow-x: auto; }
            .tab-btn { flex: none; min-width: 100px; }
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
                  {/* Fixed widths for straight columns */}
                  <colgroup>
                    <col style={{width: '60px'}} />   {/* # */}
                    <col style={{width: '140px'}} />  {/* Time */}
                    <col style={{width: '120px'}} />  {/* Type */}
                    <col style={{width: 'auto'}} />   {/* Subject (Flex) */}
                    <col style={{width: '180px'}} />  {/* Teacher */}
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
  );
};

export default TutorDashboard;