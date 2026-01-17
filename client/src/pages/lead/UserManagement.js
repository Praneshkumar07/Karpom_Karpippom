import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadSidebar from './LeadSidebar';
import { UserPlus, Edit, Trash2, X, Save, Search, Upload, FileText } from 'lucide-react';

const API_URL = "http://localhost:8081/lead/manage-users";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const initialForm = {
    full_name: "",
    username: "",
    password: "12345", 
    role: "Student",
    status: "Active",
    batch: "",
    maatram_id: "",  // Only for Tutor
    parent_name: ""  // Only for Student
  };
  const [formData, setFormData] = useState(initialForm);

  // Fetch Data on Load
  useEffect(() => { fetchUsers(); }, []);

  // Filter Logic
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const results = users.filter(user => 
      user.full_name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      (user.batch && user.batch.toLowerCase().includes(term)) ||
      (user.maatram_id && user.maatram_id.toLowerCase().includes(term))
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) { console.error("Error loading users", err); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CSV IMPORT FUNCTIONS ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const parsedData = parseCSV(text);
      
      if(parsedData.length > 0) {
        if(window.confirm(`Ready to import ${parsedData.length} users?`)) {
            try {
                // Ensure your backend has the /import route defined
                const res = await axios.post(`${API_URL}/import`, parsedData); 
                alert(`Import Complete!\nSuccess: ${res.data.success}\nFailed/Duplicates: ${res.data.failed}`);
                fetchUsers(); 
            } catch (err) {
                console.error("Import error", err);
                alert("Error importing data. Check console for details.");
            }
        }
      } else {
        alert("CSV appears empty or has invalid headers.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase()); 
    const result = [];
    
    for(let i=1; i<lines.length; i++) {
        if(!lines[i].trim()) continue;
        const currentLine = lines[i].split(',');
        
        let obj = {};
        headers.forEach((header, index) => {
            let val = currentLine[index]?.trim();
            if(val && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            obj[header] = val || "";
        });

        if(obj.full_name && obj.username && obj.role) {
            result.push(obj);
        }
    }
    return result;
  };

  const downloadTemplate = () => {
      const csvContent = "data:text/csv;charset=utf-8,full_name,username,password,role,batch,parent_name,maatram_id\nJohn Student,jstudent,12345,Student,KK_01,Mr. Parent,\nJane Tutor,jtutor,12345,Tutor,KK_01,,MTR_TUT_01";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "user_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- MODAL & CRUD FUNCTIONS ---

  const openModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentId(user.id);
      setFormData({
        full_name: user.full_name,
        username: user.username,
        password: "",
        role: user.role,
        status: user.status,
        batch: user.batch || "",
        maatram_id: user.maatram_id || "",
        parent_name: user.parent_name || ""
      });
    } else {
      setIsEditing(false);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${currentId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { console.error("Error saving user", err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This will delete the user and their login access.")) return;
    try { await axios.delete(`${API_URL}/${id}`); fetchUsers(); } 
    catch (err) { console.error("Error deleting user", err); }
  };

  return (
    <div className="page-wrapper">
      <div className="sidebar-container">
        <LeadSidebar />
      </div>

      <div className="content-container">
        <style>{`
          .page-wrapper { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
          .sidebar-container { width: 260px; flex-shrink: 0; background: #171f2e; }
          .content-container { flex-grow: 1; overflow-y: auto; padding: 0; }
          
          .user-manage-wrapper { max-width: 1200px; margin: 0 auto; padding: 40px; }
          
          /* Header & Buttons */
          .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .page-title { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin: 0; }
          
          .btn-group { display: flex; gap: 10px; }
          
          .btn-primary { background: #000000; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
          .btn-primary:hover { background: #1d4ed8; }

          .btn-secondary { background: white; color: #475569; padding: 10px 15px; border-radius: 8px; font-weight: 600; border: 1px solid #cbd5e1; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
          .btn-secondary:hover { background: #f8fafc; color: #1e293b; }

          /* Search Bar */
          .search-bar { display: flex; align-items: center; background: white; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; width: 300px; }
          .search-bar input { border: none; outline: none; margin-left: 10px; width: 100%; color: #334155; }

          /* Table Styles */
          .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 16px; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; vertical-align: middle; }
          
          .role-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
          .role-student { background: #dbeafe; color: #1e40af; }
          .role-tutor { background: #f3e8ff; color: #6b21a8; }
          
          .batch-tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; color: #475569; border: 1px solid #e2e8f0; }
          .info-block { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
          
          .status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
          .st-active { background: #22c55e; }
          .st-pending { background: #f59e0b; }
          
          .action-btn { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 6px; color: #64748b; transition: all 0.2s; }
          .action-btn:hover { background: #f1f5f9; color: #0f172a; }
          
          /* Modal Styles */
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
          .modal-content { background: white; width: 500px; border-radius: 12px; padding: 30px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: popIn 0.2s ease-out; }
          .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
          .form-group { margin-bottom: 15px; }
          .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
          .form-control { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; }
          .form-control:focus { outline: 2px solid #2563eb; border-color: transparent; }
          .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
          .btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
          
          @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

        <div className="user-manage-wrapper">
          
          {/* Header Row */}
          <div className="header-row">
            <div>
              <h1 className="page-title">User Management</h1>
              <p style={{color:'#64748b', margin:'5px 0 0'}}>Manage Tutor and Student profiles</p>
            </div>
            
            <div className="btn-group">
                {/* Template Download */}
                <button className="btn-secondary" onClick={downloadTemplate} title="Download CSV Template">
                    <FileText size={18} /> Template
                </button>

                {/* Import CSV */}
                <input 
                    type="file" 
                    id="csvInput" 
                    accept=".csv" 
                    style={{display:'none'}} 
                    onChange={handleFileUpload} 
                />
                <label htmlFor="csvInput" className="btn-secondary" style={{cursor:'pointer'}}>
                    <Upload size={18} /> Import CSV
                </label>

                {/* Add User */}
                <button className="btn-primary" onClick={() => openModal()}>
                  <UserPlus size={18} /> Add User
                </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{marginBottom: '20px', display:'flex', justifyContent:'flex-end'}}>
             <div className="search-bar">
               <Search size={18} color="#94a3b8" />
               <input 
                 type="text" 
                 placeholder="Search name, ID, or batch..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
          </div>

          {/* Table */}
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Full Name / Info</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{fontWeight: 600}}>{user.full_name}</div>
                      {/* Conditional Display: Parent Name OR Maatram ID */}
                      {user.role === 'Student' && user.parent_name && (
                        <div className="info-block">Parent: {user.parent_name}</div>
                      )}
                      {user.role === 'Tutor' && user.maatram_id && (
                        <div className="info-block" style={{color:'#6b21a8'}}>ID: {user.maatram_id}</div>
                      )}
                    </td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge ${user.role === 'Student' ? 'role-student' : 'role-tutor'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                        {user.batch ? <span className="batch-tag">{user.batch}</span> : <span style={{color:'#cbd5e1'}}>-</span>}
                    </td>
                    <td>
                      <span className={`status-dot ${user.status === 'Active' ? 'st-active' : 'st-pending'}`}></span>
                      {user.status}
                    </td>
                    <td style={{textAlign:'right'}}>
                      <button className="action-btn" onClick={() => openModal(user)} title="Edit"><Edit size={18} /></button>
                      <button className="action-btn" onClick={() => handleDelete(user.id)} title="Delete" style={{color:'#ef4444'}}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                    <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL FORM --- */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{margin:0}}>{isEditing ? "Edit User" : "Add New User"}</h3>
                <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}>
                    <X size={24} color="#64748b" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input className="form-control" name="username" value={formData.username} onChange={handleChange} required />
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                    <div className="form-group">
                        <label>Role</label>
                        <select className="form-control" name="role" value={formData.role} onChange={handleChange}>
                            <option value="Student">Student</option>
                            <option value="Tutor">Tutor</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Common Field: Batch */}
                <div className="form-group">
                  <label>Batch</label>
                  <input className="form-control" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g. KK_01" required />
                </div>

                {/* Conditional Field: Parent Name (Student Only) */}
                {formData.role === 'Student' && (
                  <div className="form-group" style={{background:'#f0f9ff', padding:'10px', borderRadius:'6px', border:'1px solid #bae6fd'}}>
                    <label style={{color:'#0369a1'}}>Parent Name</label>
                    <input className="form-control" name="parent_name" value={formData.parent_name} onChange={handleChange} placeholder="Mr. Parent Name" />
                  </div>
                )}

                {/* Conditional Field: Maatram ID (Tutor Only) */}
                {formData.role === 'Tutor' && (
                  <div className="form-group" style={{background:'#fdf4ff', padding:'10px', borderRadius:'6px', border:'1px solid #e879f9'}}>
                    <label style={{color:'#a21caf'}}>Maatram ID</label>
                    <input className="form-control" name="maatram_id" value={formData.maatram_id} onChange={handleChange} placeholder="e.g. MTR_TUT_01" />
                  </div>
                )}

                {!isEditing && (
                  <div className="form-group">
                    <label>Password</label>
                    <input className="form-control" name="password" value={formData.password} onChange={handleChange} placeholder="Default: 12345" />
                  </div>
                )}
                
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-primary"><Save size={18}/> Save User</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;