'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useFormState } from 'react-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, WandSparkles } from 'lucide-react';
import { addInspectionAction, getAISuggestionsAction } from '@/app/actions';
import type { Area } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const inspectionSchema = z.object({
  heightCm: z.coerce.number().min(1, "Altura é obrigatória."),
  observations: z.string().optional(),
  atSize: z.boolean().default(false),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectAreaDialogProps {
  children: ReactNode;
  area: Area;
}

export function InspectAreaDialog({ children, area }: InspectAreaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, startAiTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      heightCm: 0,
      observations: '',
      atSize: false,
    },
  });

  const [state, formAction] = useFormState(addInspectionAction.bind(null, area.id), { message: '', errors: {} });

  const onSubmit = (data: InspectionFormValues) => {
    const formData = new FormData();
    formData.append('heightCm', data.heightCm.toString());
    formData.append('observations', data.observations || '');
    if (data.atSize) {
      formData.append('atSize', 'on');
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleGetSuggestions = () => {
    const heightCm = form.getValues('heightCm');
    if (!heightCm || heightCm <= 0) {
      form.setError('heightCm', { message: 'Informe a altura para obter sugestões.' });
      return;
    }
    
    startAiTransition(async () => {
      const result = await getAISuggestionsAction(heightCm, area.id);
      if(result?.suggestions) {
        const suggestionsText = result.suggestions.join('\n');
        const currentObs = form.getValues('observations');
        form.setValue('observations', `${currentObs ? currentObs + '\n' : ''}${suggestionsText}`);
      } else {
        toast({
          title: 'Sugestão IA',
          description: 'Não foi possível obter sugestões no momento.',
          variant: 'destructive',
        });
      }
    });
  }

  if (state.message && !isPending) {
    toast({
      title: 'Vistoria de Área',
      description: state.message,
      variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
    });
    if (!state.errors || Object.keys(state.errors).length === 0) {
      setOpen(false);
      form.reset();
    }
    state.message = '';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Realizar Vistoria</DialogTitle>
          <DialogDescription>
            {`Área: ${area.sectorLote} - ${area.plots}. Data: ${format(new Date(), 'PPP', { locale: ptBR })}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="heightCm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura da Cana (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 150" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Observações</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={handleGetSuggestions} disabled={isAiLoading}>
                      {isAiLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <WandSparkles className="mr-2 h-4 w-4 text-accent" />
                      )}
                      Sugerir
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o que foi observado..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="atSize"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Cana está no porte?
                    </FormLabel>
                     <p className="text-sm text-muted-foreground">
                      Marque se a cana atingiu a altura esperada. Se não, uma nova vistoria será agendada em 20 dias.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Vistoria
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
