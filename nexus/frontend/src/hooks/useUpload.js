/**
 * hooks/useUpload.js
 * Thin wrapper around the /api/uploads/image endpoint.
 * Returns { upload(file) → url|null, uploading, error }
 */
import { useState, useCallback } from "react";
import { getToken } from "../api/index.js";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const upload = useCallback(async (file) => {
    if (!file) return null;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/uploads/image", {
        method:  "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Upload failed (${res.status})`);
      return data.url;          // e.g. "/uploads/abc123.jpg"
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
