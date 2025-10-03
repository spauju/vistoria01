'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getAppSettings, addRecipientEmail, removeRecipientEmail } from '@/lib/data';
import type { AppSettings } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Mail, Trash2, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const emailSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

function SettingsSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const fetchSettings = () => {
    setLoading(true);
    getAppSettings().then(data => {
        setSettings(data);
    }).catch(error => {
        // Errors are now handled by the global error listener
        // We can optionally show a toast here if we want to inform the user
        // but the main debugging info comes from the listener.
        toast({ title: 'Erro', description: 'Não foi possível carregar as configurações.', variant: 'destructive' });
    }).finally(() => {
        setLoading(false);
    });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchSettings();
      }
    }
  }, [user, authLoading, router]);

  const handleAddEmail = (data: EmailFormValues) => {
    if (settings?.recipientEmails.includes(data.email)) {
      form.setError('email', { message: 'Este email já está na lista.' });
      return;
    }

    startTransition(async () => {
      try {
        await addRecipientEmail(data.email);
        toast({ title: 'Sucesso', description: 'Email adicionado à lista de notificações.' });
        form.reset();
        fetchSettings();
      } catch (error) {
        // The global listener will throw in dev mode. 
        // This toast is a fallback for production.
        if (process.env.NODE_ENV !== 'development') {
            toast({ title: 'Erro', description: 'Não foi possível adicionar o email.', variant: 'destructive' });
        }
      }
    });
  };
  
  const handleRemoveEmail = (email: string) => {
    startTransition(async () => {
      try {
        await removeRecipientEmail(email);
        toast({ title: 'Sucesso', description: 'Email removido da lista de notificações.' });
        fetchSettings();
      } catch (error) {
         if (process.env.NODE_ENV !== 'development') {
            toast({ title: 'Erro', description: 'Não foi possível remover o email.', variant: 'destructive' });
        }
      }
    });
  }

  if (authLoading || loading || !user || user.role !== 'admin') {
    return <SettingsSkeleton />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Notificações por Email</CardTitle>
            <CardDescription>
              Adicione ou remova os endereços de e-mail que devem receber notificações sobre as vistorias.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddEmail)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Label htmlFor="email" className="sr-only">Email</Label>
                      <FormControl>
                        <Input id="email" placeholder="nome@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </form>
            </Form>

            <div className="space-y-2">
              <h4 className="font-medium">Destinatários Atuais</h4>
              {settings && settings.recipientEmails.length > 0 ? (
                <ul className="rounded-md border">
                  {settings.recipientEmails.map((email, index) => (
                    <li key={email} className={`flex items-center justify-between p-3 ${index < settings.recipientEmails.length - 1 ? 'border-b' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{email}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveEmail(email)} disabled={isPending}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remover {email}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum destinatário configurado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
