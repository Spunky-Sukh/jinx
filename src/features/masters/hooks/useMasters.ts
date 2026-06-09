import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MasterTable } from "@/types/db";
import * as api from "../api/masters.api";

export const masterKeys = {
  list: (t: MasterTable) => ["master", t] as const,
  periods: ["training_periods"] as const,
};

export function useMaster(table: MasterTable) {
  return useQuery({ queryKey: masterKeys.list(table), queryFn: () => api.listMaster(table) });
}

export function useMasterMutations(table: MasterTable) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: masterKeys.list(table) });

  return {
    create: useMutation({ mutationFn: (name: string) => api.createMaster(table, name), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; name?: string; is_active?: boolean }) =>
        api.updateMaster(table, v.id, { name: v.name, is_active: v.is_active }),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteMaster(table, id), onSuccess: invalidate }),
  };
}

export function useTrainingPeriods() {
  return useQuery({ queryKey: masterKeys.periods, queryFn: api.listTrainingPeriods });
}

export function useTrainingPeriodMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: masterKeys.periods });
  return {
    create: useMutation({
      mutationFn: (v: { label: string; duration_days: number }) =>
        api.createTrainingPeriod(v.label, v.duration_days),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; label?: string; duration_days?: number; is_active?: boolean }) =>
        api.updateTrainingPeriod(v.id, { label: v.label, duration_days: v.duration_days, is_active: v.is_active }),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteTrainingPeriod(id), onSuccess: invalidate }),
  };
}
