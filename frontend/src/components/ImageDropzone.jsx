import { useState } from "react";
import LottieFlowIcon from "./LottieFlowIcon";

export default function ImageDropzone({ file, onFile, label = "Drag an image from your PC" }) {
  const [dragging, setDragging] = useState(false);

  return (
    <label
      className={`listing-image-dropzone ${dragging ? "is-dragging" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFile(event.dataTransfer.files?.[0] || null);
      }}
    >
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onFile(event.target.files?.[0] || null)} />
      <span className="listing-image-drop-icon"><LottieFlowIcon name="success" /></span>
      <strong>{file ? file.name : label}</strong>
      <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected` : "or click to browse · PNG, JPEG or WebP · max 6 MB"}</small>
    </label>
  );
}
