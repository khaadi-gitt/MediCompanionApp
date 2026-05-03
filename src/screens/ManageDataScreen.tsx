import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StatusBar as RNStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export function ManageDataScreen({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(isDesktop ? 620 : 560, width - 20);
  const topInset = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 8 : 10;

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={[styles.content, { width: contentWidth }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.topBtn} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2AAFC0" />
          </Pressable>
          <Text style={styles.title}>Manage Data</Text>
          <View style={styles.topBtn} />
        </View>

        <View style={styles.card}>
          <ActionRow icon="history" label="Clear Chat History" />
          <ActionRow icon="download-outline" label="Export My Data" />
          <ActionRow icon="delete-outline" label="Delete Account Request" danger />
        </View>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, danger }: { icon: string; label: string; danger?: boolean }) {
  return (
    <Pressable style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name={icon as never} size={19} color={danger ? '#E27F73' : '#2CB7C5'} />
        <Text style={[styles.rowText, danger && styles.rowTextDanger]}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#B0BDCC" />
    </Pressable>
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
  row: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#E2ECF7',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { color: '#2E3C52', fontSize: 14, fontWeight: '500' },
  rowTextDanger: { color: '#D96E63' },
});
