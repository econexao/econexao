import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { AppHeader } from '../../../src/components/common/AppHeader';
import { AuthModal } from '../../../src/components/profile/AuthModal';
import { EditProfileModal } from '../../../src/components/profile/EditProfileModal';
import { AccountDeletionModal } from '../../../src/components/profile/AccountDeletionModal';
import { apiClient } from '../../../src/api/client';
import { useMyProfileQuery } from '../../../src/hooks/queries';
import { useAuth } from '../../../src/hooks/useAuth';
import { queryKeys } from '../../../src/api/queryKeys';
import { queryClient } from '../../../src/api/queryClient';
import { theme, useAppTheme } from '../../../src/theme/theme';
import { makeAccessibleButton } from '../../../src/utils/accessibility';
import { MotionBlock } from '../../../src/components/common/MotionBlock';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, signOut } = useAuth();
  const profileQuery = useMyProfileQuery(user?.id);
  const profile = profileQuery.data;
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'link' | 'signin' | 'signup' | 'recovery' | undefined>(undefined);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isAccountDeletionModalVisible, setIsAccountDeletionModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const avatarBusyRef = useRef(false);

  const isAnonymous = user ? (user.is_anonymous === true && !user.email) : true;
  const googleName = (user?.user_metadata?.full_name || user?.user_metadata?.name || '').trim();
  const userName =
    profile?.name ||
    googleName ||
    (isAnonymous ? 'Visitante' : user?.email?.split('@')[0] || 'Usuário ECOnexão');

  const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUri = profile?.avatar?.url || googleAvatarUrl;

  const handleAvatarPress = async () => {
    if (avatarBusyRef.current) return;
    avatarBusyRef.current = true;
    setIsUploading(true);
    try {
      AccessibilityInfo.announceForAccessibility('Abrindo seletor de foto do perfil.');
      const picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (picker.canceled) return;
      const asset = picker.assets[0];
      await apiClient.uploadAvatar({
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
        file: asset.file,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile(user?.id) });
      AccessibilityInfo.announceForAccessibility('Foto do perfil atualizada com sucesso.');
      Alert.alert('Foto atualizada', 'Seu avatar foi processado e publicado com segurança.');
    } catch {
      AccessibilityInfo.announceForAccessibility('Não foi possível atualizar a foto do perfil.');
      Alert.alert('Erro no upload', 'Não foi possível atualizar a foto. Tente novamente.');
    } finally {
      avatarBusyRef.current = false;
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      queryClient.clear();
      await signOut();
      AccessibilityInfo.announceForAccessibility('Sessão encerrada com sucesso.');
    } catch {
      Alert.alert('Erro ao sair', 'Não foi possível encerrar a sessão. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Meu Perfil" />

      <ScrollView contentContainerStyle={styles.content}>
        <MotionBlock staggerIndex={0}>
        {/* Banner de Convidado / Salvar Conta com Google (ADR 0007 / ECO-2606) */}
        {isAnonymous && (
          <LinearGradient
            colors={['#1C3B0F', '#284B18', '#33601E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.guestBanner}
          >
            <View style={styles.guestBannerContent}>
              <View style={styles.guestBannerIconWrapper}>
                <Ionicons name="sparkles" size={16} color="#FDE047" />
              </View>

              <View style={styles.guestBannerTextCol}>
                <View style={styles.guestBannerTitleRow}>
                  <Text style={styles.guestBannerTitle}>Salvar Favoritos</Text>
                  <View style={styles.guestBannerBadge}>
                    <Text style={styles.guestBannerBadgeText}>100% Grátis</Text>
                  </View>
                </View>
                <Text style={styles.guestBannerSubtitle} numberOfLines={1}>
                  Vincule com Google e não perca dados
                </Text>
              </View>

              <TouchableOpacity
                style={styles.guestBannerButton}
                onPress={() => {
                  setAuthInitialMode('link');
                  setIsAuthModalVisible(true);
                }}
                {...makeAccessibleButton('Salvar conta', 'Abrir opções de login e vinculação')}
              >
                <Ionicons name="logo-google" size={14} color="#EA4335" style={{ marginRight: 4 }} />
                <Text style={styles.guestBannerButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* Profile Info Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={isUploading}
              {...makeAccessibleButton('Alterar Foto do Perfil', 'Toque para selecionar uma foto')}
              accessibilityLabel={isUploading ? 'Atualizando foto do perfil' : 'Alterar Foto do Perfil'}
              accessibilityState={{ disabled: isUploading, busy: isUploading }}
            >
              {isUploading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.brandForest}
                  accessibilityLabel="Upload da foto em andamento"
                />
              ) : avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  accessible={false}
                />
              ) : (
                <Ionicons name="person" size={28} color={theme.colors.brandForest} />
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={11} color={theme.colors.surfaceWhite} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileTextInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditProfileModalVisible(true)}
                  style={styles.editProfileIconBtn}
                  {...makeAccessibleButton('Editar informações do perfil')}
                >
                  <Ionicons name="pencil" size={14} color={theme.colors.brandForest} />
                </TouchableOpacity>
              </View>

              <View style={styles.userStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.userRole} numberOfLines={1}>
                  {isAnonymous
                    ? 'Sessão Convidado • Modo Anônimo'
                    : user?.email ?? 'Conta Autenticada'}
                </Text>
              </View>

              {profile?.location && (
                <View style={styles.userLocationRow}>
                  <Ionicons name="location-outline" size={12} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.userLocationText} numberOfLines={1}>
                    {profile.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Menu de Preferências & Minha Conta (Grid 2 Colunas) */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeaderTitle}>Minha Conta & Preferências</Text>

          <View style={styles.gridContainer}>
            {/* 1. Rotas Salvas */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/favorite-routes')}
              {...makeAccessibleButton('Rotas Salvas', 'Visualizar suas rotas favoritadas')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                  <Ionicons name="bookmark" size={18} color="#059669" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Rotas Salvas</Text>
                <Text style={styles.gridCardSubtitle}>Trilhas offline</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Atores Favoritos */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/favorite-actors')}
              {...makeAccessibleButton('Atores Favoritos', 'Visualizar estabelecimentos salvos')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }]}>
                  <Ionicons name="heart" size={18} color="#E11D48" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Atores Favoritos</Text>
                <Text style={styles.gridCardSubtitle}>Guias e pontos</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Histórico de Viagens */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/trips')}
              {...makeAccessibleButton('Histórico de Viagens', 'Ver passeios e trajetos realizados')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <Ionicons name="compass" size={18} color="#D97706" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Histórico</Text>
                <Text style={styles.gridCardSubtitle}>Passeios feitos</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Acessibilidade */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/accessibility')}
              {...makeAccessibleButton('Acessibilidade', 'Ajustar opções visuais e de contraste')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}>
                  <Ionicons name="accessibility" size={18} color="#0D9488" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Acessibilidade</Text>
                <Text style={styles.gridCardSubtitle}>Áudio e contraste</Text>
              </View>
            </TouchableOpacity>

            {/* 5. Ajuda & Suporte */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/support')}
              {...makeAccessibleButton('Ajuda & Suporte', 'Acessar documentação e contatos')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}>
                  <Ionicons name="help-circle" size={18} color="#0284C7" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Ajuda & Suporte</Text>
                <Text style={styles.gridCardSubtitle}>Dúvidas e SAC</Text>
              </View>
            </TouchableOpacity>

            {/* 6. Termos & Privacidade */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/(profile)/legal')}
              {...makeAccessibleButton('Termos & Privacidade LGPD', 'Acessar termos de uso e política de privacidade')}
            >
              <View style={styles.gridCardTop}>
                <View style={[styles.iconBox, { backgroundColor: '#F4F9F0', borderColor: '#E1EEDB' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#33601E" />
                </View>
                <Ionicons name="arrow-forward-outline" size={14} color="#A3A89F" />
              </View>
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle}>Termos & Dados</Text>
                <Text style={styles.gridCardSubtitle}>Políticas LGPD</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Deletion & Session Action (Sign Out / LGPD) */}
        <View style={styles.accountActionsSection}>
          {!isAnonymous ? (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                {...makeAccessibleButton('Encerrar sessão', 'Fazer logout da conta atual')}
              >
                <Ionicons name="log-out-outline" size={16} color="#42493D" />
                <Text style={styles.signOutText}>Encerrar Sessão</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={() => setIsAccountDeletionModalVisible(true)}
                {...makeAccessibleButton('Excluir minha conta', 'Solicitar exclusão de conta conforme a LGPD')}
              >
                <Ionicons name="trash-outline" size={15} color="#B91C1C" />
                <Text style={styles.deleteAccountText}>Excluir Conta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => {
                setAuthInitialMode('signin');
                setIsAuthModalVisible(true);
              }}
              {...makeAccessibleButton('Entrar na minha conta', 'Acessar sua conta com e-mail ou Google')}
            >
              <Ionicons name="log-in-outline" size={18} color="#284B18" />
              <Text style={styles.signInButtonText}>Entrar na Minha Conta</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.versionFooterText}>
            ECOnexão Sustentável v2.4 • Amazônia Viva
          </Text>
        </View>
        </MotionBlock>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditProfileModalVisible}
        onClose={() => setIsEditProfileModalVisible(false)}
        currentProfile={profile}
        userId={user?.id}
      />

      {/* Account Deletion Modal (LGPD) */}
      <AccountDeletionModal
        visible={isAccountDeletionModalVisible}
        onClose={() => setIsAccountDeletionModalVisible(false)}
      />

      {/* Auth & Account Linking Modal (ADR 0007 / ECO-1902) */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
        initialMode={authInitialMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  guestBanner: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  guestBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  guestBannerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestBannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  guestBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: theme.typography.headlineSm.fontFamily,
  },
  guestBannerBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  guestBannerBadgeText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '700',
  },
  guestBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(225, 238, 219, 0.9)',
    marginTop: 2,
  },
  guestBannerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  guestBannerButtonText: {
    color: '#142A0B',
    fontSize: 11,
    fontWeight: '700',
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.18)',
    ...theme.shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(117, 155, 113, 0.12)',
    borderWidth: 2,
    borderColor: '#C5DDBC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.brandForest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileTextInfo: {
    flex: 1,
    minWidth: 0,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: '#191C1B',
    fontFamily: theme.typography.headlineSm.fontFamily,
    flexShrink: 1,
  },
  editProfileIconBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
  },
  userStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#538A44',
  },
  userRole: {
    fontSize: 12,
    color: '#575F51',
    fontWeight: '500',
    flexShrink: 1,
  },
  userLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userLocationText: {
    fontSize: 11,
    color: '#72796C',
    fontWeight: '500',
    flexShrink: 1,
  },
  menuSection: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#284B18',
    paddingHorizontal: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: '48.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.16)',
    padding: 11,
    justifyContent: 'space-between',
    minHeight: 74,
    ...theme.shadows.card,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardBottom: {
    gap: 2,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191C1B',
    lineHeight: 15,
  },
  gridCardSubtitle: {
    fontSize: 10,
    color: '#72796C',
    lineHeight: 12,
  },
  accountActionsSection: {
    marginTop: 2,
    gap: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(114, 121, 108, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#42493D',
  },
  deleteAccountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteAccountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(117, 155, 113, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signInButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#284B18',
  },
  versionFooterText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#8E9588',
    fontWeight: '500',
    paddingTop: 4,
  },
});
