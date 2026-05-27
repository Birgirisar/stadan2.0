import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme/useTheme';
import { translateSurface, formatCapacity } from '../../lib/utils/venueDisplay';
import type { TeamVenue } from '../../lib/api/teamDetail';

interface Props {
  venue: TeamVenue;
}

interface MetaTile {
  label: string;
  value: string;
}

export function StadiumCard({ venue }: Props) {
  const { colors } = useTheme();

  const tiles: MetaTile[] = [];
  if (venue.capacity) {
    tiles.push({ label: 'Stærð', value: formatCapacity(venue.capacity) });
  }
  if (venue.surface) {
    tiles.push({ label: 'Yfirborð', value: translateSurface(venue.surface) });
  }

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Heimavöllur</Text>

      {/* Stylized pitch visual */}
      <PitchVisual colors={colors} />

      {/* Venue name + location */}
      <View style={styles.nameRow}>
        <Text style={[styles.venueName, { color: colors.text }]}>{venue.name}</Text>
        {venue.city_name && (
          <Text style={[styles.city, { color: colors.textMuted }]}>{venue.city_name}</Text>
        )}
      </View>

      {/* Meta tiles */}
      {tiles.length > 0 && (
        <View style={styles.tilesRow}>
          {tiles.map((tile, idx) => (
            <View
              key={idx}
              style={[styles.tile, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}
            >
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{tile.label}</Text>
              <Text style={[styles.tileValue, { color: colors.text }]}>{tile.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PitchVisual({ colors }: { colors: any }) {
  const pitchGreen = colors.win + '18';
  const lineColor = colors.win + '66';

  return (
    <View style={[styles.pitch, { backgroundColor: pitchGreen, borderColor: lineColor }]}>
      {/* Centre circle */}
      <View style={[styles.centreCircle, { borderColor: lineColor }]} />
      {/* Centre line */}
      <View style={[styles.centreLine, { backgroundColor: lineColor }]} />
      {/* Left penalty box */}
      <View style={[styles.penaltyBoxLeft, { borderColor: lineColor }]} />
      {/* Right penalty box */}
      <View style={[styles.penaltyBoxRight, { borderColor: lineColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // Pitch
  pitch: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    position: 'absolute',
  },
  centreLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
  },
  penaltyBoxLeft: {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: 22,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 1.5,
  },
  penaltyBoxRight: {
    position: 'absolute',
    right: 0,
    top: '20%',
    height: '60%',
    width: 22,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderLeftWidth: 1.5,
  },
  nameRow: {
    gap: 2,
  },
  venueName: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  city: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  tileLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tileValue: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
