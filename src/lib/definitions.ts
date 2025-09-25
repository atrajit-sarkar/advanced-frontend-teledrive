export type FileType = 'image' | 'video' | 'audio' | 'document';

export type MediaFile = {
  /** Local unique id (maps to backend FileEntry id) */
  id: string;
  /** Display name */
  name: string;
  /** Derived file classification */
  type: FileType;
  /** Pretty size string (may be unknown if not provided by backend) */
  size: string;
  /** ISO timestamp when added (best effort) */
  dateAdded: string;
  /** User / AI tags */
  tags: string[];
  /** Download / preview URL */
  url: string;
  /** Backend Telegram message id for download */
  messageId?: number;
  /** Original folder id (for future folder navigation) */
  folderId?: number | null;
};
