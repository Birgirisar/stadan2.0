import { Stack } from 'expo-router';

export default function MotLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
