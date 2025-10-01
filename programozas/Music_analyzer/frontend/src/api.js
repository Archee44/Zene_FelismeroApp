const API_URL = "http://localhost:5000/api/music";

export async function uploadTrack(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getRecommendations(trackId, strict = false) {
  const res = await fetch(`${API_URL}/recommend/${trackId}?strict=${strict}`);
  return res.json();
}
