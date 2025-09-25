"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Filter, ImageIcon, LayoutGrid, List, LogOut, Music, Search, Settings, Video, X, CheckSquare, Square, FolderPlus, Trash2, MoveRight, ArrowLeft } from 'lucide-react';
import type { MediaFile, FileType } from '@/lib/definitions';
import { fetchDrive, buildDownloadUrl, renameFile, deleteFiles, getSessionId, avatarUrl, createFolder, bulkDelete, moveItems, fetchBreadcrumbs, renameFolder } from '@/lib/backend';
import { useAuth } from '@/context/auth-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from '@/components/logo';
import FileCard from '@/components/dashboard/file-card';
import FolderCard, { FolderEntry } from '@/components/dashboard/folder-card';
import { UploadButton } from '@/components/dashboard/upload-button';

// (Optionally used elsewhere later) Map of file type to icon component
const fileTypeIcons: Record<FileType, React.ElementType> = { image: ImageIcon, video: Video, audio: Music, document: FileText };

export default function DashboardPage() {
  const router = useRouter();
  const { me, loading, refresh } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FileType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const avatarSrc = avatarUrl();
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredFiles = useMemo(() => files
    .filter(f => (filterType === 'all' ? true : f.type === filterType))
    .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()), [files, searchTerm, filterType]);

  const breadcrumbs = useMemo(() => {
    return [] as { id: number|null; name: string }[]; // placeholder; populated via effect below
  }, [currentFolder]);

  const handleAddFile = (newFile: MediaFile) => setFiles(prev => [newFile, ...prev]);

  // Fetch drive data after authentication resolves
  useEffect(() => {
    if (loading) return;
    const sid = getSessionId();
    if (!sid && !me) { router.replace('/'); return; }
    if (sid && !me) { refresh(); return; }
    if (!me) return;
    (async () => {
      try {
        const nodes = await fetchDrive(currentFolder);
        const folderNodes = nodes.filter(n=> n.type==='folder').map(n => ({ id: n.id, name: n.name, parentId: n.parent_id, dateAdded: new Date().toISOString() }));
        const mapped: MediaFile[] = nodes.filter(n => n.type === 'file').map(n => {
          const name = n.name;
          const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
          return {
            id: String(n.id),
            name,
            type: isImg ? 'image' : 'document',
            size: '—',
            dateAdded: new Date().toISOString(),
            tags: [],
            url: n.message_id && isImg ? buildDownloadUrl(n.message_id, true) : '#',
            messageId: n.message_id,
            folderId: n.parent_id ?? null,
          };
        });
        setFolders(folderNodes);
        setFiles(mapped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [me, loading, refresh, router, currentFolder]);

  // Fetch breadcrumbs separately
  const [crumbs, setCrumbs] = useState<{id:number|null; name:string}[]>([{ id: null, name: 'My Drive' }]);
  useEffect(()=>{
    (async ()=>{
      if (currentFolder === null) { setCrumbs([{ id: null, name: 'My Drive' }]); return; }
      try {
        const items = await fetchBreadcrumbs(currentFolder);
        const converted = [{ id: null, name: 'My Drive' }, ...items.map(i=>({ id: i.id, name: i.name }))];
        setCrumbs(converted);
      } catch(e){ console.warn('Breadcrumbs failed', e); }
    })();
  }, [currentFolder]);
  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const clearSelection = () => setSelected(new Set());

  // Track selection across both folders + files; prefix ids to avoid collision (f_ for folders)
  const allItemsIds = [...folders.map(f=>`f_${f.id}`), ...filteredFiles.map(f=>f.id)];
  const allSelected = selected.size && selected.size === allItemsIds.length;

  const toggleSelectAll = () => {
    if (allSelected) clearSelection(); else setSelected(new Set(allItemsIds));
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder name'); if (!name) return;
    try { await createFolder(name, currentFolder); // Refresh
      const nodes = await fetchDrive(currentFolder);
      setFolders(nodes.filter(n=>n.type==='folder').map(n=>({ id:n.id, name:n.name, parentId:n.parent_id, dateAdded:new Date().toISOString()})));
      setFiles(nodes.filter(n=>n.type==='file').map(n=>{ const name=n.name; const isImg=/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name); return { id:String(n.id), name, type:isImg?'image':'document', size:'—', dateAdded:new Date().toISOString(), tags:[], url:n.message_id && isImg? buildDownloadUrl(n.message_id,true):'#', messageId:n.message_id, folderId:n.parent_id??null }; }));
    } catch (e:any) { alert(e.message); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return; if(!confirm(`Delete ${selected.size} selected item(s)?`)) return;
    const fileIds = Array.from(selected).filter(id=>!id.startsWith('f_')).map(id=>Number(id));
    const folderIds = Array.from(selected).filter(id=>id.startsWith('f_')).map(id=>Number(id.slice(2)));
    try { await bulkDelete(fileIds, folderIds); setFiles(fs=>fs.filter(f=>!selected.has(f.id))); setFolders(fs=>fs.filter(f=>!selected.has(`f_${f.id}`))); clearSelection(); } catch(e:any){ alert(e.message);} };

  const handleMove = async () => {
    const target = prompt('Target folder id (blank for root)'); if (target === null) return;
    const targetId = target.trim() === '' ? null : Number(target);
    const fileIds = Array.from(selected).filter(id=>!id.startsWith('f_')).map(id=>Number(id));
    const folderIds = Array.from(selected).filter(id=>id.startsWith('f_')).map(id=>Number(id.slice(2)));
    try { await moveItems(fileIds, folderIds, targetId); clearSelection(); const nodes=await fetchDrive(currentFolder); setFolders(nodes.filter(n=>n.type==='folder').map(n=>({ id:n.id, name:n.name, parentId:n.parent_id, dateAdded:new Date().toISOString()}))); setFiles(nodes.filter(n=>n.type==='file').map(n=>{ const name=n.name; const isImg=/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name); return { id:String(n.id), name, type:isImg?'image':'document', size:'—', dateAdded:new Date().toISOString(), tags:[], url:n.message_id && isImg? buildDownloadUrl(n.message_id,true):'#', messageId:n.message_id, folderId:n.parent_id??null }; })); } catch(e:any){ alert(e.message);} };
  const openFolder = (folder: FolderEntry) => { setCurrentFolder(folder.id); clearSelection(); };
  const goUp = () => { if (crumbs.length > 1) { const parentCrumb = crumbs[crumbs.length - 2]; setCurrentFolder(parentCrumb.id); clearSelection(); } };

  const renameFolderInline = async (folder: FolderEntry, newName: string) => {
    try { await renameFolder(folder.id, newName); setFolders(fs=> fs.map(f=> f.id===folder.id ? { ...f, name:newName } : f)); }
    catch(e:any){ alert(e.message);} }

  // Drag & drop move (files & folders)
  const onDragStartFile = (e: React.DragEvent, file: MediaFile) => {
    const ids = selected.has(file.id) ? Array.from(selected) : [file.id];
    e.dataTransfer.setData('application/td-items', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragStartFolder = (e: React.DragEvent, folder: FolderEntry) => {
    const fid = `f_${folder.id}`;
    const ids = selected.has(fid) ? Array.from(selected) : [fid];
    e.dataTransfer.setData('application/td-items', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDropFolder = async (e: React.DragEvent, target: FolderEntry) => {
    e.preventDefault();
    try { const data = e.dataTransfer.getData('application/td-items'); if(!data) return; const ids: string[] = JSON.parse(data); const fileIds = ids.filter(i=>!i.startsWith('f_')).map(i=>Number(i)); const folderIds = ids.filter(i=>i.startsWith('f_')).map(i=>Number(i.slice(2))); await moveItems(fileIds, folderIds, target.id); clearSelection(); const nodes=await fetchDrive(currentFolder); setFolders(nodes.filter(n=>n.type==='folder').map(n=>({ id:n.id, name:n.name, parentId:n.parent_id, dateAdded:new Date().toISOString()}))); setFiles(nodes.filter(n=>n.type==='file').map(n=>{ const name=n.name; const isImg=/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name); return { id:String(n.id), name, type:isImg?'image':'document', size:'—', dateAdded:new Date().toISOString(), tags:[], url:n.message_id && isImg? buildDownloadUrl(n.message_id,true):'#', messageId:n.message_id, folderId:n.parent_id??null }; })); } catch(err){ console.error(err);} }
  const onDragOverFolder = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect='move'; };

  const onDropRoot = async(e: React.DragEvent) => {
    e.preventDefault();
    try { const data = e.dataTransfer.getData('application/td-items'); if(!data) return; const ids: string[] = JSON.parse(data); const fileIds = ids.filter(i=>!i.startsWith('f_')).map(i=>Number(i)); const folderIds = ids.filter(i=>i.startsWith('f_')).map(i=>Number(i.slice(2))); await moveItems(fileIds, folderIds, null); clearSelection(); const nodes=await fetchDrive(null); setFolders(nodes.filter(n=>n.type==='folder').map(n=>({ id:n.id, name:n.name, parentId:n.parent_id, dateAdded:new Date().toISOString()}))); setFiles(nodes.filter(n=>n.type==='file').map(n=>{ const name=n.name; const isImg=/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name); return { id:String(n.id), name, type:isImg?'image':'document', size:'—', dateAdded:new Date().toISOString(), tags:[], url:n.message_id && isImg? buildDownloadUrl(n.message_id,true):'#', messageId:n.message_id, folderId:n.parent_id??null }; })); } catch(err){ console.error(err);} }
  const onDragOverRoot = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDownload = (file: MediaFile) => {
    if (!file.messageId) return;
    const url = buildDownloadUrl(file.messageId, false);
    window.open(url, '_blank');
  };

  const handleRename = async (file: MediaFile) => {
    const name = prompt('Rename file', file.name);
    if (!name || name === file.name) return;
    try {
      await renameFile(Number(file.id), name);
      setFiles(fs => fs.map(f => f.id === file.id ? { ...f, name } : f));
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    try {
      await deleteFiles([Number(file.id)]);
      setFiles(fs => fs.filter(f => f.id !== file.id));
    } catch (e: any) { alert(e.message); }
  };

  const handlePreview = (file: MediaFile) => { if (file.type === 'image') setPreviewFile(file); else handleDownload(file); };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r bg-slate-50/50 dark:bg-card/20 lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="flex flex-col gap-4">
            <h3 className="px-2 font-headline text-lg font-semibold">Filters</h3>
            <div className="rounded-lg border p-4">
              <Label className="text-base">File Type</Label>
              <RadioGroup
                defaultValue="all"
                className="mt-2 grid grid-cols-2 gap-2"
                onValueChange={(value) => setFilterType(value as FileType | 'all')}
              >
                {(['all', 'image', 'video', 'audio', 'document'] as const).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`filter-${type}`} />
                    <Label htmlFor={`filter-${type}`} className="capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {/* More filters can be added here */}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2">
                    <Switch id="dark-mode" onCheckedChange={(checked) => document.documentElement.classList.toggle('dark', checked)} />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                </div>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="lg:hidden">
                <Filter className="h-5 w-5" />
                <span className="sr-only">Open filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-headline text-2xl"><Logo /></SheetTitle>
                <SheetDescription>Filter your media files.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-4">
                  <h3 className="px-2 font-headline text-lg font-semibold">Filters</h3>
                  <div className="rounded-lg border p-4">
                    <Label className="text-base">File Type</Label>
                    <RadioGroup
                      defaultValue="all"
                      className="mt-2 grid grid-cols-2 gap-2"
                      onValueChange={(value) => setFilterType(value as FileType | 'all')}
                    >
                      {(['all', 'image', 'video', 'audio', 'document'] as const).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`filter-mobile-${type}`} />
                          <Label htmlFor={`filter-mobile-${type}`} className="capitalize">{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="w-full rounded-lg bg-white pl-9 shadow-none dark:bg-card md:w-80"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
             <UploadButton onUploadSuccess={handleAddFile} />
             <Button variant="outline" size="icon" onClick={handleCreateFolder} title="New Folder"><FolderPlus className="h-4 w-4" /></Button>
             {selected.size > 0 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handleBulkDelete} title="Delete Selected"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <Button variant="outline" size="icon" onClick={handleMove} title="Move Selected"><MoveRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={toggleSelectAll} title="Toggle Select All">
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </Button>
              </div>
             )}

            <TooltipProvider>
              <div className="flex items-center rounded-md border bg-slate-50/50 p-1 dark:bg-card/20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-8" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={avatarSrc || PlaceHolderImages.find(p => p.id === 'user-avatar')?.imageUrl} alt="User Avatar" />
                    <AvatarFallback>{me?.first_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/')}> 
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {currentFolder !== null && (
                <Button size="icon" variant="ghost" onClick={goUp} title="Up one level"><ArrowLeft className="h-4 w-4"/></Button>
              )}
              <nav className="flex items-center gap-1 text-sm">
                {crumbs.map((c, idx) => (
                  <div key={c.id ?? 'root'} className="flex items-center gap-1">
                    <button className={cn('px-1 rounded hover:bg-muted', idx === crumbs.length-1 && 'font-semibold')} onClick={()=> setCurrentFolder(c.id)}>{c.name}</button>
                    {idx < crumbs.length -1 && <span className="text-muted-foreground">/</span>}
                  </div>
                ))}
              </nav>
            </div>
            <p className="text-sm text-muted-foreground">{folders.length + filteredFiles.length} items</p>
          </div>
          {filteredFiles.length > 0 ? (
            <div
              className={cn(
                'mt-6',
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : 'flex flex-col gap-2'
              )}
              onDragOver={currentFolder===null?onDragOverRoot:undefined}
              onDrop={currentFolder===null?onDropRoot:undefined}
            >
               {/* Folders first */}
               {folders.map(folder => {
                 const fid = `f_${folder.id}`;
                 const isSelected = selected.has(fid);
                 return (
                  <div key={fid} className={cn('relative', isSelected && 'ring-2 ring-primary')} onClick={(e)=>{ if(e.metaKey|| e.ctrlKey){ toggleSelect(fid); } }} onDoubleClick={()=> openFolder(folder)}>
                    {selected.size > 0 && (
                      <button type="button" onClick={(e)=>{ e.stopPropagation(); toggleSelect(fid); }} className="absolute top-2 left-2 z-10 rounded bg-background/70 p-1 shadow">
                        {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    <FolderCard
                      folder={folder}
                      viewMode={viewMode}
                      selected={isSelected}
                      onOpen={openFolder}
                      onRename={renameFolderInline}
                      onDelete={(f)=>{ if(confirm('Delete folder? (must be empty)')) { bulkDelete([], [f.id]).then(()=>{ setFolders(fs=> fs.filter(x=>x.id!==f.id)); }); } }}
                      onToggleSelect={()=> toggleSelect(fid)}
                      selectionActive={selected.size>0}
                      draggable
                      onDragStart={onDragStartFolder}
                      onDropOnFolder={onDropFolder}
                      onDragOverFolder={onDragOverFolder}
                    />
                  </div>
                 );
               })}
               {/* Files */}
               {filteredFiles.map(file => {
                 const isSelected = selected.has(file.id);
                 return (
                  <div key={file.id} className={cn('relative', isSelected && 'ring-2 ring-primary')} draggable onDragStart={(e)=> onDragStartFile(e, file)} onClick={(e)=>{ if(e.metaKey|| e.ctrlKey){ toggleSelect(file.id); } }} onDoubleClick={()=>handlePreview(file)}>
                    {selected.size > 0 && (
                      <button type="button" onClick={(e)=>{ e.stopPropagation(); toggleSelect(file.id); }} className="absolute top-2 left-2 z-10 rounded bg-background/70 p-1 shadow">
                        {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    <FileCard
                      file={file}
                      viewMode={viewMode}
                      onDownload={handleDownload}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onPreview={handlePreview}
                    />
                  </div>
                 );
               })}
            </div>
          ) : (
             <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="rounded-full border-8 border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <Search className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold font-headline">No Files Found</h2>
              <p className="mt-2 text-muted-foreground">
                Your search for "{searchTerm}" in {filterType} files returned no results.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Search & Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    <Dialog open={!!previewFile} onOpenChange={(o) => { if (!o) setPreviewFile(null); }}>
      <DialogContent className="max-w-4xl p-2 bg-background">
        {previewFile && (
          <>
            <DialogTitle className="sr-only">{previewFile.name}</DialogTitle>
            {previewFile.messageId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={buildDownloadUrl(previewFile.messageId, true)}
                alt={previewFile.name}
                className="max-h-[80vh] w-auto mx-auto rounded"
              />
            )}
            <p className="mt-2 text-center text-sm text-muted-foreground truncate" title={previewFile.name}>{previewFile.name}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
    </div>
  );
}
