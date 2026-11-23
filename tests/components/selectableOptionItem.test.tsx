import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Animated, StyleSheet } from 'react-native';
import { SelectableOptionItem } from '@/view/components/selectableOptionItem';
import { setInputModalityForTest } from '@/view/components/useKeyboardFocus';
import { darkTokens, tokens } from '@/view/theme';

describe('SelectableOptionItem (item-selecionavel.md + DS v1.1.0)', () => {
  beforeEach(() => {
    setInputModalityForTest('keyboard');
  });

  it('renderiza numeração sequencial (1..16) com tokens component.option, alvo >= 56dp e dispara onPress', () => {
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
    expect(flatStyle.backgroundColor).toBe(tokens.component.option.bg.default);
    expect(flatStyle.borderColor).toBe(tokens.component.option.border.default);
    expect(flatStyle.borderRadius).toBe(tokens.component.option.radius);
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

  it('renderiza ícone semântico próprio (hand-back-left-outline) e estado selecionado', () => {
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
    expect(icons.some((i) => i.props.name === 'hand-back-left-outline')).toBe(true);
    expect(icons.some((i) => i.props.name === 'check-circle')).toBe(true);

    const pressable = tree.root.findByType('Pressable' as any);
    const flatStyle = StyleSheet.flatten(pressable.props.style);
    expect(flatStyle.backgroundColor).toBe(tokens.component.option.bg.selected);
    expect(flatStyle.borderColor).toBe(tokens.component.option.border.selected);
    expect(flatStyle.borderRadius).toBe(tokens.component.option.radiusPressed);
    expect(pressable.props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
  });

  it('aplica tokens escuros, suprime foco no clique e exibe anel duplo no foco por teclado', () => {
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
    expect(selectedStyle.backgroundColor).toBe(darkTokens.component.option.bg.selected);
    expect(selectedStyle.borderColor).toBe(darkTokens.component.option.border.selected);

    // Clique não dispara anel
    act(() => {
      pressable.props.onPressIn();
      pressable.props.onFocus();
    });
    expect(StyleSheet.flatten(pressable.props.style).outlineColor).toBeUndefined();

    act(() => {
      pressable.props.onPressOut();
      pressable.props.onBlur();
    });

    // Teclado dispara anel duplo
    act(() => {
      pressable.props.onFocus();
    });
    const focusedStyle = StyleSheet.flatten(pressable.props.style);
    expect(focusedStyle.outlineColor).toBe(darkTokens.component.option.border.focus);
    expect(focusedStyle.outlineWidth).toBe(darkTokens.semantic.border.focus);
    expect(focusedStyle.borderColor).toBe(darkTokens.component.option.border.selected);
  });

  it('renderiza borda e fundo de erro via component.option.border.error', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SelectableOptionItem
          index={1}
          label="Opção inválida"
          error
          onPress={jest.fn()}
        />
      );
    });

    const pressable = tree.root.findByType('Pressable' as any);
    const flatStyle = StyleSheet.flatten(pressable.props.style);
    expect(flatStyle.backgroundColor).toBe(tokens.component.option.bg.error);
    expect(flatStyle.borderColor).toBe(tokens.component.option.border.error);
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
