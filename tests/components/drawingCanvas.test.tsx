import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';
import type { DrawingElement } from '@/model/entities/drawingChallenge';
import { DrawingCanvas } from '@/view/components/drawingCanvas';
import { ThemeProvider, darkTokens, tokens } from '@/view/theme';

const SAMPLE_ELEMENTS: DrawingElement[] = [
  {
    id: 'el-1',
    tool: 'freehand',
    points: [
      { x: 10, y: 20 },
      { x: 40, y: 60 },
    ],
    colorId: 'ink',
    widthId: 'thin',
  },
  {
    id: 'el-2',
    tool: 'line',
    start: { x: 5, y: 5 },
    end: { x: 80, y: 80 },
    fillMode: 'stroke',
    colorId: 'purple',
    widthId: 'thick',
  },
  {
    id: 'el-3',
    tool: 'rectangle',
    start: { x: 10, y: 10 },
    end: { x: 90, y: 70 },
    fillMode: 'fill',
    colorId: 'coral',
    widthId: 'thin',
  },
  {
    id: 'el-4',
    tool: 'circle',
    start: { x: 20, y: 20 },
    end: { x: 100, y: 100 },
    fillMode: 'stroke',
    colorId: 'green',
    widthId: 'thick',
  },
  {
    id: 'el-5',
    tool: 'triangle',
    start: { x: 15, y: 15 },
    end: { x: 115, y: 115 },
    fillMode: 'fill',
    colorId: 'purple',
    widthId: 'thin',
  },
];

