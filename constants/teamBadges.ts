import { ImageSourcePropType } from 'react-native';

const TEAM_BADGES: Record<number, ImageSourcePropType> = {
  247574: require('../assets/team-badges/fjardabyggd-hottur-leiknir-women.png'),
  237452: require('../assets/team-badges/haukar-women.png'),
  237448: require('../assets/team-badges/keflavik-women.png'),
  237449: require('../assets/team-badges/kr-women.png'),
  237458: require('../assets/team-badges/tindastoll-women.png'),
  239241: require('../assets/team-badges/volsungur-husavik-women.png'),
  228393: require('../assets/team-badges/thor-women.png'),
  237459: require('../assets/team-badges/fh-women.png'),
  275519: require('../assets/team-badges/grindavik-njardvik-women.png'),
};

export function getLocalTeamBadge(teamId?: number): ImageSourcePropType | null {
  if (teamId == null) return null;
  return TEAM_BADGES[teamId] ?? null;
}
