import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { AuthModal } from '../profile/AuthModal';

interface SignedOutScreenProps {
  onContinueAsGuest: () => void;
}

export const SignedOutScreen: React.FC<SignedOutScreenProps> = ({ onContinueAsGuest }) => {
  const { signInWithGoogle } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup' | 'link' | 'recovery'>('signin');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Sua sessão foi encerrada com sucesso.');
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      AccessibilityInfo.announceForAccessibility('Iniciando login com o Google...');
      const result = await signInWithGoogle();
      if (result?.url) {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.assign) {
          window.location.assign(result.url);
        } else if (result.url) {
          await Linking.openURL(result.url);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.message?.includes('denied')) {
        setErrorMessage('Autenticação com o Google cancelada.');
        AccessibilityInfo.announceForAccessibility('Autenticação com o Google cancelada.');
      } else {
        const msg = err?.message || 'Falha na autenticação com o Google. Tente novamente.';
        setErrorMessage(msg);
        AccessibilityInfo.announceForAccessibility(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOpenEmailLogin = () => {
    setAuthInitialMode('signin');
    setErrorMessage(null);
    setIsAuthModalVisible(true);
  };

  const handleOpenSignUp = () => {
    setAuthInitialMode('signup');
    setErrorMessage(null);
    setIsAuthModalVisible(true);
  };

  const handleGuestContinue = () => {
    AccessibilityInfo.announceForAccessibility('Iniciando sessão como visitante...');
    onContinueAsGuest();
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerCard}>
          {/* Top Brand & Badge */}
          <LinearGradient
            colors={['#1C3B0F', '#284B18']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Ionicons name="leaf" size={28} color="#A3E635" />
          </LinearGradient>

          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.statusBadgeText}>Sessão Encerrada</Text>
          </View>

          {/* Heading */}
          <Text style={styles.title} accessibilityRole="header">
            Até logo!
          </Text>
          <Text style={styles.subtitle}>
            Você saiu da sua conta. Escolha como deseja continuar no ECOnexão:
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Action 1: Google Login */}
          <TouchableOpacity
            style={[styles.primaryGoogleButton, isGoogleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
            {...makeAccessibleButton('Entrar com o Google', 'Acessar sua conta Google cadastrada')}
            accessibilityState={{ busy: isGoogleLoading, disabled: isGoogleLoading }}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#1C3B0F" />
            ) : (
              <View style={styles.buttonContentRow}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.primaryGoogleButtonText}>Entrar com o Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action 2: Email & Password */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleOpenEmailLogin}
            {...makeAccessibleButton('Entrar com E-mail e Senha', 'Abrir tela de login com credenciais')}
          >
            <View style={styles.buttonContentRow}>
              <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emailButtonText}>Entrar com E-mail</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou explore</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Action 3: Continue as Guest */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestContinue}
            {...makeAccessibleButton(
              'Continuar como Visitante',
              'Acessar o catálogo, mapa e rotas do ECOnexão em modo anônimo'
            )}
          >
            <View style={styles.buttonContentRow}>
              <Ionicons name="compass-outline" size={20} color="#284B18" />
              <View style={styles.guestButtonTextCol}>
                <Text style={styles.guestButtonTitle}>Continuar como Visitante</Text>
                <Text style={styles.guestButtonSubtitle}>Explorar rotas e mapa sem login</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          {/* Footer: Sign Up Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity
              onPress={handleOpenSignUp}
              {...makeAccessibleButton('Criar conta', 'Cadastrar uma nova conta')}
            >
              <Text style={styles.footerLinkText}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.brandFooter}>ECOnexão • Turismo Sustentável e Comunitário</Text>
      </ScrollView>

      {/* Auth Modal for Sign-in / Sign-up */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
        initialMode={authInitialMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F4F7F2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  centerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: '#E6EFE2',
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1C3B0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: theme.typography.labelSm.fontFamily,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C3B0F',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.headlineSm.fontFamily,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#52604D',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
  },
  primaryGoogleButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8E2D2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadows.card,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryGoogleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: theme.typography.labelMd.fontFamily,
  },
  emailButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#284B18',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#1C3B0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: theme.typography.labelMd.fontFamily,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guestButton: {
    width: '100%',
    backgroundColor: '#F4F9F0',
    borderColor: '#D4E7CE',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  guestButtonTextCol: {
    flex: 1,
    marginLeft: 4,
  },
  guestButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3B0F',
    fontFamily: theme.typography.labelMd.fontFamily,
  },
  guestButtonSubtitle: {
    fontSize: 11,
    color: '#52604D',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#284B18',
    textDecorationLine: 'underline',
  },
  brandFooter: {
    marginTop: 20,
    fontSize: 11,
    color: '#83937E',
    fontWeight: '500',
  },
});
