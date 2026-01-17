import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadSidebar from './LeadSidebar';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';

const API_URL = "http://localhost:8081/lead/timetables";

const Timetables = () => {
  const [list, setList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Initial Form State
  const initialForm = {
    batch: "KK_01",
    day_of_week: "Monday",
    period_order: 1,
    time_slot: "06:00 PM - 07:30 PM",
    subject: "",
    teacher_name: "",
    type: "Class"
  };

  const [formData, setFormData] = useState(initialForm);

  // Fetch Data
  useEffect(() => { fetchTimetables(); }, []);

  const fetchTimetables = async () => {
    try {
      const res = await axios.get(API_URL);
      setList(res.data);
    } catch (err) { console.error("Error loading data", err); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Submit (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${currentId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      fetchTimetables();
      resetForm();
    } catch (err) { console.error("Error saving", err); }
  };

  // Load data into form for editing
  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      batch: item.batch,
      day_of_week: item.day_of_week,
      period_order: item.period_order,
      time_slot: item.time_slot,
      subject: item.subject,
      teacher_name: item.teacher_name,
      type: item.type
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this class?")) return;
    try { await axios.delete(`${API_URL}/${id}`); fetchTimetables(); } 
    catch (err) { console.error("Error deleting", err); }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialForm);
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-container">
        <LeadSidebar />
      </div>

      <div className="content-container">
        {/* --- STYLES --- */}
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #171f2e; }
          .content-container { flex-grow: 1; overflow-y: auto; }

          .timetable-wrapper { max-width: 1200px; margin: 0 auto; padding: 40px; }
          .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .main-title { font-size: 1.8rem; color: #0f172a; font-weight: 700; margin: 0; }

          /* Form Panel */
          .panel { background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 30px; }
          .form-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; display: flex; justify-content: space-between; }
          
          .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .span-2 { grid-column: span 2; }
          
          .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 8px; }
          .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem; }
          .form-group input:focus { outline: 2px solid #fcc419; border-color: transparent; }

          .btn-submit { background: #000000; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
          .btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }

          /* Table */
          .table-wrapper { overflow-x: auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 15px; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
          tr:last-child td { border-bottom: none; }
          tr:hover { background-color: #f8fafc; }

          .day-badge { padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; background: #e0f2fe; color: #0284c7; }
          .type-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          
          .action-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 4px; transition: background 0.2s; }
          .edit-btn { color: #2563eb; }
          .edit-btn:hover { background: #eff6ff; }
          .del-btn { color: #ef4444; }
          .del-btn:hover { background: #fef2f2; }
        `}</style>

        <div className="timetable-wrapper">
          <div className="header-flex">
            <h1 className="main-title">📅 Class Schedule Manager</h1>
          </div>

          {/* --- ADD / EDIT FORM --- */}
          <div className="panel">
            <div className="form-title">
              <span>{isEditing ? "✏️ Edit Class Entry" : "➕ Add New Class"}</span>
              {isEditing && <button onClick={resetForm} className="btn-cancel"><X size={16}/> Cancel</button>}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Batch Code</label>
                  <input name="batch" value={formData.batch} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                  <label>Day of Week</label>
                  <select name="day_of_week" value={formData.day_of_week} onChange={handleChange}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Period Order</label>
                  <input type="number" name="period_order" value={formData.period_order} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Class">Class</option>
                    <option value="Alumni Talk">Alumni Talk</option>
                    <option value="Test">Test</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Time Slot</label>
                  <input name="time_slot" value={formData.time_slot} onChange={handleChange} placeholder="e.g. 06:00 PM - 07:30 PM" required />
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input name="subject" value={formData.subject} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Teacher Name</label>
                  <input name="teacher_name" value={formData.teacher_name} onChange={handleChange} required />
                </div>
              </div>
              
              <div style={{marginTop: '20px', display:'flex', justifyContent:'flex-end'}}>
                <button type="submit" className="btn-submit">
                  {isEditing ? <Save size={18}/> : <Plus size={18}/>}
                  {isEditing ? "Update Schedule" : "Add to Schedule"}
                </button>
              </div>
            </form>
          </div>

          {/* --- DISPLAY TABLE --- */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Day</th>
                  <th>Slot</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Type</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.batch}</strong></td>
                    <td><span className="day-badge">{item.day_of_week}</span></td>
                    <td>
                        {item.time_slot}
                        <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>Period {item.period_order}</div>
                    </td>
                    <td style={{fontWeight:600, color:'#334155'}}>{item.subject}</td>
                    <td>{item.teacher_name}</td>
                    <td><span className="type-badge">{item.type}</span></td>
                    <td style={{textAlign:'right'}}>
                      <button onClick={() => handleEdit(item)} className="action-btn edit-btn" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="action-btn del-btn" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>
                      No timetable entries found. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Timetables;