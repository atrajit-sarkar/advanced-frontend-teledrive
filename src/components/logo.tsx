import { Cloud } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-primary p-2 text-primary-foreground">
        <Cloud className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold font-headline tracking-tight">TeleDrive</span>
    </div>
  );
}
