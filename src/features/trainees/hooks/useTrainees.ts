import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/trainees.api";

export const traineeKeys = {
  all: ["trainees"] as const,
  me: ["trainees", "me"] as const,
};

export function useTrainees() {
  return useQuery({ queryKey: traineeKeys.all, queryFn: api.listTrainees });
}

export function useMyTrainee() {
  return useQuery({ queryKey: traineeKeys.me, queryFn: api.getMyTrainee });
}

export function useTraineeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: traineeKeys.all });
  return {
    register: useMutation({ mutationFn: api.registerTrainee, onSuccess: invalidate }),
    setActive: useMutation({
      mutationFn: (v: { id: string; is_active: boolean }) => api.setTraineeActive(v.id, v.is_active),
      onSuccess: invalidate,
    }),
  };
}
