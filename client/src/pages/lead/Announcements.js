import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadSidebar from './LeadSidebar'; 

const API_URL = "http://localhost:8081/lead/announcements";

const Announcements = () => {
  const [list, setList] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "", content: "", type: "Notice", subject: "",
    event_date_time: "", link: "", priority: "Normal", target_batch: "All",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      setList(res.data);
    } catch (err) { console.error("Error loading data", err); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      fetchData();
      setFormData({
        title: "", content: "", type: "Notice", subject: "",
        event_date_time: "", link: "", priority: "Normal", target_batch: "All"
      });
    } catch (err) { console.error("Error adding", err); }
  };

  const handleRemove = async (id) => {
    if(!window.confirm("Delete this announcement?")) return;
    try { await axios.delete(`${API_URL}/${id}`); fetchData(); } 
    catch (err) { console.error("Error deleting", err); }
  };

  return (
    <div className="page-wrapper">
      
      {/* Sidebar */}
      <div className="sidebar-container">
        <LeadSidebar />
      </div>

      {/* Main Content */}
      <div className="content-container">
        
        <style>{`
          /* --- GLOBAL LAYOUT --- */
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; overflow: hidden; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; height: 100%; color: #e2e8f0; }
          .content-container { flex-grow: 1; overflow-y: auto; }

          /* Sidebar Active State Update (Yellow) */
          .menu-item.active { background-color: #1e293b; color: #f1d85b; border-left: 3px solid #facc15; }

          /* --- PAGE SPECIFIC STYLES --- */
          .announcement-wrapper { max-width: 1200px; margin: 0 auto; padding: 40px 60px; }
          
          /* Header */
          .header-section { margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
          .main-title { color: #1e293b; font-size: 1.5rem; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .sub-title { color: #64748b; font-size: 0.9rem; margin-top: 5px; }

          /* Panels */
          .panel { background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); margin-bottom: 25px; overflow: hidden; }
          
          /* UPDATED: Panel Header to look like a Title */
          .panel-header { 
            padding: 20px 25px; 
            background: #fff; /* Clean white background */
            border-bottom: 1px solid #f1f5f9; 
            font-size: 1.25rem; /* Larger font */
            font-weight: 700; /* Bolder */
            color: #0f172a; 
            display: flex; align-items: center; gap: 8px; 
          }
          .panel-body { padding: 25px; }

          /* Form Elements */
          .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .span-2 { grid-column: span 2; }
          .span-3 { grid-column: span 3; }
          
          .form-group { display: flex; flex-direction: column; }
          .form-group label { font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; }
          
          input, select, textarea { 
            padding: 10px 12px; 
            border: 1px solid #cbd5e1; 
            border-radius: 6px; 
            font-size: 0.9rem; 
            color: #334155; 
            background: #fff;
            transition: border-color 0.15s ease;
          }
          
          /* UPDATED: Focus Color to Yellow (#facc15) */
          input:focus, select:focus, textarea:focus { 
            border-color: #342b05; 
            outline: none; 
            box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2); 
          }
          ::placeholder { color: #94a3b8; }

          /* UPDATED: Publish Button (Yellow Background) */
          .btn-add { 
            background-color: #0e0b01; /* The requested Yellow */
            color: #e8eaf0; /* Dark text for readability on yellow */
            padding: 12px; 
            border: none; 
            border-radius: 6px; 
            font-weight: 600; 
            font-size: 0.9rem;
            cursor: pointer; 
            transition: background 0.2s; 
            width: 100%;
          }
          .btn-add:hover { background-color: #181301; } /* Slightly darker yellow on hover */

          /* Table Styles */
          .table-wrapper { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          
          th { 
            padding: 12px 20px; 
            background-color: #ffffff; 
            color: #64748b; 
            font-size: 0.75rem; 
            font-weight: 700; 
            text-transform: uppercase; 
            border-bottom: 2px solid #f1f5f9; 
          }
          td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #334155; font-size: 0.9rem; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background-color: #fffbeb; } /* Very subtle yellow tint on row hover */

          /* Item Styling */
          .item-title { font-weight: 600; color: #0f172a; font-size: 0.95rem; margin-bottom: 4px; }
          .item-content { color: #64748b; font-size: 0.85rem; line-height: 1.5; margin-bottom: 8px; max-width: 500px; }
          
          /* Badges */
          .badge { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.7rem; 
            font-weight: 600; 
            border: 1px solid #e2e8f0;
            background: #fff;
            color: #475569;
            margin-right: 8px;
            text-transform: uppercase;
          }
          .badge-Notice { border-color: #cbd5e1; color: #475569; }
          /* Updated Class badge to match yellow theme subtly */
          .badge-Class { border-color: #f0ede2; color: #854d0e; background: #fefce8; }
          .badge-Event { border-color: #bbf7d0; color: #166534; background: #f0fdf4; }
          .badge-Talk { border-color: #e9d5ff; color: #7e22ce; background: #faf5ff; }

          .subject-text { font-size: 0.75rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

          /* Link Button */
          .link-action { 
            color: #252422; /* Darker yellow/gold for readability */
            font-size: 0.8rem; 
            text-decoration: none; 
            font-weight: 600; 
            display: inline-flex; 
            align-items: center; 
            margin-top: 4px; 
          }
          .link-action:hover { text-decoration: underline; color: #a16207; }

          /* Priority & Meta */
          .meta-date { display: flex; align-items: center; gap: 6px; color: #334155; font-weight: 500; }
          .meta-sub { color: #94a3b8; font-size: 0.75rem; margin-top: 4px; }

          .status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
          .p-High { color: #dc2626; font-weight: 600; font-size: 0.85rem; }
          .dot-High { background-color: #dc2626; }
          
          /* UPDATED: Normal Priority to Green */
          .p-Normal { color: #15803d; font-size: 0.85rem; font-weight: 500; }
          .dot-Normal { background-color: #22c55e; } /* Green Dot */

          /* UPDATED: Remove Button */
          .btn-text-remove { 
            background: #fff; 
            border: 1px solid #fecaca; 
            color: #ef4444; 
            padding: 6px 12px;
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.2s;
          }
          .btn-text-remove:hover { 
            background: #fee2e2; 
            border-color: #ef4444;
          }

        `}</style>

        <div className="announcement-wrapper">
          
          <div className="header-section">
            <h1 className="main-title">Announcements</h1>
            <div className="sub-title">Manage class updates, notices, and events.</div>
          </div>

          {/* --- INPUT FORM --- */}
          <div className="panel">
            {/* Title Look Updated */}
            <div className="panel-header">
              <span>Create New Announcement</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group span-2">
                  <label>Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} required placeholder="Title of the announcement" />
                </div>
                
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Notice">Notice</option>
                    <option value="Class">Class</option>
                    <option value="Talk">Talk</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g. Physics" />
                </div>

                <div className="form-group">
                  <label>Target Batch</label>
                  <input name="target_batch" value={formData.target_batch} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Event Date/Time (Optional)</label>
                  <input type="datetime-local" name="event_date_time" value={formData.event_date_time} onChange={handleChange} />
                </div>

                <div className="form-group span-2">
                  <label>External Link (Optional)</label>
                  <input name="link" value={formData.link} onChange={handleChange} placeholder="https://" />
                </div>

                <div className="form-group span-3">
                  <label>Content</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} required rows="2" placeholder="Write your message here..." />
                </div>

                <div className="span-3">
                  <button type="submit" className="btn-add">Publish Announcement</button>
                </div>
              </form>
            </div>
          </div>

          {/* --- DISPLAY TABLE --- */}
          <div className="panel">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{width: '45%'}}>Announcement</th>
                    <th>Target</th>
                    <th>Event Details</th>
                    <th>Priority</th>
                    <th style={{textAlign: 'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{marginBottom: '4px'}}>
                          <span className={`badge badge-${item.type}`}>{item.type}</span>
                          {item.subject && <span className="subject-text">{item.subject}</span>}
                        </div>
                        <div className="item-title">{item.title}</div>
                        <div className="item-content">{item.content}</div>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="link-action">
                             Visit Link &rarr;
                          </a>
                        )}
                      </td>
                      <td>
                        <div style={{fontWeight: 600, color: '#334155'}}>{item.target_batch}</div>
                        <div className="meta-sub">ID: #{item.id}</div>
                      </td>
                      <td>
                        {item.event_date_time ? (
                          <>
                            <div className="meta-date">
                               {new Date(item.event_date_time).toLocaleDateString()}
                            </div>
                            <div className="meta-sub">
                               {new Date(item.event_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </>
                        ) : (
                          <span style={{color:'#cbd5e1'}}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        <div className={`p-${item.priority}`}>
                            <span className={`status-dot dot-${item.priority}`}></span>
                            {item.priority}
                        </div>
                      </td>
                      <td style={{textAlign: 'right'}}>
                        {/* CHANGED: "X" Icon to "Remove" Text Button */}
                        <button onClick={() => handleRemove(item.id)} className="btn-text-remove">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
                        No active announcements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Announcements;