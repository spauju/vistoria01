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
import { CalendarDays, Sprout, ClipboardList, Ruler, Eye } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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
  const today = new Date();
  today.setHours(0,0,0,0);
  const daysUntilInspection = differenceInDays(nextInspectionDate, today);
  const lastInspection = area.inspections.length > 0 ? area.inspections[area.inspections.length - 1] : null;


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

  const getCardStyle = () => {
    if (area.status === 'Concluída') {
        return {};
    }
    if (daysUntilInspection < 0) {
      return { 
          backgroundColor: 'hsl(var(--card-overdue-background))',
          borderColor: 'hsl(var(--card-overdue-border))'
      };
    }
    if (daysUntilInspection <= 7) {
      return { 
          backgroundColor: 'hsl(var(--card-approaching-background))',
          borderColor: 'hsl(var(--card-approaching-border))'
       };
    }
    return {
        backgroundColor: 'hsl(var(--card-normal-background))',
        borderColor: 'hsl(var(--card-normal-border))'
    };
  }

  return (
    <Card className="flex flex-col" style={getCardStyle()}>
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
          <div className={cn("flex items-center gap-2", daysUntilInspection < 0 && area.status !== 'Concluída' && "text-destructive font-semibold")}>
            <CalendarDays className="h-4 w-4" />
            <span>
              Próx. Vistoria: {format(nextInspectionDate, 'PPP', { locale: ptBR })}
            </span>
          </div>
          {area.status === 'Pendente' && lastInspection && (
            <div className='mt-2 space-y-2 border-t pt-2'>
              <p className='text-xs font-semibold text-foreground'>Última Vistoria:</p>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <span>
                  Altura: {lastInspection.heightCm} cm
                </span>
              </div>
              {lastInspection.observations && (
                 <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 mt-0.5" />
                  <span className='flex-1'>
                    Obs: {lastInspection.observations}
                  </span>
                </div>
              )}
            </div>
          )}
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
