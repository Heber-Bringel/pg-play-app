import type {
  CidadeDormeAlignment,
  CidadeDormeConfig,
  CidadeDormeDawnReport,
  CidadeDormeDetectiveVerdict,
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
  CidadeDormeVoiceProfile,
  CidadeDormeVoteReport,
} from '@/model/entities/multiplayerSession';
import { ValidationError } from '@/model/errors';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';
import type { INarratorAudioService } from '@/model/services/iNarratorAudioService';
import type {
  CidadeDormeRoleMetadata,
  ICidadeDormeUseCases,
} from '@/usecase/iCidadeDormeUseCases';

export const CIDADE_DORME_MIN_PLAYERS = 5;
export const CIDADE_DORME_MAX_PLAYERS = 16;

const ROLE_METADATA_MAP: Record<CidadeDormeRole, CidadeDormeRoleMetadata> = {
  cidadao: {
    role: 'cidadao',
    title: 'Cidadão',
    alignmentLabel: 'Cidade (Bem)',
    description:
      'Dorme à noite. Durante o dia, analisa comportamentos, argumenta e vota para descobrir e eliminar o Assassino.',
    icon: 'account-group',
  },
  assassino: {
    role: 'assassino',
    title: 'Assassino',
    alignmentLabel: 'Infiltrados',
    description:
      'Acorda durante a noite para escolher uma vítima. Durante o dia, blefa e se passa por Cidadão para não ser descoberto.',
    icon: 'knife-military',
  },
  anjo: {
    role: 'anjo',
    title: 'Anjo',
    alignmentLabel: 'Cidade (Bem)',
    description:
      'Acorda durante a noite para escolher um jogador e protegê-lo. Se proteger o mesmo alvo do Assassino, ninguém é eliminado.',
    icon: 'shield-Half-Full',
  },
  detetive: {
    role: 'detetive',
    title: 'Detetive',
    alignmentLabel: 'Cidade (Bem)',
    description:
      'Acorda durante a noite e escolhe um suspeito para investigar, descobrindo silenciosamente na tela se é Assassino ou Inocente.',
    icon: 'magnify',
  },
};

export function evaluateCidadeDormeWinner(
  players: CidadeDormePlayer[]
): CidadeDormeAlignment | null {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveAssassins = alivePlayers.filter(
    (p) => p.role === 'assassino'
  ).length;
  const aliveInnocents = alivePlayers.length - aliveAssassins;

  if (aliveAssassins === 0) {
    return 'cidade';
  }
  if (aliveAssassins >= aliveInnocents) {
    return 'infiltrados';
  }
  return null;
}

function buildRolePool(
  playerCount: number,
  assassinCount: number,
  roundSeed: number
): CidadeDormeRole[] {
  const roles: CidadeDormeRole[] = [];
  roles.push('detetive');
  for (let i = 0; i < assassinCount; i++) {
    roles.push('assassino');
  }
  roles.push('anjo');
  while (roles.length < playerCount) {
    roles.push('cidadao');
  }

  const offset = (roundSeed - 1) % playerCount;
  if (offset === 0) {
    return roles;
  }
  return roles.map((_, idx) => roles[(idx + offset) % playerCount]);
}

export class CidadeDormeUseCases implements ICidadeDormeUseCases {
  constructor(
    private readonly roomService: IMultiplayerRoomService,
    private readonly narratorService: INarratorAudioService
  ) {}

  private async speakIfHost(
    room: CidadeDormeRoom,
    caption: string
  ): Promise<void> {
    const localId = await this.roomService.getLocalPlayerId(room.id);
    if (!localId || localId === room.hostId) {
      await this.narratorService.speak(caption, room.config.narratorVoice);
    }
  }

  async speakNarratorCaption(
    caption: string,
    voice: CidadeDormeVoiceProfile
  ): Promise<void> {
    const clean = caption.trim();
    if (!clean) {
      return;
    }
    await this.narratorService.speak(clean, voice);
  }

  async stopNarratorAudio(): Promise<void> {
    await this.narratorService.stop();
  }

