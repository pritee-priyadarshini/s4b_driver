import React, { useState, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalize } from '../utils/responsive';

type InputFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  /** Matches Saveful-for-Business auth form field styling. */
  formStyle?: boolean;
  inputRef?: Ref<TextInput>;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: TextInputProps['autoCorrect'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
};

export function InputField({
  label,
  placeholder,
  value = '',
  onChangeText = () => {},
  editable,
  multiline,
  secureTextEntry,
  isPassword,
  formStyle = false,
  inputRef,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword ? true : Boolean(secureTextEntry));

  return (
    <View style={styles.container}>
      <AppText
        variant="label"
        color={formStyle ? palette.black : palette.textMuted}
        style={formStyle ? styles.labelForm : undefined}
      >
        {label}
      </AppText>

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          multiline={multiline}
          editable={editable}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={palette.stone}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            formStyle && styles.inputForm,
            multiline && styles.multiline,
            isFocused && styles.inputFocused,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />

        {isPassword && (
          <Pressable
            style={styles.eye}
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={palette.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },

  labelForm: {
    textTransform: 'none',
    fontSize: normalize(14),
    lineHeight: normalize(18),
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingRight: 45,
    color: palette.text,
    fontSize: normalize(16),
    fontFamily: 'Saveful-Regular',
  },

  inputForm: {
    minHeight: 48,
    borderRadius: 10,
    borderColor: '#D9D9D9',
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: normalize(15),
    lineHeight: normalize(20),
  },

  eye: {
    position: 'absolute',
    right: 15,
  },

  inputFocused: {
    borderColor: palette.primary,
  },

  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
