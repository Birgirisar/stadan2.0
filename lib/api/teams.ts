import { smGet } from './sportmonks';

export interface TeamBrief {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string | null;
}

export async function fetchTeamsBySeason(seasonId: number): Promise<TeamBrief[]> {
  const data = await smGet<TeamBrief[]>(`/teams/seasons/${seasonId}`);
  return Array.isArray(data) ? data : [];
}
