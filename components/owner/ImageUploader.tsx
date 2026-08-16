"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [dragOverZone, setDragOverZone] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for drag & drop reordering
  const [imageList, setImageList] = useState<UploadedImage[]>(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sync imageList from props
  useEffect(() => {
    setImageList(images);
  }, [images]);

  // Exit select mode when no images left
  useEffect(() => {
    if (imageList.length === 0) {
      setSelectMode(false);
      setSelectedIds(new Set());
    }
  }, [imageList.length]);

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

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [carId, onRefresh]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadFiles(e.target.files);
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setDragOverZone(false);
      void uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setDragOverZone(true);
    }
  };

  const handleDropZoneDragLeave = () => setDragOverZone(false);

  // ── Save new order ──────────────────────────────────────
  const saveNewOrder = async (newItems: UploadedImage[]) => {
    setIsReordering(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`/api/owner/cars/${carId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder_all",
          imageIds: newItems.map((img) => img.id),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Failed to save image order.");
      setNotice("Image positions updated. The first image is set as cover.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder images.");
      setImageList(images);
    } finally {
      setIsReordering(false);
    }
  };

  // ── Drag & Drop handlers ────────────────────────────────
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    if (selectMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    if (selectMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragTargetIndex !== index) setDragTargetIndex(index);
  };

  const handleItemDragLeave = (index: number) => {
    if (dragTargetIndex === index) setDragTargetIndex(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectMode) return;

    const fromIndex =
      draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData("text/plain"));

    setDraggedIndex(null);
    setDragTargetIndex(null);

    if (
      isNaN(fromIndex) ||
      fromIndex === targetIndex ||
      fromIndex < 0 ||
      fromIndex >= imageList.length
    ) return;

    const updated = [...imageList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((img, idx) => ({
      ...img,
      is_primary: idx === 0,
      display_order: idx,
    }));

    setImageList(reordered);
    void saveNewOrder(reordered);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
    setDragTargetIndex(null);
  };

  // ── Move step buttons ───────────────────────────────────
  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imageList.length) return;

    const updated = [...imageList];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    const reordered = updated.map((img, idx) => ({
      ...img,
      is_primary: idx === 0,
      display_order: idx,
    }));

    setImageList(reordered);
    void saveNewOrder(reordered);
  };

  // ── Single delete ───────────────────────────────────────
  const handleDelete = async (imageId: number) => {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/owner/cars/${carId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Failed to delete image.");
      setNotice("Image deleted successfully.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  // ── Multi-select ────────────────────────────────────────
  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
    setError("");
    setNotice("");
  };

  const toggleSelectImage = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === imageList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(imageList.map((img) => img.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} selected image${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`
      )
    ) return;

    setIsBulkDeleting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`/api/owner/cars/${carId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: Array.from(selectedIds) }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Bulk delete failed.");
      setNotice(result.message ?? "Images deleted.");
      setSelectedIds(new Set());
      setSelectMode(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const allSelected = imageList.length > 0 && selectedIds.size === imageList.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className={styles.uploader}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${dragOverZone ? styles.dropZoneActive : ""} ${uploading ? styles.dropZoneUploading : ""}`}
        onDrop={handleDropZoneDrop}
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
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
          {uploading ? "Uploading…" : "Drag & drop new images here, or click to browse"}
        </p>
        <p className={styles.dropHint}>JPEG, PNG, WebP · Max 10 MB per file · Multiple allowed</p>
      </div>

      {/* Feedback */}
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.noticeError}>{error}</div> : null}

      {/* Toolbar row: reorder hint + select toggle */}
      {imageList.length > 0 && (
        <div className={styles.toolbar}>
          {/* Left: hint text */}
          {!selectMode ? (
            <div className={styles.reorderTitleGroup}>
              <span className={styles.reorderIcon}>⋮⋮</span>
              <span className={styles.reorderText}>
                Drag to rearrange · <strong>First image = Cover</strong>
              </span>
              {isReordering && <span className={styles.reorderSaving}>Saving…</span>}
            </div>
          ) : (
            <div className={styles.reorderTitleGroup}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  className={styles.selectAllCheckbox}
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                {allSelected ? "Deselect all" : "Select all"}
              </label>
              {someSelected && (
                <span className={styles.selectedCount}>
                  {selectedIds.size} selected
                </span>
              )}
            </div>
          )}

          {/* Right: toggle + bulk delete */}
          <div className={styles.toolbarRight}>
            {selectMode && someSelected && (
              <button
                type="button"
                className={styles.bulkDeleteBtn}
                disabled={isBulkDeleting}
                onClick={() => void handleBulkDelete()}
              >
                {isBulkDeleting ? (
                  <span className={styles.spinnerSmall} />
                ) : (
                  <svg width={14} height={14} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7z" />
                  </svg>
                )}
                Delete {selectedIds.size} image{selectedIds.size > 1 ? "s" : ""}
              </button>
            )}
            <button
              type="button"
              className={selectMode ? styles.selectToggleActive : styles.selectToggle}
              onClick={toggleSelectMode}
              title={selectMode ? "Exit selection mode" : "Select multiple images"}
            >
              {selectMode ? (
                <>
                  <svg width={14} height={14} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                  Select
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {imageList.length > 0 ? (
        <div className={styles.imageGrid}>
          {imageList.map((image, index) => {
            const isCover = index === 0;
            const isBeingDragged = draggedIndex === index;
            const isDragTarget = dragTargetIndex === index;
            const isSelected = selectedIds.has(image.id);

            return (
              <div
                key={image.id}
                draggable={!selectMode}
                onDragStart={(e) => handleItemDragStart(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDragLeave={() => handleItemDragLeave(index)}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleItemDragEnd}
                onClick={() => selectMode && toggleSelectImage(image.id)}
                className={[
                  styles.imageCard,
                  isCover ? styles.coverCard : "",
                  isBeingDragged ? styles.draggingCard : "",
                  isDragTarget ? styles.dragTargetCard : "",
                  selectMode ? styles.selectableCard : "",
                  isSelected ? styles.selectedCard : "",
                ].join(" ")}
              >
                {/* Multi-select Checkbox */}
                {selectMode && (
                  <div
                    className={`${styles.selectCheckbox} ${isSelected ? styles.selectCheckboxChecked : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleSelectImage(image.id); }}
                  >
                    {isSelected && (
                      <svg width={12} height={12} fill="white" viewBox="0 0 24 24" aria-hidden>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Cover Badge */}
                {isCover && !selectMode && (
                  <div className={styles.coverBadge}>
                    <svg width={12} height={12} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>COVER</span>
                  </div>
                )}

                {/* Drag Handle (hidden in select mode) */}
                {!selectMode && (
                  <div className={styles.dragHandle} title="Drag to rearrange">
                    <svg width={16} height={16} fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                    </svg>
                  </div>
                )}

                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={`Vehicle photo ${index + 1}`}
                  className={styles.imagePreview}
                />

                {/* Action buttons — hidden in select mode */}
                {!selectMode && (
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Move left"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMoveStep(index, "up")}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Move right"
                      disabled={index === imageList.length - 1 || isReordering}
                      onClick={() => handleMoveStep(index, "down")}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtnDanger}
                      title="Delete image"
                      disabled={isReordering}
                      onClick={() => void handleDelete(image.id)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyImages}>No images uploaded yet. Add photos to attract renters.</div>
      )}
    </div>
  );
}
