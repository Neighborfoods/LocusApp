import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

const defaultInputStyle = StyleSheet.create({
  base: { textTransform: 'none' as const },
});

/**
 * App-wide TextInput that enforces no ALL CAPS:
 * - textTransform: 'none' by default
 * - Passes through all other props. Use autoCapitalize when needed (e.g. "none" for email).
 * - Forwards ref for focus() etc.
 */
export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { style, autoCapitalize = 'sentences', ...props },
  ref
) {
  return (
    <TextInput
      ref={ref}
      style={[defaultInputStyle.base, style]}
      autoCapitalize={autoCapitalize}
      {...props}
    />
  );
});

export default AppTextInput;
