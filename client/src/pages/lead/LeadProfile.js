import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Camera, Edit2, Calendar, BookOpen, 
  Phone, Briefcase, GraduationCap, MapPin 
} from 'lucide-react';

import LeadSidebar from './LeadSidebar';

const LeadProfile = () => {
  // --- Helper: Format Date to YYYY-MM-DD ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // If it's already YYYY-MM-DD, return it
    if (dateString.length === 10) return dateString;
    // If it's ISO (2024-05-27T00:00:00.000Z), split it
    return dateString.split('T')[0];
  };

  // --- State ---
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [profile, setProfile] = useState({
    firstName: 'Sathyabama', // Updated Default
    lastName: '',
    role: 'Tutor',
    phone: '',
    course: 'Tamil',         // Default single subject
    college: '',      
    passoutYear: '',
    joinDate: '',
    bio: '',
    Maatram_ID: 'MA_LD_01',  // Updated Default
    batch: 'KK_01'
  });

  // --- API Fetch ---
  useEffect(() => {
    axios.get('http://localhost:8081/lead/profile')
      .then(res => {
        // We merge data, but ensure Date is formatted immediately
        const data = res.data;
        setProfile(prev => ({ 
          ...prev, 
          ...data,
          // Ensure name falls back to Sathyabama if empty
          firstName:'Sathya', 
          // Format date immediately upon fetch
          joinDate: formatDate(data.joinDate || '2024-05-27'),
          Maatram_ID: data.Maatram_ID || 'MA_LD_01',
          college:'Madras University'
        }));
      })
      .catch(err => console.error(err));
  }, []);

  // --- Handlers ---
  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('http://localhost:8081/lead/profile', profile);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          /* Theme Colors */
          --bg-sidebar: #0f172a; 
          --bg-card-left: #111827; 
          --bg-body: #f3f4f6;
          --text-highlight: #f59e0b; 
          --text-white: #ffffff;
          --text-muted: #9ca3af;
          --text-dark: #1f2937;
          --text-label: #6b7280; 
        }

        /* --- Layout & Reset --- */
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-body); }
        * { box-sizing: border-box; }

        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        /* --- Fixed Sidebar --- */
        .sidebar-container {
          width: 260px;
          background-color: var(--bg-sidebar);
          position: fixed; 
          top: 0; left: 0; bottom: 0;
          overflow-y: auto;
          z-index: 100;
          color: white;
        }

        /* --- Main Content Area --- */
        .main-content {
          margin-left: 260px; 
          flex-grow: 1;
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: flex-start; 
        }

        /* --- The Split Card --- */
        .profile-card {
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 550px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden; 
        }

        /* --- Left Panel (Dark) --- */
        .card-left {
          flex: 0 0 35%; 
          background-color: var(--bg-card-left);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .avatar-container {
          position: relative;
          width: 140px;
          height: 140px;
          margin-bottom: 24px;
        }

        .avatar {
          width: 100%;
          height: 100%;
          background-color: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          border: 4px solid #1f2937;
        }

        .user-name { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: white; }
        .user-degree { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }

        .id-pill {
          background-color: #374151;
          padding: 8px 24px;
          border-radius: 9999px;
          font-family: monospace;
          color: var(--text-muted);
          font-size: 13px;
          letter-spacing: 0.5px;
        }

        /* --- Right Panel (White) --- */
        .card-right {
          flex: 1;
          padding: 50px;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 15px;
        }

        .section-title { font-size: 20px; font-weight: 700; color: var(--text-dark); }
        
        .edit-btn {
          display: flex; align-items: center; gap: 8px;
          border: none; background: none;
          color: var(--text-label);
          cursor: pointer; font-size: 14px;
          transition: color 0.2s;
        }
        .edit-btn:hover { color: var(--text-highlight); }

        /* --- Info Grid --- */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }

        .info-item { display: flex; flex-direction: column; gap: 6px; }
        
        .label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-highlight); 
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex; align-items: center; gap: 6px;
        }

        .value {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-dark);
          min-height: 24px;
        }

        /* --- Form Inputs within Grid --- */
        .edit-input {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
        }
        .edit-input:focus { outline: 2px solid var(--text-highlight); border-color: transparent; }

        /* --- Bio Section --- */
        .bio-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          color: #4b5563;
          font-style: italic;
          line-height: 1.6;
        }
        .bio-textarea {
          width: 100%; border: 1px solid #d1d5db;
          border-radius: 6px; padding: 10px;
          font-family: inherit; resize: none;
        }

        /* --- Save Button --- */
        .save-btn {
          background-color: var(--text-highlight);
          color: white; border: none;
          padding: 10px 24px; border-radius: 6px;
          font-weight: 600; cursor: pointer;
          align-self: flex-start; margin-top: 20px;
        }
        
        /* Mobile */
        @media (max-width: 900px) {
          .profile-card { flex-direction: column; height: auto; }
          .card-left { padding: 30px; }
          .card-right { padding: 30px; }
          .info-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dashboard-layout">
        
        {/* FIXED SIDEBAR */}
        <div className="sidebar-container">
          <LeadSidebar />
        </div>

        {/* CONTENT AREA */}
        <div className="main-content">
          <div className="profile-card">
            
            {/* LEFT PANEL */}
            <div className="card-left">
              <div className="avatar-container">
                <div className="avatar">
                  <Camera size={48} strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Name Updated to Sathyabama */}
              <h1 className="user-name">
                Ms. {profile.firstName || 'Sathyabama'}
              </h1>
              
              <p className="user-degree">
                {profile.course || 'B.A. Education'}
              </p>

              {/* ID Updated to MA_LD_01 */}
              <div className="id-pill">
                # {profile.Maatram_ID || 'MA_LD_01'}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="card-right">
              
              <form onSubmit={handleSave}>
                <div className="section-header">
                  <span className="section-title">General Information</span>
                  {!isEditing && (
                    <button type="button" className="edit-btn" onClick={() => setIsEditing(true)}>
                      <Edit2 size={16} /> Edit Profile
                    </button>
                  )}
                </div>

                <div className="info-grid">
                  
                  {/* Contact */}
                  <div className="info-item">
                    <span className="label"><Phone size={12}/> CONTACT</span>
                    {isEditing ? (
                      <input 
                        className="edit-input" 
                        name="phone" 
                        value={profile.phone} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <span className="value">{profile.phone || '9876500000'}</span>
                    )}
                  </div>

                  {/* College */}
                  <div className="info-item">
                    <span className="label"><GraduationCap size={12}/> COLLEGE</span>
                    {isEditing ? (
                      <input 
                        className="edit-input" 
                        name="college" 
                        value={profile.college} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <span className="value">{profile.college || 'Madras University'}</span>
                    )}
                  </div>

                  {/* Date of Joining - Only Date */}
                  <div className="info-item">
                    <span className="label"><Calendar size={12}/> DATE OF JOINING</span>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="edit-input" 
                        name="joinDate" 
                        value={formatDate(profile.joinDate)} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <span className="value">{formatDate(profile.joinDate) || '2024-05-27'}</span>
                    )}
                  </div>

                  {/* Passed Out */}
                  <div className="info-item">
                    <span className="label"><Briefcase size={12}/> PASSED OUT</span>
                    {isEditing ? (
                      <input 
                        className="edit-input" 
                        name="passoutYear" 
                        value={profile.passoutYear} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <span className="value">{profile.passoutYear || '2025'}</span>
                    )}
                  </div>

                  {/* Subject - Single Subject */}
                  <div className="info-item">
                    <span className="label"><BookOpen size={12}/> SUBJECT</span>
                    {isEditing ? (
                      <input 
                        className="edit-input" 
                        name="course" 
                        value={profile.course} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Tamil"
                      />
                    ) : (
                      <div style={{display:'flex', gap:'8px'}}>
                        <span style={{background:'#f3f4f6', padding:'4px 12px', borderRadius:'4px', fontSize:'14px'}}>
                          {profile.course || 'Tamil'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Biography */}
                <div className="info-item" style={{ marginTop: '10px' }}>
                  <span className="label" style={{marginBottom:'10px'}}>BIOGRAPHY</span>
                  {isEditing ? (
                    <textarea 
                      className="bio-textarea" 
                      rows="3" 
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="bio-box">
                      {profile.bio || 'Enthusiastic about Tamil literature.'}
                    </div>
                  )}
                </div>

                {/* Save Actions */}
                {isEditing && (
                  <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      style={{background:'transparent', border:'1px solid #d1d5db', padding:'10px 20px', borderRadius:'6px', cursor:'pointer'}}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default LeadProfile;