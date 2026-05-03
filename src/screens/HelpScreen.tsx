import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { NavItem } from '../components/NavItem';

export function HelpScreen({
  onBack,
  onGoHome,
  onGoHistory,
  onGoProfile,
  onGoChat,
  onGoUpgrade,
}: {
  onBack: () => void;
  onGoHome: () => void;
  onGoHistory: () => void;
  onGoProfile: () => void;
  onGoChat: () => void;
  onGoUpgrade: () => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(isDesktop ? 620 : 560, width - 20);
  const topInset = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 8 : 10;
  const bottomInset = Platform.OS === 'android' ? 18 : 10;

  return (
    <View style={[styles.root, { paddingTop: topInset, paddingBottom: bottomInset }]}> 
      <ScrollView style={{ width: contentWidth }} showsVerticalScrollIndicator={false}>
        <Top title="Help Center" onBack={onBack} />
        <View style={styles.card}>
          <Item title="How to ask a better question?" body="Write clear symptoms and duration for better response." />
          <Item title="Is this app for diagnosis?" body="No. This app is educational and not a replacement for doctors." />
          <Item title="How to contact support?" body="Email: support@medicompanion.app" />
        </View>
      </ScrollView>

      <BottomNav
        width={contentWidth}
        bottom={bottomInset}
        onGoHome={onGoHome}
        onGoHistory={onGoHistory}
        onGoProfile={onGoProfile}
        onGoChat={onGoChat}
        onGoUpgrade={onGoUpgrade}
      />
    </View>
  );
}

function Top({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.topRow}>
      <Pressable style={styles.topBtn} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#2AAFC0" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.topBtn} />
    </View>
  );
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemBody}>{body}</Text>
    </View>
  );
}

function BottomNav({
  width,
  bottom,
  onGoHome,
  onGoHistory,
  onGoProfile,
  onGoChat,
  onGoUpgrade,
}: {
  width: number;
  bottom: number;
  onGoHome: () => void;
  onGoHistory: () => void;
  onGoProfile: () => void;
  onGoChat: () => void;
  onGoUpgrade: () => void;
}) {
  return (
    <View style={[styles.bottomNav, { width, marginBottom: bottom }]}> 
      <NavItem label="Home" icon="home" onPress={onGoHome} />
      <NavItem label="History" icon="history" onPress={onGoHistory} />
      <Pressable style={styles.centerBtn} onPress={onGoChat}>
        <MaterialCommunityIcons name="chat-processing-outline" size={22} color="#FFFFFF" />
      </Pressable>
      <NavItem label="Profile" icon="account-outline" onPress={onGoProfile} />
      <NavItem label="Upgrade Pro" icon="star-four-points-outline" accent onPress={onGoUpgrade} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
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
  title: { fontSize: 22, color: '#2D3F56', fontWeight: '700' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDF6',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  item: { borderRadius: 12, backgroundColor: '#F8FBFF', borderWidth: 1, borderColor: '#E2ECF7', padding: 12 },
  itemTitle: { fontSize: 14, color: '#2E3C52', fontWeight: '700' },
  itemBody: { marginTop: 4, fontSize: 12, color: '#7F8A9B' },
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
