import Link from 'next/link';
import { Utensils, MonitorSmartphone, ConciergeBell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-6 mb-8 border-b border-border">
      <div className="container mx-auto flex items-center justify-between max-w-7xl px-4">
        <Link href="/" className="flex items-center gap-3">
          <Utensils className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">MenuQuick</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <p className="text-sm text-muted-foreground hidden md:block">Your Quick & Smart Menu Solution</p>
          <Link href="/kds" passHref>
            <Button variant="outline" size="sm" className="flex items-center">
              <MonitorSmartphone className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">KDS</span>
            </Button>
          </Link>
          <Link href="/waiter" passHref>
            <Button variant="outline" size="sm" className="flex items-center">
              <ConciergeBell className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Waiter</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
