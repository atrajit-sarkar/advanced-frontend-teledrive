'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Loader2, FileUp, Sparkles, AlertCircle } from 'lucide-react';
import type { MediaFile } from '@/lib/definitions';
import { uploadFile, fetchDrive, buildDownloadUrl } from '@/lib/backend';
import { generateTags } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UploadButtonProps {
  onUploadSuccess: (file: MediaFile) => void;
}

export function UploadButton({ onUploadSuccess }: UploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null); // preview of first image only
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) {
      setFiles(list);
      setError(null);
      setTags([]);
      const first = list[0];
      if (first.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { setPreview(reader.result as string); handleGenerateTags(reader.result as string, first.type); };
        reader.readAsDataURL(first);
      } else {
        setPreview(null);
        const reader = new FileReader();
        reader.onloadend = () => { handleGenerateTags(reader.result as string, first.type); };
        reader.readAsDataURL(first);
      }
    }
  };

  const handleGenerateTags = async (dataUri: string, mediaType: string) => {
    setIsLoading(true);
    const result = await generateTags({
      mediaDataUri: dataUri,
      mediaType: 'image', // Simplified for this example
    });
    setIsLoading(false);

    if (result.success && result.tags) {
      setTags(result.tags);
    } else {
      setError(result.error || 'Failed to generate tags.');
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setIsLoading(true); setError(null);
    try {
      for (const f of files) {
        await uploadFile(f, null);
        const nodes = await fetchDrive(null);
        const latest = nodes.filter(n=>n.type==='file').sort((a,b)=>b.id - a.id)[0];
        if (latest) {
          const name = latest.name;
          const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
          const newFile: MediaFile = {
            id: String(latest.id),
            name,
            type: isImg ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'document',
            size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
            dateAdded: new Date().toISOString(),
            tags: tags,
            url: isImg && latest.message_id ? buildDownloadUrl(latest.message_id, true) : '#',
            messageId: latest.message_id,
            folderId: latest.parent_id ?? null,
          };
          onUploadSuccess(newFile);
        }
      }
      toast({ title: 'Upload Complete', description: `${files.length} file(s) uploaded.` });
      resetState();
    } catch (err:any) { setError(err.message || 'Upload failed'); }
    finally { setIsLoading(false); }
  };

  const resetState = () => {
  setFiles([]);
    setPreview(null);
    setTags([]);
    setIsLoading(false);
    setError(null);
    setIsOpen(false);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) { resetState(); } 
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Upload Media</DialogTitle>
          <DialogDescription>Select a file to upload to your TeleDrive.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div
            className="flex h-48 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 text-center transition-colors hover:bg-primary/20"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <Image src={preview} alt="File preview" width={192} height={192} className="h-full w-auto object-contain rounded-md" />
            ) : files.length ? (
              <div className="text-center">
                <FileUp className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-semibold">{files.length} file(s) selected</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{files[0].name}</p>
              </div>
            ) : (
               <div className="text-center">
                <FileUp className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-semibold">Click to browse or drag file here</p>
              </div>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
              disabled={isLoading}
            />
          </div>
          {files.length > 0 && (
            <div>
              <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500"/> AI Suggested Tags</h4>
              <div className="mt-2 flex min-h-[40px] flex-wrap items-center gap-2">
                {isLoading && !error && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Analyzing content...</p>}
                {!isLoading && tags.length > 0 && tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                {!isLoading && tags.length === 0 && !error && <p className="text-sm text-muted-foreground">No tags suggested. You can add them later.</p>}
                 {error && (
                    <Alert variant="destructive" className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetState}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!files.length || isLoading}>
            {isLoading && preview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isLoading && preview ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
