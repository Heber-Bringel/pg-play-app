import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { ExpressiveButton } from '../components/ExpressiveButton';
import { ExpressiveTextField } from '../components/ExpressiveTextField';
import { GameCard } from '../components/GameCard';
import { ExpressiveTimer } from '../components/ExpressiveTimer';
import { QuizOption } from '../components/QuizOption';
import { LetterKey } from '../components/LetterKey';
import { tokens } from '../theme/tokens';

describe('Componentes do Sistema de Design PG Play Expressive (04-componentes/)', () => {
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

    it('aplica Shape Morphing (9999dp -> 16dp) ao pressionar e anel de foco ao focar', () => {
      const onPress = jest.fn();
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<ExpressiveButton label="Confirmar" onPress={onPress} />);
      });

      const pressable = tree.root.findByType('Pressable' as any);

      act(() => {
        pressable.props.onPressIn();
        pressable.props.onFocus();
      });

      const pressedStyle = StyleSheet.flatten(pressable.props.style);
      expect(pressedStyle.borderRadius).toBe(tokens.component.button.radiusPressed);
      expect(pressedStyle.backgroundColor).toBe(tokens.component.button.bgPressed);
      expect(pressedStyle.borderColor).toBe(tokens.semantic.color.focus);

      act(() => {
        pressable.props.onPressOut();
        pressable.props.onBlur();
        pressable.props.onPress();
      });

      const releasedStyle = StyleSheet.flatten(pressable.props.style);
      expect(releasedStyle.borderRadius).toBe(tokens.component.button.radius);
      expect(releasedStyle.borderColor).toBe(tokens.semantic.color.transparent);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renderiza todas as variantes (primaryJumbo, successJumbo, secondary, tonal, outlined e disabled)', () => {
      const variants = [
        { variant: 'primaryJumbo' as const, bg: tokens.component.button.bg, height: 64 },
        { variant: 'successJumbo' as const, bg: tokens.semantic.color.success, height: 64 },
        { variant: 'secondary' as const, bg: tokens.semantic.color.secondary, height: 48 },
        { variant: 'tonal' as const, bg: tokens.semantic.color.actionContainer, height: 48 },
        { variant: 'outlined' as const, bg: tokens.semantic.color.surfaceContainer, height: 48 },
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
            placeholder="Ex.: Tribo de Judá"
            helperText="Mínimo de 2 letras"
            onChangeText={onChangeText}
          />
        );
      });

      const input = tree.root.findByType('TextInput' as any);
      expect(input.props.accessibilityLabel).toBe('Nome da Equipe');
      expect(input.props.accessibilityHint).toBe('Mínimo de 2 letras');

      act(() => {
        input.props.onFocus();
      });
      act(() => {
        input.props.onBlur();
        input.props.onChangeText('Leões da Fé');
      });

      expect(onChangeText).toHaveBeenCalledWith('Leões da Fé');
    });

    it('renderiza estados de erro e desabilitado com cores e ícone semântico corretos', () => {
      let errorTree!: renderer.ReactTestRenderer;
      act(() => {
        errorTree = renderer.create(
          <ExpressiveTextField
            label="Nome da Equipe"
            value="A"
            placeholder="Digite..."
            errorText="Digite pelo menos 2 letras"
            onChangeText={jest.fn()}
          />
        );
      });

      const icons = errorTree.root.findAllByType('MaterialCommunityIcons' as any);
      expect(icons.some((i) => i.props.name === 'alert-circle')).toBe(true);

      let disabledTree!: renderer.ReactTestRenderer;
      act(() => {
        disabledTree = renderer.create(
          <ExpressiveTextField
            label="Busca"
            value=""
            placeholder="Buscar jogo"
            icon="magnify"
            disabled
            onChangeText={jest.fn()}
          />
        );
      });

      const disabledInput = disabledTree.root.findByType('TextInput' as any);
      expect(disabledInput.props.editable).toBe(false);
      expect(disabledInput.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('3. GameCard (card-de-jogo.md)', () => {
    it('renderiza card interativo com emblema, tag de jogadores e mudança de forma ao pressionar', () => {
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
      expect(pressedStyle.borderColor).toBe(tokens.semantic.color.action);

      act(() => {
        pressable.props.onPressOut();
      });
      const normalStyle = StyleSheet.flatten(pressable.props.style);
      expect(normalStyle.borderRadius).toBe(tokens.component.card.radius);
    });

    it('renderiza variante Pódio Líder (highlightLeader) e estado desabilitado sem ação', () => {
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
      expect(flatStyle.borderColor).toBe(tokens.semantic.color.highlight);
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
      expect(flatStyle.backgroundColor).toBe(tokens.component.timer.bgNormal);
      expect(flatStyle.borderRadius).toBe(tokens.component.timer.radiusNormal);

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
      expect(flatStyle.backgroundColor).toBe(tokens.component.timer.bgCritical);
      expect(flatStyle.borderRadius).toBe(tokens.component.timer.radiusCritical);

      const icon = tree.root.findByType('MaterialCommunityIcons' as any);
      expect(icon.props.name).toBe('alert');
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
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.optionCorrectBg);
          expect(pressable.props.accessibilityLabel).toContain('resposta correta');
          const icon = tree.root.findByType('MaterialCommunityIcons' as any);
          expect(icon.props.name).toBe('check-circle');
        } else if (status === 'wrong') {
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.optionWrongBg);
          expect(flatStyle.borderRadius).toBe(tokens.semantic.radius.sm);
          expect(pressable.props.accessibilityLabel).toContain('resposta incorreta');
          const icon = tree.root.findByType('MaterialCommunityIcons' as any);
          expect(icon.props.name).toBe('close-circle');
        } else if (status === 'selected') {
          expect(flatStyle.backgroundColor).toBe(tokens.semantic.color.actionContainer);
        } else {
          expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.optionBg);
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
});
