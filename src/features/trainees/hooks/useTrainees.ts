import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/trainees.api";

export const traineeKeys = {
  all: ["trainees"] as const,
  me: ["trainees", "me"] as const,
  mine: ["trainees", "mine"] as const,
  detail: (id: string) => ["trainees", "detail", id] as const,
  page: (f: api.TraineeQuery) => ["trainees", "page", f] as const,
};

export function useTrainees() {
  return useQuery({ queryKey: traineeKeys.all, queryFn: api.listTrainees });
}

/** Trainees assigned to the signed-in mentor (RLS-scoped). */
export function useMyTrainees() {
  return useQuery({ queryKey: traineeKeys.mine, queryFn: api.listMyTrainees });
}

/** A single trainee by id (RLS-scoped to the caller). */
export function useTrainee(id: string | undefined) {
  return useQuery({
    queryKey: traineeKeys.detail(id ?? "none"),
    queryFn: () => api.getTrainee(id as string),
    enabled: !!id,
  });
}

/** Paginated list; keeps the previous page visible while the next one loads. */
export function useTraineesPage(query: api.TraineeQuery = {}) {
  return useQuery({
    queryKey: traineeKeys.page(query),
    queryFn: () => api.listTraineesPage(query),
    placeholderData: keepPreviousData,
  });
}

export function useMyTrainee() {
  return useQuery({ queryKey: traineeKeys.me, queryFn: api.getMyTrainee });
}

export function useTraineeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: traineeKeys.all });
  return {
    register: useMutation({ mutationFn: api.registerTrainee, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; patch: api.TraineePatch }) => api.updateTrainee(v.id, v.patch),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: (v: { id: string; is_active: boolean }) => api.setTraineeActive(v.id, v.is_active),
      onSuccess: invalidate,
    }),
  };
}
