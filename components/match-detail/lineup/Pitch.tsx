import React, { memo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { LineupEntry, FixtureEvent } from '../../../lib/api/types';
import { organizeStartersIntoRows } from '../../../lib/utils/pitchLayout';
import { useTheme } from '../../../lib/theme/useTheme';
import { PlayerMarker } from './PlayerMarker';

interface Props {
  homeStarters: LineupEntry[];
  awayStarters: LineupEntry[];
  events: FixtureEvent[];
  isPredicted: boolean;
  onPlayerPress: (entry: LineupEntry) => void;
}

const SW = 1.9;          // SVG stroke width in screen pixels
const ROW_H = 120;       // height of each formation row in each half
const SPACER_H = 44;     // midline spacer height
const { width: SCREEN_W } = Dimensions.get('window');

export const Pitch = memo(function Pitch({
  homeStarters,
  awayStarters,
  events,
  isPredicted,
  onPlayerPress,
}: Props) {
  const { theme } = useTheme();
  const [pitchW, setPitchW] = useState(SCREEN_W);

  const pitchColor = theme === 'dark' ? '#263029' : '#3a5e40';
  const lc = 'rgba(255,255,255,0.38)';

  const homeRows = organizeStartersIntoRows(homeStarters, false);
  const awayRows = organizeStartersIntoRows(awayStarters, true);

  // Both halves are the same height — determined by whichever team has more rows.
  const maxRows = Math.max(homeRows.length, awayRows.length, 4);
  const halfH = maxRows * ROW_H;
  const pitchH = halfH * 2 + SPACER_H;

  const w = pitchW;
  const h = pitchH;
  const midY = h / 2;

  const paL = w * 0.21;
  const paR = w * 0.79;
  const paH = h * 0.085;

  const gbL = w * 0.36;
  const gbR = w * 0.64;
  const gbH = h * 0.030;

  const ccR = w * 0.115;

  const renderRow = (rowPlayers: LineupEntry[], i: number) => (
    <View key={i} style={styles.pitchRow}>
      {rowPlayers.map(entry => (
        <PlayerMarker
          key={entry.id}
          entry={entry}
          events={events}
          isPredicted={isPredicted}
          onPress={onPlayerPress}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[styles.pitchWrap, { backgroundColor: pitchColor }]}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0) setPitchW(width);
      }}
    >
      <Svg width={w} height={h} style={styles.pitchSvg} pointerEvents="none">
        {/* Halfway line */}
        <Line x1={0} y1={midY} x2={w} y2={midY} stroke={lc} strokeWidth={SW} />

        {/* Center circle — no dot inside */}
        <Circle cx={w / 2} cy={midY} r={ccR} fill="none" stroke={lc} strokeWidth={SW} />

        {/* Top penalty area — left, right, bottom only */}
        <Line x1={paL} y1={0} x2={paL} y2={paH} stroke={lc} strokeWidth={SW} />
        <Line x1={paR} y1={0} x2={paR} y2={paH} stroke={lc} strokeWidth={SW} />
        <Line x1={paL} y1={paH} x2={paR} y2={paH} stroke={lc} strokeWidth={SW} />

        {/* Top 6-yard box — left, right, bottom only */}
        <Line x1={gbL} y1={0} x2={gbL} y2={gbH} stroke={lc} strokeWidth={SW} />
        <Line x1={gbR} y1={0} x2={gbR} y2={gbH} stroke={lc} strokeWidth={SW} />
        <Line x1={gbL} y1={gbH} x2={gbR} y2={gbH} stroke={lc} strokeWidth={SW} />

        {/* Bottom penalty area — left, right, top only */}
        <Line x1={paL} y1={h - paH} x2={paL} y2={h} stroke={lc} strokeWidth={SW} />
        <Line x1={paR} y1={h - paH} x2={paR} y2={h} stroke={lc} strokeWidth={SW} />
        <Line x1={paL} y1={h - paH} x2={paR} y2={h - paH} stroke={lc} strokeWidth={SW} />

        {/* Bottom 6-yard box — left, right, top only */}
        <Line x1={gbL} y1={h - gbH} x2={gbL} y2={h} stroke={lc} strokeWidth={SW} />
        <Line x1={gbR} y1={h - gbH} x2={gbR} y2={h} stroke={lc} strokeWidth={SW} />
        <Line x1={gbL} y1={h - gbH} x2={gbR} y2={h - gbH} stroke={lc} strokeWidth={SW} />
      </Svg>

      {/* Home half — fixed height, rows flex to fill evenly */}
      <View style={[styles.half, { height: halfH }]}>
        {homeRows.map(renderRow)}
      </View>

      <View style={styles.midlineSpacer} />

      {/* Away half — same fixed height, rows flex to fill evenly */}
      <View style={[styles.half, { height: halfH }]}>
        {awayRows.map(renderRow)}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  pitchWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  pitchSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  half: {
    // height set inline — rows use flex:1 to distribute evenly within it
  },
  pitchRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  midlineSpacer: {
    height: SPACER_H,
  },
});
