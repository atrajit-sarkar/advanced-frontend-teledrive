'use client';

import Image from 'next/image';
import { FileText, ImageIcon, MoreHorizontal, Music, Video } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import type { MediaFile, FileType } from '@/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const fileTypeIcons: Record<FileType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
};

interface FileCardProps {
  file: MediaFile;
  viewMode: 'grid' | 'list';
  onDownload?: (file: MediaFile) => void;
  onRename?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
  onPreview?: (file: MediaFile) => void;
}

export default function FileCard({ file, viewMode, onDownload, onRename, onDelete, onPreview }: FileCardProps) {
  const FileIcon = fileTypeIcons[file.type];
  const placeholderImage = file.type === 'image' ? PlaceHolderImages.find(p => p.id === file.id) : null;
  const hasRealImage = file.type === 'image' && file.url && file.url !== '#';

  if (viewMode === 'list') {
    return (
      <div className="group flex w-full items-center gap-4 rounded-lg border p-2 transition-colors hover:bg-muted/50">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden cursor-pointer" onClick={()=> onPreview?.(file)}>
          {hasRealImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
          ) : placeholderImage ? (
            <Image
              src={placeholderImage.imageUrl}
              alt={file.name}
              width={40}
              height={40}
              className="h-full w-full rounded-md object-cover"
              data-ai-hint={placeholderImage.imageHint}
            />
          ) : (
            <FileIcon className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 truncate">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">{file.size}</p>
        </div>
        <div className="hidden w-48 text-sm text-muted-foreground md:block">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>{formatDistanceToNow(new Date(file.dateAdded), { addSuffix: true })}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{format(new Date(file.dateAdded), "PPPpp")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          {file.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="hidden lg:inline-flex">{tag}</Badge>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDownload?.(file)}>Download</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename?.(file)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(file)} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted cursor-pointer overflow-hidden" onClick={()=> onPreview?.(file)}>
          {hasRealImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : placeholderImage ? (
            <Image
              src={placeholderImage.imageUrl}
              alt={file.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={placeholderImage.imageHint}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="truncate font-headline text-lg leading-tight">{file.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{file.size}</p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 p-4 pt-0">
        <div className="flex w-full items-center justify-between">
           <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(file.dateAdded), { addSuffix: true })}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{format(new Date(file.dateAdded), "PPPpp")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload?.(file)}>Download</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename?.(file)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(file)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-1">
          {file.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
