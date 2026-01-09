import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, BookOpen, Clock, Eye, FileText } from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar';

const AssignmentManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 1. GET TUTOR ID FROM LOCAL STORAGE
  const tutorId = localStorage.getItem('userId');

  // New Assignment State (Subject is removed, backend handles it)
  const [newAssign, setNewAssign] = useState({ 
    title: '', 
    description: '', 
    due_date: '' 
  });

  // Load Assignments on Mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = () => {
    if (!tutorId) return console.error("No Tutor ID found in localStorage");

    // Pass tutor_id in the URL
    axios.get(`http://localhost:8081/tutor/assignments?batch=KK_01&tutor_id=${tutorId}`)
      .then(res => setAssignments(res.data))
      .catch(err => console.error("Error fetching assignments:", err));
  };

  const handleSelectAssignment = (assign) => {
    setSelectedAssignment(assign);
    setShowCreateForm(false);
    // Fetch Submissions
    axios.get(`http://localhost:8081/tutor/assignments/${assign.id}/submissions`)
      .then(res => setSubmissions(res.data))
      .catch(err => console.error(err));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if(!newAssign.title || !newAssign.due_date) return alert("Title and Date required");
    if(!tutorId) return alert("Error: You are not logged in (Missing ID).");

    // Prepare payload with tutor_id
    const payload = { 
      ...newAssign, 
      batch: 'KK_01',
      tutor_id: tutorId // Send ID to backend
    };

    axios.post('http://localhost:8081/tutor/assignments/create', payload)
      .then(() => {
        alert("Assignment Created Successfully!");
        setShowCreateForm(false);
        fetchAssignments();
        setNewAssign({ title: '', description: '', due_date: '' });
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.message || "Error creating assignment");
      });
  };

  const handleGrade = (id, marks, remarks) => {
    axios.post('http://localhost:8081/tutor/assignments/grade', { submission_id: id, marks, remarks })
      .then(() => {
        setSubmissions(prev => prev.map(s => 
          s.id === id ? { ...s, marks_obtained: marks, remarks: remarks, status: 'Graded' } : s
        ));
      })
      .catch(err => alert("Error saving grades"));
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-container"><TutorSidebar /></div>
      
      <div className="content-container">
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #0f172a; }
          .content-container { flex-grow: 1; padding: 30px; display: flex; gap: 20px; }
          .left-panel { width: 350px; background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; height: 90vh; }
          .right-panel { flex-grow: 1; background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0; height: 90vh; overflow-y: auto; }
          .assign-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; }
          .assign-card:hover { border-color: #3b82f6; background: #eff6ff; }
          .assign-card.active { background: #eff6ff; border-color: #3b82f6; border-left: 4px solid #3b82f6; }
          .btn-primary { width: 100%; padding: 10px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; font-weight: 600; }
          .inp { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
          .Pending { background: #fff7ed; color: #c2410c; }
          .Submitted { background: #eff6ff; color: #1e40af; }
          .Graded { background: #f0fdf4; color: #15803d; }
          .save-link { color: #2563eb; font-weight: 600; cursor: pointer; text-decoration: underline; border: none; background: none; }
          .view-btn { border: 1px solid #cbd5e1; background: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #475569; transition: 0.2s; }
          .view-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
        `}</style>

        {/* LEFT: LIST */}
        <div className="left-panel">
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={18} /> New Assignment
          </button>
          <div style={{overflowY: 'auto'}}>
            {assignments.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8'}}>No assignments found.</p> : 
              assignments.map(a => (
                <div key={a.id} className={`assign-card ${selectedAssignment?.id === a.id ? 'active' : ''}`} onClick={() => handleSelectAssignment(a)}>
                  <h4 style={{margin:'0 0 5px 0'}}>{a.title}</h4>
                  <div style={{fontSize:'0.8rem', color:'#64748b', display:'flex', justifyContent:'space-between'}}>
                    <span>{a.subject}</span>
                    <span>{a.due_date ? a.due_date.split('T')[0] : 'No Date'}</span>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="right-panel">
          {showCreateForm ? (
            <div style={{maxWidth: '500px'}}>
              <h2>Create New Assignment</h2>
              <div style={{background: '#f0f9ff', padding: '10px', borderRadius: '6px', border: '1px solid #bae6fd', marginBottom: '15px', fontSize: '0.9rem', color: '#0369a1'}}>
                 <strong>Note:</strong> This assignment will be automatically created under your subject.
              </div>
              <form onSubmit={handleCreate}>
                <label>Title</label> 
                <input className="inp" required value={newAssign.title} onChange={e=>setNewAssign({...newAssign, title: e.target.value})} />
                <label>Due Date</label> 
                <input type="date" className="inp" required value={newAssign.due_date} onChange={e=>setNewAssign({...newAssign, due_date: e.target.value})} />
                <label>Description</label> 
                <textarea className="inp" rows="4" value={newAssign.description} onChange={e=>setNewAssign({...newAssign, description: e.target.value})} />
                <button type="submit" className="btn-primary">Publish Assignment</button>
              </form>
            </div>
          ) : selectedAssignment ? (
            <div>
              <div style={{borderBottom:'1px solid #e2e8f0', paddingBottom:'20px'}}>
                <h2 style={{margin:0}}>{selectedAssignment.title}</h2>
                <p style={{color:'#64748b'}}>{selectedAssignment.description}</p>
                <div style={{display:'flex', gap:'20px', fontSize:'0.9rem', marginTop:'10px'}}>
                   <span style={{display:'flex', alignItems:'center', gap:'5px'}}><BookOpen size={16}/> {selectedAssignment.subject}</span>
                   <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Clock size={16}/> Due: {selectedAssignment.due_date.split('T')[0]}</span>
                </div>
              </div>
              <h3>Student Submissions</h3>
              <table>
                <thead>
                  <tr><th>Student</th><th>Status</th><th>File</th><th>Marks</th><th>Remarks</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id}>
                      <td style={{fontWeight:500}}>{sub.full_name}</td>
                      <td><span className={`badge ${sub.status}`}>{sub.status}</span></td>
                      <td>
                        {sub.file_path ? (
                           <button className="view-btn" onClick={() => window.open(`http://localhost:8081/uploads/${sub.file_path}`, '_blank')}>
                              <Eye size={16} color="#2563eb" /> PDF
                           </button>
                        ) : <span style={{color:'#94a3b8', fontSize:'0.85rem', display:'flex', gap:'5px'}}><FileText size={16}/> No File</span>}
                      </td>
                      <td><input id={`m-${sub.id}`} type="number" defaultValue={sub.marks_obtained} style={{width:'60px', padding:'5px', border:'1px solid #cbd5e1', borderRadius:'4px'}} /></td>
                      <td><input id={`r-${sub.id}`} type="text" defaultValue={sub.remarks} placeholder="Remarks..." style={{width:'100%', padding:'5px', border:'1px solid #cbd5e1', borderRadius:'4px'}} /></td>
                      <td>
                        <button className="save-link" onClick={() => {
                             const m = document.getElementById(`m-${sub.id}`).value;
                             const r = document.getElementById(`r-${sub.id}`).value;
                             handleGrade(sub.id, m, r);
                          }}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8'}}>Select an assignment to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentManager;