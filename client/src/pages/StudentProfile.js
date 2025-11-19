import React, { useEffect, useState } from 'react';
import StudentSidebar from '../components/StudentSidebar';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Phone, MapPin, BookOpen, Briefcase } from 'lucide-react';

const StudentProfile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const userId = currentUser?.id || 4;
    fetchProfile(userId);
  }, [currentUser]);

  const fetchProfile = (id) => {
    axios.get(`http://localhost:8081/student/profile/${id}`)
      .then(res => {
          setProfile(res.data);
          // Initialize form fields with fetched data
          setContact(res.data.contact_number);
          setAddress(res.data.address);
      })
      .catch(err => console.log(err));
  };

  const handleSave = () => {
    const userId = currentUser?.id || 4;
    axios.post('http://localhost:8081/student/profile/update', {
        id: userId,
        contact_number: contact,
        address: address
    })
    .then(res => {
        if(res.data.Status === "Success") {
            setIsEditing(false);
            alert("Profile Updated Successfully!");
            fetchProfile(userId); // Refresh data
        } else {
            alert("Failed to update");
        }
    })
    .catch(err => console.log(err));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f1f5f9' }}>
      <StudentSidebar />
      
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '30px' }}>My Profile</h1>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Left Card: Identity Card */}
          <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
             <div style={{ width: '100px', height: '100px', backgroundColor: '#e2e8f0', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={50} color="#64748b" />
             </div>
             <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{profile.full_name || 'Student Name'}</h2>
             <p style={{ color: '#64748b', margin: 0 }}>{profile.email}</p>
             
             <div style={{ marginTop: '30px', textAlign: 'left' }}>
                 <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>
                        <Briefcase size={16}/> Role
                    </label>
                    <div style={{ fontWeight: 'bold', color: '#334155' }}>{profile.role}</div>
                 </div>
                 
                 <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>
                        <BookOpen size={16}/> Batch
                    </label>
                    <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{profile.batch}</div>
                 </div>
             </div>
          </div>

          {/* Right Card: Personal Details */}
          <div style={{ flex: 2, minWidth: '300px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h3 style={{ margin: 0, color: '#334155' }}>Personal Details</h3>
                 <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    style={{ 
                        backgroundColor: isEditing ? '#10b981' : '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 16px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                 >
                    {isEditing ? 'Save Changes' : 'Edit Details'}
                 </button>
             </div>

             <div style={{ display: 'grid', gap: '20px' }}>
                 
                 {/* Parent Name (Read Only) */}
                 <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Parent / Guardian Name</label>
                    <div style={{ fontSize: '1.1rem', color: '#1e293b' }}>{profile.parent_name}</div>
                 </div>

                 {/* Contact Number (Editable) */}
                 <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <Phone size={16}/> Contact Number
                    </label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={contact} 
                            onChange={(e) => setContact(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    ) : (
                        <div style={{ fontSize: '1.1rem', color: '#1e293b' }}>{profile.contact_number}</div>
                    )}
                 </div>

                 {/* Address (Editable) */}
                 <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <MapPin size={16}/> Address
                    </label>
                    {isEditing ? (
                        <textarea 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px' }}
                        />
                    ) : (
                        <div style={{ fontSize: '1.1rem', color: '#1e293b', lineHeight: '1.5' }}>{profile.address}</div>
                    )}
                 </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;