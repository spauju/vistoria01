'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAreas } from '@/lib/data';
import type { Area, AreaStatus, AreaWithLastInspection } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters } from '@/components/report-filters';
import { ReportTable } from '@/components/report-table';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

export type ReportFiltersState = {
  areaId: string;
  status: AreaStatus | 'all';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
};

export default function ReportsPage() {
  const [areas, setAreas] = useState<AreaWithLastInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState<ReportFiltersState>({
    areaId: 'all',
    status: 'all',
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      getAreas().then(data => {
        setAreas(data);
        setLoading(false);
      });
    }
  }, [user]);

  const filteredAreas = useMemo(() => {
    return areas.filter(area => {
      if (filters.areaId !== 'all' && area.id !== filters.areaId) {
        return false;
      }
      if (filters.status !== 'all' && area.status !== filters.status) {
        return false;
      }
      if (filters.dateRange.from && parseISO(area.nextInspectionDate) < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && parseISO(area.nextInspectionDate) > filters.dateRange.to) {
        return false;
      }
      return true;
    });
  }, [areas, filters]);

  if (authLoading || loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Relatório de Vistorias</h1>
        </div>
        <ReportFilters
          areas={areas}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ReportTable areas={filteredAreas} />
      </main>
    </div>
  );
}
