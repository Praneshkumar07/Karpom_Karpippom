import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { 
  Calendar, User, Save, CheckCircle, AlertCircle, Upload, 
  FileText, MessageSquare, BarChart2, Printer, TrendingUp, Users,
  ChevronDown, X 
} from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar';

// --- Sub-Component: Report View (Unchanged) ---
const ReportView = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [reportData, setReportData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, totalClasses: 0, low: 0 });

  useEffect(() => {
    axios.get(`http://localhost:8081/tutor/attendance/report?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        setReportData(res.data);
        calculateStats(res.data);
      })
      .catch(console.error);
  }, [startDate, endDate]);

  const calculateStats = (data) => {
    if (!data.length) return setStats({ avg: 0, totalClasses: 0, low: 0 });
    let totalPerc = 0, lowCount = 0, maxClasses = 0;
    data.forEach(s => {
      const p = s.total_classes ? (s.present / s.total_classes) * 100 : 0;
      totalPerc += p;
      if (p < 75) lowCount++;
      if (s.total_classes > maxClasses) maxClasses = s.total_classes;
    });
    setStats({ avg: (totalPerc / data.length).toFixed(1), totalClasses: maxClasses, low: lowCount });
  };

  const getColor = (p) => p >= 85 ? '#22c55e' : p >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="report-container animate-fade">
      <div className="flex-row-between no-print" style={{ marginBottom: '20px' }}>
        <div className="filters">
          <label>From: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label>To: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        </div>
        <button onClick={() => window.print()} className="print-btn"><Printer size={16} /> Print</button>
      </div>

      <div className="stats-grid no-print">
        <div className="stat-card">
          <div className="icon-box blue"><TrendingUp size={20} /></div>
          <div><div className="val">{stats.avg}%</div><div className="lbl">Avg Attendance</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-box green"><Calendar size={20} /></div>
          <div><div className="val">{stats.totalClasses}</div><div className="lbl">Classes Held</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-box red"><Users size={20} /></div>
          <div><div className="val">{stats.low}</div><div className="lbl">Students &lt; 75%</div></div>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="print-only-header">
           <h2>Attendance Report</h2>
           <p>{startDate} to {endDate}</p>
        </div>
        <table className="report-table">
          <thead>
            <tr>
              <th>Student</th><th>Total</th><th>Present</th><th>Absent</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, i) => {
              const perc = row.total_classes ? Math.round((row.present / row.total_classes) * 100) : 0;
              return (
                <tr key={i}>
                  <td className="font-bold">{row.full_name}</td>
                  <td>{row.total_classes}</td>
                  <td className="text-green">{row.present}</td>
                  <td className="text-red">{row.absent}</td>
                  <td>
                    <div className="progress-flex">
                      <div className="progress-bg"><div className="progress-fill" style={{ width: `${perc}%`, background: getColor(perc) }}></div></div>
                      <span style={{ color: getColor(perc), fontWeight: 'bold', fontSize: '0.85rem' }}>{perc}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!reportData.length && <tr><td colSpan="5" align="center">No data found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Component ---
const AttendanceModule = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [students, setStudents] = useState([]);
  
  // --- NEW MULTI-SELECT STATES ---
  const [selectedIds, setSelectedIds] = useState([]); 
  const [selectAll, setSelectAll] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // NEW STATE FOR DROPDOWN
  
  // Shared States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');
  
  // Import States
  const [importFile, setImportFile] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importRemarks, setImportRemarks] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8081/tutor/students').then(res => setStudents(res.data));
  }, []);

  // --- HANDLERS ---
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleCheck = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
      setSelectAll(false);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if(selectedIds.length === 0) return alert("Select at least one student.");

    setLoading(true);
    axios.post('http://localhost:8081/tutor/attendance/manual-bulk', { 
        student_ids: selectedIds, 
        date: selectedDate, 
        status, 
        remarks 
    })
    .then(res => { 
        setMessage({ type: 'success', text: res.data.message }); 
        setLoading(false); 
        setSelectedIds([]); 
        setSelectAll(false);
        setIsDropdownOpen(false); // Close dropdown on success
        setTimeout(() => setMessage(null), 3000); 
    });
  };

  // Import Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          const names = res.data.map(r => r['Participant Name'] || r['Name (Original Name)'] || r['Name']).filter(n => n);
          setImportStats({ count: names.length, names });
        }
      });
    }
  };

  const processImport = () => {
    setLoading(true);
    axios.post('http://localhost:8081/tutor/attendance/bulk-import', { date: selectedDate, names_list: importStats.names, remarks: importRemarks })
      .then(res => {
        setMessage({ type: 'success', text: res.data.message });
        setLoading(false); setImportFile(null); setImportStats(null); setImportRemarks('');
      });
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-container no-print"><TutorSidebar /></div>
      <div className="content-container">
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; height: 100%; }
          .content-container { flex-grow: 1; padding: 40px; overflow-y: auto; display: flex; justify-content: center; }
          
          .main-card { background: white; width: 100%; max-width: 800px; border-radius: 16px; border: 1px solid #e2e8f0; height: fit-content; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .card-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .card-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
          
          /* Tabs */
          .tabs-header { display: flex; background: #f8fafc; padding: 5px 5px 0 5px; border-bottom: 1px solid #e2e8f0; }
          .tab-btn { flex: 1; padding: 14px; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .tab-btn:hover { background: #f1f5f9; color: #334155; }
          .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: white; border-radius: 8px 8px 0 0; border: 1px solid #e2e8f0; border-bottom: none; position: relative; top: 1px; }

          .tab-content { padding: 30px; }
          .form-group { margin-bottom: 20px; }
          .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 8px; }
          .form-control { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; }
          .btn-primary { background: #0f172a; color: white; width: 100%; padding: 12px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .btn-primary:disabled { opacity: 0.7; }
          .upload-area { border: 2px dashed #cbd5e1; padding: 40px; text-align: center; border-radius: 12px; cursor: pointer; background: #f8fafc; transition: 0.2s; }
          
          /* NEW DROPDOWN STYLES */
          .dropdown-wrapper { position: relative; width: 100%; }
          .dropdown-btn { 
            width: 100%; padding: 12px 14px; background: white; border: 1px solid #cbd5e1; 
            border-radius: 8px; display: flex; justify-content: space-between; align-items: center; 
            cursor: pointer; font-size: 0.95rem; color: #334155; 
          }
          .dropdown-menu { 
            position: absolute; top: 100%; left: 0; right: 0; background: white; 
            border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 5px; 
            max-height: 250px; overflow-y: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); 
            z-index: 50; 
          }
          .dropdown-item { 
            padding: 10px 15px; border-bottom: 1px solid #f1f5f9; display: flex; 
            align-items: center; gap: 10px; cursor: pointer; transition: 0.1s; 
          }
          .dropdown-item:hover { background: #f8fafc; }
          .dropdown-header { padding: 10px 15px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 0.85rem; color: #64748b; display: flex; gap: 10px; align-items: center; }
          
          .checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: #0f172a; }
          .badge { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; color: #475569; }

          /* Report Styles */
          .flex-row-between { display: flex; justify-content: space-between; align-items: center; }
          .filters { display: flex; gap: 15px; } .filters input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-left: 5px; }
          .print-btn { background: white; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; gap: 6px; align-items: center; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .stat-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; gap: 12px; align-items: center; }
          .icon-box { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
          .icon-box.blue { background: #eff6ff; color: #2563eb; } .icon-box.green { background: #f0fdf4; color: #16a34a; } .icon-box.red { background: #fef2f2; color: #dc2626; }
          .stat-card .val { font-weight: 700; font-size: 1.2rem; color: #0f172a; } .stat-card .lbl { font-size: 0.8rem; color: #64748b; }
          .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .report-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 1px solid #e2e8f0; }
          .report-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
          .progress-flex { display: flex; align-items: center; gap: 10px; }
          .progress-bg { width: 80px; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 10px; }
          .font-bold { font-weight: 600; color: #334155; }
          .text-green { color: #166534; font-weight: 500; } .text-red { color: #dc2626; font-weight: 500; }
          .feedback { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
          .success { background: #dcfce7; color: #166534; }
          
          .print-only-header { display: none; }
          @media print {
            .no-print { display: none !important; }
            .page-wrapper { display: block; height: auto; background: white; }
            .content-container { padding: 0; overflow: visible; }
            .main-card { border: none; box-shadow: none; max-width: 100%; }
            .tabs-header, .submit-btn { display: none; }
            .print-only-header { display: block; text-align: center; margin-bottom: 20px; }
            .report-container { display: block !important; }
          }
        `}</style>

        <div className="main-card">
          <div className="card-header no-print">
            <div className="card-title">
              {activeTab === 'report' ? <BarChart2 size={24} className="text-blue-600"/> : <CheckCircle size={24} className="text-blue-600"/>}
              Attendance Manager
            </div>
            {activeTab !== 'report' && (
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{padding:'6px 10px', borderRadius:'6px', border:'1px solid #cbd5e1'}} />
            )}
          </div>

          <div className="tabs-header no-print">
            <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
              <User size={16} /> Manual Entry
            </button>
            <button className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>
              <Upload size={16} /> Import CSV
            </button>
            <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
              <BarChart2 size={16} /> View Report
            </button>
          </div>

          <div className="tab-content">
            
            {/* --- TAB 1: MANUAL (Updated to Dropdown) --- */}
            {activeTab === 'manual' && (
              <form onSubmit={handleBulkSubmit} className="animate-fade">
                {message && <div className="feedback success"><CheckCircle size={18}/> {message.text}</div>}
                
                <div className="form-group">
                  <label style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      Select Students
                      {selectedIds.length > 0 && <span className="badge">{selectedIds.length} Selected</span>}
                  </label>
                  
                  <div className="dropdown-wrapper">
                    {/* Toggle Button */}
                    <div className="dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {selectedIds.length === 0 
                            ? 'Select students from list...' 
                            : `${selectedIds.length} students selected`}
                        {isDropdownOpen ? <X size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {/* Dropdown Menu (Hidden unless open) */}
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <input type="checkbox" className="checkbox" checked={selectAll} onChange={handleSelectAll} />
                                Select All
                            </div>
                            {students.map(s => (
                                <div key={s.id} className="dropdown-item" onClick={() => handleCheck(s.id)}>
                                    <input 
                                        type="checkbox" 
                                        className="checkbox" 
                                        checked={selectedIds.includes(s.id)} 
                                        onChange={() => handleCheck(s.id)}
                                    />
                                    <span>{s.full_name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mark Selected As:</label>
                  <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                    <option>On Leave</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea className="form-control" rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Applied to all selected..."></textarea>
                </div>

                <button type="submit" className="btn-primary" disabled={loading || selectedIds.length === 0}>
                  {loading ? 'Saving...' : `Update ${selectedIds.length} Students`}
                </button>
              </form>
            )}

            {/* --- TAB 2 & 3: IMPORT & REPORT (Unchanged) --- */}
            {activeTab === 'import' && (
              <div className="animate-fade">
                {message && <div className="feedback success"><CheckCircle size={18}/> {message.text}</div>}
                <div className="upload-area" onClick={() => document.getElementById('csvInput').click()}>
                   <FileText size={32} color="#94a3b8" style={{marginBottom:'10px'}}/>
                   <p style={{margin:0, fontWeight:600, color:'#475569'}}>Click to Upload CSV</p>
                   <input id="csvInput" type="file" accept=".csv" style={{display:'none'}} onChange={handleFileChange} />
                </div>
                {importFile && (
                  <div style={{marginTop:'20px', background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', fontWeight:600, color:'#334155'}}>
                      <CheckCircle size={18} color="#22c55e"/> {importFile.name}
                    </div>
                    {importStats && <div style={{marginTop:'5px', fontSize:'0.85rem', color:'#64748b'}}>Found <b>{importStats.count}</b> names.</div>}
                  </div>
                )}
                <div className="form-group" style={{marginTop:'20px'}}>
                  <label>Batch Remarks</label>
                  <input className="form-control" placeholder="e.g. 'Math Online Class'" value={importRemarks} onChange={e => setImportRemarks(e.target.value)} />
                </div>
                <button onClick={processImport} className="btn-primary" disabled={!importFile || loading}>{loading ? 'Processing...' : 'Process Import'}</button>
              </div>
            )}

            {activeTab === 'report' && <ReportView />}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModule;