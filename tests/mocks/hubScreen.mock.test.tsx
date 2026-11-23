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
      .mockReturnValue([{ ...baseState, error: 'Erro simulado no Hub' }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Erro simulado no Hub')).toBe(true);

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
      .mockReturnValue([
        { ...baseState, games: [] },
        actions,
      ]);

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

  it('deve renderizar líder, chips de modalidade e cards acionando as ações corretas (RF01–RF03)', () => {
    const actions = createMockActions();
    jest
      .spyOn(hubVmModule, 'useHubViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<HubScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Líder: Tribo de Judá')
    ).toBe(true);

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

    const teamsButton = tree.root.findByProps({
      accessibilityLabel: 'Equipes (2)',
    });
    act(() => {
      teamsButton.props.onPress();
    });
    expect(actions.handleOpenTeams).toHaveBeenCalledTimes(1);
  });

  it('inicia seletor de tema minimizado, permite expandir/minimizar e alternar entre Automático, Claro e Escuro', () => {
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

    // Inicia minimizado: chips e botão de minimizar ausentes
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Selecionar tema Automático' })
    ).toHaveLength(0);
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Minimizar opções de tema' })
    ).toHaveLength(0);

    const scroll = tree.root.findByType('ScrollView' as any);
    expect(StyleSheet.flatten(scroll.props.style).backgroundColor).toBe(
      tokens.semantic.color.surface
    );

    // Expande o painel ao tocar no botão compacto do cabeçalho
    const toggleBtn = tree.root.findByProps({
      accessibilityLabel: 'Tema: Automático. Expandir opções de tema',
    });
    const togglePressable = toggleBtn.findByType('Pressable' as any);
    expect(togglePressable.props.accessibilityState).toEqual({
      disabled: false,
      expanded: false,
    });
    act(() => {
      toggleBtn.props.onPress();
    });

    expect(
      tree.root.findByProps({ accessibilityLabel: 'Selecionar tema Automático' })
    ).toBeTruthy();
    expect(
      tree.root.findByProps({ accessibilityLabel: 'Selecionar tema Claro' })
    ).toBeTruthy();
    const darkChip = tree.root.findByProps({
      accessibilityLabel: 'Selecionar tema Escuro',
    });

    // Alterna para Escuro mesmo com sistema em light
    act(() => {
      darkChip.props.onPress();
    });
    expect(
      StyleSheet.flatten(tree.root.findByType('ScrollView' as any).props.style)
        .backgroundColor
    ).toBe(darkTokens.semantic.color.surface);

    // Sistema em dark, alterna para Claro e depois volta para Automático
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const lightChip = tree.root.findByProps({
      accessibilityLabel: 'Selecionar tema Claro',
    });
    act(() => {
      lightChip.props.onPress();
    });
    expect(
      StyleSheet.flatten(tree.root.findByType('ScrollView' as any).props.style)
        .backgroundColor
    ).toBe(tokens.semantic.color.surface);

    const autoChip = tree.root.findByProps({
      accessibilityLabel: 'Selecionar tema Automático',
    });
    act(() => {
      autoChip.props.onPress();
    });
    expect(
      StyleSheet.flatten(tree.root.findByType('ScrollView' as any).props.style)
        .backgroundColor
    ).toBe(darkTokens.semantic.color.surface);

    // Minimiza pelo botão interno do painel
    const minimizeBtn = tree.root.findByProps({
      accessibilityLabel: 'Minimizar opções de tema',
    });
    act(() => {
      minimizeBtn.props.onPress();
    });
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Selecionar tema Automático' })
    ).toHaveLength(0);

    // Reabre e minimiza novamente pelo botão compacto do cabeçalho
    const toggleBtnReopen = tree.root.findByProps({
      accessibilityLabel: 'Tema: Automático. Expandir opções de tema',
    });
    act(() => {
      toggleBtnReopen.props.onPress();
    });
    expect(
      tree.root.findAllByProps({
        accessibilityLabel: 'Selecionar tema Automático',
      }).length
    ).toBeGreaterThan(0);

    const toggleBtnCollapse = tree.root.findByProps({
      accessibilityLabel: 'Tema: Automático. Minimizar opções de tema',
    });
    const toggleCollapsePressable = toggleBtnCollapse.findByType(
      'Pressable' as any
    );
    expect(toggleCollapsePressable.props.accessibilityState).toEqual({
      disabled: false,
      expanded: true,
    });
    act(() => {
      toggleBtnCollapse.props.onPress();
    });
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Selecionar tema Automático' })
    ).toHaveLength(0);
  });
});
