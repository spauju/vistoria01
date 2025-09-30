'use client';
import type { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Area, AreaStatus } from '@/lib/types';
import type { ReportFiltersState } from '@/app/reports/page';
import { cn } from '@/lib/utils';


interface ReportFiltersProps {
  areas: Area[];
  filters: ReportFiltersState;
  onFiltersChange: (filters: ReportFiltersState) => void;
}

export function ReportFilters({ areas, filters, onFiltersChange }: ReportFiltersProps) {
  const handleFilterChange = <K extends keyof ReportFiltersState>(key: K, value: ReportFiltersState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };
  
  const handleDateChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({ ...filters, dateRange: { from: dateRange?.from, to: dateRange?.to } });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
      <div className="grid gap-2 sm:flex-1">
        <label className="text-sm font-medium">Área (Setor/Lote)</label>
        <Select
          value={filters.areaId}
          onValueChange={(value) => handleFilterChange('areaId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map(area => (
              <SelectItem key={area.id} value={area.id}>
                {area.sectorLote}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:flex-1">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={filters.status}
          onValueChange={(value: AreaStatus | 'all') => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Agendada">Agendada</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div className="grid gap-2 sm:flex-1">
          <label className="text-sm font-medium">Data da Próxima Vistoria</label>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Selecione um intervalo</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange.from}
                selected={filters.dateRange}
                onSelect={handleDateChange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
    </div>
  );
}
