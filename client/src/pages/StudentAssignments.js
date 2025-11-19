import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, FileText, Upload, LayoutDashboard, CheckSquare, Calendar, BookOpen, User, LogOut } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
const useAuth = () => {
  // Simulate logged in student
  return { currentUser: { id: 4, username: 'Student User' } };
};
// ----------------------------------------------------------------

const StudentAssignments = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  const fetchAssignments = () => {
    const userId = currentUser?.id || 4;
    
    axios.get(`http://localhost:8081/student/assignments/${userId}`)
      .then(res => setAssignments(res.data))
      .catch(err => {
          console.log("Backend error or offline, showing dummy data");
          // Dummy data for preview
          setAssignments([
             { id: 1, subject: 'Maths', title: 'Algebra Exercise 5.1', description: 'Complete all even numbers.', due_date: '2025-11-25', status: 'Pending' },
             { id: 2, subject: 'Physics', title: 'Newton Laws', description: 'Write a summary.', due_date: '2025-11-28', status: 'Submitted', remarks: 'Good job!' }
          ]);
      });
  };

  const handleSubmit = (assignmentId) => {
    const userId = currentUser?.id || 4;

    if(window.confirm("Are you sure you want to mark this as submitted?")) {
        axios.post('http://localhost:8081/student/assignment/submit', {
            student_id: userId,
            assignment_id: assignmentId
        })
        .then(res => {
            if(res.data.Status === "Success") {
                alert("Assignment Submitted!");
                fetchAssignments(); // Refresh list
            }
        })
        .catch(err => {
            alert("Submission failed (Check backend connection)");
            console.log(err);
        });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar Mock */}
      <StudentSidebar />
      
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>My Assignments</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Manage your tasks and track your submissions.</p>

        <div style={{ display: 'grid', gap: '20px' }}>
          {assignments.map((task, index) => (
            <div key={index} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: task.status === 'Pending' ? '5px solid #f59e0b' : '5px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                
                {/* Left: Task Details */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ 
                            backgroundColor: '#e2e8f0', 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            color: '#475569'
                        }}>
                            {task.subject}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14}/> Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 style={{ margin: '5px 0', color: '#1e293b' }}>{task.title}</h3>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{task.description || "No specific description provided."}</p>
                </div>

                {/* Right: Action Button */}
                <div>
                    {task.status === 'Pending' ? (
                        <button 
                            onClick={() => handleSubmit(task.id)}
                            style={{ 
                                backgroundColor: '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                padding: '10px 20px', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                fontWeight: '600'
                            }}
                        >
                            <Upload size={18} /> Upload Work
                        </button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                            <span style={{ 
                                color: '#10b981', 
                                fontWeight: 'bold', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '5px' 
                            }}>
                                <CheckCircle size={20} /> Submitted
                            </span>
                            {task.remarks && (
                                <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                                    Tutor says: "{task.remarks}"
                                </span>
                            )}
                        </div>
                    )}
                </div>

            </div>
          ))}
          
          {assignments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FileText size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p>No assignments found for your batch.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;