import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import type { DrawingStroke } from '@/model/entities/drawingChallenge';
import { DrawingCanvas } from '@/view/components/drawingCanvas';
import { darkTokens, ThemeProvider, tokens } from '@/view/theme';

const SAMPLE_STROKES: DrawingStroke[] = [
  {
    id: 'stroke-1',
    points: [
      { x: 10, y: 20 },
      { x: 40, y: 55 },
    ],
    colorId: 'purple',
    widthId: 'thick',
  },
];

describe('DrawingCanvas — Testes de Componente RNTL/Acessibilidade (UC12, RF41)', () => {
  it('deve renderizar folha limpa com marca-d-água e botões Desfazer/Limpar desabilitados quando vazio', () => {
    const onSelectColor = jest.fn();
    const onSelectWidth = jest.fn();
    const onUndo = jest.fn();
    const onClear = jest.fn();
    const onStrokeComplete = jest.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DrawingCanvas
          strokes={[]}
          selectedColor="ink"
          selectedWidth="thin"
          onStrokeComplete={onStrokeComplete}
          onSelectColor={onSelectColor}
          onSelectWidth={onSelectWidth}
          onUndo={onUndo}
          onClear={onClear}
        />
      );
    });

    const paper = tree.root.findByProps({ testID: 'drawing-canvas-paper' });
    expect(paper.props.accessibilityLabel).toContain('Área de desenho em branco');
    expect(StyleSheet.flatten(paper.props.style).backgroundColor).toBe(
      tokens.component.canvas.paperBg
    );

    const undoBtn = tree.root.findByProps({ accessibilityLabel: 'Desfazer' });
    const clearBtn = tree.root.findByProps({ accessibilityLabel: 'Limpar' });
    expect(undoBtn.props.accessibilityState).toMatchObject({ disabled: true });
    expect(clearBtn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('deve permitir selecionar as 4 cores e 2 espessuras com alvos >= 48 dp, acessibilidade e shape morphing', () => {
    const onSelectColor = jest.fn();
    const onSelectWidth = jest.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeProvider mode="dark">
          <DrawingCanvas
            strokes={SAMPLE_STROKES}
            selectedColor="coral"
            selectedWidth="thick"
            onStrokeComplete={jest.fn()}
            onSelectColor={onSelectColor}
            onSelectWidth={onSelectWidth}
            onUndo={jest.fn()}
            onClear={jest.fn()}
          />
        </ThemeProvider>
      );
    });

    const coralBtn = tree.root.findByProps({ accessibilityLabel: 'Cor Coral' });
    const greenBtn = tree.root.findByProps({ accessibilityLabel: 'Cor Verde' });
    const thinBtn = tree.root.findByProps({ accessibilityLabel: 'Traço Fino' });
    const thickBtn = tree.root.findByProps({ accessibilityLabel: 'Traço Grosso' });

    expect(coralBtn.props.accessibilityRole).toBe('button');
    expect(coralBtn.props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
    expect(StyleSheet.flatten(coralBtn.props.style).minHeight).toBe(48);
    expect(StyleSheet.flatten(coralBtn.props.style).borderRadius).toBe(
      darkTokens.component.canvas.tool.radiusSelected
    );
    expect(StyleSheet.flatten(greenBtn.props.style).borderRadius).toBe(
      darkTokens.component.canvas.tool.radius
    );

    // Ícone check contrastante no modo escuro usa canvas.pen.onPen (#FDF8FF)
    const checkIcon = coralBtn.findByProps({ name: 'check' });
    expect(checkIcon.props.color).toBe(darkTokens.component.canvas.pen.onPen);

    expect(thickBtn.props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
    expect(thinBtn.props.accessibilityState).toEqual({
      disabled: false,
      selected: false,
    });

    act(() => {
      greenBtn.props.onPress();
      thinBtn.props.onPress();
    });
    expect(onSelectColor).toHaveBeenCalledWith('green');
    expect(onSelectWidth).toHaveBeenCalledWith('thin');
  });

  it('deve capturar traços (incluindo ponto único) via PanResponder e emitir onDrawingStart/onDrawingEnd', () => {
    const onStrokeComplete = jest.fn();
    const onDrawingStart = jest.fn();
    const onDrawingEnd = jest.fn();
    const onUndo = jest.fn();
    const onClear = jest.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DrawingCanvas
          strokes={SAMPLE_STROKES}
          selectedColor="ink"
          selectedWidth="thin"
          onStrokeComplete={onStrokeComplete}
          onSelectColor={jest.fn()}
          onSelectWidth={jest.fn()}
          onUndo={onUndo}
          onClear={onClear}
          onDrawingStart={onDrawingStart}
          onDrawingEnd={onDrawingEnd}
        />
      );
    });

    const paper = tree.root.findByProps({ testID: 'drawing-canvas-paper' });

    // Traço contínuo
    act(() => {
      paper.props.onResponderGrant({ nativeEvent: { locationX: 12, locationY: 18 } });
      paper.props.onResponderMove({ nativeEvent: { locationX: 30, locationY: 42 } });
      paper.props.onResponderRelease({});
    });

    expect(onDrawingStart).toHaveBeenCalledTimes(1);
    expect(onDrawingEnd).toHaveBeenCalledTimes(1);
    expect(onStrokeComplete).toHaveBeenCalledWith([
      { x: 12, y: 18 },
      { x: 30, y: 42 },
    ]);

    // Toque curto (ponto único)
    act(() => {
      paper.props.onResponderGrant({ nativeEvent: { locationX: 50, locationY: 60 } });
      paper.props.onResponderRelease({});
    });
    expect(onStrokeComplete).toHaveBeenLastCalledWith([{ x: 50, y: 60 }]);

    // Desfazer e Limpar habilitados quando há traços
    const undoBtn = tree.root.findByProps({ accessibilityLabel: 'Desfazer' });
    const clearBtn = tree.root.findByProps({ accessibilityLabel: 'Limpar' });
    act(() => {
      undoBtn.props.onPress();
      clearBtn.props.onPress();
    });
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('deve bloquear gestos e ferramentas quando disabled=true e encerrar traço ativo com segurança', () => {
    const onStrokeComplete = jest.fn();
    const onDrawingEnd = jest.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <DrawingCanvas
          strokes={SAMPLE_STROKES}
          selectedColor="ink"
          selectedWidth="thin"
          disabled={false}
          onStrokeComplete={onStrokeComplete}
          onSelectColor={jest.fn()}
          onSelectWidth={jest.fn()}
          onUndo={jest.fn()}
          onClear={jest.fn()}
          onDrawingEnd={onDrawingEnd}
        />
      );
    });

    const paper = tree.root.findByProps({ testID: 'drawing-canvas-paper' });
    act(() => {
      paper.props.onResponderGrant({ nativeEvent: { locationX: 20, locationY: 20 } });
    });

    // Bloqueio no meio do traço descarta sem emitir onStrokeComplete e restaura scroll
    act(() => {
      tree.update(
        <DrawingCanvas
          strokes={SAMPLE_STROKES}
          selectedColor="ink"
          selectedWidth="thin"
          disabled
          onStrokeComplete={onStrokeComplete}
          onSelectColor={jest.fn()}
          onSelectWidth={jest.fn()}
          onUndo={jest.fn()}
          onClear={jest.fn()}
          onDrawingEnd={onDrawingEnd}
        />
      );
    });

    expect(onDrawingEnd).toHaveBeenCalledTimes(1);
    expect(onStrokeComplete).not.toHaveBeenCalled();

    const blockedPaper = tree.root.findByProps({ testID: 'drawing-canvas-paper' });
    expect(blockedPaper.props.onStartShouldSetResponder()).toBe(false);
    expect(blockedPaper.props.accessibilityState).toEqual({ disabled: true });
  });
});
