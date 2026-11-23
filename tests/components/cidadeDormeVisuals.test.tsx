import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Animated } from 'react-native';
import type { CidadeDormePlayer } from '@/model/entities/multiplayerSession';
import { CidadeDormeCityPanel } from '@/view/components/cidadeDormeCityPanel';
import { CidadeDormePhaseTimeline } from '@/view/components/cidadeDormePhaseTimeline';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';

const samplePlayers: CidadeDormePlayer[] = [
  {
    id: 'p1',
    nickname: 'Héber',
    isHost: true,
    isAlive: true,
    isReady: true,
    role: 'detetive',
    hasVoted: false,
  },
  {
    id: 'p2',
    nickname: 'Ana',
    isHost: false,
    isAlive: false,
    isReady: true,
    role: 'assassino',
    hasVoted: false,
  },
  {
    id: 'p3',
    nickname: 'Lucas',
    isHost: false,
    isAlive: true,
    isReady: false,
    role: 'anjo',
    hasVoted: false,
  },
];

describe('Componentes Visuais do Cidade Dorme (UC07 #56)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('CidadeDormePhaseTimeline destaca a etapa ativa e exibe o número da rodada', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CidadeDormePhaseTimeline
          currentRound={2}
          isNightPhase
          themeMode="dark"
          steps={[
            { id: 'night', label: 'Noite', isActive: true, isCompleted: false },
            { id: 'dawn', label: 'Amanhecer', isActive: false, isCompleted: false },
            { id: 'debate', label: 'Debate', isActive: false, isCompleted: false },
            { id: 'voting', label: 'Votação', isActive: false, isCompleted: false },
          ]}
        />
      );
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Noite 2')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Noite')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Votação')).toBe(true);

    const activeStep = tree.root.findByProps({
      accessibilityLabel: 'Noite: etapa atual',
    } as any);
    expect(activeStep.props.accessibilityState).toEqual({ selected: true });
  });

  it('CidadeDormeCityPanel exibe Vivos/Eliminados, barra de progresso e nunca revela papéis secretos (RNF11)', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CidadeDormeCityPanel
          players={samplePlayers}
          aliveCount={2}
          eliminatedCount={1}
          progress={{ label: 'Prontos', current: 2, total: 3 }}
        />
      );
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Vivos 2 · Eliminados 1')).toBe(
      true
    );
    expect(texts.some((t) => t.props.children === 'Prontos 2/3')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Eliminado')).toBe(true);
    // Garante que papéis secretos não vazam na grade de avatares
    expect(
      texts.some((t) =>
        ['Assassino', 'Detetive', 'Anjo', 'Cidadão'].includes(
          String(t.props.children)
        )
      )
    ).toBe(false);

    const icons = tree.root.findAllByType('MaterialCommunityIcons' as any);
    expect(icons.some((i) => i.props.name === 'ghost-outline')).toBe(true);
  });

  it('ExpressiveTimer e CidadeDormeCityPanel respeitam reduceMotion=true sem disparar animações (RNF09)', () => {
    const springSpy = jest.spyOn(Animated, 'spring');
    const timingSpy = jest.spyOn(Animated, 'timing');

    act(() => {
      renderer.create(<ExpressiveTimer secondsRemaining={5} reduceMotion />);
      renderer.create(
        <CidadeDormeCityPanel
          players={samplePlayers}
          aliveCount={2}
          eliminatedCount={1}
          reduceMotion
          progress={{ label: 'Votos', current: 1, total: 2 }}
        />
      );
    });

    expect(springSpy).not.toHaveBeenCalled();
    expect(timingSpy).not.toHaveBeenCalled();
  });
});
