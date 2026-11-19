import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { MemoryNarratorAudioService } from '@/infra/services/memoryNarratorAudioService';
import { ValidationError } from '@/model/errors';
import { CidadeDormeUseCases } from '@/usecase/cidadeDormeUseCases';

describe('CidadeDormeUseCases — Dedução Social com Narrador por Áudio (UC07)', () => {
  function createSut() {
    const roomService = new MemoryMultiplayerRoomService();
    const narratorService = new MemoryNarratorAudioService();
    const useCases = new CidadeDormeUseCases(roomService, narratorService);
    return { useCases, roomService, narratorService };
  }

  it('deve criar sala, permitir entrada via código PIN e gerenciar participantes no Lobby (RNF03)', async () => {
    const { useCases } = createSut();

    const created = await useCases.createRoom('Héber');
    expect(created.gameType).toBe('cidade-dorme');
    expect(created.phase).toBe('lobby');
    expect(created.players[0].nickname).toBe('Héber');
    expect(created.players[0].isHost).toBe(true);
    expect(created.players.length).toBeGreaterThanOrEqual(5);

    const joined = await useCases.joinRoom(created.code, 'Mikaelle');
    expect(joined.players.some((p) => p.nickname === 'Mikaelle')).toBe(true);

    const mikaelle = joined.players.find((p) => p.nickname === 'Mikaelle')!;
    const afterRemove = await useCases.removePlayer(created.id, mikaelle.id);
    expect(afterRemove.players.some((p) => p.id === mikaelle.id)).toBe(false);
  });

  it('deve lançar ValidationError para apelidos curtos, PIN inválido ou remoção do Moderador', async () => {
    const { useCases } = createSut();
    const room = await useCases.getRoom();

    await expect(useCases.createRoom('A')).rejects.toThrow(ValidationError);
    await expect(useCases.joinRoom('CD', 'Ana')).rejects.toThrow(
      ValidationError
    );
    await expect(useCases.joinRoom(room.code, 'X')).rejects.toThrow(
      ValidationError
    );
    await expect(
      useCases.removePlayer(room.id, room.hostId)
    ).rejects.toThrow(ValidationError);
  });

  it('deve atualizar as configurações da sala (voz Masculina/Feminina e tempos) e impedir iniciar com menos de 5 jogadores (RF18, RF19)', async () => {
    const { useCases } = createSut();
    let room = await useCases.getRoom();

    room = await useCases.updateConfig(room.id, {
      narratorVoice: 'feminina',
      dayDebateSeconds: 180,
      nightTurnSeconds: 20,
      revealRoleOnDeath: false,
    });

    expect(room.config.narratorVoice).toBe('feminina');
    expect(room.config.dayDebateSeconds).toBe(180);
    expect(room.config.nightTurnSeconds).toBe(20);
    expect(room.config.revealRoleOnDeath).toBe(false);

    // Remover jogadores até restarem 4
    const nonHosts = room.players.filter((p) => !p.isHost);
    await useCases.removePlayer(room.id, nonHosts[0].id);
    await useCases.removePlayer(room.id, nonHosts[1].id);

    await expect(useCases.startMatch(room.id)).rejects.toThrow(ValidationError);
  });

  it('deve sortear papéis secretos, exigir confirmação e conduzir A Noite com salvamento pelo Anjo e veredito do Detetive (RF18, RF19)', async () => {
    const { useCases, narratorService } = createSut();
    const initial = await useCases.getRoom();

    const started = await useCases.startMatch(initial.id, [
      'detetive',
      'assassino',
      'anjo',
      'cidadao',
      'cidadao',
      'cidadao',
    ]);

    expect(started.phase).toBe('role_reveal');
    expect(started.players[0].role).toBe('detetive');
    expect(started.players[1].role).toBe('assassino');
    expect(started.players[2].role).toBe('anjo');
    expect(narratorService.getLastSpeech()?.voice).toBe('masculina');

    // Confirmação individual ainda mantém em role_reveal até todos estarem prontos
    const partialReady = await useCases.confirmPlayerReady(
      started.id,
      started.players[0].id,
      false
    );
    expect(partialReady.phase).toBe('role_reveal');
    expect(partialReady.players[0].isReady).toBe(true);

    // Confirmar todos prontos inicia a primeira noite
    const nightStart = await useCases.confirmPlayerReady(
      started.id,
      started.hostId,
      true
    );
    expect(nightStart.phase).toBe('night_assassin');

    // Turno do Assassino: ataca Beatriz (cd-player-4)
    const afterAssassin = await useCases.submitAssassinTarget(
      nightStart.id,
      'cd-player-4'
    );
    expect(afterAssassin.phase).toBe('night_angel');
    expect(afterAssassin.nightTargetId).toBe('cd-player-4');

    // Turno do Anjo: protege a mesma vítima (cd-player-4)
    const afterAngel = await useCases.submitAngelProtection(
      afterAssassin.id,
      'cd-player-4'
    );
    expect(afterAngel.phase).toBe('night_detective');
    expect(afterAngel.nightProtectedId).toBe('cd-player-4');

    // Turno do Detetive: investiga Ana (cd-player-2, que é Assassino)
    const afterDetective = await useCases.submitDetectiveInvestigation(
      afterAngel.id,
      'cd-player-2'
    );
    expect(afterDetective.detectiveVerdict).toEqual({
      targetPlayerId: 'cd-player-2',
      targetNickname: 'Ana',
      isAssassin: true,
      roundNumber: 1,
    });

    // Amanhecer: Anjo salvou a vítima, ninguém morre
    const dawn = await useCases.advanceToDawn(afterDetective.id);
    expect(dawn.phase).toBe('day_debate');
    expect(dawn.dawnReport?.savedByAngel).toBe(true);
    expect(dawn.dawnReport?.eliminatedPlayerId).toBeNull();
    expect(dawn.players.every((p) => p.isAlive)).toBe(true);
  });

  it('deve realizar votação secreta, tratar empate/abstenção e declarar Vitória da Cidade ao eliminar o Assassino (RF20)', async () => {
    const { useCases } = createSut();
    const initial = await useCases.getRoom();

    await useCases.startMatch(initial.id, [
      'detetive',
      'assassino',
      'anjo',
      'cidadao',
      'cidadao',
      'cidadao',
    ]);
    await useCases.confirmPlayerReady(initial.id, initial.hostId, true);

    // Noite 1: avanço automático de turnos
    await useCases.autoAdvanceNightTurn(initial.id); // Assassino
    await useCases.autoAdvanceNightTurn(initial.id); // Anjo
    const dawn1 = await useCases.autoAdvanceNightTurn(initial.id); // Detetive + Amanhecer
    expect(dawn1.phase).toBe('day_debate');

    // Inicia votação do Dia 1 com empate -> ninguém eliminado
    await useCases.startVotingPhase(initial.id);
    await useCases.castVote(initial.id, 'cd-player-1', 'cd-player-2');
    await useCases.castVote(initial.id, 'cd-player-2', 'cd-player-3');

    const tiedResult = await useCases.tallyVotes(initial.id);
    expect(tiedResult.phase).toBe('vote_result');
    expect(tiedResult.voteReport?.tieOrSkipped).toBe(true);
    expect(tiedResult.voteReport?.eliminatedPlayerId).toBeNull();

    // Avança para a Noite 2
    const night2 = await useCases.startNextNight(initial.id);
    expect(night2.phase).toBe('night_assassin');
    expect(night2.currentRound).toBe(2);

    // Noite 2: Assassino ataca Pedro (cd-player-5), Anjo protege Lucas (cd-player-3)
    await useCases.submitAssassinTarget(initial.id, 'cd-player-5');
    await useCases.submitAngelProtection(initial.id, 'cd-player-3');
    await useCases.submitDetectiveInvestigation(initial.id, 'cd-player-3');
    const dawn2 = await useCases.advanceToDawn(initial.id);

    expect(dawn2.dawnReport?.savedByAngel).toBe(false);
    expect(dawn2.dawnReport?.eliminatedPlayerId).toBe('cd-player-5');

    // Jogador eliminado (Pedro) está no Modo Espectador e não pode votar
    await useCases.startVotingPhase(initial.id);
    await expect(
      useCases.castVote(initial.id, 'cd-player-5', 'cd-player-2')
    ).rejects.toThrow(ValidationError);

    // Jogadores vivos votam na Assassina Ana (cd-player-2)
    await useCases.castVote(initial.id, 'cd-player-1', 'cd-player-2');
    await useCases.castVote(initial.id, 'cd-player-3', 'cd-player-2');
    await useCases.castVote(initial.id, 'cd-player-4', 'cd-player-2');

    const finalRoom = await useCases.tallyVotes(initial.id);
    expect(finalRoom.phase).toBe('finished');
    expect(finalRoom.winner).toBe('cidade');
    expect(finalRoom.voteReport?.eliminatedPlayerId).toBe('cd-player-2');

    // Revanche na mesma sala
    const rematch = await useCases.restartMatch(initial.id);
    expect(rematch.phase).toBe('role_reveal');
    expect(rematch.winner).toBeNull();
    expect(rematch.players.every((p) => p.isAlive)).toBe(true);
  });

  it('deve declarar Vitória dos Assassinos quando atingirem paridade numérica com os inocentes vivos (RF20)', async () => {
    const { useCases } = createSut();
    const initial = await useCases.getRoom();

    // Partida com 5 jogadores e 2 assassinos (3 inocentes vs 2 assassinos)
    await useCases.removePlayer(initial.id, 'cd-player-6');
    await useCases.updateConfig(initial.id, { assassinCount: 2 });

    await useCases.startMatch(initial.id, [
      'detetive',
      'assassino',
      'assassino',
      'anjo',
      'cidadao',
    ]);
    await useCases.confirmPlayerReady(initial.id, initial.hostId, true);

    // Assassinos eliminam o Cidadão (cd-player-5) e Anjo protege o Detetive (cd-player-1)
    await useCases.submitAssassinTarget(initial.id, 'cd-player-5');
    await useCases.submitAngelProtection(initial.id, 'cd-player-1');
    await useCases.submitDetectiveInvestigation(initial.id, 'cd-player-2');

    // Ao amanhecer restam 2 Assassinos e 2 Inocentes -> Paridade numérica -> Vitória dos Assassinos!
    const finishedDawn = await useCases.advanceToDawn(initial.id);
    expect(finishedDawn.phase).toBe('finished');
    expect(finishedDawn.winner).toBe('infiltrados');
  });

  it('não deve acionar narratorService.speak no aparelho de convidado e deve expor speakNarratorCaption/stopNarratorAudio', async () => {
    const { useCases, narratorService } = createSut();
    const created = await useCases.createRoom('Héber');

    await useCases.startMatch(created.id, [
      'detetive',
      'assassino',
      'anjo',
      'cidadao',
      'cidadao',
      'cidadao',
    ]);
    await useCases.confirmPlayerReady(created.id, created.hostId, true);
    const historyAfterHostStart = narratorService.getSpeechHistory().length;
    expect(historyAfterHostStart).toBeGreaterThan(0);

    // Simula aparelho de um jogador convidado (localPlayerId != hostId)
    await useCases.joinRoom(created.code, 'Ana');
    await useCases.submitAssassinTarget(created.id, 'cd-player-4');
    expect(narratorService.getSpeechHistory()).toHaveLength(
      historyAfterHostStart
    );

    await useCases.speakNarratorCaption('Legenda de teste', 'feminina');
    expect(narratorService.getLastSpeech()?.caption).toBe('Legenda de teste');
    expect(narratorService.getLastSpeech()?.voice).toBe('feminina');

    await useCases.stopNarratorAudio();
    expect(narratorService.getLastSpeech()).toBeNull();
  });
});