describe('DrawingCanvas — Formas Geométricas, Preenchimento, Expansão e ReadOnly (UC12)', () => {
  it('deve renderizar folha vazia com marca-d’água e desabilitar Desfazer/Limpar e Preenchimento no modo pincel', async () => {
    const screen = await render(
      <DrawingCanvas
        elements={[]}
        selectedTool="freehand"
        selectedFillMode="stroke"
        selectedColor="ink"
        selectedWidth="thin"
        onElementComplete={jest.fn()}
        onSelectTool={jest.fn()}
        onSelectFillMode={jest.fn()}
        onSelectColor={jest.fn()}
        onSelectWidth={jest.fn()}
        onUndo={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(
      screen.getByText('Arraste o dedo para desenhar · Sem letras nem números')
    ).toBeTruthy();

    expect(screen.getByLabelText('Desfazer').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByLabelText('Limpar').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(
      screen.getByLabelText('Estilo Preenchido').props.accessibilityState
    ).toMatchObject({
      disabled: true,
    });

    const paper = screen.getByTestId('drawing-canvas-paper');
    const paperStyle = Array.isArray(paper.props.style)
      ? Object.assign({}, ...paper.props.style.filter(Boolean))
      : paper.props.style;
    expect(paperStyle.minHeight).toBe(tokens.component.canvas.minHeight);
  });

  it('deve renderizar Path, Line, Rect, Ellipse e Polygon respeitando cores/espessuras/preenchimento e altura expandida', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeProvider mode="dark">
          <DrawingCanvas
            elements={SAMPLE_ELEMENTS}
            selectedTool="rectangle"
            selectedFillMode="fill"
            selectedColor="coral"
            selectedWidth="thick"
            expanded
            onElementComplete={jest.fn()}
            onSelectTool={jest.fn()}
            onSelectFillMode={jest.fn()}
            onSelectColor={jest.fn()}
            onSelectWidth={jest.fn()}
            onUndo={jest.fn()}
            onClear={jest.fn()}
          />
        </ThemeProvider>
      );
    });

    const paper = tree.root.findByProps({ testID: 'drawing-canvas-paper' });
    const paperStyle = Array.isArray(paper.props.style)
      ? Object.assign({}, ...paper.props.style.filter(Boolean))
      : paper.props.style;
    expect(paperStyle.backgroundColor).toBe(darkTokens.component.canvas.paperBg);
    expect(paperStyle.minHeight).toBe(darkTokens.component.canvas.expandedMinHeight);

    expect(tree.root.findAllByType('Path' as any)).toHaveLength(1);
    expect(tree.root.findAllByType('Line' as any)).toHaveLength(1);
    const rects = tree.root.findAllByType('Rect' as any);
    expect(rects).toHaveLength(1);
    expect(rects[0].props.fill).toBe(darkTokens.component.canvas.pen.coral);

    const ellipses = tree.root.findAllByType('Ellipse' as any);
    expect(ellipses).toHaveLength(1);
    expect(ellipses[0].props.fill).toBe('none');

    const polygons = tree.root.findAllByType('Polygon' as any);
    expect(polygons).toHaveLength(1);
    expect(polygons[0].props.fill).toBe(darkTokens.component.canvas.pen.purple);

    act(() => {
      tree.unmount();
    });
  });

  it('deve emitir onElementComplete com forma geométrica (triângulo preenchido) e callbacks de scroll via PanResponder', async () => {
    const onElementComplete = jest.fn();
    const onDrawingStart = jest.fn();
    const onDrawingEnd = jest.fn();
    const onSelectTool = jest.fn();
    const onSelectFillMode = jest.fn();
    const onSelectColor = jest.fn();
    const onSelectWidth = jest.fn();
    const onUndo = jest.fn();
    const onClear = jest.fn();

    const screen = await render(
      <DrawingCanvas
        elements={SAMPLE_ELEMENTS}
        selectedTool="triangle"
        selectedFillMode="fill"
        selectedColor="coral"
        selectedWidth="thick"
        expanded
        onElementComplete={onElementComplete}
        onSelectTool={onSelectTool}
        onSelectFillMode={onSelectFillMode}
        onSelectColor={onSelectColor}
        onSelectWidth={onSelectWidth}
        onUndo={onUndo}
        onClear={onClear}
        onDrawingStart={onDrawingStart}
        onDrawingEnd={onDrawingEnd}
      />
    );

    const paper = screen.getByTestId('drawing-canvas-paper');
    await act(async () => {
      paper.props.onResponderGrant({ nativeEvent: { locationX: 20, locationY: 30 } });
      paper.props.onResponderMove({ nativeEvent: { locationX: 120, locationY: 140 } });
      paper.props.onResponderRelease();
    });

    expect(onDrawingStart).toHaveBeenCalledTimes(1);
    expect(onDrawingEnd).toHaveBeenCalledTimes(1);
    expect(onElementComplete).toHaveBeenCalledWith({
      tool: 'triangle',
      start: { x: 20, y: 30 },
      end: { x: 120, y: 140 },
      fillMode: 'fill',
      colorId: 'coral',
      widthId: 'thick',
    });

    await fireEvent.press(screen.getByLabelText('Forma Retângulo'));
    await fireEvent.press(screen.getByLabelText('Estilo Contorno'));
    await fireEvent.press(screen.getByLabelText('Cor Verde'));
    await fireEvent.press(screen.getByLabelText('Traço Fino'));
    await fireEvent.press(screen.getByLabelText('Desfazer'));
    await fireEvent.press(screen.getByLabelText('Limpar'));

    expect(onSelectTool).toHaveBeenCalledWith('rectangle');
    expect(onSelectFillMode).toHaveBeenCalledWith('stroke');
    expect(onSelectColor).toHaveBeenCalledWith('green');
    expect(onSelectWidth).toHaveBeenCalledWith('thin');
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('deve ocultar barra de ferramentas em readOnly e exibir themeOverlay temporário quando fornecido', async () => {
    const screen = await render(
      <DrawingCanvas
        elements={[]}
        readOnly
        expanded
        themeOverlay={{
          word: 'Arca de Noé',
          category: 'Bíblico',
          secondsLeft: 3,
        }}
      />
    );

    expect(screen.queryByLabelText('Desfazer')).toBeNull();
    expect(screen.queryByLabelText('Forma Triângulo')).toBeNull();
    expect(screen.getByTestId('drawing-canvas-theme-overlay')).toBeTruthy();
    expect(screen.getByText('Arca de Noé')).toBeTruthy();
    expect(screen.getByText('Some em 3s')).toBeTruthy();
  });
});
