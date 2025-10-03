'use client';

import { useState, useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, CalendarPlus, Loader2 } from 'lucide-react';
import { AddAreaDialog } from './add-area-dialog';
import type { Area } from '@/lib/types';
import { deleteArea, updateArea } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface AreaActionsProps {
  area: Area;
}

function RescheduleDialog({ area }: { area: Area }) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date(area.nextInspectionDate));
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleReschedule = () => {
        if (!date) {
            toast({ title: 'Erro', description: 'Por favor, selecione uma data.', variant: 'destructive'});
            return;
        }
        startTransition(async () => {
            const newDate = date.toISOString().split('T')[0];
            try {
                const payload = { nextInspectionDate: newDate, status: 'Agendada' as const };
                await updateArea(area.id, payload);

                toast({ title: 'Reagendamento', description: 'Vistoria reagendada com sucesso.' });
                setOpen(false);
                window.dispatchEvent(new Event('refresh-data'));
                router.refresh();
            } catch (error: any) {
                if (process.env.NODE_ENV !== 'development') {
                  toast({ title: 'Erro', description: 'Falha ao reagendar vistoria.', variant: 'destructive'});
                }
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    <span>Adiantar/Reagendar</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adiantar/Reagendar Vistoria</DialogTitle>
                    <DialogDescription>
                        Selecione a nova data para a vistoria da área ${area.sectorLote}.
                        <br />
                        Data atual: {format(new Date(area.nextInspectionDate), 'PPP', { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        initialFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleReschedule} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Nova Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AreaActions({ area }: AreaActionsProps) {
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteArea(area.id);
        toast({
            title: 'Exclusão de Área',
            description: 'Área excluída com sucesso.',
        });
        setAlertOpen(false);
        window.dispatchEvent(new Event('refresh-data'));
        router.refresh();
      } catch (error: any) {
         if (process.env.NODE_ENV !== 'development') {
             toast({
                title: 'Erro de Exclusão',
                description: 'Falha ao excluir área.',
                variant: 'destructive',
            });
         }
      }
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <AddAreaDialog area={area}>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Editar</span>
                </div>
            </AddAreaDialog>
          )}
          {area.status !== 'Concluída' && (
             <RescheduleDialog area={area} />
          )}
          {isAdmin && (
            <DropdownMenuItem onSelect={() => setAlertOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a área
              <span className="font-semibold">{` ${area.sectorLote} - ${area.plots} `}</span>
              e todos os seus dados de vistorias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
