import React, { useEffect, useState, createContext, useContext } from 'react';
import axios from 'axios';
import { BookOpen, Download, FileText, Search, Upload, LayoutDashboard, CheckSquare, Calendar, User, Layers, XCircle } from 'lucide-react';
import StudentSidebar from '../components/StudentSidebar';
// --- INTERNAL MOCK AUTH & SIDEBAR ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);


// const StudentSidebar = () => (
//   <div style={{ width: '250px', minHeight: '100vh', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
//       <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
//         <h2 style={{ margin: 0, color: '#facc15', fontSize: '1.5rem' }}>KK Platform</h2>
//         <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Student Portal</span>
//       </div>
//       <div style={{ flex: 1, marginTop: '20px', paddingLeft: '10px' }}>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><LayoutDashboard size={20} style={{marginRight:'12px'}}/> Dashboard</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><CheckSquare size={20} style={{marginRight:'12px'}}/> Assignments</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><Calendar size={20} style={{marginRight:'12px'}}/> Timetable</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#facc15', marginBottom:'5px', fontWeight:'bold' }}><BookOpen size={20} style={{marginRight:'12px'}}/> Materials</div>
//           <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', color:'#cbd5e1', marginBottom:'5px' }}><User size={20} style={{marginRight:'12px'}}/> Profile</div>
//       </div>
//   </div>
// );

// --- MAIN COMPONENT ---
const MaterialsContent = () => {
    const { currentUser } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [showUpload, setShowUpload] = useState(false); // Toggle for Admin Upload Form

    // Helper to get unique subjects
    const subjects = ['All', ...new Set(materials.map(m => m.subject))];

    // Filtered list
    const displayedMaterials = selectedSubject === 'All' 
        ? materials 
        : materials.filter(m => m.subject === selectedSubject);

    useEffect(() => {
        fetchMaterials();
    }, [currentUser]);

    const fetchMaterials = () => {
        const userId = currentUser?.id || 4;
        setLoading(true);
        axios.get(`http://localhost:8081/student/materials/${userId}`)
            .then(res => {
                setMaterials(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.log("Error fetching materials", err);
                // Mock Data Fallback
                setMaterials([
                    { id: 1, title: 'Physics Formula Sheet', subject: 'Physics', description: 'Important formulas for Ch 1-5', uploaded_at: '2025-11-15' },
                    { id: 2, title: 'Calculus Notes', subject: 'Maths', description: 'Handwritten notes on Integration', uploaded_at: '2025-11-10' },
                    { id: 3, title: 'Shakespeare Summary', subject: 'English', description: 'Summary of Macbeth acts', uploaded_at: '2025-11-18' }
                ]);
                setLoading(false);
            });
    };

    const handleDownload = (id, title) => {
        // Direct the browser to the download URL
        window.open(`http://localhost:8081/materials/download/${id}`, '_blank');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
            <StudentSidebar />
            
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0 }}>Study Materials</h1>
                        <p style={{ color: '#64748b', marginTop: '5px' }}>Access course notes, formulas, and reference docs.</p>
                    </div>
                    {/* <button 
                        onClick={() => setShowUpload(!showUpload)}
                        style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        {showUpload ? 'Close Upload' : '+ Add Material (Admin)'}
                    </button> */}
                </div>

                {/* Admin Upload Form (For Testing) */}
                {/* {showUpload && <UploadForm onClose={() => setShowUpload(false)} onUploadSuccess={fetchMaterials} />} */}

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {subjects.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: selectedSubject === sub ? '#2563eb' : 'white',
                                color: selectedSubject === sub ? 'white' : '#64748b',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                fontWeight: '500',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {sub}
                        </button>
                    ))}
                </div>

                {/* Materials Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading materials...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {displayedMaterials.map((item) => (
                            <div key={item.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                            {item.subject}
                                        </span>
                                        <FileText size={20} color="#94a3b8"/>
                                    </div>
                                    <h3 style={{ margin: '15px 0 10px', color: '#1e293b', fontSize: '1.1rem' }}>{item.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                                        {item.description}
                                    </p>
                                </div>
                                
                                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Unknown Date'}
                                    </span>
                                    <button 
                                        onClick={() => handleDownload(item.id, item.title)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <Download size={16} /> Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && displayedMaterials.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                        <Layers size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
                        <p>No materials found for {selectedSubject}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ADMIN UPLOAD FORM COMPONENT (Internal) ---
// const UploadForm = ({ onClose, onUploadSuccess }) => {
//     const [title, setTitle] = useState('');
//     const [subject, setSubject] = useState('');
//     const [desc, setDesc] = useState('');
//     const [file, setFile] = useState(null);
//     const [uploading, setUploading] = useState(false);

//     const handleUpload = (e) => {
//         e.preventDefault();
//         if(!file || !title) return alert("Please select a file and title");

//         setUploading(true);
//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('title', title);
//         formData.append('subject', subject);
//         formData.append('description', desc);
//         formData.append('batch', 'KK_01'); // Defaulting to this batch

//         axios.post('http://localhost:8081/admin/materials/upload', formData, {
//             headers: { 'Content-Type': 'multipart/form-data' }
//         })
//         .then(() => {
//             alert("Uploaded Successfully");
//             onUploadSuccess();
//             onClose();
//         })
//         .catch(err => {
//             console.error(err);
//             alert("Upload Failed");
//         })
//         .finally(() => setUploading(false));
//     };

//     return (
//         <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #cbd5e1' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
//                 <h3 style={{ margin: 0 }}>Upload New Material</h3>
//                 <XCircle size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={onClose} />
//             </div>
//             <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
//                 <input placeholder="Title (e.g. Math Notes)" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
//                 <input placeholder="Subject (e.g. Maths)" value={subject} onChange={e => setSubject(e.target.value)} required style={inputStyle} />
//                 <input type="text" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, gridColumn: 'span 2' }} />
//                 <input type="file" onChange={e => setFile(e.target.files[0])} required style={{ ...inputStyle, gridColumn: 'span 2' }} />
//                 <button type="submit" disabled={uploading} style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
//                     {uploading ? 'Uploading...' : 'Upload Material'}
//                 </button>
//             </form>
//         </div>
//     );
// };

const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' };

// --- ROOT COMPONENT ---
const StudentMaterials = () => {
    return (
        <AuthContext.Provider value={{ currentUser: { id: 4, username: 'Student User' } }}>
            <MaterialsContent />
        </AuthContext.Provider>
    );
};

export default StudentMaterials;