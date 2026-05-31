import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../../../lib/theme/useTheme';
import { MatchRow } from '../../fixtures/MatchRow';
import { MonthSectionHeader } from './MonthSectionHeader';
import { NextMatchLabel } from './NextMatchLabel';
import { formatMonthYear, getMonthKey } from '../../../lib/utils/dates';
import type { Fixture } from '../../../lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnchorType = 'live' | 'next' | 'none';

interface MonthGroup {
  monthKey: string;
  label: string;
  fixtures: Fixture[];
}

interface Anchor {
  fixtureId: number;
  type: AnchorType;
  groupIndex: number;
  fixtureIndex: number;
}

// ─── Layout constants (approximate — used only for auto-scroll offset) ────────

const HEADER_H = 40;  // MonthSectionHeader: paddingTop(18) + text(14) + paddingBottom(8)
const ROW_H = 52;     // MatchRow: paddingVertical(14×2) + badge/text content (~24px)
const LABEL_H = 26;   // NextMatchLabel: marginTop(6) + pill(~18) + marginBottom(2)
const CARD_BOTTOM = 14; // gap between month group cards

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupFixtures(fixtures: Fixture[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const f of fixtures) {
    const key = getMonthKey(f.starting_at);
    if (!map.has(key)) {
      map.set(key, { monthKey: key, label: formatMonthYear(f.starting_at), fixtures: [] });
    }
    map.get(key)!.fixtures.push(f);
  }
  return Array.from(map.values());
}

function findAnchor(fixtures: Fixture[], groups: MonthGroup[]): Anchor | null {
  if (fixtures.length === 0) return null;

  const nowTs = Math.floor(Date.now() / 1000);

  const locateInGroups = (fixtureId: number): { groupIndex: number; fixtureIndex: number } | null => {
    for (let gi = 0; gi < groups.length; gi++) {
      const fi = groups[gi].fixtures.findIndex((f) => f.id === fixtureId);
      if (fi !== -1) return { groupIndex: gi, fixtureIndex: fi };
    }
    return null;
  };

  // 1. Live match
  const live = fixtures.find((f) => f.state?.is_live);
  if (live) {
    const pos = locateInGroups(live.id);
    if (pos) return { fixtureId: live.id, type: 'live', ...pos };
  }

  // 2. First upcoming (not final, in the future)
  const upcoming = fixtures.find(
    (f) =>
      !f.state?.is_final_state &&
      !f.state?.is_live &&
      (f.starting_at_timestamp ?? 0) > nowTs,
  );
  if (upcoming) {
    const pos = locateInGroups(upcoming.id);
    if (pos) return { fixtureId: upcoming.id, type: 'next', ...pos };
  }

  // 3. Season over — scroll to last fixture
  const last = fixtures[fixtures.length - 1];
  const pos = locateInGroups(last.id);
  if (pos) return { fixtureId: last.id, type: 'none', ...pos };

  return null;
}

function computeScrollTarget(
  anchor: Anchor,
  groups: MonthGroup[],
  heroFull: number,
  compactH: number,
  screenH: number,
): number {
  let y = heroFull;

  for (let gi = 0; gi < groups.length; gi++) {
    y += HEADER_H;

    if (gi === anchor.groupIndex) {
      // Count rows before the anchor within this group
      y += anchor.fixtureIndex * ROW_H;
      // Account for the label above the anchor if visible
      if (anchor.type !== 'none') y += LABEL_H;
      break;
    }

    y += groups[gi].fixtures.length * ROW_H;
    y += CARD_BOTTOM;
  }

  const viewportH = screenH - compactH;
  return Math.max(0, y - viewportH * 0.3);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  fixtures: Fixture[];
  scrollViewRef: React.RefObject<any>;
  heroFull: number;
  compactH: number;
}

export function FixturesList({ fixtures, scrollViewRef, heroFull, compactH }: Props) {
  const { colors } = useTheme();
  const { height: screenH } = useWindowDimensions();

  const groups = useMemo(() => groupFixtures(fixtures), [fixtures]);
  const anchor = useMemo(() => findAnchor(fixtures, groups), [fixtures, groups]);

  // ── Auto-scroll to anchor on first render ─────────────────────────────────
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (hasScrolled.current || !anchor || groups.length === 0) return;

    const targetY = computeScrollTarget(anchor, groups, heroFull, compactH, screenH);

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      hasScrolled.current = true;
    }, 150);

    return () => clearTimeout(timer);
  }, [anchor, groups, heroFull, compactH, screenH, scrollViewRef]);

  return (
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.monthKey} style={styles.groupWrap}>
          <MonthSectionHeader label={group.label} />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {group.fixtures.map((fixture, i) => (
              <React.Fragment key={fixture.id}>
                {fixture.id === anchor?.fixtureId && anchor.type !== 'none' && (
                  <NextMatchLabel type={anchor.type} />
                )}
                <MatchRow fixture={fixture} isLast={i === group.fixtures.length - 1} />
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.bottomSpacer} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  groupWrap: {
    marginBottom: CARD_BOTTOM,
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bottomSpacer: {
    height: 24,
  },
});
