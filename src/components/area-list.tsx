import type { AreaWithLastInspection } from '@/lib/types';
import { AreaCard } from './area-card';

interface AreaListProps {
  areas: AreaWithLastInspection[];
}

export function AreaList({ areas }: AreaListProps) {
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
