import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, BookOpen, ExternalLink, 
  XCircle, CheckCircle, Loader2, Cloud
} from 'lucide-react';
import TutorSidebar from '../../components/TutorSidebar'; 

const TutorMaterialUpload = () => {
  // --- STATE ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '', 
    batch: 'KK_01'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);

  // --- API CALLS ---
  const fetchTutorProfile = async () => {
    try {
        // 1. GET ID FROM STORAGE
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            setFormData(prev => ({ ...prev, subject: 'Error: No User ID' }));
            return;
        }

        // 2. SEND ID IN URL (?tutor_id=...)
        const res = await axios.get(`http://localhost:8081/tutor/profile?tutor_id=${userId}`);
        
        if(res.data && res.data.Status === "Success") {
            setFormData(prev => ({ ...prev, subject: res.data.subject }));
        } else {
            setFormData(prev => ({ ...prev, subject: 'Subject Not Found' }));
        }
    } catch(err) {
        console.error("Error fetching profile.", err);
        setFormData(prev => ({ ...prev, subject: 'Connection Error' }));
    }
  };

  const fetchMaterials = async () => {
  try {
      const userId = localStorage.getItem('userId'); // <--- Get ID
      if (!userId) return;

      // <--- Send ID in URL
      const res = await axios.get(`http://localhost:8081/tutor/materials?tutor_id=${userId}`);
      
      if (Array.isArray(res.data)) {
          setUploadedFiles(res.data);
      }
  } catch(err) {
      console.error("Error fetching materials", err);
  }
};

  useEffect(() => {
    fetchTutorProfile();
    fetchMaterials();
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    // Check for ID before uploading
    const userId = localStorage.getItem('userId');
    if (!userId) {
        setMessage({ type: 'error', text: 'You are not logged in (Missing ID).' });
        return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('subject', formData.subject); 
    data.append('batch', formData.batch);
    
    // 3. CRITICAL: SEND ID IN FORM DATA
    data.append('tutor_id', userId); 

    try {
        const res = await axios.post('http://localhost:8081/tutor/upload', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.Status === "Success") {
            setFormData(prev => ({ 
                ...prev, 
                title: '', 
                description: '' 
            }));
            setFile(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
            setMessage({ type: 'success', text: 'Material uploaded successfully!' });
            fetchMaterials(); 
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
             setMessage({ type: 'error', text: 'Upload failed: ' + (res.data.Error || 'Unknown error') });
        }
    } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Upload failed. Check console.' });
    } finally {
        setUploading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="page-wrapper">
      <div className="sidebar-container">
        <TutorSidebar />
      </div>

      <div className="content-container">
        <style>{`
          :root { --primary-slate: #0f172a; --slate-light: #f1f5f9; --accent-gold: #d97706; --text-main: #334155; --text-light: #64748b; }
          .page-wrapper { display: flex; height: 100vh; width: 100vw; overflow: hidden; background-color: #f8fafc; font-family: 'Inter', sans-serif; color: var(--text-main); }
          .sidebar-container { width: 250px; flex-shrink: 0; background: var(--primary-slate); height: 100%; }
          .content-container { flex-grow: 1; height: 100vh; display: flex; flex-direction: column; padding: 20px 30px; }
          .page-header { flex-shrink: 0; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
          .page-title { font-size: 1.4rem; font-weight: 700; color: var(--primary-slate); margin: 0; }
          .main-grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; flex-grow: 1; min-height: 0; }
          .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .card-header { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; background: #fff; flex-shrink: 0; }
          .card-title { font-size: 1rem; font-weight: 600; color: var(--primary-slate); margin: 0; }
          .card-body { padding: 20px; overflow-y: auto; flex-grow: 1; }
          .inp-group { margin-bottom: 12px; }
          .inp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .inp-label { font-size: 0.8rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px; display: block; }
          .inp-field { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; color: var(--primary-slate); }
          .inp-field:focus { border-color: var(--accent-gold); outline: none; }
          .inp-field:disabled { background-color: #f1f5f9; color: #64748b; cursor: not-allowed; border-color: #e2e8f0; }
          .drop-zone { margin: 15px 0; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 20px; text-align: center; background-color: #fafafa; cursor: pointer; transition: all 0.2s; }
          .drop-zone:hover { border-color: var(--accent-gold); background-color: #fffbeb; }
          .btn-pri { background: var(--primary-slate); color: white; border: none; padding: 10px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .file-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f1f5f9; }
          .file-item:last-child { border-bottom: none; }
          .icon-box { width: 32px; height: 32px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-light); }
          .file-title { margin: 0; font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
          .file-meta { margin: 2px 0 0; font-size: 0.75rem; color: var(--text-light); }
          .link-btn { color: var(--text-light); padding: 6px; border-radius: 4px; }
          .msg-overlay { position: absolute; top: 20px; right: 30px; z-index: 100; padding: 10px 16px; border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .msg-success { background: #fff; color: #15803d; border-left: 4px solid #15803d; }
          .msg-error { background: #fff; color: #b91c1c; border-left: 4px solid #b91c1c; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin-anim { animation: spin 1s linear infinite; }
          @media (max-width: 900px) { .sidebar-container { display: none; } .main-grid { grid-template-columns: 1fr; } .page-wrapper { overflow-y: auto; height: auto; } }
        `}</style>

        {message.text && (
            <div className={`msg-overlay ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                {message.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                {message.text}
            </div>
        )}

        <div className="page-header">
           <BookOpen size={24} color="#d97706" />
           <h1 className="page-title">Material Upload</h1>
        </div>

        <div className="main-grid">
          {/* LEFT: FORM */}
          <div className="card">
            <div className="card-header">
                <h2 className="card-title">New Upload</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="inp-group">
                    <label className="inp-label">Material Title</label>
                    <input 
                      type="text" name="title" required 
                      className="inp-field"
                      value={formData.title} onChange={handleInputChange} 
                      placeholder="e.g. Algebra Chapter 1" 
                    />
                </div>
                
                <div className="inp-row">
                    <div className="inp-group">
                        <label className="inp-label">
                            Subject 
                            {formData.subject === 'Loading...' && <span style={{color:'orange', marginLeft:'5px'}}> (Fetching...)</span>}
                        </label>
                        <input 
                            type="text" 
                            name="subject"
                            className="inp-field"
                            value={formData.subject}
                            readOnly
                            disabled
                            placeholder="Loading..."
                        />
                    </div>
                    <div className="inp-group">
                        <label className="inp-label">Batch</label>
                        <input 
                          type="text" name="batch" 
                          className="inp-field"
                          value={formData.batch} onChange={handleInputChange} 
                        />
                    </div>
                </div>

                <div className="inp-group">
                    <label className="inp-label">Description</label>
                    <textarea 
                      name="description" rows="2" 
                      className="inp-field"
                      value={formData.description} onChange={handleInputChange} 
                      placeholder="Details..." 
                      style={{ resize: 'none' }}
                    />
                </div>

                <div className="drop-zone">
                    <input 
                        type="file" id="fileUpload" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                    />
                    <label htmlFor="fileUpload" style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
                        <Cloud size={24} style={{ color: file ? '#d97706' : '#94a3b8', margin: '0 auto' }} />
                        <span className="drop-text">
                            {file ? <strong style={{color:'#334155'}}>{file.name}</strong> : "Click to select file"}
                        </span>
                    </label>
                </div>

                <button type="submit" disabled={uploading || !formData.subject || formData.subject.includes('Error')} className="btn-pri">
                    {uploading ? <Loader2 className="spin-anim" size={16} /> : <Upload size={16} />}
                    {uploading ? "Uploading..." : "Upload Material"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: LIST */}
          <div className="card">
              <div className="card-header">
                  <h2 className="card-title">Library ({uploadedFiles.length})</h2>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                  <div className="file-list">
                    {uploadedFiles.map((item, index) => (
                        <div key={item.id || index} className="file-item">
                            <div className="icon-box"><FileText size={16} /></div>
                            <div className="file-info">
                                <h4 className="file-title">{item.title}</h4>
                                <p className="file-meta">{item.subject} • {item.batch}</p>
                            </div>
                            <a href={`http://localhost:8081/uploads/${item.file_name}`} target="_blank" rel="noopener noreferrer" className="link-btn">
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    ))}
                    {uploadedFiles.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.9rem' }}>
                            No materials found.
                        </div>
                    )}
                  </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorMaterialUpload;