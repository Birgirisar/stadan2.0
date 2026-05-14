import { useQuery } from '@tanstack/react-query';
import { fetchTeamForm } from '../api/teamForm';

export function useTeamForm(teamId: number | undefined, seasonId: number | undefined) {
  return useQuery({
    queryKey: ['team-form', teamId, seasonId],
    queryFn: () => fetchTeamForm(teamId!, seasonId!),
    enabled: teamId != null && seasonId != null,
    staleTime: 60 * 60 * 1000,
  });
}
