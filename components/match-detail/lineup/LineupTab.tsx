import React, { useState } from 'react';
import { View } from 'react-native';
import type { DetailedFixture, LineupEntry } from '../../../lib/api/types';
import { getMatchState } from '../../../lib/utils/state';
import { splitLineup, getTeamColor } from '../../../lib/utils/lineup';
import { deriveFormation } from '../../../lib/utils/pitchLayout';
import { EmptyState } from './EmptyState';
import { PredictedBanner } from './PredictedBanner';
import { TeamFormationLine } from './TeamFormationLine';
import { Pitch } from './Pitch';
import { ManagersSection } from './ManagersSection';
import { SubstitutesSection } from './SubstitutesSection';
import { PlayerPopup } from './PlayerPopup';

interface Props {
  fixture: DetailedFixture;
}

export function LineupTab({ fixture }: Props) {
  const [popupEntry, setPopupEntry] = useState<LineupEntry | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  const home = fixture.participants?.find(p => p.meta.location === 'home');
  const away = fixture.participants?.find(p => p.meta.location === 'away');

  if (!home || !away) return null;

  const result = splitLineup(fixture, home.id, away.id);
  const events = fixture.events ?? [];

  if (result.state === 'empty') {
    const isPending = getMatchState(fixture.state).type === 'pending';
    return <EmptyState isPending={isPending} />;
  }

  const homeFormation = result.home.formation || deriveFormation(result.home.starters);
  const awayFormation = result.away.formation || deriveFormation(result.away.starters);

  const homeColor = getTeamColor(home, false, true);
  const awayColor = getTeamColor(away, false, false);

  function handlePlayerPress(entry: LineupEntry) {
    setPopupEntry(entry);
    setPopupVisible(true);
  }

  function handlePopupClose() {
    setPopupVisible(false);
  }

  const popupTeamName =
    popupEntry?.team_id === home.id
      ? (home.name ?? '')
      : (away.name ?? '');
  const popupTeamColor =
    popupEntry?.team_id === home.id ? homeColor : awayColor;

  return (
    <View>
      {result.state === 'predicted' && <PredictedBanner />}

      <TeamFormationLine
        teamName={home.name}
        imageUrl={home.image_path ?? ''}
        formation={homeFormation}
      />

      <Pitch
        homeStarters={result.home.starters}
        awayStarters={result.away.starters}
        events={events}
        isPredicted={result.state === 'predicted'}
        onPlayerPress={handlePlayerPress}
      />

      <TeamFormationLine
        teamName={away.name}
        imageUrl={away.image_path ?? ''}
        formation={awayFormation}
      />

      <ManagersSection
        homeCoach={result.home.coach}
        awayCoach={result.away.coach}
        homeTeamName={home.name}
        awayTeamName={away.name}
        homeTeamShortCode={home.short_code ?? ''}
        awayTeamShortCode={away.short_code ?? ''}
        homeColor={homeColor}
        awayColor={awayColor}
      />

      <SubstitutesSection
        homeSubs={result.home.subs}
        awaySubs={result.away.subs}
        homeParticipant={home}
        awayParticipant={away}
        events={events}
        isPredicted={result.state === 'predicted'}
        onPlayerPress={handlePlayerPress}
      />

      <View style={{ height: 8 }} />

      {popupEntry && (
        <PlayerPopup
          entry={popupEntry}
          teamName={popupTeamName}
          teamColor={popupTeamColor}
          visible={popupVisible}
          onClose={handlePopupClose}
        />
      )}
    </View>
  );
}
