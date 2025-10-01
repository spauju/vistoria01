export type Inspection = {
  id: string;
  // areaId is no longer needed as it's a subcollection
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
  inspections: Inspection[]; // Inspections are now an array within the area
};

export type AreaWithInspections = Area;

export type AreaWithLastInspection = Area & {
    // The type is the same, but the data processing will ensure only the last one is present
}


export type UserRole = 'admin' | 'technician';

export type User = {
    id: string; // This will be the Firebase Auth UID
    email: string;
    role: UserRole;
    name: string;
}
