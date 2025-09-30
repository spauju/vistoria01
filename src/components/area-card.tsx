import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Area } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CalendarDays, Sprout, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaActions } from './area-actions';
import { InspectAreaDialog } from './inspect-area-dialog';
import { cn } from '@/lib/utils';

interface AreaCardProps {
  area: Area;
}

export function AreaCard({ area }: AreaCardProps) {
  const placeholderImage = PlaceHolderImages[0];
  const nextInspectionDate = new Date(area.nextInspectionDate);
  const isOverdue = new Date() > nextInspectionDate && area.status !== 'Concluída';

  const getStatusVariant = () => {
    switch (area.status) {
      case 'Agendada':
        return 'default';
      case 'Pendente':
        return 'secondary';
      case 'Concluída':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant={getStatusVariant()}>{area.status}</Badge>
            <CardTitle className="mt-2">{area.sectorLote}</CardTitle>
            <CardDescription>{area.plots}</CardDescription>
          </div>
          <AreaActions area={area} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg">
          <Image
            src={placeholderImage.imageUrl}
            alt={placeholderImage.description}
            fill
            className="object-cover"
            data-ai-hint={placeholderImage.imageHint}
          />
        </div>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            <span>
              Plantio: {format(new Date(area.plantingDate), 'dd/MM/yyyy')}
            </span>
          </div>
          <div className={cn("flex items-center gap-2", isOverdue && "text-destructive font-semibold")}>
            <CalendarDays className="h-4 w-4" />
            <span>
              Próx. Vistoria: {format(nextInspectionDate, 'PPP', { locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <InspectAreaDialog area={area}>
          <Button
            className="w-full"
            variant="default"
            disabled={area.status === 'Concluída'}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Vistoriar
          </Button>
        </InspectAreaDialog>
      </CardFooter>
    </Card>
  );
}
