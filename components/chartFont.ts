import { matchFont } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

// Skia draws axis labels itself, so charts need an SkFont. matchFont picks a
// system font — no bundled ttf asset required.
export const chartAxisFont = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' }),
  fontSize: 11,
});
