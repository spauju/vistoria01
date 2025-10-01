'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AreaWithLastInspection } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportTableProps {
  areas: AreaWithLastInspection[];
}

export function ReportTable({ areas }: ReportTableProps) {
    const getStatusVariant = (status: string) => {
        switch (status) {
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
    
  if (areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Nenhum resultado encontrado
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajuste os filtros para encontrar os dados desejados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Setor/Lote</TableHead>
            <TableHead>Talhões</TableHead>
            <TableHead>Data Plantio</TableHead>
            <TableHead>Próx. Vistoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Nº Vistorias</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map(area => (
            <TableRow key={area.id}>
              <TableCell className="font-medium">{area.sectorLote}</TableCell>
              <TableCell>{area.plots}</TableCell>
              <TableCell>{format(parseISO(area.plantingDate), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{format(parseISO(area.nextInspectionDate), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(area.status)}>{area.status}</Badge>
              </TableCell>
              {/* This might be inaccurate now as we only fetch the last one */}
              <TableCell className='text-right'>{area.inspections.length > 0 ? '1+' : 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
