import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ActorCard } from '../../../src/components/catalog/ActorCard';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { EmptyStateView, ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { useMyFavoriteActorsQuery } from '../../../src/hooks/queries';
import { useOptimisticFavoriteActor } from '../../../src/hooks/useOptimisticFavoriteActor';
import { useAuth } from '../../../src/hooks/useAuth';
import { theme } from '../../../src/theme/theme';

export default function FavoriteActorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const favActors = useMyFavoriteActorsQuery(user?.id);
  const { toggleFavorite } = useOptimisticFavoriteActor();

  return (
    <View style={styles.container}>
      <AppHeader showBack fallbackHref="/(tabs)/(profile)" title="Lugares e Serviços Salvos" />

      <ScrollView contentContainerStyle={styles.content}>
        {favActors.isPending ? (
          <LoadingView message="Carregando lugares e serviços salvos..." />
        ) : favActors.isError ? (
          <ErrorStateView
            title="Erro ao carregar lugares e serviços"
            message="Não foi possível obter seus lugares e serviços salvos no momento."
            onRetry={() => void favActors.refetch()}
          />
        ) : favActors.data?.length ? (
          favActors.data.map((actorSummary) => (
              <ActorCard
                key={actorSummary.id}
                actor={actorSummary}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(actorSummary, true)}
                onPress={() => router.push(`/actor/${actorSummary.id}`)}
              />
          ))
        ) : (
          <EmptyStateView
            title="Nenhum lugar salvo"
            message="Você ainda não salvou nenhum local ou serviço nos seus favoritos."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBackground,
  },
  content: {
    padding: theme.spacing.marginMobile,
    gap: 12,
  },
});
