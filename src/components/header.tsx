import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { PlusCircle } from 'lucide-react';
import { AddAreaDialog } from './add-area-dialog';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">
          CanaControl
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <AddAreaDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Área
          </Button>
        </AddAreaDialog>
      </div>
    </header>
  );
}
