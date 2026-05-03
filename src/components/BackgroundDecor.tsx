import { StyleSheet, View } from 'react-native';

import { APP_BG_DARK, APP_BG_LIGHT } from '../theme';

export function BackgroundDecor({ darkMode }: { darkMode: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.bgTop, { backgroundColor: darkMode ? APP_BG_DARK : APP_BG_LIGHT }]} />
      <View style={[styles.circleTopLeft, darkMode ? styles.darkCircle : null]} />
      <View style={[styles.circleTopRight, darkMode ? styles.darkCircle : null]} />
      <View style={[styles.circleBottomLeft, darkMode ? styles.darkBottomCircle : null]} />
      <View style={[styles.circleBottomRight, darkMode ? styles.darkBottomCircle : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
  },
  circleTopLeft: {
    position: 'absolute',
    top: 64,
    left: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    opacity: 0.24,
  },
  circleTopRight: {
    position: 'absolute',
    top: 14,
    right: -28,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    opacity: 0.22,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DDF8FB',
    opacity: 0.62,
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: -30,
    right: -25,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DDF8FB',
    opacity: 0.62,
  },
  darkCircle: {
    backgroundColor: '#1C2C40',
    opacity: 0.5,
  },
  darkBottomCircle: {
    backgroundColor: '#1A3146',
    opacity: 0.62,
  },
});
