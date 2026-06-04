import { useLocalSearchParams } from 'expo-router';
import { LeagueDetailScreen } from '../../../components/league-detail/LeagueDetailScreen';

export default function LeagueDetailRoute() {
  const { leagueId: leagueIdParam } = useLocalSearchParams<{ leagueId: string }>();
  const leagueId = parseInt(leagueIdParam ?? '0', 10);
  return <LeagueDetailScreen leagueId={leagueId} />;
}
