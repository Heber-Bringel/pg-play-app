import React from 'react';

export const View = (props: any) => React.createElement('View', props, props.children);
export const ActivityIndicator = (props: any) =>
  React.createElement('ActivityIndicator', props, props.children);
export const Modal = (props: any) =>
  props.visible ? React.createElement('Modal', props, props.children) : null;
export const KeyboardAvoidingView = (props: any) => React.createElement('KeyboardAvoidingView', props, props.children);
export const ScrollView = (props: any) => React.createElement('ScrollView', props, props.children);
export const Text = (props: any) => React.createElement('Text', props, props.children);
export const TextInput = (props: any) => React.createElement('TextInput', props, props.children);
export const Pressable = (props: any) => React.createElement('Pressable', props, props.children);

export const Platform = {
  OS: 'ios',
  select: <T,>(options: { ios?: T; android?: T; default?: T }): T | undefined =>
    options.ios ?? options.default,
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: jest.fn(async () => false),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

export const Animated = {
  View: (props: any) => React.createElement('View', props, props.children),
  Text: (props: any) => React.createElement('Text', props, props.children),
  Value: class {
    val: number;
    constructor(val: number) {
      this.val = val;
    }
    setValue(v: number) {
      this.val = v;
    }
    interpolate(config: { inputRange: number[]; outputRange: Array<number | string> }) {
      const idx = this.val >= (config.inputRange[1] ?? 1) ? 1 : 0;
      return config.outputRange[idx] ?? config.outputRange[0];
    }
  },
  spring: (_val: any, _config: any) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
  timing: (_val: any, _config: any) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
  sequence: (_animations: any[]) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
};

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: (style: any): any => {
    if (!style) return {};
    if (Array.isArray(style)) {
      return style.reduce((acc, item) => ({ ...acc, ...StyleSheet.flatten(item) }), {});
    }
    return style;
  },
};

export const useWindowDimensions = () => ({
  width: 360,
  height: 640,
  scale: 1,
  fontScale: 1,
});

export const useColorScheme = jest.fn((): 'light' | 'dark' | null | undefined => 'light');

export const PanResponder = {
  create: (config: Record<string, any>) => ({
    panHandlers: {
      onStartShouldSetResponder: config.onStartShouldSetPanResponder,
      onMoveShouldSetResponder: config.onMoveShouldSetPanResponder,
      onResponderGrant: (event: any) =>
        config.onPanResponderGrant?.(event, { dx: 0, dy: 0 }),
      onResponderMove: (event: any) =>
        config.onPanResponderMove?.(event, { dx: 0, dy: 0 }),
      onResponderRelease: (event: any) =>
        config.onPanResponderRelease?.(event, { dx: 0, dy: 0 }),
      onResponderTerminate: (event: any) =>
        config.onPanResponderTerminate?.(event, { dx: 0, dy: 0 }),
      onResponderTerminationRequest: (event: any) =>
        config.onPanResponderTerminationRequest?.(event, { dx: 0, dy: 0 }) ?? true,
    },
  }),
};
