import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { NavItem } from '../components/NavItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function HistoryScreen({
  items,
  onBack,
  onGoHome,
  onGoProfile,
  onGoChat,
  onClearHistory,
  onGoUpgrade,
}: {
  items: { id: string; title: string }[];
  onBack: () => void;
  onGoHome: () => void;
  onGoProfile: () => void;
  onGoChat: (sessionId?: string) => void;
  onClearHistory: () => void;
  onGoUpgrade: () => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(isDesktop ? 620 : 560, width - 20);
  const topInset = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 8 : 10;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 2 : 8);

  const latestSessionItems = useMemo(() => {
    return items.slice(0, 30);
  }, [items]);

  return (
    <View style={[styles.root, { paddingTop: topInset, paddingBottom: 0 }]}> 
      <ScrollView style={{ width: contentWidth }} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable style={styles.topBtn} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2AAFC0" />
          </Pressable>
          <Text style={styles.title}>History</Text>
          <Pressable style={styles.topBtn} onPress={onClearHistory}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#A5B2C1" />
          </Pressable>
        </View>

        <View style={styles.card}>
          {latestSessionItems.length === 0 ? (
            <Text style={styles.emptyText}>No history yet. Start a chat to save history.</Text>
          ) : null}
          {latestSessionItems.map((item) => (
            <Pressable style={styles.row} key={item.id} onPress={() => onGoChat(item.id)}>
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons name="history" size={18} color="#2CB7C5" />
                <Text style={styles.rowText}>{item.title}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#B0BDCC" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { width: contentWidth, marginBottom: bottomInset }]}> 
        <NavItem label="Home" icon="home" onPress={onGoHome} />
        <NavItem label="History" icon="history" active />
        <Pressable style={styles.centerBtn} onPress={() => onGoChat()}>
          <MaterialCommunityIcons name="chat-processing-outline" size={22} color="#FFFFFF" />
        </Pressable>
        <NavItem label="Profile" icon="account-outline" onPress={onGoProfile} />
        <NavItem label="Upgrade Pro" icon="star-four-points-outline" accent onPress={onGoUpgrade} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
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
  title: { fontSize: 22, color: '#2D3F56', fontWeight: '700' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDF6',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 8,
  },
  row: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#E2ECF7',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  rowText: { color: '#2E3C52', fontSize: 13, fontWeight: '500', flexShrink: 1 },
  emptyText: { color: '#6A7C92', fontSize: 13, paddingHorizontal: 4, paddingVertical: 8 },
  bottomNav: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5EDF7',
    minHeight: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F28D70',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
