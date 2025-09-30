'use server';

import type { Area, Inspection, User } from '@/lib/types';
import { add, format } from 'date-fns';

let areas: Area[] = [
  {
    id: '1',
    sectorLote: 'S1/L01',
    plots: 'T01, T02, T03',
    plantingDate: '2024-03-15',
    nextInspectionDate: '2024-06-13',
    status: 'Agendada',
    inspections: [],
  },
  {
    id: '2',
    sectorLote: 'S1/L02',
    plots: 'T04, T05',
    plantingDate: '2024-04-01',
    nextInspectionDate: '2024-06-30',
    status: 'Agendada',
    inspections: [],
  },
  {
    id: '3',
    sectorLote: 'S2/L05',
    plots: 'T10',
    plantingDate: '2024-02-10',
    nextInspectionDate: '2024-05-30',
    status: 'Pendente',
    inspections: [
      {
        id: 'insp1',
        date: '2024-05-10',
        heightCm: 50,
        observations: 'Crescimento abaixo do esperado para a época.',
        atSize: false,
      },
    ],
  },
    {
    id: '4',
    sectorLote: 'S3/L08',
    plots: 'T12, T13',
    plantingDate: '2023-12-01',
    nextInspectionDate: '2024-03-01',
    status: 'Concluída',
    inspections: [
      {
        id: 'insp2',
        date: '2024-03-01',
        heightCm: 180,
        observations: 'Cana no porte ideal, pronta para o próximo estágio.',
        atSize: true,
      },
    ],
  },
];

const users: User[] = [
    { id: '1', email: 'admin@canacontrol.com', role: 'admin', name: 'Admin' },
    { id: '2', email: 'tech@canacontrol.com', role: 'technician', name: 'Técnico' },
];

export async function getUserByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(users.find(user => user.email === email));
}


export async function getAreas(): Promise<Area[]> {
  return Promise.resolve(areas);
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  return Promise.resolve(areas.find(area => area.id === id));
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status' | 'inspections'>): Promise<Area> {
  const newId = (Math.max(...areas.map(a => parseInt(a.id, 10)), 0) + 1).toString();
  const nextInspectionDate = format(add(new Date(data.plantingDate), { days: 90 }), 'yyyy-MM-dd');

  const newArea: Area = {
    ...data,
    id: newId,
    nextInspectionDate,
    status: 'Agendada',
    inspections: [],
  };
  areas.push(newArea);
  return Promise.resolve(newArea);
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
  const areaIndex = areas.findIndex(area => area.id === id);
  if (areaIndex === -1) {
    return null;
  }
  areas[areaIndex] = { ...areas[areaIndex], ...data };
  return Promise.resolve(areas[areaIndex]);
}

export async function deleteArea(id: string): Promise<boolean> {
  const initialLength = areas.length;
  areas = areas.filter(area => area.id !== id);
  return Promise.resolve(areas.length < initialLength);
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id'>): Promise<Area | null> {
  const areaIndex = areas.findIndex(area => area.id === areaId);
  if (areaIndex === -1) {
    return null;
  }

  const newInspection: Inspection = {
    ...inspectionData,
    id: `insp_${Date.now()}`,
  };

  areas[areaIndex].inspections.push(newInspection);

  if (inspectionData.atSize) {
    areas[areaIndex].status = 'Concluída';
  } else {
    areas[areaIndex].status = 'Pendente';
    areas[areaIndex].nextInspectionDate = format(add(new Date(inspectionData.date), { days: 20 }), 'yyyy-MM-dd');
  }

  return Promise.resolve(areas[areaIndex]);
}
