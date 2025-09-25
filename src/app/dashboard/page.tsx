'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Filter,
  ImageIcon,
  LayoutGrid,
  List,
  LogOut,
  Music,
  Search,
  Settings,
  Video,
  X,
} from 'lucide-react';

import type { MediaFile, FileType } from '@/lib/definitions';
import { mockFiles } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from '@/components/logo';
import FileCard from '@/components/dashboard/file-card';
import { UploadButton } from '@/components/dashboard/upload-button';

const fileTypeIcons: Record<FileType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
};

export default function DashboardPage() {
  const router = useRouter();
  const [files, setFiles] = useState<MediaFile[]>(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FileType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (filterType === 'all') return true;
        return file.type === filterType;
      })
      .filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [files, searchTerm, filterType]);

  const handleAddFile = (newFile: MediaFile) => {
    setFiles((prevFiles) => [newFile, ...prevFiles]);
  };

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
                                <Label htmlFor={`filter-mobile-${type}`} className="capitalize">
                                {type}
                                </Label>
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
                    <AvatarImage src={PlaceHolderImages.find(p => p.id === "user-avatar")?.imageUrl} alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
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
             <h1 className="text-2xl font-headline font-bold tracking-tight">
              My Drive
            </h1>
            <p className="text-sm text-muted-foreground">{filteredFiles.length} items</p>
          </div>
          {filteredFiles.length > 0 ? (
            <div
              className={cn(
                'mt-6',
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : 'flex flex-col gap-2'
              )}
            >
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} viewMode={viewMode} />
              ))}
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
    </div>
  );
}
