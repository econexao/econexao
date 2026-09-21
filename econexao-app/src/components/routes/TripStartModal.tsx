import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { makeAccessibleButton, setAccessibilityFocusSafely } from '../../utils/accessibility';
import { AccessibleModal } from '../common/AccessibleModal';

export interface TripStartModalProps {
  visible: boolean;
  routeName: string;
  isStarting: boolean;
  isSuccess: boolean;
  onConfirmStart: () => void;
  onCancel: () => void;
  onGoToHistory: () => void;
  onContinueExploring: () => void;
  returnFocusRef?: React.RefObject<any>;
}

export const TripStartModal: React.FC<TripStartModalProps> = ({
  visible,
  routeName,
  isStarting,
  isSuccess,
  onConfirmStart,
  onCancel,
  onGoToHistory,
  onContinueExploring,
  returnFocusRef,
}) => {
  const modalTitleRef = useRef<any>(null);
  const successTitleRef = useRef<any>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (visible) {
      timer = setTimeout(() => {
        setAccessibilityFocusSafely(isSuccess ? successTitleRef : modalTitleRef);
      }, 50);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visible, isSuccess]);

  return (
    <AccessibleModal
      visible={visible}
      transparent
      animationType="fade"
      onClose={isSuccess ? onContinueExploring : onCancel}
      initialFocusRef={isSuccess ? successTitleRef : modalTitleRef}
      returnFocusRef={returnFocusRef}
      accessibilityLabel="Informações sobre o registro de viagem"
    >
      <View style={styles.overlay}>
        <View
          style={styles.dialogCard}
          accessible
          accessibilityLabel={isSuccess ? 'Viagem iniciada com sucesso' : 'Confirmar início da viagem'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isSuccess ? (
              <>
                <View style={styles.successIconBadge}>
                  <Ionicons name="checkmark-circle" size={44} color={theme.colors.brandForest} />
                </View>

                <Text
                  ref={successTitleRef}
                  style={styles.successTitle}
                  accessibilityRole="header"
                >
                  Viagem Registrada!
                </Text>

                <Text style={styles.successSubtitle}>
                  Sua visita na rota <Text style={styles.bold}>{routeName}</Text> foi registrada com o status{' '}
                  <Text style={styles.bold}>Em andamento</Text>.
                </Text>

                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.brandForest} />
                  <Text style={styles.infoCardText}>
                    Você pode pausar, retomar ou finalizar esta viagem quando quiser na aba de Histórico do seu Perfil.
                  </Text>
                </View>

                <View style={styles.buttonStack}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.colors.brandForest }]}
                    onPress={onGoToHistory}
                    {...makeAccessibleButton('Ver no Histórico de Viagens', 'Abre a tela de histórico de viagens no seu perfil')}
                  >
                    <Ionicons name="time-outline" size={18} color={theme.colors.surfaceWhite} />
                    <Text style={styles.primaryButtonText}>Ver no Histórico de Viagens</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onContinueExploring}
                    {...makeAccessibleButton('Continuar explorando a rota', 'Fecha esta janela e retorna aos detalhes da rota')}
                  >
                    <Text style={styles.secondaryButtonText}>Continuar explorando a rota</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="compass" size={26} color={theme.colors.brandForest} />
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text
                      ref={modalTitleRef}
                      style={styles.title}
                      accessibilityRole="header"
                    >
                      Registrar Início da Viagem
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {routeName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.introText}>
                  Entenda como funciona o registro antes de iniciar:
                </Text>

                {/* Explanations List */}
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="bookmark-outline" size={20} color={theme.colors.brandForest} />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>O que é registrado</Text>
                      <Text style={styles.featureDescription}>
                        Salva o início da sua visita no histórico do perfil com a data e rota selecionada.
                        <Text style={styles.featureHighlight}> Não realiza rastreamento contínuo em segundo plano.</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="map-outline" size={20} color={theme.colors.brandForest} />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>Exploração e Mapa</Text>
                      <Text style={styles.featureDescription}>
                        Consultar o mapa, calcular trajetos e ver atrativos são ações livres que não criam viagens automaticamente.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="flag-outline" size={20} color={theme.colors.brandForest} />
                    </View>
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>Como encerrar</Text>
                      <Text style={styles.featureDescription}>
                        Ao concluir ou pausar seu passeio, acesse <Text style={styles.bold}>Perfil &gt; Histórico de viagens</Text> para finalizar o registro.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonStack}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.colors.brandForest },
                      isStarting && styles.disabledButton,
                    ]}
                    onPress={onConfirmStart}
                    disabled={isStarting}
                    {...makeAccessibleButton(
                      'Confirmar e iniciar viagem',
                      'Registra o início do passeio no histórico do seu perfil'
                    )}
                  >
                    {isStarting ? (
                      <ActivityIndicator size="small" color={theme.colors.surfaceWhite} />
                    ) : (
                      <>
                        <Ionicons name="play" size={16} color={theme.colors.surfaceWhite} />
                        <Text style={styles.primaryButtonText}>Confirmar e Iniciar Viagem</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onCancel}
                    disabled={isStarting}
                    {...makeAccessibleButton('Cancelar', 'Fecha esta janela sem registrar a viagem')}
                  >
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </AccessibleModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(51, 96, 30, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurfaceVariant,
  },
  featureList: {
    gap: 14,
    paddingVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
  },
  featureHighlight: {
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  bold: {
    fontWeight: '700',
  },
  buttonStack: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: theme.colors.surfaceWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
  },
  successIconBadge: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.brandForest,
    fontWeight: '500',
  },
});
