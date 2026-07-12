import { Download, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL, api } from "../utils/api";

export default function FileShareModal({ roomId, onClose }) {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/rooms/${roomId}/files`).then((data) => setFiles(data.files)).catch((err) => setError(err.message));
  }, [roomId]);

  async function upload(event) {
    event.preventDefault();
    if (!selected) return;
    const formData = new FormData();
    formData.append("file", selected);
    try {
      const data = await api(`/api/rooms/${roomId}/files`, { method: "POST", body: formData });
      setFiles((current) => [data.file, ...current]);
      setSelected(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <header>
          <h2>Shared files</h2>
          <button className="icon-button" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form className="file-upload" onSubmit={upload}>
          <input type="file" onChange={(event) => setSelected(event.target.files?.[0] || null)} />
          <button>
            <Upload size={18} /> Upload
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="file-list">
          {files.map((file) => (
            <a key={file.id} href={`${API_URL}/api/files/${file.id}/download`} target="_blank" rel="noreferrer">
              <span>{file.originalName}</span>
              <small>{Math.ceil(file.size / 1024)} KB</small>
              <Download size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
