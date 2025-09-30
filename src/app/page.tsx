'use client';
import { useEffect, useState } from 'react';
import { getAreas } from '@/lib/data';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaList } from '@/components/area-list';
import type { Area } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getAreas().then(data => {
        setAreas(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (authLoading || loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <Skeleton className="h-8 w-32" />
                <div className="ml-auto">
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </header>
             <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Skeleton className="h-10 w-[400px]" />
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                 </div>
             </main>
        </div>
    )
  }

  const scheduled = areas.filter(area => area.status === 'Agendada');
  const pending = areas.filter(area => area.status === 'Pendente');
  const completed = areas.filter(area => area.status === 'Concluída');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="scheduled">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>
          <TabsContent value="scheduled">
            <AreaList areas={scheduled as Area[]} />
          </TabsContent>
          <TabsContent value="pending">
            <AreaList areas={pending as Area[]} />
          </TabsContent>
          <TabsContent value="completed">
            <AreaList areas={completed as Area[]} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
