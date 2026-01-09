import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Book, CheckCircle, Clock, Save, MessageSquare, Filter, Loader } from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar';
import { useAuth } from '../../contexts/AuthContext';

// --- TOAST COMPONENT (Now fully integrated) ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const styles = {
    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
    padding: '12px 24px', borderRadius: '8px', color: 'white', fontWeight: '500',
    background: type === 'success' ? '#10b981' : '#ef4444',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out',
    display: 'flex', alignItems: 'center', gap: '8px'
  };
  return (
    <div style={styles}>
      {type === 'success' ? <CheckCircle size={18} /> : null}
      {message}
    </div>
  );
};

const SyllabusTracker = () => {
  const { user, currentUser } = useAuth();
  const activeUser = user || currentUser; 

  const [syllabusData, setSyllabusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());
  const [filterSubject, setFilterSubject] = useState('All');
  
  // 1. ADDED: State for the Toast Notification
  const [toast, setToast] = useState({ message: '', type: '' });
  
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  const currentBatch = 'KK_01';

  // 2. ADDED: Helper to show the toast
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    // Auto-hide after 3 seconds
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (activeUser) {
      fetchSyllabus();
    }
  }, [activeUser]); 

  const fetchSyllabus = () => {
    setLoading(true);
    const tutorId = activeUser?.id;
    
    if (!tutorId) {
        setLoading(false);
        return;
    }

    axios.get(`${API_BASE}/tutor/syllabus?batch=${currentBatch}&tutor_id=${tutorId}`)
      .then(res => {
        setSyllabusData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching syllabus:", err);
        setLoading(false);
      });
  };

  const handleRemarkChange = (masterId, value) => {
    setSyllabusData(prev => prev.map(item => 
      item.master_id === masterId ? { ...item, remarks: value } : item
    ));
  };

  const handleStatusChange = (masterId, newStatus) => {
    setSyllabusData(prev => prev.map(item => 
      item.master_id === masterId ? { ...item, status: newStatus } : item
    ));
  };

  const handleSave = async (item) => {
    if (!activeUser || !activeUser.id) return showToast("Please log in again.", "error");

    setSavingIds(prev => new Set(prev).add(item.master_id));

    const payload = {
        tutor_id: activeUser.id, 
        master_id: item.master_id,
        batch_name: currentBatch,
        status: item.status,
        remarks: item.remarks || ''
    };

    try {
        const res = await axios.post(`${API_BASE}/tutor/syllabus/update`, payload);
        
        // 3. UPDATED: Use showToast instead of alert/console.log
        if(res.data.Status === "Success") {
            showToast("Syllabus updated & Students notified!", "success");
        } else {
            showToast("Failed to save update", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Error connecting to server", "error");
    } finally {
        setSavingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.master_id);
            return newSet;
        });
    }
  };

  const filteredData = useMemo(() => {
    return filterSubject === 'All' 
    ? syllabusData 
    : syllabusData.filter(item => item.subject === filterSubject);
  }, [syllabusData, filterSubject]);

  const subjects = useMemo(() => ['All', ...new Set(syllabusData.map(item => item.subject))], [syllabusData]);

  return (
    <div className="page-wrapper">
      {/* 4. ADDED: Render the Toast Component here */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />

      <div className="sidebar-container"><TutorSidebar /></div>
      
      <div className="content-container">
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; }
          .content-container { flex-grow: 1; padding: 40px; overflow-y: auto; }
          
          .tracker-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; max-width: 1200px; margin: 0 auto; overflow: hidden; }
          .header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: white; }
          
          /* --- STATUS TOGGLE STYLES --- */
          .status-toggle {
            display: flex;
            background: #f1f5f9;
            border-radius: 8px;
            padding: 4px;
            width: fit-content;
            border: 1px solid #e2e8f0;
          }
          
          .toggle-option {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            border: none;
            background: transparent;
          }

          .toggle-option:hover { color: #334155; background: rgba(0,0,0,0.02); }

          /* Active States */
          .toggle-option.active-pending {
            background: white; color: #475569;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .toggle-option.active-progress {
            background: #fff7ed; color: #ea580c;
            box-shadow: 0 1px 2px rgba(234, 88, 12, 0.1);
            border: 1px solid #fdba74;
          }
          
          .toggle-option.active-completed {
            background: #dcfce7; color: #166534;
            box-shadow: 0 1px 2px rgba(22, 101, 52, 0.1);
            border: 1px solid #86efac;
          }

          /* --- END STATUS STYLES --- */
          
          .save-btn {
            background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 500; transition: background 0.2s;
          }
          .save-btn:disabled { background-color: #94a3b8; cursor: not-allowed; }

          .filter-select { padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: #f8fafc; cursor: pointer;}
          .comment-input { width: 90%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; transition: border 0.2s;}
          .comment-input:focus { border-color: #3b82f6; outline: none; }

          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 16px 20px; font-size: 0.75rem; color: #64748b; font-weight: 700; background: #f8fafc; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.05em; }
          td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; vertical-align: middle; }
          tr:hover td { background: #f8fafc; }
          
          .topic-name { font-weight: 600; color: #0f172a; display: block; margin-bottom: 4px; }
          .topic-chapter { font-size: 0.75rem; color: #64748b; font-weight: 500; display: block; margin-bottom: 4px;}
          .topic-cat { font-size: 0.70rem; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; display: inline-block; }
          
          .unit-badge { 
            background: #e0f2fe; color: #0369a1; 
            width: 32px; height: 32px; 
            display: flex; align-items: center; justify-content: center; 
            border-radius: 50%; font-weight: 700; font-size: 0.9rem;
            margin: 0 auto;
          }
        `}</style>

        <div className="tracker-card">
          <div className="header">
            <h2 style={{fontSize:'1.5rem', fontWeight:700, color:'#0f172a', display:'flex', gap:'12px', alignItems:'center', margin:0}}>
              <Book className="text-blue-600" size={28} /> Syllabus Tracker 
              <span style={{fontSize:'0.9rem', fontWeight:500, color:'#475569', background:'#e2e8f0', padding:'4px 12px', borderRadius:'20px'}}>
                {currentBatch}
              </span>
            </h2>
            
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <Filter size={18} color="#64748b" />
                <select className="filter-select" onChange={(e) => setFilterSubject(e.target.value)} value={filterSubject}>
                {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>
          </div>

          {loading ? (
            <div style={{padding:'80px', display:'flex', flexDirection:'column', alignItems:'center', color:'#94a3b8'}}>
                <Loader className="animate-spin" size={32} />
                <p style={{marginTop:'10px'}}>Loading Syllabus...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{width: '8%', textAlign:'center'}}>Unit</th>
                  <th style={{width: '28%'}}>Topic Details</th>
                  <th style={{width: '32%'}}>Status</th> 
                  <th style={{width: '22%'}}>Remarks</th>
                  <th style={{width: '10%'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                    const isSaving = savingIds.has(item.master_id);
                    return (
                        <tr key={item.master_id}>
                        <td style={{textAlign:'center'}}>
                            <div className="unit-badge">{item.unit_no}</div>
                        </td>
                        
                        <td>
                            <div>
                                <span className="topic-name">{item.topic_name}</span>
                                <span className="topic-chapter">{item.chapter_name}</span> 
                                <span className="topic-cat">{item.category}</span>
                            </div>
                        </td>
                        
                        <td>
                            <div className="status-toggle">
                                <button 
                                    onClick={() => handleStatusChange(item.master_id, 'Pending')}
                                    className={`toggle-option ${item.status === 'Pending' ? 'active-pending' : ''}`}
                                >
                                    Pending
                                </button>
                                
                                <button 
                                    onClick={() => handleStatusChange(item.master_id, 'In Progress')}
                                    className={`toggle-option ${item.status === 'In Progress' ? 'active-progress' : ''}`}
                                >
                                    <Clock size={12} /> Active
                                </button>
                                
                                <button 
                                    onClick={() => handleStatusChange(item.master_id, 'Completed')}
                                    className={`toggle-option ${item.status === 'Completed' ? 'active-completed' : ''}`}
                                >
                                    <CheckCircle size={12} /> Done
                                </button>
                            </div>
                        </td>
                        
                        <td>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <MessageSquare size={18} color="#cbd5e1" />
                                <input 
                                    type="text" 
                                    className="comment-input" 
                                    placeholder="Add remarks..."
                                    value={item.remarks || ''}
                                    onChange={(e) => handleRemarkChange(item.master_id, e.target.value)}
                                />
                            </div>
                        </td>

                        <td>
                            <button 
                                className="save-btn" 
                                onClick={() => handleSave(item)}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} 
                                {isSaving ? 'Saving' : 'Save'}
                            </button>
                        </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyllabusTracker;