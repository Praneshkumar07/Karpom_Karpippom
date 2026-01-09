import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { Save, FileText, Loader2, Filter } from 'lucide-react'; 
import StudentSidebar from '../components/StudentSidebar'; 

const useAuth = () => {
  return { currentUser: { id: 4, username: 'Student User' } };
};

const StudentMarksEntry = () => {
  const { currentUser } = useAuth();
  
  // State
  const [examType, setExamType] = useState('Quarterly');
  const [marks, setMarks] = useState([
    { subject: 'Tamil', mark: '' },
    { subject: 'English', mark: '' },
    { subject: 'Physics', mark: '' },
    { subject: 'Mathematics', mark: '' },
    { subject: 'Chemistry', mark: '' },
    { subject: 'Biology', mark: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // --- FETCH MARKS ---
  useEffect(() => {
    const fetchMarks = async () => {
      setFetching(true);
      const studentId = currentUser?.id || 4; 

      try {
        const res = await axios.get(`http://localhost:8081/student/marks/${studentId}?exam_type=${examType}`);
        
        const defaultMarks = [
            { subject: 'Tamil', mark: '' },
            { subject: 'English', mark: '' },
            { subject: 'Physics', mark: '' },
            { subject: 'Mathematics', mark: '' },
            { subject: 'Chemistry', mark: '' },
            { subject: 'Biology', mark: '' },
        ];

        if (res.data && res.data.length > 0) {
            setMarks(prevMarks => {
                return defaultMarks.map(subjectRow => {
                    const found = res.data.find(d => d.subject === subjectRow.subject);
                    return found ? { ...subjectRow, mark: found.marks_obtained } : subjectRow;
                });
            });
        } else {
            setMarks(defaultMarks);
        }
      } catch (err) {
        console.error("Error fetching marks:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchMarks();
  }, [currentUser?.id, examType]);

  const handleInputChange = (index, value) => {
    if (value > 100 || value < 0) return;
    const updatedMarks = [...marks];
    updatedMarks[index].mark = value;
    setMarks(updatedMarks);
  };

  const calculateTotal = () => {
    return marks.reduce((acc, curr) => acc + (parseFloat(curr.mark) || 0), 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      student_id: currentUser?.id || 4,
      academic_year: '2023-2024',
      exam_type: examType,
      marks_data: marks
    };

    try {
      const res = await axios.post('http://localhost:8081/student/marks/add', payload);
      if(res.data.Status === "Success") alert("Marks saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <style>{`
        /* --- PROFESSIONAL THEME: Slate & Gold --- */
        :root {
            --primary-slate: #0f172a;
            --accent-gold: #d97706;
            --bg-light: #f8fafc;
            --text-main: #334155;
            --text-light: #64748b;
        }

        .page-wrapper {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-light);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-main);
        }

        .content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
          height: 100%;
        }

        .header-section {
          flex-shrink: 0;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--primary-slate);
          display: flex; align-items: center; gap: 10px;
          margin: 0;
        }

        /* --- COMPACT CARD STYLES --- */
        .main-card {
          flex: 1; 
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          max-height: 90vh;
        }

        .card-header {
          padding: 12px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 15px;
          background: #fff;
          flex-shrink: 0;
        }

        .card-body {
          flex: 1;
          display: flex; 
          flex-direction: column;
          padding: 0;
          position: relative;
        }

        .card-footer {
          padding: 12px 20px;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-shrink: 0;
        }

        /* --- INPUTS --- */
        .select-input {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          color: var(--primary-slate);
          background: #fff;
        }
        .select-input:focus { border-color: var(--accent-gold); }

        .mark-input {
          width: 80%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .mark-input:focus {
          border-color: var(--accent-gold);
          outline: none;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.1);
        }

        /* --- COMPACT TABLE --- */
        .marks-table { width: 100%; border-collapse: collapse; height: 100%; }
        
        .marks-table th {
          text-align: left;
          padding: 12px 25px;
          color: var(--text-light);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          height: 40px;
        }
        
        .marks-table tbody { display: table-row-group; }
        
        .marks-table td {
          padding: 8px 25px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          height: auto;
        }
        
        .marks-table tr:last-child td { border-bottom: none; }

        .subject-text { font-weight: 500; color: var(--primary-slate); font-size: 0.95rem; }

        /* --- BUTTONS --- */
        .btn-primary {
          background-color: var(--primary-slate);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .loader-overlay {
          position: absolute; inset: 0;
          background: rgba(255,255,255,0.8);
          display: flex; justify-content: center; alignItems: center;
          z-index: 20;
        }
      `}</style>

      {/* Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <div className="content-area">
        
        {/* Header */}
        <div className="header-section">
          <h1 className="page-title">
            <FileText color="#d97706" size={24} /> 
            Marks Entry
          </h1>
        </div>

        {/* Card */}
        <div className="main-card">
            
            {/* Control Bar */}
            <div className="card-header">
                <Filter size={16} color="#64748b"/>
                <span style={{fontWeight:'600', color:'#475569', fontSize: '0.85rem'}}>Exam:</span>
                <select 
                    className="select-input"
                    value={examType} 
                    onChange={(e) => setExamType(e.target.value)}
                >
                    <option value="Quarterly">Quarterly Exam</option>
                    <option value="Half Yearly">Half Yearly Exam</option>
                    {/* UPDATED OPTION HERE */}
                    <option value="Public">Public Exam</option>
                </select>
                
                <div style={{marginLeft: 'auto', fontSize:'0.85rem', color:'#64748b'}}>
                    <strong>Batch:</strong> KK_01
                </div>
            </div>

            {/* Table */}
            <div className="card-body">
                {fetching && (
                    <div className="loader-overlay">
                        <Loader2 className="animate-spin" color="#d97706" />
                    </div>
                )}

                <table className="marks-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th style={{width: '150px', textAlign:'center'}}>Marks Obtained</th>
                        </tr>
                    </thead>
                    <tbody>
                        {marks.map((row, index) => (
                        <tr key={index}>
                            <td>
                                <span className="subject-text">{row.subject}</span>
                            </td>
                            <td style={{textAlign: 'center'}}>
                                <input
                                    type="number"
                                    min="0" max="100"
                                    placeholder="-"
                                    className="mark-input"
                                    value={row.mark}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    style={{
                                      backgroundColor: row.mark !== '' ? '#fffbeb' : 'white',
                                      color: row.mark !== '' ? '#b45309' : '#334155'
                                    }}
                                />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="card-footer">
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Score:</span>
                     <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#d97706' }}>
                        {calculateTotal()} <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>/ 600</span>
                     </span>
                </div>

                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={loading || fetching}
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {loading ? "Saving..." : "Save Marks"}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default StudentMarksEntry;