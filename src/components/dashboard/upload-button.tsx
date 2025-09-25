'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Loader2, FileUp, Sparkles, AlertCircle } from 'lucide-react';
import type { MediaFile } from '@/lib/definitions';
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setTags([]);

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          handleGenerateTags(reader.result as string, selectedFile.type);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
        // For non-image files, we might not get a visual preview, but we can still generate tags if we can convert it to base64.
        const reader = new FileReader();
        reader.onloadend = () => {
          handleGenerateTags(reader.result as string, selectedFile.type);
        };
        reader.readAsDataURL(selectedFile);
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

  const handleUpload = () => {
    if (!file) return;
    
    // Simulate upload
    setIsLoading(true);
    setTimeout(() => {
        const newFile: MediaFile = {
            id: `new-${Date.now()}`,
            name: file.name,
            type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'document',
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            dateAdded: new Date().toISOString(),
            tags: tags,
            url: preview || '#',
        };

        onUploadSuccess(newFile);
        setIsLoading(false);
        resetState();
        toast({
            title: "Upload Successful!",
            description: `${file.name} has been added to your drive.`,
        });
    }, 1500);

  };

  const resetState = () => {
    setFile(null);
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
            ) : file ? (
              <div className="text-center">
                <FileUp className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.type}</p>
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
              disabled={isLoading}
            />
          </div>
          {file && (
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
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading && preview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isLoading && preview ? 'Uploading...' : 'Upload File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
