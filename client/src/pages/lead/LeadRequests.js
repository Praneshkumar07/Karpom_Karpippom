import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadSidebar from "./LeadSidebar";
import { 
  Check, X, Clock, User, Calendar, 
  Filter, Ban, ArrowRightLeft, FileText, 
  Search, Info 
} from "lucide-react";

const API_URL = "http://localhost:8081";

// --- Internal Components ---

// 1. Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <Check size={18} /> : <Info size={18} />}
      <span>{message}</span>
    </div>
  );
};

// 2. Skeleton Loader for smoother waiting experience
const SkeletonCard = () => (
  <div className="request-card skeleton-card">
    <div className="skeleton-header"></div>
    <div className="skeleton-body">
      <div className="skeleton-line w-75"></div>
      <div className="skeleton-line w-50"></div>
      <div className="skeleton-box"></div>
    </div>
  </div>
);

const LeadRequests = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [filterType, setFilterType] = useState("ALL"); // ALL, SWAP, CANCEL, RELIEF
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    activeTab === "pending" ? fetchPending() : fetchHistory();
  }, [activeTab]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/lead/pending`);
      setRequests(res.data);
    } catch (err) { 
      console.error(err);
      showToast("Failed to load requests", "error");
    } finally { 
      setTimeout(() => setLoading(false), 500); // Small delay to prevent flicker
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/lead/history`);
      setHistory(res.data);
    } catch (err) { 
      console.error(err);
      showToast("Failed to load history", "error");
    } finally { 
      setLoading(false); 
    }
  };

  const handleDecision = async (req, action) => {
    // Native confirm is still safest, but we phrase it clearly
    if (!window.confirm(`Are you sure you want to ${action} this request from ${req.requestor_name}?`)) return;

    try {
      await axios.put(`${API_URL}/lead/action/${req.id}`, { action });
      showToast(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`, "success");
      fetchPending(); 
    } catch (err) { 
      showToast("Action failed. Please try again.", "error");
    }
  };

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  // Filter Logic
  const filteredRequests = requests.filter(r => filterType === "ALL" || r.request_type === filterType);
  const filteredHistory = history.filter(h => filterType === "ALL" || h.request_type === filterType);

  return (
    <div className="dashboard-wrapper">
      <LeadSidebar />

      <main className="main-content">
        <div className="container">
          
          {/* Top Navigation Bar */}
          <div className="top-nav">
            <h1 className="page-title">Approvals</h1>
            
            <div className="controls">
               {/* Type Filter */}
               <div className="filter-dropdown">
                  <Filter size={14} className="filter-icon"/>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SWAP">Swaps</option>
                    <option value="CANCEL">Cancellations</option>
                    <option value="RELIEF">Relief</option>
                  </select>
               </div>

              {/* View Tabs */}
              <div className="tab-segment">
                <button 
                  className={`segment-btn ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending
                  {requests.length > 0 && <span className="counter-badge">{requests.length}</span>}
                </button>
                <button 
                  className={`segment-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>
            </div>
          </div>

          {/* === NOTIFICATIONS === */}
          {toast && (
            <div className="toast-container">
              <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            </div>
          )}

          {/* === PENDING VIEW === */}
          {activeTab === "pending" && (
            <div className="content-area">
              {loading ? (
                <div className="card-grid">
                  <SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
              ) : (
                <>
                  <div className="card-grid">
                    {filteredRequests.map((req) => (
                      <div key={req.id} className="request-card">
                        <div className="card-status-strip" data-type={req.request_type}></div>
                        
                        <div className="card-content">
                          <div className="card-top">
                            <div>
                                <h3 className="user-name">{req.requestor_name}</h3>
                                <div className="request-badge">
                                    {req.request_type}
                                </div>
                            </div>
                            <div className="date-badge">
                                {formatDate(req.class_date)}
                            </div>
                          </div>

                          <div className="info-grid">
                            {req.request_type === "SWAP" && (
                                <div className="info-item full-width">
                                    <span className="label">Swap Target</span>
                                    <span className="value">{req.target_name}</span>
                                </div>
                            )}
                            {req.request_type !== "RELIEF" && (
                                <div className="info-item">
                                    <span className="label">Class Time</span>
                                    <span className="value">{req.class_time}</span>
                                </div>
                            )}
                             <div className="info-item">
                                <span className="label">Batch</span>
                                <span className="value">{req.batch}</span>
                            </div>
                          </div>

                          <div className="reason-bubble">
                             "{req.reason}"
                          </div>

                          <div className="action-buttons">
                            <button 
                              onClick={() => handleDecision(req, "REJECT")} 
                              className="btn-text reject"
                              title="Deny this request"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleDecision(req, "APPROVE")} 
                              className="btn-solid approve"
                              title="Approve this request"
                            >
                              <Check size={16} /> Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredRequests.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-img">🎉</div>
                      <h3>No pending requests</h3>
                      <p>You are all caught up! Check History to see past actions.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* === HISTORY VIEW === */}
          {activeTab === "history" && (
            <div className="table-container">
              {loading ? <div className="loading-spinner">Loading history...</div> : (
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Request Type</th>
                      <th>Requestor</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(item => (
                      <tr key={item.id}>
                        <td>
                            <span className={`pill-type ${item.request_type}`}>{item.request_type}</span>
                        </td>
                        <td className="font-strong">{item.requestor_name}</td>
                        <td className="text-light">
                          {item.request_type === 'SWAP' ? `Swap with ${item.target_name}` : item.subject}
                        </td>
                        <td>{formatDate(item.class_date)}</td>
                        <td>
                          <span className={`status-dot ${item.status}`}></span>
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!loading && filteredHistory.length === 0 && (
                 <div className="empty-state">
                    <h3>No history found</h3>
                    <p>Try changing your filters or check back later.</p>
                 </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* USER FRIENDLY CSS */}
      <style>{`
        :root {
            --bg-app: #f8f9fa;
            --primary: #2563eb;
            --text-dark: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --danger: #ef4444;
            --swap-color: #8b5cf6;
            --cancel-color: #f59e0b;
        }

        .dashboard-wrapper { display: flex; height: 100vh; background: var(--bg-app); font-family: 'Inter', sans-serif; }
        .main-content { flex: 1; overflow-y: auto; padding: 2rem; }
        .container { max-width: 1000px; margin: 0 auto; }

        /* Top Nav */
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.5rem; color: var(--text-dark); margin: 0; font-weight: 700; }
        
        .controls { display: flex; gap: 1rem; align-items: center; }
        
        /* Filter Dropdown */
        .filter-dropdown { position: relative; display: flex; align-items: center; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; }
        .filter-icon { color: var(--text-light); margin-right: 5px; }
        .filter-select { border: none; outline: none; padding: 8px; font-size: 0.9rem; color: var(--text-dark); background: transparent; cursor: pointer; }

        /* Tabs */
        .tab-segment { background: #e2e8f0; padding: 4px; border-radius: 8px; display: flex; }
        .segment-btn { padding: 6px 14px; border: none; background: transparent; cursor: pointer; border-radius: 6px; font-weight: 500; color: var(--text-light); transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .segment-btn.active { background: white; color: var(--text-dark); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .counter-badge { background: var(--danger); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; }

        /* Cards Grid */
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        
        .request-card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 2px 5px rgba(0,0,0,0.03); transition: transform 0.2s; display: flex; flex-direction: column; }
        .request-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); }

        .card-status-strip { height: 6px; width: 100%; }
        .card-status-strip[data-type="SWAP"] { background: var(--swap-color); }
        .card-status-strip[data-type="CANCEL"] { background: var(--cancel-color); }
        .card-status-strip[data-type="RELIEF"] { background: var(--danger); }

        .card-content { padding: 20px; flex-grow: 1; display: flex; flex-direction: column; }
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .user-name { margin: 0; font-size: 1.1rem; color: var(--text-dark); }
        .request-badge { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px; }
        .date-badge { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; color: var(--text-dark); }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .info-item { background: #f8fafc; padding: 8px; border-radius: 6px; }
        .info-item.full-width { grid-column: 1 / -1; background: #eff6ff; }
        .label { display: block; font-size: 0.7rem; color: var(--text-light); text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 0.9rem; font-weight: 600; color: var(--text-dark); }

        .reason-bubble { font-style: italic; color: var(--text-light); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5; }

        .action-buttons { margin-top: auto; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border); padding-top: 15px; }
        .btn-text { background: none; border: none; color: var(--text-light); font-weight: 600; cursor: pointer; padding: 8px 12px; border-radius: 6px; transition: 0.2s; }
        .btn-text:hover { background: #fee2e2; color: var(--danger); }
        
        .btn-solid { background: var(--text-dark); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-solid:hover { background: var(--primary); transform: translateY(-1px); }

        /* Table */
        .table-container { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
        .clean-table { width: 100%; border-collapse: collapse; text-align: left; }
        .clean-table th { background: #f8fafc; padding: 16px; color: var(--text-light); font-weight: 600; font-size: 0.85rem; }
        .clean-table td { padding: 16px; border-top: 1px solid var(--border); color: var(--text-dark); }
        
        .pill-type { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: white; }
        .pill-type.SWAP { background: var(--swap-color); }
        .pill-type.CANCEL { background: var(--cancel-color); }
        .pill-type.RELIEF { background: var(--danger); }

        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .status-dot.APPROVED { background: var(--success); }
        .status-dot.REJECTED { background: var(--danger); }

        /* Toast */
        .toast-container { position: fixed; bottom: 30px; right: 30px; z-index: 1000; animation: slideIn 0.3s ease-out; }
        .toast { background: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 12px; font-weight: 500; border-left: 4px solid; }
        .toast-success { border-color: var(--success); color: #064e3b; }
        .toast-error { border-color: var(--danger); color: #7f1d1d; }

        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Skeleton */
        .skeleton-card { height: 250px; background: white; }
        .skeleton-header { height: 6px; background: #e2e8f0; width: 100%; }
        .skeleton-body { padding: 20px; }
        .skeleton-line { height: 20px; background: #f1f5f9; margin-bottom: 15px; border-radius: 4px; }
        .skeleton-box { height: 80px; background: #f1f5f9; border-radius: 6px; margin-top: 20px; }
        .w-75 { width: 75%; }
        .w-50 { width: 50%; }

        /* Empty State */
        .empty-state { text-align: center; padding: 60px 20px; color: var(--text-light); }
        .empty-img { font-size: 3rem; margin-bottom: 10px; }
        .empty-state h3 { color: var(--text-dark); margin: 0 0 5px; }

      `}</style>
    </div>
  );
};

export default LeadRequests;