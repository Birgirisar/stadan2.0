import { useQuery } from '@tanstack/react-query';
import { fetchTeamForm } from '../api/teamForm';

export function useTeamForm(teamId: number | undefined) {
  return useQuery({
    queryKey: ['team-form', teamId],
    queryFn: () => fetchTeamForm(teamId!),
    enabled: teamId != null,
    staleTime: 60 * 60 * 1000,
  });
}
