import type {
  CidadeDormeAlignment,
  CidadeDormeConfig,
  CidadeDormePhase,
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
  CidadeDormeVoiceProfile,
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

export function shuffleRoles(
  roles: readonly CidadeDormeRole[],
  random: () => number = Math.random
): CidadeDormeRole[] {
  const copy = [...roles];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const raw = random();
    const clamped = Number.isFinite(raw)
      ? Math.min(0.999999999999, Math.max(0, raw))
      : 0;
    const j = Math.floor(clamped * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function buildRolePool(
  playerCount: number,
  assassinCount: number,
  random: () => number
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
  return shuffleRoles(roles, random);
}

export class CidadeDormeUseCases implements ICidadeDormeUseCases {
  constructor(
    private readonly roomService: IMultiplayerRoomService,
    private readonly narratorService: INarratorAudioService,
    private readonly random: () => number = Math.random,
    private readonly now: () => number = Date.now
  ) {}

  private computePhaseEndsAt(durationSeconds: number): string {
    return new Date(this.now() + durationSeconds * 1000).toISOString();
  }

  private async validateNightActor(
    roomId: string,
    actorPlayerId: string,
    expectedPhase: CidadeDormePhase,
    expectedRole: CidadeDormeRole
  ): Promise<CidadeDormeRoom> {
    const cleanActorId = actorPlayerId.trim();
    if (!cleanActorId) {
      throw new ValidationError('Jogador não encontrado na sala.');
    }

    const room = await this.roomService.getCidadeDormeRoom(roomId, cleanActorId);
    if (room.phase !== expectedPhase) {
      if (expectedPhase === 'night_assassin') {
        throw new ValidationError('Não estamos no turno noturno do Assassino.');
      }
      if (expectedPhase === 'night_angel') {
        throw new ValidationError('Não estamos no turno noturno do Anjo.');
      }
      throw new ValidationError('Não estamos no turno noturno do Detetive.');
    }

    const actor = room.players.find((p) => p.id === cleanActorId);
    if (!actor) {
      throw new ValidationError('Jogador não encontrado na sala.');
    }
    if (!actor.isAlive) {
      throw new ValidationError(
        'Jogadores eliminados não podem realizar ações noturnas.'
      );
    }
    if (actor.role !== expectedRole) {
      throw new ValidationError(
        'Este jogador não possui o papel ativo deste turno noturno.'
      );
    }

    return room;
  }

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
      assignedRoles = buildRolePool(totalPlayers, assassinCount, this.random);
    }

    const assignedRolesByPlayerId: Record<string, CidadeDormeRole> = {};
    room.players.forEach((player, index) => {
      assignedRolesByPlayerId[player.id] = assignedRoles[index];
    });

    const caption =
      'Papéis secretos distribuídos! Revele seu papel sem mostrar aos colegas e confirme que está pronto.';
    const started = await this.roomService.startCidadeDormeMatch(
      room.id,
      assignedRolesByPlayerId,
      caption
    );
    await this.speakIfHost(started, caption);
    return started;
  }

  async confirmPlayerReady(
    roomId: string,
    playerId: string,
    markCompanionsReady = false
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId, playerId);
    if (room.phase !== 'role_reveal') {
      throw new ValidationError(
        'A confirmação de papel só pode ocorrer na fase de revelação.'
      );
    }

    const target = room.players.find((p) => p.id === playerId);
    if (!target) {
      throw new ValidationError('Jogador não encontrado na sala.');
    }

    const nightCaption =
      'A cidade dorme... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.';
    const updated = await this.roomService.markCidadeDormePlayerReady(
      room.id,
      playerId,
      {
        markCompanionsReady,
        nightTurnEndsAt: this.computePhaseEndsAt(room.config.nightTurnSeconds),
        nightCaption,
      }
    );

    if (updated.phase === 'night_assassin') {
      await this.speakIfHost(updated, updated.narratorCaption);
    }

    return updated;
  }

  async submitAssassinTarget(
    roomId: string,
    actorPlayerId: string,
    targetPlayerId: string
  ): Promise<CidadeDormeRoom> {
    const room = await this.validateNightActor(
      roomId,
      actorPlayerId,
      'night_assassin',
      'assassino'
    );

    if (targetPlayerId === actorPlayerId) {
      throw new ValidationError(
        'O Assassino não pode escolher a si mesmo como vítima.'
      );
    }

    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target || !target.isAlive) {
      throw new ValidationError(
        'Escolha um jogador vivo como alvo do Assassino.'
      );
    }
    if (
      target.role === 'assassino' ||
      room.allyAssassinIds?.includes(targetPlayerId)
    ) {
      throw new ValidationError(
        'O Assassino não pode atacar outro Assassino parceiro.'
      );
    }

    return this.roomService.submitCidadeDormeNightAction(
      room.id,
      actorPlayerId,
      'night_assassin',
      target.id
    );
  }

  async submitAngelProtection(
    roomId: string,
    actorPlayerId: string,
    protectedPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    const room = await this.validateNightActor(
      roomId,
      actorPlayerId,
      'night_angel',
      'anjo'
    );

    if (protectedPlayerId === null || !protectedPlayerId.trim()) {
      throw new ValidationError(
        'Selecione um jogador vivo para o Anjo proteger esta noite.'
      );
    }

    const target = room.players.find((p) => p.id === protectedPlayerId);
    if (!target || !target.isAlive) {
      throw new ValidationError('O Anjo só pode proteger um jogador vivo.');
    }

    return this.roomService.submitCidadeDormeNightAction(
      room.id,
      actorPlayerId,
      'night_angel',
      target.id
    );
  }

  async submitDetectiveInvestigation(
    roomId: string,
    actorPlayerId: string,
    suspectPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    const room = await this.validateNightActor(
      roomId,
      actorPlayerId,
      'night_detective',
      'detetive'
    );

    if (
      room.detectiveVerdict &&
      room.detectiveVerdict.roundNumber === room.currentRound
    ) {
      throw new ValidationError(
        'O Detetive só pode investigar um suspeito por noite.'
      );
    }

    if (suspectPlayerId === null || !suspectPlayerId.trim()) {
      throw new ValidationError(
        'Selecione um jogador vivo para o Detetive investigar.'
      );
    }

    if (suspectPlayerId === actorPlayerId) {
      throw new ValidationError(
        'O Detetive não pode investigar a si mesmo.'
      );
    }

    const suspect = room.players.find((p) => p.id === suspectPlayerId);
    if (!suspect || !suspect.isAlive) {
      throw new ValidationError(
        'O Detetive só pode investigar um jogador vivo.'
      );
    }

    return this.roomService.submitCidadeDormeNightAction(
      room.id,
      actorPlayerId,
      'night_detective',
      suspect.id
    );
  }

  async advanceToDawn(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'night_detective') {
      throw new ValidationError(
        'O amanhecer só ocorre após a conclusão dos turnos da noite.'
      );
    }

    const resolved = await this.roomService.resolveCidadeDormeDawn(room.id, {
      debateEndsAt: this.computePhaseEndsAt(room.config.dayDebateSeconds),
    });
    await this.speakIfHost(resolved, resolved.narratorCaption);
    return resolved;
  }

  async autoAdvanceNightTurn(
    roomId: string,
    expectedPhase?: CidadeDormePhase,
    expectedRound?: number
  ): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);

    if (expectedPhase !== undefined && room.phase !== expectedPhase) {
      return room;
    }
    if (expectedRound !== undefined && room.currentRound !== expectedRound) {
      return room;
    }

    if (room.phase === 'night_assassin') {
      const caption =
        'Assassino, volte a dormir e feche os olhos. Anjo, acorde e escolha quem você deseja proteger esta noite.';
      await this.speakIfHost(room, caption);
      return this.roomService.saveCidadeDormeRoom({
        ...room,
        phase: 'night_angel',
        phaseEndsAt: this.computePhaseEndsAt(room.config.nightTurnSeconds),
        narratorCaption: caption,
      });
    }

    if (room.phase === 'night_angel') {
      const caption =
        'Anjo, volte a dormir e feche os olhos. Detetive, acorde e aponte um suspeito para investigar.';
      await this.speakIfHost(room, caption);
      return this.roomService.saveCidadeDormeRoom({
        ...room,
        phase: 'night_detective',
        phaseEndsAt: this.computePhaseEndsAt(room.config.nightTurnSeconds),
        narratorCaption: caption,
      });
    }

    if (room.phase === 'night_detective') {
      return this.advanceToDawn(room.id);
    }

    if (expectedPhase !== undefined) {
      return room;
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
      phaseEndsAt: null,
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
    const room = await this.roomService.getCidadeDormeRoom(
      roomId,
      voterPlayerId
    );
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
    if (!cleanChoice) {
      throw new ValidationError(
        'Selecione um suspeito vivo ou escolha Abster-se / Pular Voto.'
      );
    }
    if (cleanChoice === voter.id) {
      throw new ValidationError(
        'Você não pode votar em si mesmo na votação da cidade.'
      );
    }
    if (cleanChoice !== 'skip') {
      const target = room.players.find((p) => p.id === cleanChoice);
      if (!target || !target.isAlive) {
        throw new ValidationError(
          'Selecione um suspeito vivo ou escolha Abster-se / Pular Voto.'
        );
      }
    }

    return this.roomService.submitCidadeDormeVote(
      room.id,
      voter.id,
      cleanChoice
    );
  }

  async tallyVotes(roomId: string): Promise<CidadeDormeRoom> {
    const room = await this.roomService.getCidadeDormeRoom(roomId);
    if (room.phase !== 'day_voting') {
      throw new ValidationError(
        'A apuração só pode ser realizada durante a fase de votação.'
      );
    }

    const tallied = await this.roomService.tallyCidadeDormeVotes(room.id);
    await this.speakIfHost(tallied, tallied.narratorCaption);
    return tallied;
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
      phaseEndsAt: this.computePhaseEndsAt(room.config.nightTurnSeconds),
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
