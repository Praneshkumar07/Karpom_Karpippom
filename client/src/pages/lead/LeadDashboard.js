import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, GraduationCap, TrendingUp, AlertTriangle,
  MoreVertical, Search, Plus, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import LeadSidebar from './LeadSidebar';

const LeadDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0, activeTutors: 0, avgAttendance: 0, pendingApprovals: 0
  });
  const [chartData, setChartData] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes, tutorsRes, alertsRes] = await Promise.all([
          axios.get('http://localhost:8081/lead/stats'),
          axios.get('http://localhost:8081/lead/attendance-chart'),
          axios.get('http://localhost:8081/lead/top-tutors'),
          axios.get('http://localhost:8081/lead/alerts')
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data);
        setTutors(tutorsRes.data);
        setAlerts(alertsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-wrapper">
      <aside className="sidebar-container">
        <LeadSidebar />
      </aside>

      <main className="content-container">

        <style>{`
          /* Color strategy inspired palette */
          :root{
            --bg: #f6f8fb;           /* soft neutral background */
            --card: #ffffff;         /* card surface */
            --muted: #6b7280;        /* muted text */
            --text: #0f1724;         /* primary text */
            --nav-dark: #071028;     /* deep navy for sidebar */
            --nav-deep: #0b1220;     /* darker gradient stop */
            --accent-teal: #0ea5e9;  /* primary accent (teal) */
            --accent-gold: #b58900;  /* secondary accent (gold) */
            --border: #e6eef6;       /* subtle border */
            --success: #16a34a;      /* success */
            --danger: #dc2626;       /* danger */
            --surface: #f3f6f9;      /* light surface */
          }

          /* Layout */
          .page-wrapper {
            display:flex;
            height:100vh;
            background: var(--bg);
            font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: var(--text);
            overflow:hidden;
          }
          .sidebar-container {
            width: 260px;
            flex-shrink: 0;
            background: linear-gradient(180deg, var(--nav-dark) 0%, var(--nav-deep) 100%);
            height:100%;
            color: #e6eef6;
            display:flex;
            flex-direction:column;
            box-shadow: 2px 0 8px rgba(11,18,32,0.06);
          }
          .content-container {
            flex-grow:1;
            padding: 28px 36px;
            overflow-y:auto;
          }

          /* Sidebar (keeps parity with LeadSidebar structure) */
          .sidebar-header { padding: 20px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); }
          .header-title { font-size: 1.25rem; font-weight: 700; color: var(--accent-gold); margin:0; }
          .header-subtitle { font-size: 0.85rem; color: rgba(230,238,246,0.7); margin-top:6px; }
          .menu-item { display:flex; align-items:center; padding: 12px 18px; color: rgba(230,238,246,0.9); text-decoration:none; border-left:4px solid transparent; font-weight:600; }
          .menu-item.active { background: rgba(236, 244, 248, 0.06); color: #b58900; border-left-color: #b58900; }

          /* Header */
          .dashboard-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; gap:16px; }
          .dashboard-header h1 { font-size:1.5rem; color:var(--text); margin:0 0 6px 0; font-weight:700; }
          .subtitle { color:var(--muted); margin:0; font-size:0.95rem; }
          .header-actions { display:flex; gap:12px; align-items:center; }

          .search-box {
            display:flex; align-items:center; background:var(--card); padding:8px 12px; border-radius:8px; border:1px solid var(--border); min-width:260px;
          }
          .search-box input { border:none; outline:none; margin-left:10px; color:var(--text); font-size:0.95rem; background:transparent; width:100%; }

          .btn-primary {
            background: black;
            color: white; border:none; padding:8px 14px; border-radius:8px; font-weight:600; display:flex; align-items:center; gap:8px; cursor:pointer;
            box-shadow: 0 6px 18px rgba(14,165,233,0.08);
          }
          .btn-primary:hover { filter:brightness(0.95); }

          /* Stats Grid */
          .stats-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:18px; margin-bottom:28px; }
          .stat-card { background:var(--card); padding:18px; border-radius:10px; border:1px solid var(--border); box-shadow:0 1px 4px rgba(16,24,40,0.03); min-height:110px; display:flex; flex-direction:column; justify-content:space-between; }
          .stat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
          .stat-value { font-size:1.45rem; font-weight:700; color:var(--text); }
          .stat-label { color:var(--muted); font-size:0.9rem; margin-top:6px; }

          .icon-bg { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:var(--surface); color:var(--muted); }
          .icon-bg.blue { color:#0b61a6; background: rgba(11,97,166,0.06); }
          .icon-bg.green { color:var(--success); background: rgba(22,163,74,0.06); }
          .icon-bg.purple { color:#6b21a8; background: rgba(107,33,168,0.06); }
          .icon-bg.orange { color:#b45309; background: rgba(180,83,9,0.04); }

          .trend { font-size:0.85rem; display:flex; align-items:center; gap:6px; font-weight:600; color:var(--muted); }
          .trend.up { color:var(--success); }
          .trend.down { color:var(--danger); }

          /* Content Grid */
          .content-grid { display:grid; grid-template-columns: 2fr 1fr; gap:18px; margin-bottom:28px; }
          .card-base { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:18px; box-shadow:0 1px 4px rgba(16,24,40,0.03); height:100%; display:flex; flex-direction:column; }
          .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
          .card-header h3 { font-size:1.05rem; font-weight:700; color:var(--text); margin:0; }

          /* Chart */
          .recharts-wrapper { width:100%; height:300px; }

          /* Alerts */
          .alert-list { display:flex; flex-direction:column; gap:12px; flex-grow:1; }
          .alert-item { display:flex; gap:12px; align-items:flex-start; }
          .alert-dot { width:10px; height:10px; border-radius:50%; margin-top:6px; flex-shrink:0; }
          .alert-item.warning .alert-dot { background: #f59e0b; }
          .alert-item.info .alert-dot { background: var(--accent-teal); }
          .alert-text { font-size:0.95rem; color:var(--text); margin:0; line-height:1.4; }
          .alert-time { font-size:0.8rem; color:var(--muted); display:block; margin-top:4px; }

          .mini-card-highlight { background:var(--surface); border-radius:8px; padding:12px; margin-top:14px; border:1px solid var(--border); display:flex; align-items:center; gap:12px; }
          .block-title { display:block; font-weight:700; color:var(--text); font-size:0.95rem; }
          .block-sub { font-size:0.85rem; color:var(--muted); }

          /* Table */
          .table-container { width:100%; overflow-x:auto; }
          .dashboard-table { width:100%; border-collapse:collapse; text-align:left; min-width:720px; }
          .dashboard-table th { text-align:left; padding:12px; color:var(--muted); font-size:0.85rem; border-bottom:1px solid var(--border); font-weight:700; }
          .dashboard-table td { padding:12px; border-bottom:1px solid #f1f5f9; font-size:0.95rem; color:var(--text); vertical-align:middle; }
          .dashboard-table tbody tr:hover { background: rgba(14,165,233,0.02); }

          .status-badge { padding:6px 12px; border-radius:999px; font-size:0.8rem; font-weight:700; display:inline-block; }
          .status-badge.active { background: rgba(22,163,74,0.08); color:var(--success); }
          .status-badge.inactive { background: rgba(220,38,38,0.06); color:var(--danger); }

          .rating-pill { background: rgba(15,23,42,0.03); color:var(--muted); padding:6px 10px; border-radius:8px; font-weight:700; display:inline-flex; align-items:center; gap:6px; }

          .icon-btn { background:none; border:none; cursor:pointer; color:var(--muted); padding:6px; border-radius:6px; }
          .icon-btn:hover { background: rgba(14,165,233,0.04); color:var(--accent-teal); }

          /* Accent usage examples */
          .header-title-accent { color: var(--accent-gold); font-weight:700; letter-spacing:0.2px; }
          .small-accent-pill { background: rgba(181,137,0,0.08); color: var(--accent-gold); padding:6px 10px; border-radius:999px; font-weight:700; font-size:0.85rem; }

          /* Responsive */
          @media (max-width:1100px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .content-grid { grid-template-columns: 1fr; }
          }
          @media (max-width:640px) {
            .sidebar-container { display:none; }
            .content-container { padding:18px; }
            .stats-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <header className="dashboard-header">
          <div>
            <h1 className="header-title-accent">Dashboard Overview</h1>
            <p className="subtitle">Welcome back, Lead. Here's a concise view of today's activity.</p>
          </div>
          <div className="header-actions">
            <div className="search-box" role="search" aria-label="Search dashboard">
              <Search size={16} color="#6b7280" />
              <input type="text" placeholder="Search people, reports, or alerts" />
            </div>
            <button className="btn-primary" aria-label="Add user">
              <Plus size={16} /> Add User
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="Key metrics">
          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg blue"><Users size={18} /></div>
              <span className="trend up"><ArrowUpRight size={14} /> +12%</span>
            </div>
            <div className="stat-value">{stats.totalStudents || 0}</div>
            <div className="stat-label">Total Students</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg green"><GraduationCap size={18} /></div>
              <span className="trend up"><ArrowUpRight size={14} /> +4%</span>
            </div>
            <div className="stat-value">{stats.activeTutors || 0}</div>
            <div className="stat-label">Active Tutors</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg purple"><TrendingUp size={18} /></div>
              <span className="trend down"><ArrowDownRight size={14} /> -2%</span>
            </div>
            <div className="stat-value">{stats.avgAttendance || "0%"}</div>
            <div className="stat-label">Avg. Attendance</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg orange"><AlertTriangle size={18} /></div>
              <span className="small-accent-pill">Action Required</span>
            </div>
            <div className="stat-value">{stats.pendingApprovals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </section>

        <section className="content-grid" aria-label="Charts and alerts">
          <div className="card-base" aria-live="polite">
            <div className="card-header">
              <h3>Weekly Attendance</h3>
            </div>
            <div style={{ height: '300px', width: '100%' }} className="recharts-wrapper">
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} />
                  <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 6px 18px rgba(2,6,23,0.08)'}} />
                  <Area type="monotone" dataKey="attendance" stroke="var(--accent-teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <aside className="card-base" aria-label="Recent alerts">
            <div className="card-header">
              <h3>Recent Alerts</h3>
            </div>
            <div className="alert-list" role="list">
              {alerts.length === 0 && <p className="alert-text">No new alerts</p>}
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type || 'info'}`} role="listitem">
                  <div className="alert-dot" aria-hidden></div>
                  <div>
                    <p className="alert-text">{alert.text}</p>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mini-card-highlight" aria-hidden>
              <Calendar size={18} color="#0b1220" />
              <div>
                <span className="block-title">Next Meeting</span>
                <span className="block-sub">Tutor Sync • 2:00 PM</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="card-base" aria-label="Top performing tutors">
          <div className="card-header">
            <h3>Top Performing Tutors</h3>
          </div>
          <div className="table-container">
            <table className="dashboard-table" role="table" aria-label="Top tutors table">
              <thead>
                <tr>
                  <th>Tutor Name</th>
                  <th>Subject</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tutor) => (
                  <tr key={tutor.id}>
                    <td style={{fontWeight:600}}>{tutor.name}</td>
                    <td>{tutor.subject}</td>
                    <td>{tutor.students}</td>
                    <td>
                      <span className={`status-badge ${tutor.status === 'Active' ? 'active' : 'inactive'}`}>
                        {tutor.status}
                      </span>
                    </td>
                    <td>
                      <div className="rating-pill" aria-label={`Rating ${tutor.rating}`}>
                        <span style={{color:'#f59e0b'}}>★</span>
                        <span style={{marginLeft:6}}>{tutor.rating}</span>
                      </div>
                    </td>
                    <td style={{textAlign:'right'}}>
                      <button className="icon-btn" aria-label="More actions"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};

export default LeadDashboard;
