import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  User, Phone, BookOpen, Briefcase, 
  GraduationCap, Calendar, Award, Hash, X, Edit3, Loader2, Save
} from 'lucide-react';
// Add this to your imports
import { useParams } from 'react-router-dom';
// Import your Sidebar
import TutorSidebar from '../../components/TutorSidebar';

// Configuration
const API_BASE_URL = 'http://localhost:8081/tutor/profile';

const TutorProfile = () => {
  const { id } = useParams(); 
  
  // FIXED LOGIC:
  // 1. Check URL first
  // 2. Check 'userId' in localStorage (which we saved in Login.jsx)
  // 3. Do NOT default to 12. If no ID, it stays null.
  const profileId = id || localStorage.getItem('userId');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Prevent API call if we don't have an ID
    if (!profileId) {
        setError("No user logged in found.");
        setLoading(false);
        return;
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]); // <--- IMPORTANT: Add profileId here so it re-runs when URL changes

  const fetchProfile = () => {
    setLoading(true);
    // Use profileId instead of the old userId variable
    axios.get(`${API_BASE_URL}/${profileId}`) 
      .then(res => {
        setProfile(res.data);
        setFormData(res.data); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setError("Could not load profile data.");
        setLoading(false);
      });
  };

  const handleSave = () => {
    // Prepare a clean payload
    const payload = {
        ...formData,
        // Ensure date is formatted properly before sending (remove time part if present)
        join_date: formData.join_date ? formData.join_date.split('T')[0] : null
    };

    axios.put(`${API_BASE_URL}/${profileId}`, payload)
      .then(res => {
        setProfile(formData); 
        setIsEditing(false);  
        alert("Profile Updated Successfully!");
      })
      .catch(err => {
        console.error("Error updating profile:", err);
        // Display the specific message from the server if available
        const msg = err.response?.data?.message || err.message;
        alert("Failed to update profile: " + msg);
      });
  };
  
  // ... rest of your render code ...
  
  const handleEditClick = () => {
    setFormData({ ...profile }); 
    setIsEditing(true);
  };
    const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper: Format date for Display (e.g., "June 1, 2024")
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper: Format date for Input Field (YYYY-MM-DD)
  const formatDateInput = (dateString) => {
    if (!dateString) return "";
    // If it's an ISO string like "2024-06-01T00:00:00.000Z", split at T
    return dateString.split('T')[0];
  };

  return (
    <div className="page-wrapper">
      {/* Sidebar */}
      <div className="sidebar-container">
        <TutorSidebar />
      </div>

      {/* Main Content */}
      <div className="content-container">
        
        {/* --- CSS STYLES --- */}
        <style>{`
          /* --- Layout & Reset --- */
          * { box-sizing: border-box; }
          
          .page-wrapper {
            display: flex;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background-color: #f8fafc; /* Slate 50 */
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #334155;
          }

          .sidebar-container {
            width: 260px;
            flex-shrink: 0;
            background: #0f172a;
            height: 100%;
            display: block;
          }

          .content-container {
            flex-grow: 1;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
          }

          /* --- Profile Card --- */
          .profile-card {
            display: flex;
            flex-direction: row;
            width: 100%;
            max-width: 950px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            min-height: 550px;
          }

          /* --- Left Column (Identity) --- */
          .left-column {
            width: 35%;
            background: linear-gradient(145deg, #1e293b, #0f172a);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }

          .profile-img-box {
            width: 130px;
            height: 130px;
            background: #f8fafc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border: 4px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .tutor-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0; color: #fff; line-height: 1.2; }
          .tutor-qual { color: #94a3b8; font-size: 0.95rem; font-weight: 400; margin: 0; }
          
          .id-badge {
            margin-top: 25px;
            display: inline-flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            letter-spacing: 0.5px;
          }

          /* --- Right Column (Details) --- */
          .right-column {
            width: 65%;
            padding: 40px;
            display: flex;
            flex-direction: column;
            background: #fff;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 15px;
          }

          .section-title {
            font-size: 1.25rem;
            color: #0f172a;
            font-weight: 700;
          }

          .edit-trigger {
            color: #64748b;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9rem;
            font-weight: 500;
          }
          .edit-trigger:hover { background: #f1f5f9; color: #0f172a; }

          /* --- Grid Layout --- */
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px 30px;
          }

          .detail-item { display: flex; flex-direction: column; }

          .detail-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .detail-value {
            font-size: 1rem;
            color: #1e293b;
            font-weight: 500;
            line-height: 1.5;
          }

          .full-width { grid-column: span 2; }

          /* Accent Icon */
          .accent-icon { color: #d97706; } 

          /* Tags */
          .tags-wrapper { display: flex; flex-wrap: wrap; gap: 8px; }
          .tag-pill {
            background-color: #f1f5f9;
            color: #475569;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }

          /* Bio */
          .bio-box {
            background-color: #fafafa;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
            color: #475569;
            font-style: italic;
            font-size: 0.95rem;
            line-height: 1.6;
          }

          /* --- Loading State --- */
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            color: #64748b;
          }
          .spin-anim { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

          /* --- Responsive Media Queries --- */
          @media (max-width: 900px) {
            .profile-card { flex-direction: column; height: auto; max-height: none; overflow: visible; }
            .left-column { width: 100%; padding: 30px; flex-direction: row; justify-content: flex-start; gap: 20px; text-align: left; }
            .right-column { width: 100%; padding: 30px; }
            .profile-img-box { margin-bottom: 0; width: 80px; height: 80px; }
            .id-badge { margin-top: 5px; }
            .left-column-text { display: flex; flex-direction: column; }
            .sidebar-container { display: none; } 
          }

          @media (max-width: 600px) {
             .left-column { flex-direction: column; align-items: center; text-align: center; }
             .details-grid { grid-template-columns: 1fr; }
             .full-width { grid-column: span 1; }
             .modal-panel { width: 95%; }
             .inp-row { grid-template-columns: 1fr !important; }
          }

          /* --- Modal --- */
          .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
            z-index: 50;
            display: flex; justify-content: center; align-items: center;
          }
          .modal-panel {
            background: white; width: 550px; padding: 0;
            border-radius: 12px; max-height: 90vh; overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex; flex-direction: column;
          }
          .modal-header {
            padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
            background: #fff;
            position: sticky; top: 0;
          }
          .modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
          .modal-body { padding: 24px; }
          .modal-footer {
            padding: 20px 24px; border-top: 1px solid #e2e8f0;
            display: flex; justify-content: flex-end; gap: 12px;
            background: #f8fafc;
            border-radius: 0 0 12px 12px;
          }

          /* Inputs */
          .inp-group { margin-bottom: 16px; }
          .inp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .inp-label { font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
          .inp-field {
            width: 100%; padding: 10px 14px;
            border: 1px solid #cbd5e1; border-radius: 6px;
            font-size: 0.95rem; color: #1e293b;
            transition: all 0.2s;
          }
          .inp-field:focus { border-color: #d97706; outline: none; box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1); }
          .inp-field:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

          /* Buttons */
          .btn-close { background: none; border: none; cursor: pointer; color: #94a3b8; transition: color 0.2s; }
          .btn-close:hover { color: #ef4444; }
          
          .btn-sec { background: white; border: 1px solid #cbd5e1; padding: 9px 18px; border-radius: 6px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
          .btn-sec:hover { background: #f1f5f9; border-color: #94a3b8; }
          
          .btn-pri { 
            background: #0f172a; color: white; border: none; 
            padding: 9px 18px; border-radius: 6px; font-weight: 600; 
            cursor: pointer; display: flex; align-items: center; gap: 8px; 
            transition: background 0.2s;
          }
          .btn-pri:hover { background: #1e293b; }
        `}</style>

        {/* --- MAIN LOGIC & DISPLAY --- */}
        {loading ? (
          <div className="loading-container">
            <Loader2 size={40} className="spin-anim" />
            <p>Loading Profile...</p>
          </div>
        ) : error ? (
          <div style={{color: '#ef4444'}}>{error}</div>
        ) : !profile ? (
          <div>No profile data found.</div>
        ) : (
          <div className="profile-card">
            
            {/* Left Column */}
            <div className="left-column">
              <div className="profile-img-box">
                <User size={60} color="#cbd5e1" />
              </div>
              <div className="left-column-text">
                <h2 className="tutor-name">{profile.full_name || "Tutor Name"}</h2>
                <p className="tutor-qual">{profile.qualification || "Qualification N/A"}</p>
                <div className="id-badge">
                  <Hash size={12} style={{ marginRight: '6px' }} />
                  <span>{profile.maatram_id || "--"}</span>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="right-column">
              <div className="section-header">
                <div className="section-title">
                  General Information
                </div>
                <button className="edit-trigger" onClick={handleEditClick}>
                  <Edit3 size={16} /> Edit Profile
                </button>
              </div>
              
              <div className="details-grid">
                
                <div className="detail-item">
                  <span className="detail-label"><Phone size={14} className="accent-icon" /> Contact</span>
                  <span className="detail-value">{profile.contact_no || "N/A"}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label"><GraduationCap size={14} className="accent-icon" /> College</span>
                  <span className="detail-value">{profile.college_name || "N/A"}</span>
                </div>

                {/* --- UPDATED FIELD: Date of Joining --- */}
                <div className="detail-item">
                  <span className="detail-label"><Calendar size={14} className="accent-icon" /> Date of Joining</span>
                  <span className="detail-value">{formatDateDisplay(profile.join_date)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label"><Award size={14} className="accent-icon" /> Passed Out</span>
                  <span className="detail-value">{profile.passed_out_year || "N/A"}</span>
                </div>

                <div className="detail-item full-width">
                  <span className="detail-label"><BookOpen size={14} className="accent-icon" /> Subjects Handled</span>
                  <div className="tags-wrapper">
                    {profile.subjects_handled 
                      ? profile.subjects_handled.split(',').map((sub, idx) => (
                          <span key={idx} className="tag-pill">{sub.trim()}</span>
                        ))
                      : <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>No subjects listed</span>
                    }
                  </div>
                </div>

                <div className="detail-item full-width">
                  <span className="detail-label"><Briefcase size={14} className="accent-icon" /> Biography</span>
                  <div className="bio-box">
                    {profile.bio || "No biography provided."}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {isEditing && (
          <div className="modal-overlay">
            <div className="modal-panel">
              <div className="modal-header">
                <span className="modal-title">Edit Profile</span>
                <button className="btn-close" onClick={() => setIsEditing(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="inp-group">
                  <label className="inp-label">Full Name</label>
                  <input type="text" name="full_name" className="inp-field" value={formData.full_name || ''} onChange={handleInputChange} />
                </div>
                
                <div className="inp-row">
                    <div className="inp-group">
                    <label className="inp-label">Contact No</label>
                    <input type="text" name="contact_no" className="inp-field" value={formData.contact_no || ''} onChange={handleInputChange} />
                  </div>
                  <div className="inp-group">
                    <label className="inp-label">Passed Out Year</label>
                    <input type="number" name="passed_out_year" className="inp-field" value={formData.passed_out_year || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="inp-group">
                  <label className="inp-label">College / Institute</label>
                  <input type="text" name="college_name" className="inp-field" value={formData.college_name || ''} onChange={handleInputChange} />
                </div>

                <div className="inp-group">
                  <label className="inp-label">Qualification</label>
                  <input type="text" name="qualification" className="inp-field" value={formData.qualification || ''} onChange={handleInputChange} />
                </div>

                <div className="inp-row">
                  {/* --- UPDATED FIELD: Join Date Picker --- */}
                  <div className="inp-group">
                    <label className="inp-label">Date of Joining</label>
                    <input 
                      type="date" 
                      name="join_date" 
                      className="inp-field" 
                      value={formatDateInput(formData.join_date)} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="inp-group">
                    <label className="inp-label">Maatram ID</label>
                    <input type="text" name="maatram_id" className="inp-field" value={formData.maatram_id || ''} disabled />
                  </div>
                </div>

                <div className="inp-group">
                  <label className="inp-label">Subjects (comma separated)</label>
                  <input type="text" name="subjects_handled" className="inp-field" value={formData.subjects_handled || ''} onChange={handleInputChange} placeholder="Maths, Physics, English" />
                </div>

                <div className="inp-group" style={{marginBottom: 0}}>
                  <label className="inp-label">Bio</label>
                  <textarea name="bio" className="inp-field" rows="4" value={formData.bio || ''} onChange={handleInputChange} style={{resize: 'vertical'}} />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-sec" onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="btn-pri" onClick={handleSave}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorProfile;