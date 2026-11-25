import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import type {
  DrawingElement,
  DrawingElementDraft,
  DrawingFillMode,
  DrawingPenColorId,
  DrawingPoint,
  DrawingShapeToolId,
  DrawingStrokeWidthId,
  DrawingToolId,
} from '@/model/entities/drawingChallenge';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type DrawingThemeOverlay = {
  word: string;
  category: string;
  secondsLeft: number;
};

export type DrawingCanvasProps = {
  elements: DrawingElement[];
  selectedTool?: DrawingToolId;
  selectedFillMode?: DrawingFillMode;
  selectedColor?: DrawingPenColorId;
  selectedWidth?: DrawingStrokeWidthId;
  expanded?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  reduceMotion?: boolean;
  themeMode?: ThemeMode;
  themeOverlay?: DrawingThemeOverlay | null;
  onElementComplete?: (draft: DrawingElementDraft) => void;
  onSelectTool?: (tool: DrawingToolId) => void;
  onSelectFillMode?: (fillMode: DrawingFillMode) => void;
  onSelectColor?: (colorId: DrawingPenColorId) => void;
  onSelectWidth?: (widthId: DrawingStrokeWidthId) => void;
  onUndo?: () => void;
  onClear?: () => void;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
};

type PenColorOption = {
  id: DrawingPenColorId;
  label: string;
};

type StrokeWidthOption = {
  id: DrawingStrokeWidthId;
  label: string;
};

type ToolIconName =
  | 'draw'
  | 'vector-line'
  | 'rectangle-outline'
  | 'circle-outline'
  | 'triangle-outline';

type ToolOption = {
  id: DrawingToolId;
  label: string;
  icon: ToolIconName;
};

type FillModeIconName = 'shape-outline' | 'shape';

type FillModeOption = {
  id: DrawingFillMode;
  label: string;
  icon: FillModeIconName;
};

const TOOL_OPTIONS: readonly ToolOption[] = [
  { id: 'freehand', label: 'Pincel livre', icon: 'draw' },
  { id: 'line', label: 'Forma Linha', icon: 'vector-line' },
  { id: 'rectangle', label: 'Forma Retângulo', icon: 'rectangle-outline' },
  { id: 'circle', label: 'Forma Círculo', icon: 'circle-outline' },
  { id: 'triangle', label: 'Forma Triângulo', icon: 'triangle-outline' },
];

const FILL_MODE_OPTIONS: readonly FillModeOption[] = [
  { id: 'stroke', label: 'Estilo Contorno', icon: 'shape-outline' },
  { id: 'fill', label: 'Estilo Preenchido', icon: 'shape' },
];

const PEN_COLOR_OPTIONS: readonly PenColorOption[] = [
  { id: 'ink', label: 'Cor Grafite' },
  { id: 'purple', label: 'Cor Roxo' },
  { id: 'coral', label: 'Cor Coral' },
  { id: 'green', label: 'Cor Verde' },
];

const STROKE_WIDTH_OPTIONS: readonly StrokeWidthOption[] = [
  { id: 'thin', label: 'Traço Fino' },
  { id: 'thick', label: 'Traço Grosso' },
];

const isFillableTool = (tool: DrawingToolId): boolean =>
  tool === 'rectangle' || tool === 'circle' || tool === 'triangle';

const buildSvgPath = (points: DrawingPoint[]): string => {
  if (points.length === 0) return '';
  const first = points[0];
  if (points.length === 1) {
    return `M ${first.x} ${first.y} L ${first.x} ${first.y}`;
  }
  const rest = points
    .slice(1)
    .map((point) => `L ${point.x} ${point.y}`)
    .join(' ');
  return `M ${first.x} ${first.y} ${rest}`;
};

const buildTrianglePoints = (
  start: DrawingPoint,
  end: DrawingPoint
): string => {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const topX = Math.round((minX + maxX) / 2);
  return `${topX},${minY} ${maxX},${maxY} ${minX},${maxY}`;
};

const renderSvgElement = (
  element: DrawingElement | (DrawingElementDraft & { id: string }),
  activeTokens: AppTokens
): React.ReactNode => {
  const canvasTokens = activeTokens.component.canvas;
  const strokeColor = canvasTokens.pen[element.colorId];
  const strokeWidth = canvasTokens.stroke[element.widthId];

  if (element.tool === 'freehand') {
    const path = buildSvgPath(element.points);
    if (!path) return null;
    return (
      <Path
        key={element.id}
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  }

  const { start, end, fillMode } = element;
  if (element.tool === 'line') {
    return (
      <Line
        key={element.id}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const fillColor = fillMode === 'fill' ? strokeColor : 'none';

  if (element.tool === 'rectangle') {
    return (
      <Rect
        key={element.id}
        x={minX}
        y={minY}
        width={width}
        height={height}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={fillColor}
      />
    );
  }

  if (element.tool === 'circle') {
    const rx = width / 2;
    const ry = height / 2;
    return (
      <Ellipse
        key={element.id}
        cx={minX + rx}
        cy={minY + ry}
        rx={rx}
        ry={ry}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fillColor}
      />
    );
  }

  return (
    <Polygon
      key={element.id}
      points={buildTrianglePoints(start, end)}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill={fillColor}
    />
  );
};

type IconToolButtonProps = {
  label: string;
  icon: ToolIconName | FillModeIconName;
  selected: boolean;
  disabled: boolean;
  activeTokens: AppTokens;
  onPress: () => void;
};

const IconToolButton = ({
  label,
  icon,
  selected,
  disabled,
  activeTokens,
  onPress,
}: IconToolButtonProps) => {
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );
  const canvasTokens = activeTokens.component.canvas;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      style={[
        {
          minWidth: canvasTokens.tool.size,
          minHeight: canvasTokens.tool.size,
          width: canvasTokens.tool.size,
          height: canvasTokens.tool.size,
          borderRadius: selected
            ? canvasTokens.tool.radiusSelected
            : canvasTokens.tool.radius,
          borderWidth: activeTokens.semantic.border.thin,
          borderColor: selected
            ? canvasTokens.tool.border.selected
            : canvasTokens.tool.border.default,
          backgroundColor: disabled
            ? activeTokens.semantic.color.disabledBg
            : selected
              ? activeTokens.semantic.color.actionContainer
              : activeTokens.semantic.color.surfaceContainer,
          alignItems: 'center',
          justifyContent: 'center',
        },
        focusRingStyle,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={activeTokens.semantic.icon.md}
        color={
          disabled
            ? activeTokens.semantic.color.disabledText
            : selected
              ? activeTokens.semantic.color.onActionContainer
              : activeTokens.semantic.color.onSurface
        }
      />
    </Pressable>
  );
};

type ColorSwatchButtonProps = {
  option: PenColorOption;
  penColor: string;
  selected: boolean;
  disabled: boolean;
  activeTokens: AppTokens;
  onPress: () => void;
};

const ColorSwatchButton = ({
  option,
  penColor,
  selected,
  disabled,
  activeTokens,
  onPress,
}: ColorSwatchButtonProps) => {
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );
  const canvasTokens = activeTokens.component.canvas;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ disabled, selected }}
      style={[
        {
          minWidth: canvasTokens.tool.size,
          minHeight: canvasTokens.tool.size,
          width: canvasTokens.tool.size,
          height: canvasTokens.tool.size,
          borderRadius: selected
            ? canvasTokens.tool.radiusSelected
            : canvasTokens.tool.radius,
          borderWidth: activeTokens.semantic.border.thin,
          borderColor: selected
            ? canvasTokens.tool.border.selected
            : canvasTokens.tool.border.default,
          backgroundColor: disabled
            ? activeTokens.semantic.color.disabledBg
            : penColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        focusRingStyle,
      ]}
    >
      {selected && (
        <MaterialCommunityIcons
          name="check"
          size={activeTokens.semantic.icon.md}
          color={
            disabled
              ? activeTokens.semantic.color.disabledText
              : canvasTokens.pen.onPen
          }
        />
      )}
    </Pressable>
  );
};

type WidthToggleButtonProps = {
  option: StrokeWidthOption;
  strokeThickness: number;
  selected: boolean;
  disabled: boolean;
  activeTokens: AppTokens;
  onPress: () => void;
};

const WidthToggleButton = ({
  option,
  strokeThickness,
  selected,
  disabled,
  activeTokens,
  onPress,
}: WidthToggleButtonProps) => {
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );
  const canvasTokens = activeTokens.component.canvas;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ disabled, selected }}
      style={[
        {
          minWidth: canvasTokens.tool.size,
          minHeight: canvasTokens.tool.size,
          paddingHorizontal: activeTokens.semantic.space.sm,
          borderRadius: selected
            ? canvasTokens.tool.radiusSelected
            : canvasTokens.tool.radius,
          borderWidth: activeTokens.semantic.border.thin,
          borderColor: selected
            ? canvasTokens.tool.border.selected
            : canvasTokens.tool.border.default,
          backgroundColor: disabled
            ? activeTokens.semantic.color.disabledBg
            : selected
              ? activeTokens.semantic.color.actionContainer
              : activeTokens.semantic.color.surfaceContainer,
          alignItems: 'center',
          justifyContent: 'center',
        },
        focusRingStyle,
      ]}
    >
      <View
        style={{
          width: activeTokens.semantic.space.lg,
          height: strokeThickness,
          borderRadius: activeTokens.semantic.radius.full,
          backgroundColor: disabled
            ? activeTokens.semantic.color.disabledText
            : selected
              ? activeTokens.semantic.color.onActionContainer
              : activeTokens.semantic.color.onSurface,
        }}
      />
    </Pressable>
  );
};

export const DrawingCanvas = ({
  elements,
  selectedTool = 'freehand',
  selectedFillMode = 'stroke',
  selectedColor = 'ink',
  selectedWidth = 'thin',
  expanded = false,
  readOnly = false,
  disabled = false,
  themeMode,
  themeOverlay = null,
  onElementComplete,
  onSelectTool,
  onSelectFillMode,
  onSelectColor,
  onSelectWidth,
  onUndo,
  onClear,
  onDrawingStart,
  onDrawingEnd,
}: DrawingCanvasProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const [activeDraft, setActiveDraft] = useState<DrawingElementDraft | null>(
    null
  );

  const activeDraftRef = useRef<DrawingElementDraft | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const interactiveBlocked = readOnly || disabled;
  const blockedRef = useRef<boolean>(interactiveBlocked);
  blockedRef.current = interactiveBlocked;

  const toolConfigRef = useRef({
    selectedTool,
    selectedFillMode,
    selectedColor,
    selectedWidth,
  });
  toolConfigRef.current = {
    selectedTool,
    selectedFillMode,
    selectedColor,
    selectedWidth,
  };

  const callbacksRef = useRef({
    onElementComplete,
    onDrawingStart,
    onDrawingEnd,
  });
  callbacksRef.current = {
    onElementComplete,
    onDrawingStart,
    onDrawingEnd,
  };

  useEffect(() => {
    if (interactiveBlocked && isDrawingRef.current) {
      isDrawingRef.current = false;
      activeDraftRef.current = null;
      setActiveDraft(null);
      callbacksRef.current.onDrawingEnd?.();
    }
  }, [interactiveBlocked]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !blockedRef.current,
        onMoveShouldSetPanResponder: () => !blockedRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (blockedRef.current) return;
          const x = Math.round(event.nativeEvent.locationX ?? 0);
          const y = Math.round(event.nativeEvent.locationY ?? 0);
          const {
            selectedTool: tool,
            selectedFillMode: fillMode,
            selectedColor: colorId,
            selectedWidth: widthId,
          } = toolConfigRef.current;

          const startPoint: DrawingPoint = { x, y };
          const draft: DrawingElementDraft =
            tool === 'freehand'
              ? {
                  tool: 'freehand',
                  points: [startPoint],
                  colorId,
                  widthId,
                }
              : {
                  tool: tool as DrawingShapeToolId,
                  start: startPoint,
                  end: startPoint,
                  fillMode: tool === 'line' ? 'stroke' : fillMode,
                  colorId,
                  widthId,
                };

          isDrawingRef.current = true;
          activeDraftRef.current = draft;
          setActiveDraft(draft);
          callbacksRef.current.onDrawingStart?.();
        },
        onPanResponderMove: (event) => {
          if (blockedRef.current || !isDrawingRef.current) return;
          const current = activeDraftRef.current;
          if (!current) return;
          const x = Math.round(event.nativeEvent.locationX ?? 0);
          const y = Math.round(event.nativeEvent.locationY ?? 0);

          const next: DrawingElementDraft =
            current.tool === 'freehand'
              ? {
                  ...current,
                  points: [...current.points, { x, y }],
                }
              : {
                  ...current,
                  end: { x, y },
                };

          activeDraftRef.current = next;
          setActiveDraft(next);
        },
        onPanResponderRelease: () => {
          if (!isDrawingRef.current) return;
          const finished = activeDraftRef.current;
          isDrawingRef.current = false;
          activeDraftRef.current = null;
          setActiveDraft(null);
          callbacksRef.current.onDrawingEnd?.();

          if (blockedRef.current || !finished) return;

          if (finished.tool === 'freehand') {
            if (finished.points.length > 0) {
              callbacksRef.current.onElementComplete?.(finished);
            }
            return;
          }

          const dx = Math.abs(finished.end.x - finished.start.x);
          const dy = Math.abs(finished.end.y - finished.start.y);
          if (dx >= 2 || dy >= 2) {
            callbacksRef.current.onElementComplete?.(finished);
          }
        },
        onPanResponderTerminate: () => {
          if (!isDrawingRef.current) return;
          isDrawingRef.current = false;
          activeDraftRef.current = null;
          setActiveDraft(null);
          callbacksRef.current.onDrawingEnd?.();
        },
      }),
    []
  );

  const canvasTokens = activeTokens.component.canvas;
  const hasElements = elements.length > 0;
  const isEmpty = !hasElements && activeDraft === null;
  const fillModeEnabled = !disabled && isFillableTool(selectedTool);

  return (
    <View style={styles.wrapper}>
      <View style={styles.paperStage}>
        <View
          testID="drawing-canvas-paper"
          accessible
          accessibilityRole="image"
          accessibilityLabel={
            isEmpty
              ? readOnly
                ? 'Área de desenho em branco aguardando o desenhista'
                : 'Área de desenho em branco. Sem letras nem números'
              : `Área de desenho com ${elements.length} ${
                  elements.length === 1 ? 'elemento' : 'elementos'
                }`
          }
          accessibilityState={{ disabled: disabled && !readOnly }}
          style={[
            styles.paper,
            expanded ? styles.paperExpanded : styles.paperCompact,
            disabled && !readOnly && styles.paperDisabled,
          ]}
          {...(interactiveBlocked ? {} : panResponder.panHandlers)}
        >
          <Svg style={styles.svgSurface} width="100%" height="100%">
            {elements.map((element) => renderSvgElement(element, activeTokens))}
            {activeDraft !== null &&
              renderSvgElement(
                { ...activeDraft, id: 'active-preview' },
                activeTokens
              )}
          </Svg>

          {isEmpty && themeOverlay === null && (
            <View style={styles.watermark} pointerEvents="none">
              <MaterialCommunityIcons
                name={readOnly ? 'eye-outline' : 'gesture-swipe'}
                size={activeTokens.semantic.icon.lg}
                color={activeTokens.semantic.color.canvasInk}
              />
              <Text allowFontScaling style={styles.watermarkText}>
                {readOnly
                  ? 'Aguardando o desenhista começar...'
                  : 'Arraste o dedo para desenhar · Sem letras nem números'}
              </Text>
            </View>
          )}
        </View>

        {themeOverlay !== null && (
          <View
            testID="drawing-canvas-theme-overlay"
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            style={styles.themeOverlay}
          >
            <View style={styles.themeOverlayHeader}>
              <Text allowFontScaling style={styles.themeOverlayCategory}>
                {themeOverlay.category}
              </Text>
              <Text allowFontScaling style={styles.themeOverlayCountdown}>
                {`Some em ${themeOverlay.secondsLeft}s`}
              </Text>
            </View>
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.themeOverlayWord}
            >
              {themeOverlay.word}
            </Text>
            <View style={styles.themeOverlayRule}>
              <MaterialCommunityIcons
                name="pencil-off-outline"
                size={activeTokens.semantic.icon.sm}
                color={activeTokens.component.banner.warning.text}
              />
              <Text allowFontScaling style={styles.themeOverlayRuleText}>
                Sem letras nem números
              </Text>
            </View>
          </View>
        )}
      </View>

      {!readOnly && (
        <View style={styles.toolbar}>
          <View style={styles.toolsRow}>
            <View style={styles.toolGroup}>
              {TOOL_OPTIONS.map((option) => (
                <IconToolButton
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={selectedTool === option.id}
                  disabled={disabled}
                  activeTokens={activeTokens}
                  onPress={() => onSelectTool?.(option.id)}
                />
              ))}
            </View>

            <View style={styles.toolGroup}>
              {FILL_MODE_OPTIONS.map((option) => (
                <IconToolButton
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={fillModeEnabled && selectedFillMode === option.id}
                  disabled={!fillModeEnabled}
                  activeTokens={activeTokens}
                  onPress={() => onSelectFillMode?.(option.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.toolsRow}>
            <View style={styles.toolGroup}>
              {PEN_COLOR_OPTIONS.map((option) => (
                <ColorSwatchButton
                  key={option.id}
                  option={option}
                  penColor={canvasTokens.pen[option.id]}
                  selected={selectedColor === option.id}
                  disabled={disabled}
                  activeTokens={activeTokens}
                  onPress={() => onSelectColor?.(option.id)}
                />
              ))}
            </View>

            <View style={styles.toolGroup}>
              {STROKE_WIDTH_OPTIONS.map((option) => (
                <WidthToggleButton
                  key={option.id}
                  option={option}
                  strokeThickness={canvasTokens.stroke[option.id]}
                  selected={selectedWidth === option.id}
                  disabled={disabled}
                  activeTokens={activeTokens}
                  onPress={() => onSelectWidth?.(option.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionItem}>
              <ExpressiveButton
                label="Desfazer"
                variant="tonal"
                icon="undo-variant"
                disabled={disabled || !hasElements}
                themeMode={themeMode}
                onPress={() => onUndo?.()}
              />
            </View>
            <View style={styles.actionItem}>
              <ExpressiveButton
                label="Limpar"
                variant="outlined"
                icon="trash-can-outline"
                disabled={disabled || !hasElements}
                themeMode={themeMode}
                onPress={() => onClear?.()}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, space, border, elevation } = activeTokens.semantic;
  const { canvas, card, banner } = activeTokens.component;

  return StyleSheet.create({
    wrapper: {
      gap: space.sm,
    },
    paperStage: {
      position: 'relative',
      width: '100%',
    },
    paper: {
      width: '100%',
      backgroundColor: canvas.paperBg,
      borderColor: canvas.border,
      borderWidth: border.thin,
      borderRadius: canvas.radius,
      overflow: 'hidden',
      position: 'relative',
    },
    paperCompact: {
      minHeight: canvas.minHeight,
      height: canvas.minHeight,
    },
    paperExpanded: {
      minHeight: canvas.expandedMinHeight,
      height: canvas.expandedMinHeight,
    },
    paperDisabled: {
      opacity: 0.7,
    },
    svgSurface: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    themeOverlay: {
      position: 'absolute',
      top: space.sm,
      right: space.sm,
      left: space.sm,
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: card.radius,
      padding: space.md,
      elevation: elevation.card,
      alignItems: 'center',
      gap: space.xs,
    },
    themeOverlayHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
    },
    themeOverlayCategory: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: color.secondary,
    },
    themeOverlayCountdown: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: color.action,
    },
    themeOverlayWord: {
      fontFamily: font.display.family,
      fontSize: font.display.size,
      fontWeight: font.display.weight,
      lineHeight: font.display.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    themeOverlayRule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: banner.warning.bg,
      borderColor: banner.warning.border,
      borderWidth: border.thin,
      borderRadius: banner.radius,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
    },
    themeOverlayRuleText: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: banner.warning.text,
    },
    watermark: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      gap: space.xs,
    },
    watermarkText: {
      fontFamily: font.body.family,
      fontSize: font.body.size,
      fontWeight: font.body.weight,
      lineHeight: font.body.lineHeight,
      color: color.canvasInk,
      textAlign: 'center',
    },
    toolbar: {
      gap: space.sm,
    },
    toolsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
    },
    toolGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: space.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: space.sm,
    },
    actionItem: {
      flex: 1,
    },
  });
};
