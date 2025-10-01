export type Inspection = {
  id: string;
  areaId: string;
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
};

export type AreaWithInspections = Area & {
    inspections: Inspection[];
}

export type AreaWithLastInspection = Area & {
    inspections: Inspection[]; // This will only contain the last inspection
}


export type UserRole = 'admin' | 'technician';

export type User = {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}
