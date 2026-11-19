import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { MemoryNarratorAudioService } from '@/infra/services/memoryNarratorAudioService';
import type { CidadeDormeRole } from '@/model/entities/multiplayerSession';
import { ValidationError } from '@/model/errors';
import {
  CidadeDormeUseCases,
  shuffleRoles,
} from '@/usecase/cidadeDormeUseCases';

describe('CidadeDormeUseCases — Dedução Social com Narrador por Áudio (UC07)', () => {
  function createSut(options?: {
    random?: () => number;
    now?: () => number;
  }) {
    const roomService = new MemoryMultiplayerRoomService();
    const narratorService = new MemoryNarratorAudioService();
    const useCases = new CidadeDormeUseCases(
      roomService,
      narratorService,
      options?.random,
      options?.now
    );
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

  it('deve sortear papéis secretos com sigilo RNF11, exigir confirmação e conduzir A Noite com salvamento pelo Anjo e veredito do Detetive (RF18, RF19)', async () => {
    const { useCases, roomService, narratorService } = createSut();
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
    expect(started.players[1].role).toBeNull();
    expect(started.players[2].role).toBeNull();
    expect(narratorService.getLastSpeech()?.voice).toBe('masculina');

    const p2View = await roomService.getCidadeDormeRoom(
      started.id,
      started.players[1].id
    );
    expect(p2View.players[1].role).toBe('assassino');
    expect(p2View.players[0].role).toBeNull();

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
    expect(nightStart.phaseEndsAt).not.toBeNull();

    // Turno do Assassino (cd-player-2 ataca Beatriz cd-player-4) — mantém cadência fixa
    const afterAssassin = await useCases.submitAssassinTarget(
      nightStart.id,
      'cd-player-2',
      'cd-player-4'
    );
    expect(afterAssassin.phase).toBe('night_assassin');
    expect(afterAssassin.nightTargetId).toBeNull();

    const angelTurn = await useCases.autoAdvanceNightTurn(
      nightStart.id,
      'night_assassin',
      1
    );
    expect(angelTurn.phase).toBe('night_angel');

    // Turno do Anjo (cd-player-3 protege a mesma vítima cd-player-4)
    const afterAngel = await useCases.submitAngelProtection(
      angelTurn.id,
      'cd-player-3',
      'cd-player-4'
    );
    expect(afterAngel.phase).toBe('night_angel');
    expect(afterAngel.nightProtectedId).toBeNull();

    const detectiveTurn = await useCases.autoAdvanceNightTurn(
      angelTurn.id,
      'night_angel',
      1
    );
    expect(detectiveTurn.phase).toBe('night_detective');

    // Turno do Detetive (cd-player-1 investiga Ana cd-player-2, que é Assassino)
    const afterDetective = await useCases.submitDetectiveInvestigation(
      detectiveTurn.id,
      'cd-player-1',
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

    // Noite 1: avanço automático de turnos sem ações
    await useCases.autoAdvanceNightTurn(initial.id); // Assassino -> Anjo
    await useCases.autoAdvanceNightTurn(initial.id); // Anjo -> Detetive
    const dawn1 = await useCases.autoAdvanceNightTurn(initial.id); // Detetive -> Amanhecer
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
    await useCases.submitAssassinTarget(initial.id, 'cd-player-2', 'cd-player-5');
    await useCases.autoAdvanceNightTurn(initial.id, 'night_assassin', 2);
    await useCases.submitAngelProtection(initial.id, 'cd-player-3', 'cd-player-3');
    await useCases.autoAdvanceNightTurn(initial.id, 'night_angel', 2);
    await useCases.submitDetectiveInvestigation(
      initial.id,
      'cd-player-1',
      'cd-player-3'
    );
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
    expect(finalRoom.players.every((p) => p.role !== null)).toBe(true);

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
    await useCases.submitAssassinTarget(initial.id, 'cd-player-2', 'cd-player-5');
    await useCases.autoAdvanceNightTurn(initial.id, 'night_assassin', 1);
    await useCases.submitAngelProtection(initial.id, 'cd-player-4', 'cd-player-1');
    await useCases.autoAdvanceNightTurn(initial.id, 'night_angel', 1);
    await useCases.submitDetectiveInvestigation(
      initial.id,
      'cd-player-1',
      'cd-player-2'
    );

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
    await useCases.submitAssassinTarget(created.id, 'cd-player-2', 'cd-player-4');
    expect(narratorService.getSpeechHistory()).toHaveLength(
      historyAfterHostStart
    );

    await useCases.speakNarratorCaption('Legenda de teste', 'feminina');
    expect(narratorService.getLastSpeech()?.caption).toBe('Legenda de teste');
    expect(narratorService.getLastSpeech()?.voice).toBe('feminina');

    await useCases.stopNarratorAudio();
    expect(narratorService.getLastSpeech()).toBeNull();
  });

  it('deve preservar todas as confirmações e votos simultâneos sob concorrência com Promise.all (Issue #38)', async () => {
    const { useCases, roomService } = createSut();
    const room = await useCases.getRoom();
    await useCases.removePlayer(room.id, 'cd-player-6');

    const started = await useCases.startMatch(room.id, [
      'detetive',
      'assassino',
      'anjo',
      'cidadao',
      'cidadao',
    ]);

    await Promise.all(
      started.players.map((p) => useCases.confirmPlayerReady(started.id, p.id))
    );

    const afterReady = await useCases.getRoom(started.id);
    expect(afterReady.players.every((p) => p.isReady)).toBe(true);
    expect(afterReady.phase).toBe('night_assassin');

    // Avança a noite até votação do dia
    await useCases.autoAdvanceNightTurn(started.id);
    await useCases.autoAdvanceNightTurn(started.id);
    await useCases.autoAdvanceNightTurn(started.id);
    await useCases.startVotingPhase(started.id);

    const votingRoom = await useCases.getRoom(started.id);
    const alive = votingRoom.players.filter((p) => p.isAlive);
    expect(alive).toHaveLength(5);

    await Promise.all(
      alive.map((p, idx) => {
        const target = alive[(idx + 1) % alive.length].id;
        return useCases.castVote(started.id, p.id, target);
      })
    );

    const afterVotes = await useCases.getRoom(started.id);
    expect(afterVotes.players.every((p) => p.hasVoted)).toBe(true);

    const tallied = await useCases.tallyVotes(started.id);
    const totalCounted =
      Object.values(tallied.voteReport?.voteCounts ?? {}).reduce(
        (acc, n) => acc + n,
        0
      ) + (tallied.voteReport?.skipCount ?? 0);
    expect(totalCounted).toBe(5);

    // Simular latência assíncrona entre leitura e escrita garantindo que operações atômicas não se perdem
    const originalMark = roomService.markCidadeDormePlayerReady.bind(roomService);
    const spy = jest
      .spyOn(roomService, 'markCidadeDormePlayerReady')
      .mockImplementation(async (rid, pid, opts) => {
        await Promise.resolve();
        return originalMark(rid, pid, opts);
      });

    const rematch = await useCases.restartMatch(started.id);
    await Promise.all(
      rematch.players.map((p) => useCases.confirmPlayerReady(rematch.id, p.id))
    );
    const afterAsyncReady = await useCases.getRoom(rematch.id);
    expect(afterAsyncReady.players.every((p) => p.isReady)).toBe(true);
    expect(afterAsyncReady.phase).toBe('night_assassin');
    spy.mockRestore();
  });

  it('deve sortear papéis aleatoriamente via Fisher-Yates variando o anfitrião, preservando invariantes e re-sorteando na revanche (Issue #39)', async () => {
    const basePool: CidadeDormeRole[] = [
      'detetive',
      'assassino',
      'anjo',
      'cidadao',
      'cidadao',
    ];
    expect(shuffleRoles(basePool, () => 0)).toHaveLength(5);
    expect(
      shuffleRoles(basePool, () => 0.999999).every((r) => r !== undefined)
    ).toBe(true);

    // Sequências pseudoaleatórias distintas mudam o papel do anfitrião
    let cursorA = 0;
    const seqA = [0.1, 0.2, 0.3, 0.4, 0.5];
    const sutA = createSut({
      random: () => seqA[cursorA++ % seqA.length],
    });
    const roomA = await sutA.useCases.getRoom();
    const startedA = await sutA.useCases.startMatch(roomA.id);

    let cursorB = 0;
    const seqB = [0.999999, 0.999999, 0.999999, 0.999999, 0.999999];
    const sutB = createSut({
      random: () => seqB[cursorB++ % seqB.length],
    });
    const roomB = await sutB.useCases.getRoom();
    const startedB = await sutB.useCases.startMatch(roomB.id);

    // Com seqA (valores baixos), o último elemento (cidadao) vai parar na posição 0
    expect(startedA.players[0].role).not.toBe('detetive');
    expect(startedB.players[0].role).toBe('detetive');

    // Re-sortear na revanche com gerador que avança
    let rematchStep = 0;
    const rematchSeq = [
      0.99, 0.99, 0.99, 0.99, 0.99, // partida 1
      0.05, 0.15, 0.25, 0.35, 0.45, // revanche
    ];
    const sutRematch = createSut({
      random: () => rematchSeq[rematchStep++ % rematchSeq.length],
    });
    const r = await sutRematch.useCases.getRoom();
    const m1 = await sutRematch.useCases.startMatch(r.id);
    const m2 = await sutRematch.useCases.restartMatch(r.id);
    expect(m1.players[0].role).not.toBe(m2.players[0].role);

    // Validar invariante exata para 5..16 jogadores e 1..3 assassinos
    const configs: Array<{ players: number; assassins: 1 | 2 | 3 }> = [
      { players: 5, assassins: 1 },
      { players: 8, assassins: 2 },
      { players: 12, assassins: 2 },
      { players: 16, assassins: 3 },
    ];
    for (const cfg of configs) {
      const { useCases: cfgUseCases, roomService: cfgService } = createSut({
        random: () => 0.37,
      });
      const cfgRoom = await cfgUseCases.getRoom();
      if (cfg.players < cfgRoom.players.length) {
        const removable = cfgRoom.players
          .filter((p) => !p.isHost)
          .slice(cfg.players - 1);
        for (const extra of removable) {
          await cfgUseCases.removePlayer(cfgRoom.id, extra.id);
        }
      }
      while (
        (await cfgUseCases.getRoom(cfgRoom.id)).players.length < cfg.players
      ) {
        const count = (await cfgUseCases.getRoom(cfgRoom.id)).players.length;
        await cfgUseCases.joinRoom(cfgRoom.code, `Player${count + 1}`);
      }
      await cfgUseCases.updateConfig(cfgRoom.id, {
        assassinCount: cfg.assassins,
      });
      const match = await cfgUseCases.startMatch(cfgRoom.id);
      const roles = await Promise.all(
        match.players.map(async (p) => {
          const view = await cfgService.getCidadeDormeRoom(match.id, p.id);
          return view.players.find((vp) => vp.id === p.id)?.role;
        })
      );
      expect(roles.filter((x) => x === 'detetive')).toHaveLength(1);
      expect(roles.filter((x) => x === 'anjo')).toHaveLength(1);
      expect(roles.filter((x) => x === 'assassino')).toHaveLength(
        cfg.assassins
      );
      expect(roles.filter((x) => x === 'cidadao')).toHaveLength(
        cfg.players - cfg.assassins - 2
      );
    }
  });

  it('deve garantir isolamento de segredos RNF11 por jogador (inclusive Anfitrião) e expor allyAssassinIds apenas para Assassinos (Issue #40)', async () => {
    const { useCases, roomService } = createSut();
    const initial = await useCases.getRoom();
    await useCases.updateConfig(initial.id, { assassinCount: 2 });

    await useCases.startMatch(initial.id, [
      'cidadao', // cd-player-1 (Anfitrião!)
      'assassino', // cd-player-2
      'assassino', // cd-player-3
      'anjo', // cd-player-4
      'detetive', // cd-player-5
      'cidadao', // cd-player-6
    ]);

    // Anfitrião é Cidadão -> só vê seu próprio papel; demais papéis são null e allyAssassinIds é []
    const hostView = await roomService.getCidadeDormeRoom(
      initial.id,
      'cd-player-1'
    );
    expect(hostView.players[0].role).toBe('cidadao');
    expect(hostView.players.slice(1).every((p) => p.role === null)).toBe(true);
    expect(hostView.allyAssassinIds).toEqual([]);

    // Assassino vê apenas seu papel + ID do parceiro Assassino em allyAssassinIds
    const assassinView = await roomService.getCidadeDormeRoom(
      initial.id,
      'cd-player-2'
    );
    expect(assassinView.players[1].role).toBe('assassino');
    expect(assassinView.players[2].role).toBeNull();
    expect(assassinView.allyAssassinIds).toEqual(['cd-player-3']);

    // Investigação do Detetive não vaza para o Anfitrião
    await useCases.confirmPlayerReady(initial.id, initial.hostId, true);
    await useCases.autoAdvanceNightTurn(initial.id); // -> night_angel
    await useCases.autoAdvanceNightTurn(initial.id); // -> night_detective
    await useCases.submitDetectiveInvestigation(
      initial.id,
      'cd-player-5',
      'cd-player-2'
    );

    const hostDuringDetective = await roomService.getCidadeDormeRoom(
      initial.id,
      'cd-player-1'
    );
    expect(hostDuringDetective.detectiveVerdict).toBeNull();

    const detectiveView = await roomService.getCidadeDormeRoom(
      initial.id,
      'cd-player-5'
    );
    expect(detectiveView.detectiveVerdict?.isAssassin).toBe(true);
  });

  it('deve avançar a noite automaticamente mesmo com Anjo/Detetive mortos ou sem ação, mantendo cadência fixa phaseEndsAt e idempotência (Issue #41)', async () => {
    let currentTime = 1_700_000_000_000;
    const { useCases } = createSut({ now: () => currentTime });
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

    // Noite 1: Assassino elimina o Anjo (cd-player-3)
    const afterAttack = await useCases.submitAssassinTarget(
      initial.id,
      'cd-player-2',
      'cd-player-3'
    );
    expect(afterAttack.phase).toBe('night_assassin');
    const night1AssassinEndsAt = afterAttack.phaseEndsAt;

    currentTime += 15_000;
    const night1Angel = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_assassin',
      1
    );
    expect(night1Angel.phase).toBe('night_angel');
    // Anjo vivo não age no tempo -> não inventa proteção
    currentTime += 15_000;
    const night1Det = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_angel',
      1
    );
    expect(night1Det.phase).toBe('night_detective');
    // Detetive vivo não age no tempo -> não inventa investigação
    currentTime += 15_000;
    const dawn1 = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_detective',
      1
    );
    expect(dawn1.phase).toBe('day_debate');
    expect(dawn1.dawnReport?.savedByAngel).toBe(false);
    expect(dawn1.dawnReport?.eliminatedPlayerId).toBe('cd-player-3');
    expect(night1AssassinEndsAt).toBe(
      new Date(1_700_000_000_000 + 15_000).toISOString()
    );

    // Votação elimina o Detetive (cd-player-1) por engano
    await useCases.startVotingPhase(initial.id);
    await useCases.castVote(initial.id, 'cd-player-2', 'cd-player-1');
    await useCases.castVote(initial.id, 'cd-player-4', 'cd-player-1');
    const voteRes = await useCases.tallyVotes(initial.id);
    expect(voteRes.phase).toBe('vote_result');

    // Noite 2: Anjo E Detetive estão mortos! Nenhum jogador age -> deve amanhecer normalmente sem travar
    const night2Start = await useCases.startNextNight(initial.id);
    expect(night2Start.phase).toBe('night_assassin');

    // Chamada dupla idempotente no mesmo turno não pula 2 fases
    const n2Angel1 = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_assassin',
      2
    );
    const n2Angel2 = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_assassin',
      2
    );
    expect(n2Angel1.phase).toBe('night_angel');
    expect(n2Angel2.phase).toBe('night_angel');
    expect(n2Angel1.phaseEndsAt).toBe(
      new Date(currentTime + 15_000).toISOString()
    );

    currentTime += 15_000;
    const n2Det = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_angel',
      2
    );
    expect(n2Det.phase).toBe('night_detective');
    expect(n2Det.phaseEndsAt).toBe(
      new Date(currentTime + 15_000).toISOString()
    );

    currentTime += 15_000;
    const dawn2 = await useCases.autoAdvanceNightTurn(
      initial.id,
      'night_detective',
      2
    );
    expect(dawn2.phase).toBe('day_debate');
    expect(dawn2.dawnReport?.attackedPlayerId).toBeNull();
    expect(dawn2.dawnReport?.eliminatedPlayerId).toBeNull();
  });

  it('deve validar ator, vida, papel, alvos inválidos, limite de 1 investigação e permitir auto-proteção do Anjo (Issue #42)', async () => {
    const { useCases } = createSut();
    const initial = await useCases.getRoom();
    await useCases.updateConfig(initial.id, { assassinCount: 2 });

    await useCases.startMatch(initial.id, [
      'detetive', // cd-player-1
      'assassino', // cd-player-2
      'assassino', // cd-player-3
      'anjo', // cd-player-4
      'cidadao', // cd-player-5
      'cidadao', // cd-player-6
    ]);
    await useCases.confirmPlayerReady(initial.id, initial.hostId, true);

    // Papel errado tentando atacar
    await expect(
      useCases.submitAssassinTarget(initial.id, 'cd-player-5', 'cd-player-6')
    ).rejects.toThrow(ValidationError);

    // Assassino tentando auto-ataque ou ataque a parceiro Assassino
    await expect(
      useCases.submitAssassinTarget(initial.id, 'cd-player-2', 'cd-player-2')
    ).rejects.toThrow(ValidationError);
    await expect(
      useCases.submitAssassinTarget(initial.id, 'cd-player-2', 'cd-player-3')
    ).rejects.toThrow(ValidationError);

    // Assassino ataca o próprio Anjo (cd-player-4)
    await useCases.submitAssassinTarget(initial.id, 'cd-player-2', 'cd-player-4');
    await useCases.autoAdvanceNightTurn(initial.id, 'night_assassin', 1);

    // Papel errado tentando proteger
    await expect(
      useCases.submitAngelProtection(initial.id, 'cd-player-5', 'cd-player-4')
    ).rejects.toThrow(ValidationError);

    // Anjo PODE proteger a si mesmo!
    await expect(
      useCases.submitAngelProtection(initial.id, 'cd-player-4', 'cd-player-4')
    ).resolves.toBeDefined();

    await useCases.autoAdvanceNightTurn(initial.id, 'night_angel', 1);

    // Detetive não pode investigar a si mesmo
    await expect(
      useCases.submitDetectiveInvestigation(
        initial.id,
        'cd-player-1',
        'cd-player-1'
      )
    ).rejects.toThrow(ValidationError);

    // Primeira investigação válida
    const verdictRoom = await useCases.submitDetectiveInvestigation(
      initial.id,
      'cd-player-1',
      'cd-player-2'
    );
    expect(verdictRoom.detectiveVerdict?.isAssassin).toBe(true);

    // Segunda investigação na mesma noite deve lançar ValidationError
    await expect(
      useCases.submitDetectiveInvestigation(
        initial.id,
        'cd-player-1',
        'cd-player-5'
      )
    ).rejects.toThrow(ValidationError);

    // Amanhecer confirma que Anjo salvou a si mesmo
    const dawn = await useCases.advanceToDawn(initial.id);
    expect(dawn.dawnReport?.savedByAngel).toBe(true);
    expect(dawn.players.find((p) => p.id === 'cd-player-4')?.isAlive).toBe(
      true
    );

    // Jogador não pode votar em si mesmo
    await useCases.startVotingPhase(initial.id);
    await expect(
      useCases.castVote(initial.id, 'cd-player-1', 'cd-player-1')
    ).rejects.toThrow(ValidationError);

    // Elimina o Detetive (cd-player-1) na votação e verifica que morto não age na noite seguinte
    await useCases.castVote(initial.id, 'cd-player-2', 'cd-player-1');
    await useCases.castVote(initial.id, 'cd-player-3', 'cd-player-1');
    await useCases.castVote(initial.id, 'cd-player-5', 'cd-player-1');
    await useCases.tallyVotes(initial.id);
    await useCases.startNextNight(initial.id);
    await useCases.autoAdvanceNightTurn(initial.id, 'night_assassin', 2);
    await useCases.autoAdvanceNightTurn(initial.id, 'night_angel', 2);

    await expect(
      useCases.submitDetectiveInvestigation(
        initial.id,
        'cd-player-1',
        'cd-player-2'
      )
    ).rejects.toThrow(ValidationError);
  });
});
