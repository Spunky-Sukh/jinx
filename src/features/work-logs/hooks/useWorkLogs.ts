import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/workLogs.api";
import type { WorkStatus } from "@/types/db";

export const workLogKeys = {
  list: (f: api.WorkLogFilters) => ["work_logs", f] as const,
};

export function useWorkLogs(filters: api.WorkLogFilters = {}) {
  return useQuery({
    queryKey: workLogKeys.list(filters),
    queryFn: () => api.listWorkLogs(filters),
  });
}

export function useWorkLogMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["work_logs"] });
  return {
    create: useMutation({ mutationFn: api.createWorkLog, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; patch: api.WorkLogPatch }) => api.updateWorkLog(v.id, v.patch),
      onSuccess: invalidate,
    }),
    review: useMutation({
      mutationFn: (v: { id: string; status: WorkStatus; remarks: string }) =>
        api.reviewWorkLog(v.id, v.status, v.remarks),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: api.deleteWorkLog, onSuccess: invalidate }),
  };
}
