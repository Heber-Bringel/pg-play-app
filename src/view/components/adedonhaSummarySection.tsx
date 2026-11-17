import React from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  AdedonhaAwards,
  AdedonhaPlayer,
  AdedonhaRoom,
} from '@/model/entities/multiplayerSession';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { GameCard } from '@/view/components/gameCard';
import { tokens } from '@/view/theme';

export type AdedonhaSummarySectionProps = {
  room: AdedonhaRoom;
  awards: AdedonhaAwards;
  rankedPlayers: AdedonhaPlayer[];
  isCurrentPlayerHost: boolean;
  onAdvanceToNextRound: () => Promise<void>;
  onGoToScoreboard: () => void;
};

export const AdedonhaSummarySection = ({
  room,
  awards,
  rankedPlayers,
  isCurrentPlayerHost,
  onAdvanceToNextRound,
  onGoToScoreboard,
}: AdedonhaSummarySectionProps) => {
  return (
    <View style={styles.container}>
      <GameCard
        title={
          room.phase === 'finished'
            ? 'Pódio Final da Adedonha Bíblica'
            : `Resumo da Rodada ${room.currentRound}`
        }
        description={`Letras já sorteadas: ${room.usedLetters.join(', ')}`}
        playersTag={`${room.players.length} jogadores`}
        icon="trophy-award"
      />

      {awards.generalChampion && (
        <GameCard
          title={`Campeão Geral: ${awards.generalChampion.nickname}`}
          description={`Mão Mais Rápida: ${awards.fastestHand?.nickname ?? '-'} · Vocabulário Raro: ${awards.rareVocabulary?.nickname ?? '-'}`}
          playersTag={`${awards.generalChampion.score} pts`}
          icon="crown"
          highlightLeader
        />
      )}

      <View style={styles.rankingList}>
        {rankedPlayers.map((player, index) => (
          <GameCard
            key={player.id}
            title={`${index + 1}º · ${player.nickname}`}
            description={`Respostas únicas: ${player.uniqueAnswersCount} · Gritos de Adedonha: ${player.stopCount}`}
            playersTag={`${player.score} pts`}
            icon={index === 0 ? 'medal' : 'account'}
            highlightLeader={index === 0}
          />
        ))}
      </View>

      <View style={styles.actionsStack}>
        {room.phase === 'round_summary' && isCurrentPlayerHost && (
          <ExpressiveButton
            label="Girar Próxima Letra"
            variant="primaryJumbo"
            icon="rotate-right"
            onPress={() => {
              void onAdvanceToNextRound();
            }}
          />
        )}
        <ExpressiveButton
          label="Ir para o Placar Final"
          variant="tonal"
          icon="podium-gold"
          onPress={onGoToScoreboard}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.lg,
  },
  rankingList: {
    gap: tokens.semantic.space.md,
  },
  actionsStack: {
    gap: tokens.semantic.space.md,
  },
});
