import { getAreas } from '@/lib/data';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaList } from '@/components/area-list';
import type { Area } from '@/lib/types';

export default async function Home() {
  const areas = await getAreas();

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
