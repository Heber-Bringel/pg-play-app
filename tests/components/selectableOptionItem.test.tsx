import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Animated, StyleSheet } from 'react-native';
import { SelectableOptionItem } from '@/view/components/selectableOptionItem';
import { darkTokens, tokens } from '@/view/theme';

describe('SelectableOptionItem (design-system + UC07 #43)', () => {
  it('renderiza numeração sequencial (1..16) sem letras A-D, alvo >= 56dp e dispara onPress', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <SelectableOptionItem
          index={12}
          label="Pedro"
          onPress={onPress}
        />
      );
    });

    const pressable = tree.root.findByType('Pressable' as any);
    const flatStyle = StyleSheet.flatten(pressable.props.style);
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(56);
    expect(flatStyle.backgroundColor).toBe(tokens.component.quiz.optionBg);
    expect(flatStyle.borderRadius).toBe(tokens.component.quiz.optionRadius);
    expect(pressable.props.accessibilityRole).toBe('button');
    expect(pressable.props.accessibilityLabel).toBe(
      'Selecionar jogador 12: Pedro'
    );
    expect(pressable.props.accessibilityState).toEqual({
      disabled: false,
      selected: false,
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === '12')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Pedro')).toBe(true);

    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renderiza ícone semântico próprio (hand-back-left-outline) para Abster-se / Pular Voto', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SelectableOptionItem
          icon="hand-back-left-outline"
          label="Abster-se / Pular Voto"
          selected
          onPress={jest.fn()}
        />
      );
    });

    const icons = tree.root.findAllByType('MaterialCommunityIcons' as any);
    expect(icons.some((i) => i.props.name === 'hand-back-left-outline')).toBe(
      true
    );
    expect(icons.some((i) => i.props.name === 'check-circle')).toBe(true);

    const pressable = tree.root.findByType('Pressable' as any);
    const flatStyle = StyleSheet.flatten(pressable.props.style);
    expect(flatStyle.backgroundColor).toBe(tokens.semantic.color.actionContainer);
    expect(flatStyle.borderRadius).toBe(tokens.semantic.radius.md);
    expect(pressable.props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
  });

  it('aplica tokens escuros (darkTokens) e anel de foco no tema dark', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SelectableOptionItem
          index={5}
          label="Ana"
          themeMode="dark"
          selected
          onPress={jest.fn()}
        />
      );
    });

    const pressable = tree.root.findByType('Pressable' as any);
    const selectedStyle = StyleSheet.flatten(pressable.props.style);
    expect(selectedStyle.backgroundColor).toBe(
      darkTokens.semantic.color.actionContainer
    );
    expect(selectedStyle.borderColor).toBe(darkTokens.semantic.color.action);

    act(() => {
      pressable.props.onFocus();
    });
    const focusedStyle = StyleSheet.flatten(pressable.props.style);
    expect(focusedStyle.borderColor).toBe(darkTokens.semantic.color.focus);
    expect(focusedStyle.borderWidth).toBe(darkTokens.semantic.border.focus);
  });

  it('não dispara Animated.spring quando reduceMotion=true (RNF09)', () => {
    const springSpy = jest.spyOn(Animated, 'spring');
    act(() => {
      renderer.create(
        <SelectableOptionItem
          index={1}
          label="Lucas"
          selected
          reduceMotion
          onPress={jest.fn()}
        />
      );
    });
    expect(springSpy).not.toHaveBeenCalled();
    springSpy.mockRestore();
  });
});
