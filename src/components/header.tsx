
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { PlusCircle, LogOut, UserPlus, LineChart, Settings } from 'lucide-react';
import { AddAreaDialog } from './add-area-dialog';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChangePasswordDialog } from './change-password-dialog';
import { CreateUserDialog } from './create-user-dialog';
import Link from 'next/link';


export function Header() {
  const { user, signOut } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userInitial = user?.name ? user.name[0].toUpperCase() : '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">
          CanaControl
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {isAdmin && (
            <AddAreaDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Área
            </Button>
            </AddAreaDialog>
        )}
        {isAdmin && (
          <Button asChild variant="outline">
              <Link href="/reports">
                  <LineChart className="mr-2 h-4 w-4" />
                  Relatórios
              </Link>
          </Button>
        )}
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.name ?? ''} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ChangePasswordDialog />
            {isAdmin && <CreateUserDialog />}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
