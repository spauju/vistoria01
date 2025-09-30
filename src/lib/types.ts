export type Inspection = {
  id: string;
  date: string;
  heightCm: number;
  observations: string;
  atSize: boolean;
};

export type AreaStatus = 'Agendada' | 'Pendente' | 'Concluída';

export type Area = {
  id: string;
  sectorLote: string;
  plots: string;
  plantingDate: string;
  nextInspectionDate: string;
  status: AreaStatus;
  inspections: Inspection[];
};
