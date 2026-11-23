import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { ExpressiveTag, type TagTone } from '@/view/components/expressiveTag';
import { darkTokens, tokens } from '@/view/theme';

describe('ExpressiveTag (design-system/04-componentes/tag.md — v1.1.0)', () => {
  const tones: TagTone[] = [
    'neutral',
    'action',
    'secondary',
    'success',
    'error',
    'highlight',
  ];

  it('renderiza todos os 6 tons no modo claro e escuro com font.tag (14dp) e bordas dos tokens', () => {
    for (const tone of tones) {
      let lightTree!: renderer.ReactTestRenderer;
      act(() => {
        lightTree = renderer.create(<ExpressiveTag label={`Tag ${tone}`} tone={tone} />);
      });

      const container = lightTree.root.findByType('View' as any);
      const flatStyle = StyleSheet.flatten(container.props.style);
      expect(flatStyle.backgroundColor).toBe(tokens.component.tag[tone].bg);
      expect(flatStyle.borderColor).toBe(tokens.component.tag[tone].border);
      expect(flatStyle.borderWidth).toBe(tokens.semantic.border.thin);
      expect(flatStyle.borderRadius).toBe(tokens.component.tag.radius);

      const text = lightTree.root.findByType('Text' as any);
      const textStyle = StyleSheet.flatten(text.props.style);
      expect(textStyle.fontSize).toBe(14);
      expect(textStyle.fontFamily).toBe('PlusJakartaSans_700Bold');
      expect(textStyle.color).toBe(tokens.component.tag[tone].text);

      let darkTree!: renderer.ReactTestRenderer;
      act(() => {
        darkTree = renderer.create(
          <ExpressiveTag label={`Tag ${tone}`} tone={tone} themeMode="dark" />
        );
      });
      const darkStyle = StyleSheet.flatten(
        darkTree.root.findByType('View' as any).props.style
      );
      expect(darkStyle.backgroundColor).toBe(darkTokens.component.tag[tone].bg);
      expect(darkStyle.borderColor).toBe(darkTokens.component.tag[tone].border);
    }
  });

  it('renderiza ícone opcional e não expõe papel interativo de botão', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ExpressiveTag
          label="1 Celular · 2+ equipes"
          icon="cellphone"
          tone="action"
        />
      );
    });

    expect(tree.root.findAllByType('Pressable' as any)).toHaveLength(0);
    const icon = tree.root.findByType('MaterialCommunityIcons' as any);
    expect(icon.props.name).toBe('cellphone');
    expect(icon.props.color).toBe(tokens.component.tag.action.text);
  });
});
