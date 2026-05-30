import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Platform, SafeAreaView, StyleSheet } from 'react-native';

import { BackgroundDecor } from './src/components/BackgroundDecor';
import { AboutScreen } from './src/screens/AboutScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { DisclaimerScreen } from './src/screens/DisclaimerScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { LanguageScreen } from './src/screens/LanguageScreen';
import { ManageDataScreen } from './src/screens/ManageDataScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import type { AppSettings } from './src/screens/SettingsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { TextSizeScreen } from './src/screens/TextSizeScreen';
import { UpgradeScreen } from './src/screens/UpgradeScreen';
import { APP_BG_DARK, APP_BG_LIGHT } from './src/theme';
import type { Screen } from './src/types/navigation';

type ProfilePayload = {
  fullName: string;
  email: string;
  photoUrl: string;
};

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string;
};

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMsg[];
  updatedAt: number;
};

export default function App() {
  const backendApiBase = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  const [screen, setScreen] = useState<Screen>('splash');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatPrefill, setChatPrefill] = useState('');
  const [chatSessionsByUser, setChatSessionsByUser] = useState<Record<string, ChatSession[]>>({});
  const [activeChatSessionByUser, setActiveChatSessionByUser] = useState<Record<string, string | null>>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    pushNotifications: true,
    healthTips: true,
    sounds: true,
    language: 'English',
    textSize: 'Medium',
  });
  const [profile, setProfile] = useState<ProfilePayload>({
    fullName: 'Sarah Mitchell',
    email: 'sarahmitchell@email.com',
    photoUrl: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentUserId(null);
      setScreen('login');
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      const target = getBackTarget(screen);
      if (!target) return false;
      setScreen(target);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [screen]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      if (!backendApiBase) {
        Alert.alert('Login failed', 'EXPO_PUBLIC_API_BASE_URL is missing in .env');
        return;
      }

      const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert('Login failed', String(data?.error || 'Invalid email or password.'));
        return;
      }

      const user = normalizeAuthUser(data?.user);
      setCurrentUserId(user.id);
      setProfile({
        fullName: user.fullName,
        email: user.email,
        photoUrl: user.photoUrl,
      });
      setScreen('home');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUpSendOtp = async (payload: { fullName: string; email: string; password: string; photoUrl: string }) => {
    try {
      setAuthLoading(true);
      if (!backendApiBase) {
        Alert.alert('Signup failed', 'EXPO_PUBLIC_API_BASE_URL is missing in .env');
        return;
      }

      const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert('Signup failed', String(data?.error || 'Could not send OTP.'));
        return;
      }
      Alert.alert('OTP sent', 'Check your email for the 6-digit OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUpVerifyOtp = async (email: string, otp: string) => {
    try {
      setAuthLoading(true);
      if (!backendApiBase) {
        Alert.alert('Signup failed', 'EXPO_PUBLIC_API_BASE_URL is missing in .env');
        return;
      }
      const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert('OTP verify failed', String(data?.error || 'Invalid OTP.'));
        return;
      }
      const user = normalizeAuthUser(data?.user);
      setCurrentUserId(user.id);
      setProfile({
        fullName: user.fullName,
        email: user.email,
        photoUrl: user.photoUrl,
      });
      setScreen('home');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordResetSendOtp = async (email: string) => {
    try {
      setAuthLoading(true);
      if (!backendApiBase) {
        Alert.alert('Reset failed', 'EXPO_PUBLIC_API_BASE_URL is missing in .env');
        return;
      }
      const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/auth/password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert('Reset failed', String(data?.error || 'Could not send OTP.'));
        return;
      }
      Alert.alert('OTP sent', 'Check your email for the reset OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (payload: { email: string; otp: string; newPassword: string }) => {
    try {
      setAuthLoading(true);
      if (!backendApiBase) {
        Alert.alert('Reset failed', 'EXPO_PUBLIC_API_BASE_URL is missing in .env');
        return;
      }
      const resp = await fetch(`${backendApiBase.replace(/\/+$/, '')}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert('Reset failed', String(data?.error || 'Could not reset password.'));
        return;
      }
      Alert.alert('Success', 'Password reset successfully. Please login.');
      setScreen('login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setCurrentUserId(null);
    setScreen('login');
  };

  const historyKey = currentUserId || 'guest';
  const currentSessions = chatSessionsByUser[historyKey] || [];
  const activeSessionId = activeChatSessionByUser[historyKey] || null;

  const ensureActiveChatSession = () => {
    const existing = activeChatSessionByUser[historyKey];
    if (existing && currentSessions.some((s) => s.id === existing)) return existing;

    const id = createUuid();
    const next: ChatSession = {
      id,
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          text: 'Hello! Ask any medical question and I will explain it in simple language.',
        },
      ],
    };
    setChatSessionsByUser((prev) => ({ ...prev, [historyKey]: [next, ...(prev[historyKey] || [])] }));
    setActiveChatSessionByUser((prev) => ({ ...prev, [historyKey]: id }));
    return id;
  };

  const handleAppendSessionMessage = (msg: ChatMsg) => {
    const sid = ensureActiveChatSession();
    setChatSessionsByUser((prev) => {
      const list = prev[historyKey] || [];
      const next = list.map((s) => {
        if (s.id !== sid) return s;
        const nextTitle =
          s.title === 'New Chat' && msg.role === 'user'
            ? msg.text.slice(0, 60)
            : s.title;
        return {
          ...s,
          title: nextTitle || s.title,
          updatedAt: Date.now(),
          messages: [...s.messages, msg],
        };
      });
      return { ...prev, [historyKey]: next.sort((a, b) => b.updatedAt - a.updatedAt) };
    });
  };

  const handleClearLocalHistory = () => {
    setChatSessionsByUser((prev) => ({ ...prev, [historyKey]: [] }));
    setActiveChatSessionByUser((prev) => ({ ...prev, [historyKey]: null }));
  };

  const handleOpenChatSession = (sessionId: string, prefill = '') => {
    setActiveChatSessionByUser((prev) => ({ ...prev, [historyKey]: sessionId }));
    setChatPrefill(prefill);
    setScreen('chat');
  };

  const handleStartNewChat = (prefill = '') => {
    const id = createUuid();
    const next: ChatSession = {
      id,
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          text: 'Hello! Ask any medical question and I will explain it in simple language.',
        },
      ],
    };
    setChatSessionsByUser((prev) => ({ ...prev, [historyKey]: [next, ...(prev[historyKey] || [])] }));
    setActiveChatSessionByUser((prev) => ({ ...prev, [historyKey]: id }));
    setChatPrefill(prefill);
    setScreen('chat');
  };

  const handleOpenChat = (sessionId?: string, prefill = '') => {
    if (sessionId) {
      handleOpenChatSession(sessionId, prefill);
      return;
    }
    handleStartNewChat(prefill);
  };

  const sessionForChat =
    currentSessions.find((s) => s.id === (activeSessionId || '')) ||
    currentSessions[0] ||
    null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: settings.darkMode ? APP_BG_DARK : APP_BG_LIGHT }]}>
      <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
      <BackgroundDecor darkMode={settings.darkMode} />
      {screen === 'splash' ? (
        <SplashScreen />
      ) : screen === 'forgot_password' ? (
        <ForgotPasswordScreen
          onGoBack={() => setScreen('login')}
          onGoLogin={() => setScreen('login')}
          onSendOtp={handlePasswordResetSendOtp}
          onResetPassword={handlePasswordResetConfirm}
          loading={authLoading}
        />
      ) : screen === 'edit_profile' ? (
        <EditProfileScreen
          profile={profile}
          onBack={() => setScreen('profile')}
          onSave={(next) => {
            setProfile(next);
            setScreen('profile');
          }}
        />
      ) : screen === 'help' ? (
        <HelpScreen
          onBack={() => setScreen('profile')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            handleStartNewChat();
          }}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'about' ? (
        <AboutScreen
          onBack={() => setScreen('profile')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            handleStartNewChat();
          }}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'disclaimer' ? (
        <DisclaimerScreen
          onBack={() => setScreen('profile')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            handleStartNewChat();
          }}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'history' ? (
        <HistoryScreen
          items={currentSessions.map((s) => ({ id: s.id, title: s.title }))}
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={(sessionId?: string) => {
            handleOpenChat(sessionId);
          }}
          onClearHistory={handleClearLocalHistory}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'upgrade' ? (
        <UpgradeScreen
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            handleStartNewChat();
          }}
        />
      ) : screen === 'settings' ? (
        <SettingsScreen
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            handleStartNewChat();
          }}
          onGoUpgrade={() => setScreen('upgrade')}
          onGoLanguage={() => setScreen('settings_language')}
          onGoTextSize={() => setScreen('settings_text_size')}
          onGoManageData={() => setScreen('settings_manage_data')}
          onGoPrivacyPolicy={() => setScreen('settings_privacy_policy')}
          settings={settings}
          onChangeSettings={setSettings}
        />
      ) : screen === 'settings_language' ? (
        <LanguageScreen
          value={settings.language}
          onBack={() => setScreen('settings')}
          onChange={(language) => setSettings((prev) => ({ ...prev, language }))}
        />
      ) : screen === 'settings_text_size' ? (
        <TextSizeScreen
          value={settings.textSize}
          onBack={() => setScreen('settings')}
          onChange={(textSize) => setSettings((prev) => ({ ...prev, textSize }))}
        />
      ) : screen === 'settings_manage_data' ? (
        <ManageDataScreen onBack={() => setScreen('settings')} />
      ) : screen === 'settings_privacy_policy' ? (
        <PrivacyPolicyScreen onBack={() => setScreen('settings')} />
      ) : screen === 'profile' ? (
        <ProfileScreen
          profile={profile}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoEditProfile={() => setScreen('edit_profile')}
          onGoHelp={() => setScreen('help')}
          onGoAbout={() => setScreen('about')}
          onGoDisclaimer={() => setScreen('disclaimer')}
          onGoUpgrade={() => setScreen('upgrade')}
          onGoChat={() => {
            handleStartNewChat();
          }}
          onLogout={handleLogout}
        />
      ) : screen === 'chat' ? (
        <ChatScreen
          userId={currentUserId}
          sessionMessages={
            sessionForChat?.messages || [
              {
                id: `m-${Date.now()}`,
                role: 'assistant',
                text: 'Hello! Ask any medical question and I will explain it in simple language.',
              },
            ]
          }
          initialText={chatPrefill}
          onAppendMessage={handleAppendSessionMessage}
          onGoHome={() => setScreen('home')}
        />
      ) : screen === 'home' ? (
        <HomeScreen
          userName={profile.fullName}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoSettings={() => setScreen('settings')}
          onGoHelp={() => setScreen('help')}
          onGoAbout={() => setScreen('about')}
          onGoUpgrade={() => setScreen('upgrade')}
          onLogout={handleLogout}
          onGoChat={(text?: string) => {
            handleStartNewChat(text ?? '');
          }}
        />
      ) : screen === 'login' ? (
        <LoginScreen
          onGoSignUp={() => setScreen('signup')}
          onGoForgotPassword={() => setScreen('forgot_password')}
          onLogin={handleLogin}
          loading={authLoading}
        />
      ) : (
        <SignUpScreen
          onGoLogin={() => setScreen('login')}
          onSendOtp={handleSignUpSendOtp}
          onVerifyOtp={handleSignUpVerifyOtp}
          loading={authLoading}
        />
      )}
    </SafeAreaView>
  );
}

function createUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getBackTarget(current: Screen): Screen | null {
  switch (current) {
    case 'signup':
    case 'forgot_password':
      return 'login';
    case 'chat':
    case 'profile':
    case 'settings':
    case 'history':
    case 'upgrade':
      return 'home';
    case 'edit_profile':
    case 'help':
    case 'about':
    case 'disclaimer':
      return 'profile';
    case 'settings_language':
    case 'settings_text_size':
    case 'settings_manage_data':
    case 'settings_privacy_policy':
      return 'settings';
    case 'home':
    case 'login':
    case 'splash':
      return null;
    default:
      return 'home';
  }
}

function normalizeAuthUser(input: any): AuthUser {
  const id = String(input?.id || '').trim() || createUuid();
  const fullName = String(input?.fullName || '').trim() || 'MediCompanion User';
  const email = String(input?.email || '').trim();
  const photoUrl = String(input?.photoUrl || '').trim();
  return {
    id,
    fullName,
    email,
    photoUrl,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
