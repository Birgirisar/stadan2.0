import { useLocalSearchParams } from 'expo-router';
import { LeagueDetailScreen } from '../../components/league-detail/LeagueDetailScreen';

export default function LeagueDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = parseInt(id ?? '0', 10);
  return <LeagueDetailScreen leagueId={leagueId} />;
}
