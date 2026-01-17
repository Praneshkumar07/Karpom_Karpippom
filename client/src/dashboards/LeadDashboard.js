import React from 'react';
import { 
  Users, GraduationCap, TrendingUp, AlertTriangle, 
  MoreVertical, Search, Plus, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

import LeadSidebar from '../components/LeadSidebar';

// --- MOCK DATA ---
const chartData = [
  { name: 'Mon', attendance: 85, active: 92 },
  { name: 'Tue', attendance: 88, active: 94 },
  { name: 'Wed', attendance: 92, active: 96 },
  { name: 'Thu', attendance: 89, active: 94 },
  { name: 'Fri', attendance: 84, active: 90 },
  { name: 'Sat', attendance: 78, active: 85 },
];

const tutors = [
  { id: 1, name: 'Sarah Wilson', subject: 'Mathematics', students: 45, rating: 4.8, status: 'Active' },
  { id: 2, name: 'James Carter', subject: 'Physics', students: 32, rating: 4.5, status: 'On Leave' },
  { id: 3, name: 'Emily Chen', subject: 'Chemistry', students: 28, rating: 4.9, status: 'Active' },
  { id: 4, name: 'Michael Brown', subject: 'Biology', students: 41, rating: 4.2, status: 'Active' },
];

const alerts = [
  { id: 1, type: 'warning', text: 'Low attendance in Physics (Batch B2)', time: '2 hrs ago' },
  { id: 2, type: 'info', text: 'New Tutor Application: R. Gupta', time: '5 hrs ago' },
  { id: 3, type: 'urgent', text: 'Server maintenance scheduled tonight', time: '1 day ago' },
];

const LeadDashboard = () => {
  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar-section">
        <LeadSidebar />
      </div>

      {/* Main Content */}
      <div className="content-section">
        
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p className="subtitle">Welcome back, Lead. Here's what's happening today.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>
            <button className="btn-primary">
              <Plus size={18} /> Add User
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="stats-grid animate-fade-up">
          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg blue"><Users size={20} /></div>
              <span className="trend up"><ArrowUpRight size={14} /> +12%</span>
            </div>
            <div className="stat-value">1,240</div>
            <div className="stat-label">Total Students</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg green"><GraduationCap size={20} /></div>
              <span className="trend up"><ArrowUpRight size={14} /> +4%</span>
            </div>
            <div className="stat-value">42</div>
            <div className="stat-label">Active Tutors</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg purple"><TrendingUp size={20} /></div>
              <span className="trend down"><ArrowDownRight size={14} /> -2%</span>
            </div>
            <div className="stat-value">88.5%</div>
            <div className="stat-label">Avg. Attendance</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="icon-bg orange"><AlertTriangle size={20} /></div>
              <span className="badge">Action Req.</span>
            </div>
            <div className="stat-value">5</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="charts-section animate-fade-up delay-1">
          <div className="chart-card">
            <div className="card-header">
              <h3>Weekly Attendance Trends</h3>
              <select className="chart-select">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#64748b', fontSize:12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b', fontSize:12}} />
                  <Tooltip 
                    contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} 
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panel: Alerts & Calendar */}
          <div className="side-panel-col">
            <div className="alert-card">
              <div className="card-header">
                <h3>Recent Alerts</h3>
                <span className="link-text">View All</span>
              </div>
              <div className="alert-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.type}`}>
                    <div className="alert-dot"></div>
                    <div>
                      <p className="alert-text">{alert.text}</p>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mini-card highlight">
                <div className="flex-row">
                    <Calendar size={20} />
                    <div>
                        <span className="block-title">Next Meeting</span>
                        <span className="block-sub">Tutor Sync • 2:00 PM</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Tutor List */}
        <div className="table-card animate-fade-up delay-2">
          <div className="card-header">
            <h3>Top Performing Tutors</h3>
            <button className="btn-outline">View All Tutors</button>
          </div>
          <table className="dashboard-table">
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
                  <td className="font-medium">{tutor.name}</td>
                  <td>{tutor.subject}</td>
                  <td>{tutor.students}</td>
                  <td>
                    <span className={`status-badge ${tutor.status === 'Active' ? 'active' : 'inactive'}`}>
                      {tutor.status}
                    </span>
                  </td>
                  <td>
                    <div className="rating-pill">★ {tutor.rating}</div>
                  </td>
                  <td style={{textAlign:'right'}}>
                    <button className="icon-btn"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default LeadDashboard;