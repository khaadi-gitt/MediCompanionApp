import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StatusBar as RNStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type TextSize = 'Small' | 'Medium' | 'Large';

export function TextSizeScreen({
  value,
  onBack,
  onChange,
}: {
  value: TextSize;
  onBack: () => void;
  onChange: (next: TextSize) => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(isDesktop ? 620 : 560, width - 20);
  const topInset = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 8 : 10;

  const options: TextSize[] = ['Small', 'Medium', 'Large'];

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={[styles.content, { width: contentWidth }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.topBtn} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2AAFC0" />
          </Pressable>
          <Text style={styles.title}>Text Size</Text>
          <View style={styles.topBtn} />
        </View>

        <View style={styles.card}>
          {options.map((opt) => (
            <Pressable key={opt} style={styles.optionRow} onPress={() => onChange(opt)}>
              <Text style={[styles.optionText, opt === 'Small' ? styles.small : opt === 'Large' ? styles.large : styles.medium]}>{opt}</Text>
              <MaterialCommunityIcons
                name={value === opt ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={value === opt ? '#2AAFC0' : '#B0BDCC'}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF7FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6EAF4',
  },
  title: { fontSize: 15, color: '#2D3F56', fontWeight: '700' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDF6',
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 8,
  },
  optionRow: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#E2ECF7',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: { color: '#2E3C52', fontWeight: '500' },
  small: { fontSize: 13 },
  medium: { fontSize: 14 },
  large: { fontSize: 16 },
});
