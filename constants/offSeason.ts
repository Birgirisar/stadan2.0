/**
 * Off-season switch.
 *
 * When `enabled`, the app shows a static "on break" screen instead of
 * mounting any of the tab screens — so nothing calls the Sportmonks API at
 * all, meaning the subscription can be paused/cancelled for the gap between
 * seasons without users seeing errors or endless spinners.
 *
 * To flip it: edit this file, then publish with
 *   eas update --branch production --message "off-season on/off"
 * No app store review needed — this ships as a normal OTA update.
 */
export const OFF_SEASON = {
  enabled: false,
  // Shown on the off-season screen. Keep it short — it's the whole message.
  resumeMessage: 'Næsta tímabil hefst fljótlega. Við látum vita þegar leikirnir byrja aftur ⚽',
} as const;
