import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import HubRoute from '@/app/index';
import type { Minigame } from '@/model/entities/minigame';
import HubScreen from '@/view/index';
import { darkTokens, ThemeProvider, tokens } from '@/view/theme';
import * as hubVmModule from '@/viewmodel/useHubViewModel';
import type { HubActions, HubState } from '@/viewmodel/useHubViewModel';

const SAMPLE_GAMES: Minigame[] = [
  {
    id: 'mimica',
    title: 'Mímica Expressiva',
    description: 'Faça gestos sem falar.',
    modality: '1 Celular',
    playersTag: '1 Celular · 2+ equipes',
    route: '/mimica',
    icon: 'drama-masks',
    themes: ['gestos'],
    available: true,
  },
  {
    id: 'cidade-dorme',
    title: 'Cidade Dorme',
    description: 'Dedução social com narrador.',
    modality: 'Multi-Celular',
    playersTag: 'Multi-Celular · Em breve',
    route: '/cidade-dorme',
    icon: 'weather-night',
    themes: ['misterio'],
    available: false,
  },
];

const createMockActions = (): HubActions => ({
  setSearchQuery: jest.fn(async () => {}),
  setSelectedModality: jest.fn(async () => {}),
  handleClearFilters: jest.fn(async () => {}),
  handleSelectGame: jest.fn(),
  handleOpenTeams: jest.fn(),
  handleOpenScoreboard: jest.fn(),
  handleOpenWelcome: jest.fn(),
  handleSelectNav: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: HubState = {
  games: SAMPLE_GAMES,
  allGamesCount: 5,
  searchQuery: '',
  selectedModality: 'Todos',
  leaderTeam: { id: 'team-1', name: 'Tribo de Judá', score: 60 },
  totalTeams: 2,
  loading: false,
  error: null,
};

describe('HubScreen — Testes de Tela com Mocks de ViewModel (UC01)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue('light');
  });

  it('deve reexportar a tela corretamente na rota fina src/app/index.tsx', () => {
    expect(HubRoute).toBe(HubScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Carregando Hub de Jogos do PG...')
    ).toBe(true);
  });

  it('deve renderizar o estado de erro e permitir tentar novamente', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([
        { ...baseState, error: 'Erro simulado no Hub' },
        actions,
      ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Erro simulado no Hub')
    ).toBe(true);

    const retryBtn = tree.root.findByProps({
      accessibilityLabel: 'Tentar Novamente',
    });
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o estado vazio e restaurar filtros ao tocar em Limpar filtros (RF04)', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([{ ...baseState, games: [] }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Nenhum minigame encontrado')
    ).toBe(true);

    const clearBtn = tree.root.findByProps({
      accessibilityLabel: 'Limpar filtros',
    });
    act(() => {
      clearBtn.props.onPress();
    });
    expect(actions.handleClearFilters).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar catálogo limpo, chips de modalidade, cards e barra inferior de 3 abas (RF01–RF03)', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Jogos do Encontro')).toBe(
      true
    );
    expect(texts.some((t) => t.props.children === '2 de 5 jogos')).toBe(false);

    const onePhoneChip = tree.root.findByProps({
      accessibilityLabel: 'Filtrar por 1 Celular',
    });
    act(() => {
      onePhoneChip.props.onPress();
    });
    expect(actions.setSelectedModality).toHaveBeenCalledWith('1 Celular');

    const mimicaCard = tree.root.findByProps({
      accessibilityLabel:
        'Mímica Expressiva. 1 Celular · 2+ equipes. Faça gestos sem falar.',
    });
    act(() => {
      mimicaCard.props.onPress();
    });
    expect(actions.handleSelectGame).toHaveBeenCalledWith(SAMPLE_GAMES[0]);

    const disabledCard = tree.root.findByProps({
      accessibilityLabel:
        'Cidade Dorme. Multi-Celular · Em breve. Dedução social com narrador.',
    });
    expect(disabledCard.props.disabled).toBe(true);

    const welcomeTab = tree.root.findByProps({
      accessibilityLabel: 'Ir para Início',
    });
    const teamsTab = tree.root.findByProps({
      accessibilityLabel: 'Ir para Equipes',
    });
    act(() => {
      welcomeTab.props.onPress();
      teamsTab.props.onPress();
    });
    expect(actions.handleSelectNav).toHaveBeenNthCalledWith(1, 'welcome');
    expect(actions.handleSelectNav).toHaveBeenNthCalledWith(2, 'teams');
  });

  it('alterna tema claro e escuro com 1 toque pelo botão do cabeçalho', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([baseState, actions]);

    (useColorScheme as jest.Mock).mockReturnValue('light');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <HubScreen />
        </ThemeProvider>
      );
    });

    const scroll = tree.root.findByType('ScrollView' as any);
    expect(StyleSheet.flatten(scroll.props.style).backgroundColor).toBe(
      tokens.semantic.color.surface
    );

    const toDarkBtn = tree.root.findByProps({
      accessibilityLabel: 'Alternar para tema escuro',
    });
    act(() => {
      toDarkBtn.props.onPress();
    });
    expect(
      StyleSheet.flatten(tree.root.findByType('ScrollView' as any).props.style)
        .backgroundColor
    ).toBe(darkTokens.semantic.color.surface);

    const toLightBtn = tree.root.findByProps({
      accessibilityLabel: 'Alternar para tema claro',
    });
    act(() => {
      toLightBtn.props.onPress();
    });
    expect(
      StyleSheet.flatten(tree.root.findByType('ScrollView' as any).props.style)
        .backgroundColor
    ).toBe(tokens.semantic.color.surface);
  });

  it('exibe botão de som ligado por padrão no cabeçalho e permite alternar entre ligado e desligado (#84)', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <HubScreen />
        </ThemeProvider>
      );
    });

    const soundOnBtn = tree.root.findByProps({
      accessibilityLabel: 'Som do jogo: Ligado. Toque para desligar o som',
    });
    expect(soundOnBtn).toBeTruthy();

    act(() => {
      soundOnBtn.props.onPress();
    });

    const soundOffBtn = tree.root.findByProps({
      accessibilityLabel: 'Som do jogo: Desligado. Toque para ligar o som',
    });
    expect(soundOffBtn).toBeTruthy();

    act(() => {
      soundOffBtn.props.onPress();
    });

    expect(
      tree.root.findByProps({
        accessibilityLabel: 'Som do jogo: Ligado. Toque para desligar o som',
      })
    ).toBeTruthy();
  });
});
