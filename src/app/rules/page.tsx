'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';
import Link from 'next/link';

export default function RulesPage() {
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rule for the 'users' collection
    match /users/{userId} {
      // Admins can read and write any user document
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Authenticated users can read their own document
      allow read: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Rule for the 'cana_data' collection
    match /cana_data/{document=**} {
      // Any authenticated user can read and write to the cana_data collection
      allow read, write: if request.auth != null;
    }
  }
}`;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rules).then(() => {
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'As regras do Firestore foram copiadas para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    }, () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar as regras.',
        variant: 'destructive',
      });
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Regras do Firestore</CardTitle>
          <CardDescription>
            Copie o conteúdo abaixo e cole nas regras de segurança do seu Cloud Firestore no Console do Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            readOnly
            value={rules}
            className="h-64 resize-none font-mono"
          />
          <div className="flex justify-between items-center">
            <Button onClick={handleCopy}>
              {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
              {copied ? 'Copiado' : 'Copiar Regras'}
            </Button>
             <Button asChild variant="outline">
                <Link href="/">Voltar para o App</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
