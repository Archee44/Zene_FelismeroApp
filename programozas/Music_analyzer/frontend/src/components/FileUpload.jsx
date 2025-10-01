import React, { useState } from "react";
import { uploadTrack } from "../api";

export default function FileUpload({ onUpload }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const result = await uploadTrack(file);
    onUpload(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Feltöltés</button>
    </form>
  );
}
