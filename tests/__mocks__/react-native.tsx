import React from 'react';

export const View = (props: any) => React.createElement('View', props, props.children);
export const Text = (props: any) => React.createElement('Text', props, props.children);
export const TextInput = (props: any) => React.createElement('TextInput', props, props.children);
export const Pressable = (props: any) => React.createElement('Pressable', props, props.children);

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
