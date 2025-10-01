'use client';

import { useState, useTransition, type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addAreaAction, updateAreaAction } from '@/app/actions';
import type { Area } from '@/lib/types';

const areaSchema = z.object({
  sectorLote: z.string().min(1, 'Setor/Lote é obrigatório.'),
  plots: z.string().min(1, 'Talhões são obrigatórios.'),
  plantingDate: z.date({
    required_error: 'A data de fim de plantio é obrigatória.',
  }),
});

type AreaFormValues = z.infer<typeof areaSchema>;

interface AddAreaDialogProps {
  children: ReactNode;
  area?: Area;
}

export function AddAreaDialog({ children, area }: AddAreaDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: area
      ? {
          sectorLote: area.sectorLote,
          plots: area.plots,
          plantingDate: new Date(area.plantingDate),
        }
      : {
          sectorLote: '',
          plots: '',
          plantingDate: undefined,
        },
  });

  const onSubmit = (data: AreaFormValues) => {
    const formData = new FormData();
    formData.append('sectorLote', data.sectorLote);
    formData.append('plots', data.plots);
    formData.append('plantingDate', format(data.plantingDate, 'yyyy-MM-dd'));

    startTransition(async () => {
      const action = area ? updateAreaAction.bind(null, area.id) : addAreaAction;
      const state = await action({ message: '', errors: {} }, formData);

      toast({
        title: area ? 'Atualização de Área' : 'Cadastro de Área',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });

      if (!state.errors || Object.keys(state.errors).length === 0) {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{area ? 'Editar Área' : 'Adicionar Nova Área'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da área de plantio. A primeira vistoria será agendada 90 dias após a data de fim do plantio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sectorLote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor/Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: S1/L01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Talhões</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: T01, T02" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plantingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Fim de Plantio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {area ? 'Salvar Alterações' : 'Cadastrar Área'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
