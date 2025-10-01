'use client';

import { useState, useTransition } from 'react';
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
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

// A criação de utilizadores é uma operação sensível e não deve ser implementada no cliente.
// Esta funcionalidade foi movida para o Firebase Console para maior segurança.
// O formulário foi deixado para fins de demonstração, mas a sua lógica foi desativada.


const userSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

type UserFormValues = z.infer<typeof userSchema>;

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();


  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: UserFormValues) => {
    startTransition(() => {
        // A lógica de criação de utilizador foi desativada no cliente por razões de segurança.
        // Os utilizadores devem ser criados através do Firebase Console (Authentication e Firestore).
        toast({
            title: 'Criação de Usuário',
            description: `A funcionalidade de criação de usuário foi desativada. O utilizador ${data.email} pode ser criado no Console do Firebase.`,
        });
        setOpen(false);
        form.reset();
        router.refresh();
    });
  };
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Criar Usuário</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie novos utilizadores no Firebase Console (separadores Authentication e Firestore). Por padrão, terão o perfil de técnico, a menos que o 'role' seja alterado para 'admin' no Firestore.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tecnico@canacontrol.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                   <FormControl>
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} {...field} />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                        >
                        {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário (Demonstração)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
