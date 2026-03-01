import React, { useState } from "react";
import axios from "axios";

function AdminPanel() {
  const [tagId, setTagId] = useState("");
  const [msg, setMsg] = useState("");

  const createNewTag = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/admin/create-tag`, 
        { tagId }, 
        { headers: { "x-admin-secret": process.env.REACT_APP_ADMIN_SECRET } }
      );
      setMsg(`Tag created! Code: ${res.data.code}`);
    } catch (err) {
      setMsg(`Failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div>
      <h2>Admin: Create New Tag</h2>
      <input 
        placeholder="Enter Tag ID" 
        value={tagId} 
        onChange={(e) => setTagId(e.target.value)} 
      />
      <button onClick={createNewTag}>Create Tag</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}

export default AdminPanel;