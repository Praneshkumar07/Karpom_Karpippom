import React, { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Send, History, Inbox, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import TutorSidebar from '../../components/TutorSidebar';

const API_URL = "http://localhost:8081";

const TutorRequests = () => {
  const navigate = useNavigate();

  // --- 1. GET ID FROM STORAGE ---
  const currentUserId = localStorage.getItem('userId');

  // --- STATE ---
  const [requests, setRequests] = useState([]);
  const [tutors, setTutors] = useState([]); 
  const [activeTab, setActiveTab] = useState('new'); 
  const [loading, setLoading] = useState(false);

  // Form State - Default time set to 18:00 (6:00 PM)
  const [formData, setFormData] = useState({
    type: 'SWAP', 
    target_id: '',
    batch: '',
    subject: '', 
    class_date: '',
    class_time: '18:00', // <--- FIXED HERE
    reason: ''
  });

  // --- 2. EFFECT HOOK ---
  useEffect(() => {
    // Security Check: If no user ID found, redirect to login
    if (!currentUserId) {
        navigate('/'); 
        return;
    }

    fetchRequests();
    fetchTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // --- 3. API CALLS ---

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/tutor/requests/${currentUserId}`);
      setRequests(res.data);
    } catch(err) { console.error("Error fetching requests", err); }
  };

  const fetchTutors = async () => {
    try {
        const res = await axios.get(`${API_URL}/tutor/tutors-list`);
        // Filter out yourself using loose equality (==)
        setTutors(res.data.filter(t => t.id != currentUserId));
    } catch(err) { console.error("Error fetching tutor list", err); }
  };

  // --- 4. AUTO-FETCH SUBJECT LOGIC ---
  const fetchClassDetails = async (batch, date) => {
      if (!batch || !date) return;
      
      setLoading(true);
      try {
          const res = await axios.get(`${API_URL}/tutor/class-info?batch=${batch}&date=${date}`);
          
          if (res.data.found) {
              setFormData(prev => ({
                  ...prev,
                  subject: res.data.subject 
              }));
          } else {
              setFormData(prev => ({ ...prev, subject: '' })); 
          }
      } catch (err) {
          console.error("Error fetching class info", err);
      } finally {
          setLoading(false);
      }
  };

  // --- 5. HANDLERS ---

  const handleChange = (e) => {
      const { name, value } = e.target;
      
      setFormData(prev => {
          const updated = { ...prev, [name]: value };
          if (name === 'batch' || name === 'class_date') {
              fetchClassDetails(updated.batch, updated.class_date);
          }
          return updated;
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) {
        alert("Please enter a subject or select a valid date/batch.");
        return;
    }

    try {
        await axios.post(`${API_URL}/tutor/create`, {
          requestor_id: currentUserId,
          request_type: formData.type,
          target_id: formData.type === 'SWAP' ? formData.target_id : null,
          batch: formData.batch,
          subject: formData.subject,
          class_date: formData.class_date,
          class_time: formData.class_time,
          reason: formData.reason
        });
        alert("Request Sent Successfully!");
        fetchRequests(); 
        setActiveTab('history'); 
        
        // Reset form - maintain default time of 18:00
        setFormData({
            type: 'SWAP', 
            target_id: '', 
            batch: '', 
            subject: '', 
            class_date: '', 
            class_time: '18:00', // <--- FIXED HERE
            reason: ''
        });

    } catch(err) { 
        console.error(err); 
        alert("Failed to send request"); 
    }
  };

  const handleResponse = async (id, action) => {
    try {
        await axios.put(`${API_URL}/tutor/respond/${id}`, { action });
        fetchRequests(); 
        alert(`Request ${action === 'ACCEPT' ? 'Accepted' : 'Rejected'}`);
    } catch(err) { console.error(err); }
  };

  // --- 6. FILTER LOGIC ---
  const incomingRequests = requests.filter(r => r.target_id == currentUserId && r.status === 'PENDING_TUTOR');
  
  const myHistory = requests.filter(r => r.requestor_id == currentUserId || (r.target_id == currentUserId && r.status !== 'PENDING_TUTOR'));

  // Prevent rendering if not logged in
  if (!currentUserId) return null;

  return (
    <div className="page-wrapper">
      {/* SIDEBAR */}
      <div className="sidebar-container">
        <TutorSidebar />
      </div>

      {/* MAIN CONTENT */}
      <div className="content-container">
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
          
          <h1 style={{fontSize:'1.8rem', color:'#1e293b', marginBottom:'20px'}}>Request Management</h1>
          
          {/* Tabs */}
          <div className="tabs-container">
            <button onClick={() => setActiveTab('new')} className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}>
               <Send size={16}/> New Request
            </button>
            <button onClick={() => setActiveTab('incoming')} className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}>
               <Inbox size={16}/> Incoming <span className="badge">{incomingRequests.length}</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}>
               <History size={16}/> History
            </button>
          </div>

          {/* --- TAB: NEW REQUEST --- */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmit} className="form-card">
              <h3>Create Request</h3>
              
              <div className="form-group">
                  <label>Request Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="form-control">
                    <option value="SWAP">Swap Class</option>
                    <option value="CANCEL">Cancel Class</option>
                    <option value="RELIEF">Request Relieving</option>
                  </select>
              </div>

              {formData.type !== 'RELIEF' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                  <div className="form-group">
                      <label>Batch</label>
                      <select name="batch" value={formData.batch} onChange={handleChange} required className="form-control">
                          <option value="">-- Select Batch --</option>
                          <option value="KK_01">KK_01</option>
                          <option value="KK_02">KK_02</option>
                      </select>
                  </div>
                  <div className="form-group">
                      <label>Date</label>
                      <input type="date" name="class_date" value={formData.class_date} onChange={handleChange} required className="form-control" />
                  </div>
                </div>
              )}

              {/* Auto-filled Subject & Time Row */}
              {formData.type !== 'RELIEF' && (
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                    <div className="form-group">
                        <label>Subject {loading && <Loader size={14} className="spin"/>}</label>
                        <input 
                            type="text" 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleChange} 
                            placeholder={loading ? "Fetching..." : "e.g. English"}
                            className="form-control" 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Time</label>
                        <input type="time" name="class_time" value={formData.class_time} onChange={handleChange} required className="form-control" />
                    </div>
                  </div>
              )}

              {formData.type === 'SWAP' && (
                <div className="form-group">
                  <label>Select Tutor to Swap With</label>
                  <select name="target_id" value={formData.target_id} onChange={handleChange} required className="form-control">
                    <option value="">-- Select Tutor --</option>
                    {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                  <label>Reason</label>
                  <textarea name="reason" rows="3" placeholder="Explain why..." value={formData.reason} onChange={handleChange} className="form-control"></textarea>
              </div>
              
              <button type="submit" className="btn-submit">Submit Request</button>
            </form>
          )}

          {/* --- TAB: INCOMING --- */}
          {activeTab === 'incoming' && (
            <div>
              {incomingRequests.map(req => (
                <div key={req.id} className="card request-card">
                  <div>
                    <h4 style={{display:'flex', alignItems:'center', gap:'10px', margin:'0 0 5px 0'}}>
                        <RefreshCw size={18} color="#3b82f6"/> 
                        Swap Request from {req.requestor_name}
                    </h4>
                    <p style={{margin:0, color:'#64748b'}}>
                        <strong>{req.subject}</strong> ({req.batch}) on <strong>{req.class_date}</strong>
                    </p>
                    <p style={{fontStyle:'italic', color:'#475569', marginTop:'5px'}}>"{req.reason}"</p>
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => handleResponse(req.id, 'ACCEPT')} className="btn-success">Accept</button>
                    <button onClick={() => handleResponse(req.id, 'REJECT')} className="btn-danger">Reject</button>
                  </div>
                </div>
              ))}
              {incomingRequests.length === 0 && <p className="empty-state">No incoming requests pending your action.</p>}
            </div>
          )}

          {/* --- TAB: HISTORY --- */}
          {activeTab === 'history' && (
            <div className="history-list">
               {myHistory.map(req => (
                 <div key={req.id} className="card history-card">
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                     <strong style={{color:'#334155'}}>{req.request_type} - {req.subject}</strong>
                     <span className={`status-badge st-${req.status}`}>{req.status.replace('_', ' ')}</span>
                   </div>
                   <p style={{fontSize:'0.9rem', color:'#64748b', margin:0}}>
                     {req.request_type === 'SWAP' ? `Swap with: ${req.target_name || '...'}` : 'Request to Admin'}
                     <br/>
                     {req.batch} | {req.class_date}
                   </p>
                 </div>
               ))}
               {myHistory.length === 0 && <p className="empty-state">No history found.</p>}
            </div>
          )}

        </div>
      </div>

      {/* STYLES */}
      <style>{`
        /* Layout */
        .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .sidebar-container { width: 260px; flex-shrink: 0; background: #1f2937; }
        .content-container { flex-grow: 1; overflow-y: auto; }

        /* Tabs */
        .tabs-container { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; background: transparent; cursor: pointer; color: #64748b; font-weight: 600; border-radius: 6px; transition: 0.2s; }
        .tab-btn:hover { background: #e2e8f0; color: #334155; }
        .tab-btn.active { background: #eff6ff; color: #2563eb; }
        .badge { background: #ef4444; color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 10px; margin-left: 5px; }

        /* Forms */
        .form-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #334155; font-size: 0.9rem; }
        .form-control { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; }
        .form-control:focus { outline: none; border-color: #3b82f6; ring: 2px solid #3b82f6; }
        .btn-submit { background: #000000; color: white; padding: 12px; border: none; border-radius: 6px; width: 100%; cursor: pointer; font-weight: 600; margin-top: 10px; }
        .btn-submit:hover { background: #000000; }

        /* Cards */
        .card { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
        .request-card { display: flex; justify-content: space-between; align-items: center; }
        .btn-success { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        
        .empty-state { text-align: center; color: #94a3b8; padding: 20px; font-style: italic; }
        .spin { animation: spin 1s linear infinite; margin-left:5px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Status Badges */
        .status-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .st-PENDING_TUTOR { background: #fef9c3; color: #854d0e; }
        .st-PENDING_LEAD { background: #e0f2fe; color: #0369a1; }
        .st-APPROVED { background: #dcfce7; color: #15803d; }
        .st-REJECTED { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
};

export default TutorRequests;