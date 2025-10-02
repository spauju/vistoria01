'use client';
import { useEffect, useState, useCallback } from 'react';
import { getAreas } from '@/lib/data';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaList } from '@/components/area-list';
import type { AreaWithLastInspection } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [areas, setAreas] = useState<AreaWithLastInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter(); 

  const fetchAreas = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getAreas().then(data => {
      setAreas(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    const handleDataRefresh = () => {
      fetchAreas();
    };
    window.addEventListener('refresh-data', handleDataRefresh);
    return () => {
      window.removeEventListener('refresh-data', handleDataRefresh);
    };
  }, [fetchAreas]);

  if (authLoading || !user) {
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
            <AreaList areas={scheduled} isLoading={loading} />
          </TabsContent>
          <TabsContent value="pending">
            <AreaList areas={pending} isLoading={loading} />
          </TabsContent>
          <TabsContent value="completed">
            <AreaList areas={completed} isLoading={loading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
