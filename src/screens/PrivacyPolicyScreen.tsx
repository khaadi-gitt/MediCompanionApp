import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
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
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.topBtn} />
        </View>

        <ScrollView style={styles.card} contentContainerStyle={styles.cardBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.point}>1. We store basic account details for login and profile use.</Text>
          <Text style={styles.point}>2. Chat messages may be processed to generate medical education responses.</Text>
          <Text style={styles.point}>3. This app is for educational information only and not clinical diagnosis.</Text>
          <Text style={styles.point}>4. You can request data export or data deletion from Manage Data settings.</Text>
          <Text style={styles.point}>5. We apply security controls to protect keys, sessions, and API access.</Text>
        </ScrollView>
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
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDF6',
    backgroundColor: '#FFFFFF',
  },
  cardBody: { padding: 12, gap: 10 },
  point: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#E2ECF7',
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: '#2E3C52',
    fontSize: 14,
    lineHeight: 20,
  },
});
