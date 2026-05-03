import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Field } from '../components/Field';
import { LogoMark } from '../components/LogoMark';

export function ForgotPasswordScreen({
  onGoBack,
  onGoLogin,
}: {
  onGoBack: () => void;
  onGoLogin: () => void;
}) {
  const { height, width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const top = isDesktop ? Math.max(18, Math.min(36, height * 0.05)) : Math.max(38, Math.min(72, height * 0.08));
  const contentWidth = Math.min(isDesktop ? 560 : 470, width - 28);

  return (
    <ScrollView contentContainerStyle={[styles.root, { paddingTop: top }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { width: contentWidth }]}> 
        <Pressable style={styles.backBtn} onPress={onGoBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2AAFC0" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.topBrand}>
          <LogoMark size="login" />
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions.</Text>
        </View>

        <View style={styles.card}>
          <Field
            icon={<MaterialCommunityIcons name="email-outline" size={20} color="#A3AABB" />}
            placeholder="Email"
            secure={false}
          />
          <Pressable style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Send Reset Link</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Remembered your password?{' '}
          <Text style={styles.loginLink} onPress={onGoLogin}>
            Log In
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
    marginBottom: 6,
  },
  backText: {
    color: '#2AAFC0',
    fontWeight: '600',
    fontSize: 13,
  },
  topBrand: {
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    marginTop: 4,
    fontSize: 22,
    color: '#2D3E54',
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#7A8495',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#F8FCFF',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E7EFFA',
  },
  sendBtn: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#21B1C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footerText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#757C8A',
    fontSize: 13,
  },
  loginLink: {
    color: '#F2875E',
    fontWeight: '600',
  },
});
