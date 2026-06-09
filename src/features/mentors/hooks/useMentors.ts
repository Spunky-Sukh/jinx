import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/mentors.api";

export const mentorKeys = {
  all: ["mentors"] as const,
  byTeam: (teamId: string) => ["mentors", "team", teamId] as const,
};

export function useMentors() {
  return useQuery({ queryKey: mentorKeys.all, queryFn: api.listMentors });
}

export function useMentorsByTeam(teamId: string | null) {
  return useQuery({
    queryKey: mentorKeys.byTeam(teamId ?? "none"),
    queryFn: () => api.listMentorsByTeam(teamId as string),
    enabled: !!teamId,
  });
}

export function useMentorMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: mentorKeys.all });
  return {
    register: useMutation({ mutationFn: api.registerMentor, onSuccess: invalidate }),
    setActive: useMutation({
      mutationFn: (v: { id: string; is_active: boolean }) => api.setMentorActive(v.id, v.is_active),
      onSuccess: invalidate,
    }),
  };
}
