import type { User } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Platform, SafeAreaView, StyleSheet } from 'react-native';

import { BackgroundDecor } from './src/components/BackgroundDecor';
import { supabase } from './src/lib/supabase';
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [chatPrefill, setChatPrefill] = useState('');
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
    let isMounted = true;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const user = data.session?.user ?? null;
      if (user) {
        setProfile(getProfileFromUser(user));
        setScreen('home');
      } else {
        setScreen('login');
      }
    }, 1100);

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const user = session?.user ?? null;
      if (user) {
        setProfile(getProfileFromUser(user));
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }

      if (data.user) {
        setProfile(getProfileFromUser(data.user));
      }
      setScreen('home');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (payload: { fullName: string; email: string; password: string; photoUrl: string }) => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName,
            photo_url: payload.photoUrl,
          },
        },
      });

      if (error) {
        Alert.alert('Signup failed', error.message);
        return;
      }

      const user = data.user;
      const session = data.session;

      if (user) {
        setProfile({
          fullName: payload.fullName,
          email: payload.email,
          photoUrl: payload.photoUrl,
        });
      }

      if (session) {
        setScreen('home');
      } else {
        Alert.alert('Signup successful', 'Account created. Email confirmation may be required before login.');
        setScreen('login');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScreen('login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: settings.darkMode ? APP_BG_DARK : APP_BG_LIGHT }]}>
      <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
      <BackgroundDecor darkMode={settings.darkMode} />
      {screen === 'splash' ? (
        <SplashScreen />
      ) : screen === 'forgot_password' ? (
        <ForgotPasswordScreen onGoBack={() => setScreen('login')} onGoLogin={() => setScreen('login')} />
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
            setChatPrefill('');
            setScreen('chat');
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
            setChatPrefill('');
            setScreen('chat');
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
            setChatPrefill('');
            setScreen('chat');
          }}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'history' ? (
        <HistoryScreen
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            setChatPrefill('');
            setScreen('chat');
          }}
          onGoUpgrade={() => setScreen('upgrade')}
        />
      ) : screen === 'upgrade' ? (
        <UpgradeScreen
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            setChatPrefill('');
            setScreen('chat');
          }}
        />
      ) : screen === 'settings' ? (
        <SettingsScreen
          onBack={() => setScreen('home')}
          onGoHome={() => setScreen('home')}
          onGoHistory={() => setScreen('history')}
          onGoProfile={() => setScreen('profile')}
          onGoChat={() => {
            setChatPrefill('');
            setScreen('chat');
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
            setChatPrefill('');
            setScreen('chat');
          }}
          onLogout={handleLogout}
        />
      ) : screen === 'chat' ? (
        <ChatScreen initialText={chatPrefill} onGoHome={() => setScreen('home')} />
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
            setChatPrefill(text ?? '');
            setScreen('chat');
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
          onSignUp={handleSignUp}
          loading={authLoading}
        />
      )}
    </SafeAreaView>
  );
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

function getProfileFromUser(user: User): ProfilePayload {
  const fullName =
    String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim() || 'MediCompanion User';
  const photoUrl = String(user.user_metadata?.photo_url || '').trim();

  return {
    fullName,
    email: user.email || '',
    photoUrl,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
