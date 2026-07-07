"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./ImageUploader.module.css";

type UploadedImage = {
  id: number;
  car_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type ImageUploaderProps = {
  carId: number;
  images: UploadedImage[];
  onRefresh: () => void;
};

export default function ImageUploader({ carId, images, onRefresh }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      setError("");
      setNotice("");

      let successCount = 0;
      const errors: string[] = [];

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch(`/api/owner/cars/${carId}/images/upload`, {
            method: "POST",
            body: formData,
          });
          const result = await res.json().catch(() => ({}));
          if (!res.ok) {
            errors.push(result.error ?? `Failed to upload ${file.name}`);
          } else {
            successCount++;
          }
        } catch {
          errors.push(`Network error uploading ${file.name}`);
        }
      }

      setUploading(false);

      if (successCount > 0) {
        setNotice(`${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully.`);
        onRefresh();
      }
      if (errors.length > 0) {
        setError(errors.join(" | "));
      }

      // Clear the file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [carId, onRefresh]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleImageAction = async (
    imageId: number,
    action: "primary" | "up" | "down" | "delete"
  ) => {
    setError("");
    setNotice("");

    if (action === "delete" && !window.confirm("Delete this image? This cannot be undone.")) {
      return;
    }

    try {
      const method = action === "delete" ? "DELETE" : "PATCH";
      const body =
        action === "delete"
          ? { imageId }
          : action === "primary"
            ? { imageId, action: "primary" }
            : { imageId, action: "reorder", direction: action === "up" ? "up" : "down" };

      const res = await fetch(`/api/owner/cars/${carId}/images`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(result.error ?? "Action failed.");
      setNotice(result.message ?? "Done.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  return (
    <div className={styles.uploader}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${uploading ? styles.dropZoneUploading : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !uploading && fileInputRef.current?.click()}
        aria-label="Upload images"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div className={styles.dropIcon}>
          {uploading ? (
            <span className={styles.spinner} aria-label="Uploading…" />
          ) : (
            <svg width={36} height={36} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>
        <p className={styles.dropText}>
          {uploading ? "Uploading…" : "Drag & drop images here, or click to browse"}
        </p>
        <p className={styles.dropHint}>JPEG, PNG, WebP · Max 10 MB per file · Multiple allowed</p>
      </div>

      {/* Feedback */}
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.noticeError}>{error}</div> : null}

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className={styles.imageGrid}>
          {images.map((image, index) => (
            <div key={image.id} className={`${styles.imageCard} ${image.is_primary ? styles.imageCardPrimary : ""}`}>
              {image.is_primary && (
                <span className={styles.primaryBadge}>Cover</span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt={`Vehicle photo ${index + 1}`}
                className={styles.imagePreview}
              />
              <div className={styles.imageActions}>
                {!image.is_primary && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    title="Set as cover"
                    onClick={() => void handleImageAction(image.id, "primary")}
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  className={styles.actionBtn}
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => void handleImageAction(image.id, "up")}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  title="Move down"
                  disabled={index === images.length - 1}
                  onClick={() => void handleImageAction(image.id, "down")}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.actionBtnDanger}
                  title="Delete image"
                  onClick={() => void handleImageAction(image.id, "delete")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyImages}>No images uploaded yet. Add photos to attract renters.</div>
      )}
    </div>
  );
}
