import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { MemoryNarratorAudioService } from '@/infra/services/memoryNarratorAudioService';
import { ConflictError, ValidationError } from '@/model/errors';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';
import { CidadeDormeUseCases } from '@/usecase/cidadeDormeUseCases';

describe('Sincronização de salas multiplayer (Spec 019)', () => {
  it('bloqueia novo jogador no Adedonha após saída do lobby, mas permite reconexão', async () => {
    const service = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(service);

    const room = await useCases.createRoom('Anfitrião');
    expect(room.version).toBeGreaterThanOrEqual(1);

    await useCases.spinRoulette(room.id);

    await expect(useCases.joinRoom(room.code, 'Intruso')).rejects.toThrow(
      ValidationError
    );

    const reconnected = await useCases.joinRoom(room.code, 'Ana');
    expect(reconnected.id).toBe(room.id);
  });

  it('bloqueia novo jogador no Cidade Dorme após saída do lobby', async () => {
    const service = new MemoryMultiplayerRoomService();
    const useCases = new CidadeDormeUseCases(
      service,
      new MemoryNarratorAudioService()
    );

    const room = await useCases.createRoom('Anfitrião');
    await useCases.startMatch(room.id);

    await expect(useCases.joinRoom(room.code, 'Intruso')).rejects.toThrow(
      ValidationError
    );
  });

  it('lança ConflictError ao tentar abrir preenchimento fora da fase esperada', async () => {
    const service = new MemoryMultiplayerRoomService();
    const room = await service.createAdedonhaRoom('Anfitrião');

    await expect(
      service.openRoundFilling(room.id, 'roulette')
    ).rejects.toThrow(ConflictError);
  });

  it('mantém STOP idempotente e incrementa version monotonicamente', async () => {
    const service = new MemoryMultiplayerRoomService();
    const room = await service.createAdedonhaRoom('Anfitrião');
    const v0 = room.version;

    await service.spinAlphabetRoulette(room.id, 'A');
    const filling = await service.openRoundFilling(room.id, 'roulette');
    expect(filling.version).toBeGreaterThan(v0);
    expect(filling.phaseEndsAt).not.toBeNull();

    const [stop1, stop2] = await Promise.all([
      service.triggerAdedonhaStop(room.id, room.hostId),
      service.triggerAdedonhaStop(room.id, 'player-2'),
    ]);

    expect(stop1.phase).toBe('stop_countdown');
    expect(stop2.phase).toBe('stop_countdown');
    expect(stop1.stopTriggeredBy).toBe('Anfitrião');
    expect(stop2.stopTriggeredBy).toBe('Anfitrião');
  });
});
