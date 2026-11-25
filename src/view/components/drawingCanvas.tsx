import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import type {
  DrawingPenColorId,
  DrawingPoint,
  DrawingStroke,
  DrawingStrokeWidthId,
} from '@/model/entities/drawingChallenge';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type DrawingCanvasProps = {
  strokes: DrawingStroke[];
  selectedColor: DrawingPenColorId;
  selectedWidth: DrawingStrokeWidthId;
  disabled?: boolean;
  reduceMotion?: boolean;
  themeMode?: ThemeMode;
  onStrokeComplete: (points: DrawingPoint[]) => void;
  onSelectColor: (colorId: DrawingPenColorId) => void;
  onSelectWidth: (widthId: DrawingStrokeWidthId) => void;
  onUndo: () => void;
  onClear: () => void;
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
  strokes,
  selectedColor,
  selectedWidth,
  disabled = false,
  themeMode,
  onStrokeComplete,
  onSelectColor,
  onSelectWidth,
  onUndo,
  onClear,
  onDrawingStart,
  onDrawingEnd,
}: DrawingCanvasProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [activePoints, setActivePoints] = useState<DrawingPoint[]>([]);

  const activePointsRef = useRef<DrawingPoint[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const disabledRef = useRef<boolean>(disabled);
  disabledRef.current = disabled;

  const callbacksRef = useRef({
    onStrokeComplete,
    onDrawingStart,
    onDrawingEnd,
  });
  callbacksRef.current = {
    onStrokeComplete,
    onDrawingStart,
    onDrawingEnd,
  };

  useEffect(() => {
    if (disabled && isDrawingRef.current) {
      isDrawingRef.current = false;
      activePointsRef.current = [];
      setActivePoints([]);
      callbacksRef.current.onDrawingEnd?.();
    }
  }, [disabled]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (disabledRef.current) return;
          const x = Math.round(event.nativeEvent.locationX ?? 0);
          const y = Math.round(event.nativeEvent.locationY ?? 0);
          const initial = [{ x, y }];
          isDrawingRef.current = true;
          activePointsRef.current = initial;
          setActivePoints(initial);
          callbacksRef.current.onDrawingStart?.();
        },
        onPanResponderMove: (event) => {
          if (disabledRef.current || !isDrawingRef.current) return;
          const x = Math.round(event.nativeEvent.locationX ?? 0);
          const y = Math.round(event.nativeEvent.locationY ?? 0);
          const next = [...activePointsRef.current, { x, y }];
          activePointsRef.current = next;
          setActivePoints(next);
        },
        onPanResponderRelease: () => {
          if (!isDrawingRef.current) return;
          const finishedPoints = activePointsRef.current;
          isDrawingRef.current = false;
          activePointsRef.current = [];
          setActivePoints([]);
          callbacksRef.current.onDrawingEnd?.();
          if (!disabledRef.current && finishedPoints.length > 0) {
            callbacksRef.current.onStrokeComplete(finishedPoints);
          }
        },
        onPanResponderTerminate: () => {
          if (!isDrawingRef.current) return;
          isDrawingRef.current = false;
          activePointsRef.current = [];
          setActivePoints([]);
          callbacksRef.current.onDrawingEnd?.();
        },
      }),
    []
  );

  const canvasTokens = activeTokens.component.canvas;
  const hasStrokes = strokes.length > 0;
  const isEmpty = !hasStrokes && activePoints.length === 0;
  const activePath = buildSvgPath(activePoints);

  return (
    <View style={styles.wrapper}>
      <View
        testID="drawing-canvas-paper"
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          isEmpty
            ? 'Área de desenho em branco. Sem letras nem números'
            : `Área de desenho com ${strokes.length} ${
                strokes.length === 1 ? 'traço' : 'traços'
              }`
        }
        accessibilityState={{ disabled }}
        style={[styles.paper, disabled && styles.paperDisabled]}
        {...panResponder.panHandlers}
      >
        <Svg style={styles.svgSurface} width="100%" height="100%">
          {strokes.map((stroke) => (
            <Path
              key={stroke.id}
              d={buildSvgPath(stroke.points)}
              stroke={canvasTokens.pen[stroke.colorId]}
              strokeWidth={canvasTokens.stroke[stroke.widthId]}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {activePath.length > 0 && (
            <Path
              d={activePath}
              stroke={canvasTokens.pen[selectedColor]}
              strokeWidth={canvasTokens.stroke[selectedWidth]}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>

        {isEmpty && (
          <View style={styles.watermark} pointerEvents="none">
            <MaterialCommunityIcons
              name="gesture-swipe"
              size={activeTokens.semantic.icon.lg}
              color={activeTokens.semantic.color.canvasInk}
            />
            <Text allowFontScaling style={styles.watermarkText}>
              Arraste o dedo para desenhar · Sem letras nem números
            </Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
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
                onPress={() => onSelectColor(option.id)}
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
                onPress={() => onSelectWidth(option.id)}
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
              disabled={disabled || !hasStrokes}
              themeMode={themeMode}
              onPress={onUndo}
            />
          </View>
          <View style={styles.actionItem}>
            <ExpressiveButton
              label="Limpar"
              variant="outlined"
              icon="trash-can-outline"
              disabled={disabled || !hasStrokes}
              themeMode={themeMode}
              onPress={onClear}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, space, border } = activeTokens.semantic;
  const { canvas } = activeTokens.component;

  return StyleSheet.create({
    wrapper: {
      gap: space.sm,
    },
    paper: {
      width: '100%',
      minHeight: canvas.minHeight,
      height: canvas.minHeight,
      backgroundColor: canvas.paperBg,
      borderColor: canvas.border,
      borderWidth: border.thin,
      borderRadius: canvas.radius,
      overflow: 'hidden',
      position: 'relative',
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
