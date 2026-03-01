import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "./firebase";
import {storage} from './firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function SetupPage({ tagId, onSave, onLogout }) {
  const [pageData, setPageData] = useState({
    title: "",
    name: "",
    phone: "",
    description: "",
    email: "",
    socialMedia: [],
    links: [],
  });
  const [profilePicFile, setProfilePicFileUrl] = useState("");
  const [coverPhotoFile, setCoverPhotoFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

  // 1. Fetch Existing Data on Mount
  useEffect(() => {
    const loadCurrentData = async () => {
      try {
              const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`);
              if (res.data) {
                setPageData({
                  name: res.data.name || "",
                  title: res.data.title || "",
                  phone: res.data.phone || "",
                  email: res.data.email || "",
                  description: res.data.description || "",
                  socialMedia: res.data.socialMedia || [],
                  links: res.data.links || [],
                });
                
                setProfilePicFileUrl(res.data.profilePic || "");
                setCoverPhotoFileUrl(res.data.coverPhoto || "");
              }
            } catch (err) {
              console.log("No existing profile found. Ready for first setup.");
            } finally {
              setFetching(false);
            }
          };
          loadCurrentData();
        }, [tagId]);

  // Convert file to base64
  // const fileToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result);
  //     reader.onerror = (error) => reject(error);
  //   });
  // };

  // const handleFileChange = async (e, type) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   if (type === "profilePic") {
  //     setProfilePicFile(file);
  //     const base64 = await fileToBase64(file);
  //     setProfilePicBase64(base64);
  //   } else if (type === "coverPhoto") {
  //     setCoverPhotoFile(file);
  //     const base64 = await fileToBase64(file);
  //     setCoverPhotoBase64(base64);
  //   }
  // };

  const uploadImage = async (file, folder) => {
    if(!file) return "";
    const imageRef = ref(
      storage,
      `${folder}/${auth.currentUser.uid}-${Date.now()}-${file.name}`
    );
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const savePage = async () => {
    if (!auth.currentUser) return setErrorMsg("You must be logged in.");
        if (!pageData.name) return setErrorMsg("Name is required.");
    
        try {
          setLoading(true);
          setErrorMsg("");
          setSuccessMsg("");
    
          const token = await auth.currentUser.getIdToken();
    
const profilePicUrl = profilePicFile
      ? await uploadImage(profilePicFile, "profile-pics")
      : "";

    const coverPhotoUrl = coverPhotoFile
      ? await uploadImage(coverPhotoFile, "cover-photos")
      : "";


          const payload = {
            token,
            tagId,
            pageData,
            profilePic: profilePicUrl, 
            coverPhoto: coverPhotoUrl,
          };
      console.log("Sending Payload:", payload);

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/save-page`,
        payload,
        // { headers: { "Content-Type": "application/json" } }
      );
      console.log("Save Success:", response.data);

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => onSave(), 1500); // Transition to public view after a delay
      onSave(); // Go to Public Page
    } catch (err) {
      // console.error("Save error:", err);
      // setErrorMsg("Failed to save. Please try again.");
      console.error("Save error details:", err.response?.data || err.message);
    setErrorMsg(err.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper inputs logic (same as before, condensed for brevity)
  const addItem = (list) => setPageData({ ...pageData, [list]: [...pageData[list], { platform: "", text: "", url: "" }] });
  const removeItem = (list, index) => {
    const newList = [...pageData[list]];
    newList.splice(index, 1);
    setPageData({ ...pageData, [list]: newList });
  };
  const updateItem = (list, index, field, value) => {
    const newList = [...pageData[list]];
    newList[index][field] = value;
    setPageData({ ...pageData, [list]: newList });
  };

  return (
    <div className="page setup-page animate-fade-in">
      <nav className="setup-nav">
           <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center'}}>
        <button onClick={onLogout} className="logout-btn" style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem'}}>← ‎ Logout</button>
      </div>
        </nav>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>Edit Profile</h2>
        </div>
        
        
{/* spacer */}
           <div style={{width: 60}}></div> 
      
      

      {/* Images */}
      <div className="form-group">
        <label>Profile Picture</label>
        {profilePicFile && <img src={URL.createObjectURL(profilePicFile)} alt="Preview" style={{width: 80, height: 80, borderRadius:'50%', marginBottom: 10, objectFit:'cover'}} />}
        <input type="file" onChange={(e) => setProfilePicFileUrl(e.target.files[0])} />
      </div>

      <div className="form-group">
        <label>Cover Photo</label>
        {coverPhotoFile && <img src={URL.createObjectURL(coverPhotoFile)} alt="Preview" style={{width: '100%', height: 80, borderRadius:8, marginBottom: 10, objectFit:'cover'}} />}
        <input type="file" onChange={(e) => setCoverPhotoFileUrl(e.target.files[0])} />
      </div>

      {/* Text Fields */}
      <div className="form-group">
        <label>Name *</label>
        <input value={pageData.name} onChange={(e) => setPageData({...pageData, name: e.target.value})} />
      </div>

      <div className="form-group">
        <label>Title</label>
        <input value={pageData.title} onChange={(e) => setPageData({...pageData, title: e.target.value})} />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea value={pageData.description} onChange={(e) => setPageData({...pageData, description: e.target.value})} />
      </div>

      <div className="form-group">
        <label>Email (Public)</label>
        <input value={pageData.email} onChange={(e) => setPageData({...pageData, email: e.target.value})} />
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input value={pageData.phone} onChange={(e) => setPageData({...pageData, phone: e.target.value})} />
      </div>

      {/* Socials */}
      <section className="setup-section">
          <div className="section-header">
            <h3> Social Media</h3>
            <button className="add-btn" onClick={() => addItem('socialMedia')}>+ Add</button>
          </div>
          {pageData.socialMedia.map((sm, i) => (
            <div key={i} className="dynamic-row">
              <select value={sm.platform} onChange={(e) => updateItem('socialMedia', i, 'platform', e.target.value)}>
                <option value="">Platform</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter/X</option>
                <option value="TikTok">TikTok</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
              <input placeholder="www.platform.com/username" value={sm.url} onChange={(e) => updateItem('socialMedia', i, 'url', e.target.value)} />
              <button onClick={() => removeItem('socialMedia', i)} className="remove-btn">×</button>
            </div>
          ))}
        </section>

      {/* Links */}
      <section className="setup-section">
          <div className="section-header">
            <h3> Custom Links</h3>
            <button className="add-btn" onClick={() => addItem('links')}>+ Add</button>
          </div>
          {pageData.links.map((ln, i) => (
            <div key={i} className="dynamic-row">
              <input placeholder="Label (e.g. Portfolio)" value={ln.text} onChange={(e) => updateItem('links', i, 'text', e.target.value)} />
              <input placeholder="URL" value={ln.url} onChange={(e) => updateItem('links', i, 'url', e.target.value)} />
              <button onClick={() => removeItem('links', i)} className="remove-btn">×</button>
            </div>
          ))}
        </section>


{errorMsg && <div className="error-banner">{errorMsg}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      
      <button className="btn primary-btn" style={{marginTop: '2rem'}} onClick={savePage} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

export default SetupPage;