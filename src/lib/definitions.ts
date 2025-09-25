export type FileType = 'image' | 'video' | 'audio' | 'document';

export type MediaFile = {
  id: string;
  name: string;
  type: FileType;
  size: string;
  dateAdded: string;
  tags: string[];
  url: string;
};
