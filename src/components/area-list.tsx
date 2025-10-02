import type { AreaWithLastInspection } from '@/lib/types';
import { AreaCard } from './area-card';
import { Skeleton } from './ui/skeleton';

interface AreaListProps {
  areas: AreaWithLastInspection[];
  isLoading: boolean;
}

export function AreaList({ areas, isLoading }: AreaListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Nenhuma área encontrada
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione uma nova área para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {areas.map((area) => (
        <AreaCard key={area.id} area={area} />
      ))}
    </div>
  );
}