  async getLocalPlayerId(roomId?: string): Promise<string | null> {
    return this.roomService.getLocalPlayerId(roomId);
  }

  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: CidadeDormeRoom) => void
  ): () => void {
    return this.roomService.subscribeToCidadeDormeRoom(roomId, onRoomUpdated);
  }

  async getRoom(roomId?: string): Promise<CidadeDormeRoom> {
    return this.roomService.getCidadeDormeRoom(roomId);
  }

  getRoleMetadata(role: CidadeDormeRole): CidadeDormeRoleMetadata {
    const meta = ROLE_METADATA_MAP[role];
    return { ...meta };
  }

  async createRoom(hostNickname: string): Promise<CidadeDormeRoom> {
    const cleanHost = hostNickname.trim();
    if (cleanHost.length < 2) {
      throw new ValidationError(
        'Digite um apelido com pelo menos 2 letras para o Moderador.'
      );
    }
    if (cleanHost.length > 20) {
      throw new ValidationError(
        'O apelido do Moderador deve ter no máximo 20 caracteres.'
      );
    }
    return this.roomService.createCidadeDormeRoom(cleanHost);
  }

  async joinRoom(code: string, nickname: string): Promise<CidadeDormeRoom> {
    const cleanCode = code.trim().toUpperCase();
    const cleanNickname = nickname.trim();
    if (cleanCode.length < 4) {
      throw new ValidationError('Informe um código PIN válido para a sala.');
    }
    if (cleanNickname.length < 2) {
      throw new ValidationError(
        'Digite um apelido com pelo menos 2 letras para entrar na sala.'
      );
    }
    if (cleanNickname.length > 20) {
      throw new ValidationError(
        'O apelido do jogador deve ter no máximo 20 caracteres.'
      );
    }
    return this.roomService.joinCidadeDormeRoom(cleanCode, cleanNickname);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    if (!roomId.trim() || !playerId.trim()) {
      return;
    }
    await this.roomService.leaveCidadeDormeRoom(roomId, playerId);
  }

  async removePlayer(
    roomId: string,
    playerId: string
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    const target = room.players.find((p) => p.id === playerId);
    if (!target) {
      throw new ValidationError('Participante não encontrado na sala.');
    }
    if (target.isHost) {
      throw new ValidationError(
        'O Moderador anfitrião não pode ser removido da sala.'
      );
    }

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      players: room.players.filter((p) => p.id !== playerId),
    });
  }

  async updateConfig(
    roomId: string,
    partialConfig: Partial<CidadeDormeConfig>
  ): Promise<CidadeDormeRoom> {
    if (
      partialConfig.assassinCount !== undefined &&
      ![1, 2, 3].includes(partialConfig.assassinCount)
    ) {
      throw new ValidationError(
        'A quantidade de Assassinos deve ser entre 1 e 3.'
      );
    }
    if (
      partialConfig.dayDebateSeconds !== undefined &&
      ![60, 120, 180].includes(partialConfig.dayDebateSeconds)
    ) {
      throw new ValidationError(
        'O tempo de debate do dia deve ser 60s, 120s ou 180s.'
      );
    }
    if (
      partialConfig.nightTurnSeconds !== undefined &&
      ![15, 20].includes(partialConfig.nightTurnSeconds)
    ) {
      throw new ValidationError(
        'O tempo por turno da noite deve ser 15s ou 20s.'
      );
    }
    return this.roomService.updateCidadeDormeConfig(roomId, partialConfig);
  }

  async startMatch(
    roomId: string,
    preferredRoles?: CidadeDormeRole[]
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    const totalPlayers = room.players.length;

    if (totalPlayers < CIDADE_DORME_MIN_PLAYERS) {
      throw new ValidationError(
        'O Cidade Dorme precisa de pelo menos 5 jogadores para iniciar a partida.'
      );
    }
    if (totalPlayers > CIDADE_DORME_MAX_PLAYERS) {
      throw new ValidationError(
        'O Cidade Dorme permite no máximo 16 jogadores na sala.'
      );
    }

    const assassinCount = room.config.assassinCount;
    const innocentCount = totalPlayers - assassinCount;
    if (assassinCount >= innocentCount || assassinCount + 2 > totalPlayers) {
      throw new ValidationError(
        'Reduza o número de Assassinos ou adicione mais jogadores para equilibrar a cidade.'
      );
    }

    let assignedRoles: CidadeDormeRole[];
    if (preferredRoles !== undefined) {
      if (preferredRoles.length !== totalPlayers) {
        throw new ValidationError(
          'A lista de papéis deve corresponder exatamente ao total de jogadores.'
        );
      }
      assignedRoles = [...preferredRoles];
    } else {
      assignedRoles = buildRolePool(
        totalPlayers,
        assassinCount,
        room.currentRound
      );
    }

    const updatedPlayers: CidadeDormePlayer[] = room.players.map(
      (player, index) => ({
        ...player,
        isAlive: true,
        isReady: false,
        hasVoted: false,
        role: assignedRoles[index],
      })
    );

    const caption =
      'Papéis secretos distribuídos! Revele seu papel sem mostrar aos colegas e confirme que está pronto.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'role_reveal',
      currentRound: 1,
      narratorCaption: caption,
      players: updatedPlayers,
      nightTargetId: null,
      nightProtectedId: null,
      detectiveVerdict: null,
      votesByPlayerId: {},
      dawnReport: null,
      voteReport: null,
      winner: null,
    });
  }

  async confirmPlayerReady(
    roomId: string,
    playerId: string,
    markCompanionsReady = false
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'role_reveal') {
      throw new ValidationError(
        'A confirmação de papel só pode ocorrer na fase de revelação.'
      );
    }

    const target = room.players.find((p) => p.id === playerId);
    if (!target) {
      throw new ValidationError('Jogador não encontrado na sala.');
    }

    const updatedPlayers = room.players.map((p) => {
      if (markCompanionsReady || p.id === playerId) {
        return { ...p, isReady: true };
      }
      return { ...p };
    });

    const allReady = updatedPlayers.every((p) => p.isReady);
    if (!allReady) {
      return this.roomService.saveCidadeDormeRoom({
        ...room,
        players: updatedPlayers,
      });
    }

    const nightCaption =
      'A cidade dorme... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.';
    await this.speakIfHost(room, nightCaption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'night_assassin',
      narratorCaption: nightCaption,
      players: updatedPlayers,
      nightTargetId: null,
      nightProtectedId: null,
      detectiveVerdict: null,
    });
  }

  async submitAssassinTarget(
    roomId: string,
    targetPlayerId: string
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'night_assassin') {
      throw new ValidationError('Não estamos no turno noturno do Assassino.');
    }

    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target || !target.isAlive) {
      throw new ValidationError(
        'Escolha um jogador vivo como alvo do Assassino.'
      );
    }

    const caption =
      'Assassino, volte a dormir e feche os olhos. Anjo, acorde e escolha quem você deseja proteger esta noite.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'night_angel',
      narratorCaption: caption,
      nightTargetId: target.id,
    });
  }

  async submitAngelProtection(
    roomId: string,
    protectedPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'night_angel') {
      throw new ValidationError('Não estamos no turno noturno do Anjo.');
    }

    const angelAlive = room.players.some(
      (p) => p.role === 'anjo' && p.isAlive
    );

    let chosenId: string | null = null;
    if (protectedPlayerId !== null) {
      const target = room.players.find((p) => p.id === protectedPlayerId);
      if (!target || !target.isAlive) {
        throw new ValidationError('O Anjo só pode proteger um jogador vivo.');
      }
      chosenId = target.id;
    } else if (angelAlive) {
      throw new ValidationError(
        'Selecione um jogador vivo para o Anjo proteger esta noite.'
      );
    }

    const caption =
      'Anjo, volte a dormir e feche os olhos. Detetive, acorde e aponte um suspeito para investigar.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'night_detective',
      narratorCaption: caption,
      nightProtectedId: chosenId,
    });
  }

  async submitDetectiveInvestigation(
    roomId: string,
    suspectPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'night_detective') {
      throw new ValidationError('Não estamos no turno noturno do Detetive.');
    }

    const detectiveAlive = room.players.some(
      (p) => p.role === 'detetive' && p.isAlive
    );

    let verdict: CidadeDormeDetectiveVerdict | null = null;
    if (suspectPlayerId !== null) {
      const suspect = room.players.find((p) => p.id === suspectPlayerId);
      if (!suspect || !suspect.isAlive) {
        throw new ValidationError(
          'O Detetive só pode investigar um jogador vivo.'
        );
      }
      verdict = {
        targetPlayerId: suspect.id,
        targetNickname: suspect.nickname,
        isAssassin: suspect.role === 'assassino',
        roundNumber: room.currentRound,
      };
    } else if (detectiveAlive) {
      throw new ValidationError(
        'Selecione um jogador vivo para o Detetive investigar.'
      );
    }

    const caption =
      'Detetive, guarde seu segredo, volte a dormir e feche os olhos.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      narratorCaption: caption,
      detectiveVerdict: verdict,
    });
  }

  async advanceToDawn(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'night_detective') {
      throw new ValidationError(
        'O amanhecer só ocorre após a conclusão dos turnos da noite.'
      );
    }

    const attacked = room.nightTargetId
      ? room.players.find((p) => p.id === room.nightTargetId) ?? null
      : null;
    const savedByAngel = Boolean(
      attacked &&
        room.nightProtectedId &&
        attacked.id === room.nightProtectedId
    );

    const updatedPlayers = room.players.map((p) => {
      if (!savedByAngel && attacked && p.id === attacked.id) {
        return { ...p, isAlive: false, hasVoted: false };
      }
      return { ...p, hasVoted: false };
    });

    const dawnReport: CidadeDormeDawnReport = {
      roundNumber: room.currentRound,
      attackedPlayerId: attacked?.id ?? null,
      attackedNickname: attacked?.nickname ?? null,
      savedByAngel,
      eliminatedPlayerId: savedByAngel ? null : (attacked?.id ?? null),
      eliminatedNickname: savedByAngel ? null : (attacked?.nickname ?? null),
      eliminatedRole:
        !savedByAngel && attacked && room.config.revealRoleOnDeath
          ? attacked.role
          : null,
    };

    const winner = evaluateCidadeDormeWinner(updatedPlayers);
    let caption: string;

    if (winner === 'infiltrados') {
      caption = attacked
        ? `A cidade acorda! Triste notícia na cidade: ${attacked.nickname} foi eliminado durante a noite. Os Assassinos atingiram a paridade e venceram a partida!`
        : 'A cidade acorda! Os Assassinos atingiram a paridade numérica e venceram a partida!';
    } else if (winner === 'cidade') {
      caption =
        'A cidade acorda! Todos os Assassinos foram neutralizados. Vitória da Cidade!';
    } else if (savedByAngel) {
      caption =
        'A cidade acorda! Todos podem abrir os olhos. A madrugada foi tensa, mas o Anjo protegeu a vítima a tempo! Ninguém foi eliminado!';
    } else if (attacked) {
      caption = `A cidade acorda! Todos podem abrir os olhos. Triste notícia na cidade: ${attacked.nickname} foi eliminado durante a noite.`;
    } else {
      caption =
        'A cidade acorda! Todos podem abrir os olhos. Ninguém foi eliminado durante a noite.';
    }

    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: winner ? 'finished' : 'day_debate',
      narratorCaption: caption,
      players: updatedPlayers,
      dawnReport,
      voteReport: null,
      votesByPlayerId: {},
      winner,
    });
  }

  async autoAdvanceNightTurn(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    const alivePlayers = room.players.filter((p) => p.isAlive);

    if (room.phase === 'night_assassin') {
      const target =
        alivePlayers.find((p) => p.role !== 'assassino') ?? alivePlayers[0];
      if (!target) {
        throw new ValidationError('Não há jogadores vivos para o turno.');
      }
      return this.submitAssassinTarget(room.id, target.id);
    }

    if (room.phase === 'night_angel') {
      const angel = alivePlayers.find((p) => p.role === 'anjo');
      if (!angel) {
        return this.submitAngelProtection(room.id, null);
      }
      const protectedTarget = alivePlayers[0] ?? angel;
      return this.submitAngelProtection(room.id, protectedTarget.id);
    }

    if (room.phase === 'night_detective') {
      const detective = alivePlayers.find((p) => p.role === 'detetive');
      if (detective && !room.detectiveVerdict) {
        const suspect =
          alivePlayers.find((p) => p.id !== detective.id) ?? detective;
        await this.submitDetectiveInvestigation(room.id, suspect.id);
      }
      return this.advanceToDawn(room.id);
    }

    throw new ValidationError(
      'O avanço automático só está disponível durante os turnos da noite.'
    );
  }

  async startVotingPhase(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'day_debate') {
      throw new ValidationError(
        'A votação só pode ser iniciada a partir do debate do dia.'
      );
    }

    const caption =
      'O tempo de discussão acabou! Agora, votem pelo celular em quem vocês acreditam ser o Assassino.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'day_voting',
      narratorCaption: caption,
      votesByPlayerId: {},
      players: room.players.map((p) => ({ ...p, hasVoted: false })),
    });
  }

  async castVote(
    roomId: string,
    voterPlayerId: string,
    targetPlayerIdOrSkip: string
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'day_voting') {
      throw new ValidationError('A sala não está em fase de votação.');
    }

    const voter = room.players.find((p) => p.id === voterPlayerId);
    if (!voter) {
      throw new ValidationError('Jogador votante não encontrado na sala.');
    }
    if (!voter.isAlive) {
      throw new ValidationError(
        'Você foi eliminado e está no Modo Espectador — acompanhe em silêncio.'
      );
    }

    const cleanChoice = targetPlayerIdOrSkip.trim();
    if (cleanChoice !== 'skip') {
      const target = room.players.find((p) => p.id === cleanChoice);
      if (!target || !target.isAlive) {
        throw new ValidationError(
          'Selecione um suspeito vivo ou escolha Abster-se / Pular Voto.'
        );
      }
    }

    const updatedVotes = {
      ...room.votesByPlayerId,
      [voter.id]: cleanChoice,
    };

    const updatedPlayers = room.players.map((p) =>
      p.id === voter.id ? { ...p, hasVoted: true } : { ...p }
    );

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      votesByPlayerId: updatedVotes,
      players: updatedPlayers,
    });
  }

  async tallyVotes(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'day_voting') {
      throw new ValidationError(
        'A apuração só pode ser realizada durante a fase de votação.'
      );
    }

    const entries = Object.entries(room.votesByPlayerId);
    if (entries.length === 0) {
      throw new ValidationError(
        'Registre pelo menos um voto antes de apurar a votação.'
      );
    }

    const voteCounts: Record<string, number> = {};
    let skipCount = 0;

    for (const [, targetId] of entries) {
      if (targetId === 'skip') {
        skipCount += 1;
      } else {
        voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
      }
    }

    let maxVotes = 0;
    let leaders: string[] = [];
    for (const [candidateId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        leaders = [candidateId];
      } else if (count === maxVotes && count > 0) {
        leaders.push(candidateId);
      }
    }

    const tieOrSkipped =
      maxVotes === 0 || leaders.length !== 1 || skipCount >= maxVotes;

    const eliminatedPlayer = !tieOrSkipped
      ? room.players.find((p) => p.id === leaders[0]) ?? null
      : null;

    const updatedPlayers = room.players.map((p) => {
      if (eliminatedPlayer && p.id === eliminatedPlayer.id) {
        return { ...p, isAlive: false };
      }
      return { ...p };
    });

    const voteReport: CidadeDormeVoteReport = {
      roundNumber: room.currentRound,
      eliminatedPlayerId: eliminatedPlayer?.id ?? null,
      eliminatedNickname: eliminatedPlayer?.nickname ?? null,
      eliminatedRole:
        eliminatedPlayer && room.config.revealRoleOnDeath
          ? eliminatedPlayer.role
          : null,
      tieOrSkipped,
      voteCounts,
      skipCount,
    };

    const winner = evaluateCidadeDormeWinner(updatedPlayers);
    let caption: string;

    if (winner === 'cidade') {
      caption = eliminatedPlayer
        ? `A cidade votou e eliminou ${eliminatedPlayer.nickname}! Todos os Assassinos foram descobertos: Vitória da Cidade!`
        : 'Todos os Assassinos foram descobertos: Vitória da Cidade!';
    } else if (winner === 'infiltrados') {
      caption = eliminatedPlayer
        ? `A cidade eliminou ${eliminatedPlayer.nickname}, e os Assassinos atingiram paridade numérica: Vitória dos Assassinos!`
        : 'Os Assassinos atingiram paridade numérica com os inocentes: Vitória dos Assassinos!';
    } else if (tieOrSkipped || !eliminatedPlayer) {
      caption =
        'A cidade não chegou a um consenso na votação. Ninguém foi eliminado hoje!';
    } else {
      caption = `A cidade decidiu por maioria simples: ${eliminatedPlayer.nickname} foi eliminado na votação!`;
    }

    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: winner ? 'finished' : 'vote_result',
      narratorCaption: caption,
      players: updatedPlayers,
      voteReport,
      winner,
    });
  }

  async startNextNight(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'vote_result') {
      throw new ValidationError(
        'A próxima noite só pode iniciar após o resultado da votação do dia.'
      );
    }

    const caption =
      'A noite cai novamente sobre a cidade... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.';
    await this.speakIfHost(room, caption);

    return this.roomService.saveCidadeDormeRoom({
      ...room,
      phase: 'night_assassin',
      currentRound: room.currentRound + 1,
      narratorCaption: caption,
      nightTargetId: null,
      nightProtectedId: null,
      detectiveVerdict: null,
      votesByPlayerId: {},
      dawnReport: null,
      voteReport: null,
      players: room.players.map((p) => ({ ...p, hasVoted: false })),
    });
  }

  async restartMatch(
    roomId: string,
    preferredRoles?: CidadeDormeRole[]
  ): Promise<CidadeDormeRoom> {
    return this.startMatch(roomId, preferredRoles);
  }
}
