import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { ConfirmModal } from '@/view/components/confirmModal';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';
import { GameCard } from '@/view/components/gameCard';
import { LetterKey } from '@/view/components/letterKey';
import { QuizOption } from '@/view/components/quizOption';
import { setInputModalityForTest } from '@/view/components/useKeyboardFocus';
import { tokens } from '@/view/theme';

describe('Componentes do Sistema de Design PG Play Expressive v1.1.0 (04-componentes/)', () => {
  beforeEach(() => {
    setInputModalityForTest('keyboard');
  });

  describe('1. ExpressiveButton (botao.md)', () => {
    it('renderiza variante primária padrão com tokens corretos e ícone opcional', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExpressiveButton label="Começar Rodada" icon="play" onPress={onPress} />
        );
      });

      const pressable = tree.root.findByType('Pressable' as any);
      const flatStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressable.props.accessibilityRole).toBe('button');
      expect(pressable.props.accessibilityLabel).toBe('Começar Rodada');
      expect(pressable.props.accessibilityState).toEqual({ disabled: false });
      expect(flatStyle.minHeight).toBe(tokens.component.button.minHeight);
      expect(flatStyle.backgroundColor).toBe(tokens.component.button.bg);
      expect(flatStyle.borderRadius).toBe(tokens.component.button.radius);

      const icon = tree.root.findByType('MaterialCommunityIcons' as any);
      expect(icon.props.name).toBe('play');
    });

    it('não exibe anel de foco ao tocar/clicar, mas exibe anel duplo M3 ao focar por teclado', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveButton label="Confirmar" onPress={onPress} />);
      });

      const pressable = tree.root.findByType('Pressable' as any);

      // Toque/clique: shape morphing ativo, mas SEM anel de foco
      act(() => {
        pressable.props.onPressIn();
        pressable.props.onFocus();
      });

      const pressedStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressedStyle.borderRadius).toBe(tokens.component.button.radiusPressed);
      expect(pressedStyle.backgroundColor).toBe(tokens.component.button.bgPressed);
      expect(pressedStyle.outlineColor).toBeUndefined();
      expect(pressedStyle.borderColor).toBe(tokens.semantic.color.transparent);

      act(() => {
        pressable.props.onPressOut();
        pressable.props.onBlur();
        pressable.props.onPress();
      });
      expect(onPress).toHaveBeenCalledTimes(1);

      // Navegação por teclado: anel externo de foco ativo
      act(() => {
        pressable.props.onFocus();
      });
      const keyboardFocusedStyle = StyleSheet.flatten(pressable.props.style);
      expect(keyboardFocusedStyle.outlineColor).toBe(tokens.semantic.color.focus);
      expect(keyboardFocusedStyle.outlineWidth).toBe(tokens.semantic.border.focus);
      expect(keyboardFocusedStyle.outlineOffset).toBe(tokens.semantic.space.xs);

      act(() => {
        pressable.props.onBlur();
      });
      const blurredStyle = StyleSheet.flatten(pressable.props.style);
      expect(blurredStyle.outlineColor).toBeUndefined();
    });

    it('renderiza todas as variantes incluindo text, icon e disabled', () => {
      const variants = [
        { variant: 'primaryJumbo' as const, bg: tokens.component.button.bg, height: 64 },
        { variant: 'successJumbo' as const, bg: tokens.semantic.color.success, height: 64 },
        { variant: 'secondary' as const, bg: tokens.semantic.color.secondary, height: 48 },
        { variant: 'tonal' as const, bg: tokens.semantic.color.actionContainer, height: 48 },
        { variant: 'outlined' as const, bg: tokens.semantic.color.surfaceContainer, height: 48 },
        { variant: 'text' as const, bg: tokens.semantic.color.transparent, height: 48 },
      ];

      for (const item of variants) {
        let tree!: renderer.ReactTestRenderer;
        act(() => {
          tree = renderer.create(
            <ExpressiveButton label="Ação" variant={item.variant} onPress={jest.fn()} />
          );
        });
        const pressable = tree.root.findByType('Pressable' as any);
        const flatStyle = StyleSheet.flatten(pressable.props.style);
        expect(flatStyle.backgroundColor).toBe(item.bg);
        expect(flatStyle.minHeight).toBe(item.height);
      }

      let iconTree!: renderer.ReactTestRenderer;
      act(() => {
        iconTree = renderer.create(
          <ExpressiveButton
            variant="icon"
            tone="danger"
            icon="trash-can-outline"
            accessibilityLabel="Remover item"
            onPress={jest.fn()}
          />
        );
      });
      const iconPressable = iconTree.root.findByType('Pressable' as any);
      const iconStyle = StyleSheet.flatten(iconPressable.props.style);
      expect(iconStyle.width).toBe(48);
      expect(iconStyle.height).toBe(48);
      expect(iconPressable.props.accessibilityLabel).toBe('Remover item');
      expect(iconTree.root.findAllByType('Text' as any)).toHaveLength(0);
      expect(
        iconTree.root.findByType('MaterialCommunityIcons' as any).props.color
      ).toBe(tokens.semantic.color.error);

      let disabledTree!: renderer.ReactTestRenderer;
      act(() => {
        disabledTree = renderer.create(
          <ExpressiveButton label="Indisponível" disabled onPress={jest.fn()} />
        );
      });
      const disabledPressable = disabledTree.root.findByType('Pressable' as any);
      const disabledStyle = StyleSheet.flatten(disabledPressable.props.style);
      expect(disabledStyle.backgroundColor).toBe(tokens.component.button.bgDisabled);
      expect(disabledPressable.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('2. ExpressiveTextField (campo-de-texto.md)', () => {
    it('renderiza rótulo fixo, contador de caracteres, texto auxiliar e estados de foco', () => {
      const onChangeText = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExpressiveTextField
            label="Nome da Equipe"
            value="Leões"
            placeholder="Ex.: Águias de Fogo"
            helperText="Máximo 20 caracteres"
            maxLength={20}
            onChangeText={onChangeText}
          />
        );
      });

      const textInput = tree.root.findByType('TextInput' as any);
      expect(textInput.props.value).toBe('Leões');
      expect(textInput.props.maxLength).toBe(20);

      const labels = tree.root.findAllByType('Text' as any);
      expect(labels.some((l) => l.props.children === '5/20')).toBe(true);
      expect(labels.some((l) => l.props.children === 'Máximo 20 caracteres')).toBe(true);

      act(() => {
        textInput.props.onFocus();
        textInput.props.onChangeText('Leões do Vale');
      });
      expect(onChangeText).toHaveBeenCalledWith('Leões do Vale');
    });

    it('renderiza estado de erro com mensagem de erro, ícone de alerta e cores semânticas', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExpressiveTextField
            label="Nome da Equipe"
            value="A"
            placeholder="Ex.: Águias"
            errorText="O nome deve conter pelo menos 2 letras."
            onChangeText={jest.fn()}
          />
        );
      });

      const icon = tree.root.findByProps({ name: 'alert-circle' } as any);
      expect(icon.props.color).toBe(tokens.semantic.color.error);
      expect(
        tree.root
          .findAllByType('Text' as any)
          .some((l) => l.props.children === 'O nome deve conter pelo menos 2 letras.')
      ).toBe(true);
    });
  });

  describe('3. GameCard (card-de-jogo.md)', () => {
    it('renderiza card interativo com ExpressiveTag e mudança de forma ao pressionar', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <GameCard
            title="Mímica Expressiva"
            description="Adivinhe antes que o tempo acabe!"
            playersTag="4+ jogadores"
            icon="drama-masks"
            onPress={onPress}
          />
        );
      });

      const pressable = tree.root.findByType('Pressable' as any);
      expect(pressable.props.accessibilityRole).toBe('button');
      expect(pressable.props.accessibilityLabel).toBe(
        'Mímica Expressiva. 4+ jogadores. Adivinhe antes que o tempo acabe!'
      );

      act(() => {
        pressable.props.onPressIn();
      });
      const pressedStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressedStyle.borderRadius).toBe(tokens.semantic.radius.md);
      expect(pressedStyle.borderColor).toBe(tokens.component.card.borderPressed);

      act(() => {
        pressable.props.onPressOut();
      });
      const releasedStyle = StyleSheet.flatten(pressable.props.style);
      expect(releasedStyle.borderRadius).toBe(tokens.component.card.radius);
      expect(releasedStyle.borderColor).toBe(tokens.component.card.border);
      expect(releasedStyle.elevation).toBe(tokens.semantic.elevation.card);
    });

    it('renderiza variante pódio líder com card.borderLeader (contraste >= 4,70:1)', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <GameCard
            title="1º Lugar - Equipe Rocha"
            description="120 pontos acumulados"
            playersTag="Líder"
            icon="trophy"
            highlightLeader
            disabled
          />
        );
      });

      const pressable = tree.root.findByType('Pressable' as any);
      const flatStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressable.props.accessibilityRole).toBe('summary');
      expect(flatStyle.backgroundColor).toBe(tokens.semantic.color.disabledBg);
      expect(flatStyle.borderColor).toBe(tokens.component.card.borderLeader);
      expect(flatStyle.elevation).toBe(tokens.semantic.elevation.none);
    });
  });

  describe('4. ExpressiveTimer (cronometro-expressivo.md)', () => {
    it('renderiza estado normal (> 10s) em formato de pílula e cor highlight', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveTimer secondsRemaining={45} />);
      });

      const container = tree.root.findByType('View' as any);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(container.props.accessibilityRole).toBe('timer');
      expect(container.props.accessibilityLiveRegion).toBe('none');
      expect(flatStyle.backgroundColor).toBe(tokens.component.timer.bg.normal);
      expect(flatStyle.borderRadius).toBe(tokens.component.timer.radius.normal);

      const icon = tree.root.findByType('MaterialCommunityIcons' as any);
      expect(icon.props.name).toBe('timer-outline');
    });

    it('renderiza estado crítico (<= 10s) com troca de cor, forma (16dp) e ícone de alerta', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveTimer secondsRemaining={7} />);
      });

      const container = tree.root.findByType('View' as any);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(container.props.accessibilityLiveRegion).toBe('assertive');
      expect(flatStyle.backgroundColor).toBe(tokens.component.timer.bg.critical);
      expect(flatStyle.borderRadius).toBe(tokens.component.timer.radius.critical);
      expect(flatStyle.transform).toBeDefined();

      const icon = tree.root.findByType('MaterialCommunityIcons' as any);
      expect(icon.props.name).toBe('alert');
    });

    it('formata o visor em MM:SS mesmo acima de 59 segundos', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveTimer secondsRemaining={85} />);
      });

      const text = tree.root.findByType('Text' as any);
      expect(text.props.children).toBe('01:25');
    });

    it('renderiza estado esgotado (00:00) com ícone bell-ring e anúncio de tempo esgotado', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveTimer secondsRemaining={0} />);
      });

      const container = tree.root.findByType('View' as any);
      expect(container.props.accessibilityLabel).toBe('Tempo esgotado');
      expect(tree.root.findByType('Text' as any).props.children).toBe('00:00');
      expect(
        tree.root.findByType('MaterialCommunityIcons' as any).props.name
      ).toBe('bell-ring');
    });

    it('renderiza variante thermometer com faixas fria (< 70%), quente (>= 70%) e concluída (100%) (UC11, RF39)', () => {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExpressiveTimer
            variant="thermometer"
            totalSeconds={60}
            secondsRemaining={45}
          />
        );
      });

      let texts = tree.root.findAllByType('Text' as any);
      expect(texts.some((t) => t.props.children === 'Tempo tranquilo')).toBe(true);
      expect(texts.some((t) => t.props.children === '00:45')).toBe(true);
      expect(
        tree.root
          .findAllByType('MaterialCommunityIcons' as any)
          .some((icon) => icon.props.name === 'thermometer-low')
      ).toBe(true);

      // Faixa >= 70% (restam 15s de 60s -> 75% decorrido)
      act(() => {
        tree.update(
          <ExpressiveTimer
            variant="thermometer"
            totalSeconds={60}
            secondsRemaining={15}
          />
        );
      });
      texts = tree.root.findAllByType('Text' as any);
      expect(texts.some((t) => t.props.children === 'Pode ir concluindo')).toBe(
        true
      );
      expect(
        tree.root
          .findAllByType('MaterialCommunityIcons' as any)
          .some((icon) => icon.props.name === 'thermometer-high')
      ).toBe(true);

      // Estado pausado (com contraste outline preservando progresso visível)
      act(() => {
        tree.update(
          <ExpressiveTimer
            variant="thermometer"
            totalSeconds={60}
            secondsRemaining={15}
            paused
          />
        );
      });
      texts = tree.root.findAllByType('Text' as any);
      expect(texts.some((t) => t.props.children === 'Pausado')).toBe(true);

      // Estado concluído (00:00) com ícone heart sem erro
      act(() => {
        tree.update(
          <ExpressiveTimer
            variant="thermometer"
            totalSeconds={60}
            secondsRemaining={0}
          />
        );
      });
      texts = tree.root.findAllByType('Text' as any);
      expect(texts.some((t) => t.props.children === 'Tempo concluído')).toBe(true);
      expect(texts.some((t) => t.props.children === '00:00')).toBe(true);
      expect(
        tree.root
          .findAllByType('MaterialCommunityIcons' as any)
          .some((icon) => icon.props.name === 'heart')
      ).toBe(true);
    });
  });

  describe('5. QuizOption (alternativa-quiz.md)', () => {
    it('renderiza estados default, selected, correct e wrong com dupla confirmação visual', () => {
      const statuses = ['default', 'selected', 'correct', 'wrong'] as const;

      for (const status of statuses) {
        let tree!: renderer.ReactTestRenderer;
        act(() => {
          tree = renderer.create(
            <QuizOption
              letter="B"
              text="Davi"
              status={status}
              onPress={jest.fn()}
            />
          );
        });

        const pressable = tree.root.findByType('Pressable' as any);
        const flatStyle = StyleSheet.flatten(pressable.props.style);

        if (status === 'correct') {
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.option.correct.bg);
          expect(flatStyle.borderRadius).toBe(tokens.semantic.radius.md);
          expect(pressable.props.accessibilityLabel).toContain('resposta correta');
          expect(tree.root.findByType('MaterialCommunityIcons' as any).props.name).toBe(
            'check-circle'
          );
        } else if (status === 'wrong') {
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.option.wrong.bg);
          expect(flatStyle.borderRadius).toBe(tokens.semantic.radius.sm);
          expect(pressable.props.accessibilityLabel).toContain('resposta incorreta');
          expect(tree.root.findByType('MaterialCommunityIcons' as any).props.name).toBe(
            'close-circle'
          );
        } else if (status === 'selected') {
          expect(flatStyle.backgroundColor).toBe(tokens.semantic.color.actionContainer);
          expect(flatStyle.borderColor).toBe(tokens.component.option.border.selected);
        } else {
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.option.bg);
        }
      }
    });
  });

  describe('6. LetterKey (teclado-forca.md)', () => {
    it('renderiza tecla disponível (48x48dp) e dispara onPress com a letra escolhida', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<LetterKey letter="A" onPress={onPress} />);
      });

      const pressable = tree.root.findByType('Pressable' as any);
      const flatStyle = StyleSheet.flatten(pressable.props.style);
      expect(flatStyle.minWidth).toBe(48);
      expect(flatStyle.minHeight).toBe(48);
      expect(pressable.props.disabled).toBe(false);
      expect(pressable.props.accessibilityLabel).toBe('Letra A, disponível');

      act(() => {
        pressable.props.onPress();
      });
      expect(onPress).toHaveBeenCalledWith('A');
    });

    it('renderiza estados hit (círculo verde) e miss (quadrado com texto riscado) desabilitados', () => {
      let hitTree!: renderer.ReactTestRenderer;
      act(() => {
        hitTree = renderer.create(<LetterKey letter="E" status="hit" onPress={jest.fn()} />);
      });
      const hitPressable = hitTree.root.findByType('Pressable' as any);
      const hitStyle = StyleSheet.flatten(hitPressable.props.style);
      expect(hitPressable.props.disabled).toBe(true);
      expect(hitStyle.borderRadius).toBe(tokens.semantic.radius.full);
      expect(hitPressable.props.accessibilityLabel).toBe('Letra E, correta, já utilizada');

      let missTree!: renderer.ReactTestRenderer;
      act(() => {
        missTree = renderer.create(<LetterKey letter="Z" status="miss" onPress={jest.fn()} />);
      });
      const missPressable = missTree.root.findByType('Pressable' as any);
      const missText = missTree.root.findByType('Text' as any);
      const missTextStyle = StyleSheet.flatten(missText.props.style);
      expect(missPressable.props.disabled).toBe(true);
      expect(missTextStyle.textDecorationLine).toBe('line-through');
      expect(missPressable.props.accessibilityLabel).toBe('Letra Z, incorreta, já utilizada');
    });
  });

  describe('7. ConfirmModal (modal-confirmacao.md)', () => {
    it('suporta modo 2 botões (confirmação) e não renderiza quando visible=false', () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();

      let hiddenTree!: renderer.ReactTestRenderer;
      act(() => {
        hiddenTree = renderer.create(
          <ConfirmModal
            visible={false}
            title="Deseja sair?"
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        );
      });
      expect(hiddenTree.root.findAllByType('Text' as any)).toHaveLength(0);

      let visibleTree!: renderer.ReactTestRenderer;
      act(() => {
        visibleTree = renderer.create(
          <ConfirmModal
            visible
            title="Deseja sair da sala?"
            description="A rodada continua para o grupo."
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        );
      });

      const cancelBtn = visibleTree.root.findByProps({
        accessibilityLabel: 'Continuar Jogando',
      } as any);
      const confirmBtn = visibleTree.root.findByProps({
        accessibilityLabel: 'Confirmar Saída',
      } as any);

      act(() => {
        cancelBtn.props.onPress();
        confirmBtn.props.onPress();
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('suporta modo 1 botão (encerramento/aviso sem cancelar, #54)', () => {
      const onConfirm = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ConfirmModal
            visible
            title="Encontro encerrado"
            description="Obrigado por compartilhar. Nenhum nome foi salvo."
            confirmLabel="Voltar ao Hub"
            onConfirm={onConfirm}
          />
        );
      });

      const pressables = tree.root.findAllByType('Pressable' as any);
      expect(pressables).toHaveLength(1);
      expect(pressables[0].props.accessibilityLabel).toBe('Voltar ao Hub');

      const liveRegion = tree.root.findByProps({
        accessibilityLiveRegion: 'polite',
      } as any);
      expect(liveRegion).toBeDefined();

      act(() => {
        pressables[0].props.onPress();
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('8. ExpressiveChip (chip.md)', () => {
    it('mantém borda de estado no clique sem anel coral e exibe anel duplo apenas por teclado', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExpressiveChip
            label="Única (+10)"
            tone="success"
            selected
            onPress={onPress}
          />
        );
      });

      const pressable = tree.root.findByType('Pressable' as any);
      const initialStyle = StyleSheet.flatten(pressable.props.style);
      expect(initialStyle.minHeight).toBe(48);
      expect(initialStyle.backgroundColor).toBe(tokens.semantic.color.success);
      expect(initialStyle.borderColor).toBe(tokens.component.chip.border.success);
      expect(initialStyle.borderRadius).toBe(tokens.component.chip.radius);

      // Toque/clique não exibe anel de foco e preserva borda de sucesso
      act(() => {
        pressable.props.onPressIn();
        pressable.props.onFocus();
      });
      const pressedStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressedStyle.borderRadius).toBe(tokens.component.chip.radiusPressed);
      expect(pressedStyle.borderColor).toBe(tokens.component.chip.border.success);
      expect(pressedStyle.outlineColor).toBeUndefined();

      act(() => {
        pressable.props.onPressOut();
        pressable.props.onPress();
      });
      expect(onPress).toHaveBeenCalledTimes(1);

      // Foco por teclado exibe anel duplo externo preservando a borda verde do estado
      act(() => {
        pressable.props.onFocus();
      });
      const keyboardStyle = StyleSheet.flatten(pressable.props.style);
      expect(keyboardStyle.borderColor).toBe(tokens.component.chip.border.success);
      expect(keyboardStyle.outlineColor).toBe(tokens.component.chip.border.focus);
      expect(keyboardStyle.outlineWidth).toBe(tokens.semantic.border.focus);
    });
  });
});
