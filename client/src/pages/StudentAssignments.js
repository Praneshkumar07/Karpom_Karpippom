import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, FileText, Upload, Eye, AlertCircle } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';

const useAuth = () => {
  return { currentUser: { id: 4, username: 'Student User' } };
};

const StudentAssignments = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [uploading, setUploading] = useState(null); // Track which ID is uploading
  
  // Ref to trigger hidden file input
  const fileInputRef = useRef(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  const fetchAssignments = () => {
    const userId = currentUser?.id || 4;
    axios.get(`http://localhost:8081/student/assignments/${userId}`)
      .then(res => setAssignments(res.data))
      .catch(err => console.error("Error fetching assignments", err));
  };

  // 1. Trigger File Selection
  const handleSelectFile = (submissionId) => {
    setSelectedSubmissionId(submissionId);
    fileInputRef.current.click();
  };

  // 2. Handle File Change & Upload Immediately
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Only PDF files are allowed!");
      return;
    }

    // Prepare Form Data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('submission_id', selectedSubmissionId);

    setUploading(selectedSubmissionId);

    // Send to Backend
    try {
        const res = await axios.post('http://localhost:8081/student/assignment/submit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if(res.data.Status === "Success") {
            alert("Assignment Submitted Successfully!");
            fetchAssignments();
        }
    } catch (err) {
        console.error(err);
        alert("Upload Failed. Please try again.");
    } finally {
        setUploading(null);
        e.target.value = null; // Reset input
    }
  };

  // 3. View PDF
  const handleViewFile = (filename) => {
      // Assuming your backend serves static files at /uploads
      window.open(`http://localhost:8081/uploads/${filename}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      <StudentSidebar />
      
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>My Assignments</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Upload your work in PDF format.</p>

        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="application/pdf"
            onChange={handleFileChange}
        />

        <div style={{ display: 'grid', gap: '20px' }}>
          {assignments.map((task, index) => (
            <div key={index} style={{ 
                backgroundColor: 'white', 
                padding: '24px', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: task.status === 'Pending' ? '5px solid #f59e0b' : '5px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Left: Task Details */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ backgroundColor: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' }}>
                            {task.subject}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14}/> Due: {task.due_date ? task.due_date.split('T')[0] : 'N/A'}
                        </span>
                    </div>
                    <h3 style={{ margin: '5px 0', color: '#1e293b' }}>{task.title}</h3>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', maxWidth:'600px' }}>{task.description}</p>
                </div>

                {/* Right: Actions */}
                <div style={{minWidth: '150px', display:'flex', justifyContent:'flex-end'}}>
                    {task.status === 'Pending' ? (
                        <button 
                            onClick={() => handleSelectFile(task.submission_id)}
                            disabled={uploading === task.submission_id}
                            style={{ 
                                backgroundColor: '#2563eb', color: 'white', border: 'none', 
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
                                opacity: uploading === task.submission_id ? 0.7 : 1
                            }}
                        >
                            {uploading === task.submission_id ? 'Uploading...' : <><Upload size={18} /> Upload PDF</>}
                        </button>
                    ) : (
                        <div style={{textAlign: 'right'}}>
                            <div style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', justifyContent:'flex-end', marginBottom:'8px' }}>
                                <CheckCircle size={20} /> Submitted
                            </div>
                            
                            {/* View File Button */}
                            {task.file_path && (
                                <button 
                                    onClick={() => handleViewFile(task.file_path)}
                                    style={{ 
                                        background: 'transparent', border: '1px solid #cbd5e1', 
                                        padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                        color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <Eye size={16} /> View File
                                </button>
                            )}

                            {task.remarks && (
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', background: '#f8fafc', padding: '8px', borderRadius: '4px' }}>
                                    <strong>Tutor:</strong> "{task.remarks}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          ))}

          {assignments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FileText size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p>No assignments found.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;