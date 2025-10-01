
'use server';

import type { Area, Inspection, User, AreaWithLastInspection, UserRole } from '@/lib/types';
import { add } from 'date-fns';

// --- Static Data Store ---

let users: User[] = [
    { id: 'admin-user', email: 'admin@canacontrol.com', name: 'Admin', role: 'admin' },
    { id: 'tech-user', email: 'tech@canacontrol.com', name: 'Técnico', role: 'technician' },
];

let areas: AreaWithLastInspection[] = [
  {
    id: 'area-1',
    sectorLote: 'S1/L01',
    plots: 'T01, T02',
    plantingDate: '2024-05-10',
    nextInspectionDate: '2024-08-08',
    status: 'Agendada',
    inspections: [],
  },
  {
    id: 'area-2',
    sectorLote: 'S2/L05',
    plots: 'T08',
    plantingDate: '2024-04-20',
    nextInspectionDate: '2024-07-19',
    status: 'Pendente',
    inspections: [
      { id: 'insp-1', areaId: 'area-2', date: '2024-06-20', heightCm: 120, observations: 'Crescimento um pouco lento.', atSize: false },
    ],
  },
  {
    id: 'area-3',
    sectorLote: 'S1/L02',
    plots: 'T03, T04, T05',
    plantingDate: '2024-03-15',
    nextInspectionDate: '2024-07-05',
    status: 'Concluída',
    inspections: [
        { id: 'insp-2', areaId: 'area-3', date: '2024-06-15', heightCm: 180, observations: 'Tudo OK.', atSize: true },
    ]
  },
];

let nextUserId = 1;
let nextAreaId = 4;

// --- User Functions ---

export async function getUserById(idOrEmail: string): Promise<User | undefined> {
  // In our static data, we can look up by ID or email since we don't have real Firebase UIDs
  return users.find(user => user.id === idOrEmail || user.email === idOrEmail);
}

export async function dbCreateUser(email: string, name: string, role: UserRole): Promise<User> {
  const newUser: User = {
    id: `new-user-${nextUserId++}`,
    email,
    name,
    role,
  };
  users.push(newUser);
  console.log("Simulated creating user:", newUser);
  return newUser;
}

// --- Area and Inspection Functions ---

export async function getAreas(): Promise<AreaWithLastInspection[]> {
  // Sort by next inspection date, similar to the original logic
  return [...areas].sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  return areas.find(area => area.id === id);
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status'>): Promise<Area> {
  const nextInspectionDate = add(new Date(data.plantingDate), { days: 90 }).toISOString().split('T')[0];

  const newArea: AreaWithLastInspection = {
    ...data,
    id: `area-${nextAreaId++}`,
    nextInspectionDate,
    status: 'Agendada' as const,
    inspections: [],
  };

  areas.push(newArea);
  console.log("Simulated adding area:", newArea);
  return newArea;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
    const areaIndex = areas.findIndex(a => a.id === id);
    if (areaIndex > -1) {
        areas[areaIndex] = { ...areas[areaIndex], ...data };
        console.log("Simulated updating area:", areas[areaIndex]);
        return areas[areaIndex];
    }
    return null;
}

export async function deleteArea(id: string): Promise<boolean> {
   const areaIndex = areas.findIndex(a => a.id === id);
   if (areaIndex > -1) {
       areas.splice(areaIndex, 1);
       console.log("Simulated deleting area with id:", id);
       return true;
   }
  return false;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    const area = await getAreaById(areaId);
    if (!area) {
        throw new Error("Area not found");
    }

    const newInspection: Inspection = {
        ...inspectionData,
        id: `insp-${Date.now()}`,
        areaId,
    };
    
    // In a real DB this would be a transaction
    let newStatus: Area['status'] = 'Pendente';
    let newNextInspectionDate = add(new Date(inspectionData.date), { days: 20 }).toISOString().split('T')[0];

    if (inspectionData.atSize) {
        newStatus = 'Concluída';
    }
    
    const areaIndex = areas.findIndex(a => a.id === areaId);
    if (areaIndex > -1) {
        areas[areaIndex].status = newStatus;
        areas[areaIndex].nextInspectionDate = newNextInspectionDate;
        areas[areaIndex].inspections.unshift(newInspection); // Add to beginning
        console.log("Simulated adding inspection and updating area:", areas[areaIndex]);
    }
}
