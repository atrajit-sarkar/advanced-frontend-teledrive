"use client";

import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface FolderEntry {
  id: number;
  name: string;
  parentId: number | null;
  dateAdded: string; // synthetic timestamp like files for sorting display
}

interface FolderCardProps {
  folder: FolderEntry;
  viewMode: 'grid' | 'list';
  selected?: boolean;
  onOpen?: (folder: FolderEntry) => void;
  onRename?: (folder: FolderEntry, newName: string) => void;
  onDelete?: (folder: FolderEntry) => void;
  onToggleSelect?: (folder: FolderEntry) => void;
  selectionActive?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, folder: FolderEntry) => void;
  onDropOnFolder?: (e: React.DragEvent, folder: FolderEntry) => void;
  onDragOverFolder?: (e: React.DragEvent, folder: FolderEntry) => void;
}

export default function FolderCard({ folder, viewMode, selected, onOpen, onRename, onDelete, onToggleSelect, selectionActive, draggable, onDragStart, onDropOnFolder, onDragOverFolder }: FolderCardProps) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(folder.name);

  const commitRename = () => {
    const name = tempName.trim();
    if (name && name !== folder.name) onRename?.(folder, name);
    setEditing(false);
  };

  if (viewMode === 'list') {
    return (
      <div
        className={cn('group flex w-full items-center gap-4 rounded-lg border p-2 transition-colors hover:bg-muted/50', selected && 'ring-2 ring-primary')}
        onDoubleClick={() => onOpen?.(folder)}
        draggable={draggable}
        onDragStart={(e)=> onDragStart?.(e, folder)}
        onDragOver={(e)=> onDragOverFolder?.(e, folder)}
        onDrop={(e)=> onDropOnFolder?.(e, folder)}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted cursor-pointer" onClick={()=> selectionActive ? onToggleSelect?.(folder) : onOpen?.(folder)}>
          <Folder className="h-6 w-6" />
        </div>
        <div className="flex-1 truncate">
          {editing ? (
            <input
              autoFocus
              className="w-full rounded border bg-background px-1 text-sm"
              value={tempName}
              onChange={(e)=> setTempName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e)=>{ if(e.key==='Enter') commitRename(); if(e.key==='Escape'){ setTempName(folder.name); setEditing(false);} }}
            />
          ) : (
            <p className="truncate font-medium" onDoubleClick={()=> setEditing(true)}>{folder.name}</p>
          )}
          <p className="text-xs text-muted-foreground">Folder</p>
        </div>
        <div className="hidden w-48 text-xs text-muted-foreground md:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{formatDistanceToNow(new Date(folder.dateAdded), { addSuffix:true })}</span>
              </TooltipTrigger>
              <TooltipContent>{format(new Date(folder.dateAdded), 'PPPpp')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={()=> setEditing(true)}><Pencil className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={()=> onDelete?.(folder)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card
      className={cn('group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer', selected && 'ring-2 ring-primary')}
      onDoubleClick={()=> onOpen?.(folder)}
      draggable={draggable}
      onDragStart={(e)=> onDragStart?.(e, folder)}
      onDragOver={(e)=> onDragOverFolder?.(e, folder)}
      onDrop={(e)=> onDropOnFolder?.(e, folder)}
    >
      <CardHeader className="p-0">
        <div className="flex aspect-video items-center justify-center bg-muted">
          <Folder className="h-14 w-14 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {editing ? (
          <input
            autoFocus
            className="w-full rounded border bg-background px-1 text-sm"
            value={tempName}
            onChange={(e)=> setTempName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e)=>{ if(e.key==='Enter') commitRename(); if(e.key==='Escape'){ setTempName(folder.name); setEditing(false);} }}
          />
        ) : (
          <CardTitle className="truncate font-headline text-lg leading-tight" onDoubleClick={()=> setEditing(true)}>{folder.name}</CardTitle>
        )}
        <p className="text-xs text-muted-foreground mt-1">Folder</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-2 pt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(folder.dateAdded), { addSuffix:true })}</span>
            </TooltipTrigger>
            <TooltipContent>{format(new Date(folder.dateAdded), 'PPPpp')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={()=> setEditing(true)}><Pencil className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={()=> onDelete?.(folder)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}