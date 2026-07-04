import React, { useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/authService';
import {
  getForgotPasswordErrorMessage,
  getForgotPasswordSuccessMessage,
  getUserFriendlyErrorMessage,
} from '../utils/apiError';
import { showAppSuccess, showSuccessAlert } from '../utils/appAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { driver } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const trimmedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (driver?.email) {
      setEmail(driver.email);
    }
  }, [driver?.email]);

  const validate = () => {
    const enteredOtp = otp.join('');

    if (!trimmedEmail) {
      setFormError('Please enter your email address.');
      return false;
    }

    if (!codeSent) {
      setFormError('Please send a reset code to your email first.');
      return false;
    }

    if (enteredOtp.length !== 6) {
      setFormError('Please enter the 6-digit verification code.');
      return false;
    }

    if (newPassword.length < 8) {
      setFormError('Password should be at least 8 characters.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleOtpChange = (text: string, index: number) => {
    const next = [...otp];
    next[index] = text.replace(/[^0-9]/g, '');
    setOtp(next);
    setFormError('');

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (text: string, index: number) => {
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (loading || resending) return;

    if (!trimmedEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    try {
      setFormError('');
      setLoading(true);

      const res = await authService.forgotPassword(trimmedEmail);
      const responseData = res.data as { message?: string };
      setCodeSent(true);
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      showSuccessAlert(
        getForgotPasswordSuccessMessage(responseData?.message),
        'Code sent',
      );
    } catch (error) {
      setFormError(getForgotPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || loading) return;

    if (!trimmedEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    try {
      setFormError('');
      setResending(true);

      const res = await authService.forgotPassword(trimmedEmail);
      const responseData = res.data as { message?: string };
      setCodeSent(true);
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      showSuccessAlert(
        getForgotPasswordSuccessMessage(responseData?.message),
        'Code resent',
      );
    } catch (error) {
      setFormError(getForgotPasswordErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(trimmedEmail, otp.join(''), newPassword);

      showAppSuccess('Password updated successfully.', 'Success', () => navigation.goBack());
    } catch (error) {
      setFormError(
        getUserFriendlyErrorMessage(
          error,
          'Could not update password. Please try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scrollable backgroundColor={palette.creme}>
        <ImageBackground
          source={require('../../assets/placeholder/feed-bg.png')}
          style={styles.headerBg}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={palette.white} />
          </Pressable>

          <AppText variant="h5" style={styles.white}>
            Change Password
          </AppText>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={palette.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">Secure Your Account</AppText>
              <AppText variant="bodySmall" style={styles.infoText}>
                We will email you a 6-digit code to reset your password.
              </AppText>
            </View>
          </View>

          <InputField
            label="Email Address"
            value={email}
            editable={false}
            onChangeText={setEmail}
          />

          <Button
            label={loading ? 'Sending...' : codeSent ? 'Resend OTP' : 'Send OTP'}
            onPress={codeSent ? handleResendOtp : handleSendOtp}
          />

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    handleBackspace(digit, index);
                  }
                }}
              />
            ))}
          </View>

          <View style={styles.inputWrapper}>
            <InputField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
            />

            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowNew(!showNew)}
            >
              <Ionicons
                name={showNew ? 'eye-off' : 'eye'}
                size={18}
                color={palette.stone}
              />
            </Pressable>
          </View>

          <View style={styles.inputWrapper}>
            <InputField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />

            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? 'eye-off' : 'eye'}
                size={18}
                color={palette.stone}
              />
            </Pressable>
          </View>

          {formError ? (
            <AppText variant="bodySmall" style={styles.errorText}>
              {formError}
            </AppText>
          ) : null}

          <View style={styles.rulesCard}>
            <AppText variant="bodyBold" style={{ marginBottom: spacing.sm }}>
              Password Rules
            </AppText>

            {[
              'Minimum 8 characters',
              'Use uppercase and lowercase letters',
              'Include at least one number',
              'Use one special character',
            ].map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={palette.success}
                />
                <AppText variant="bodySmall">{rule}</AppText>
              </View>
            ))}
          </View>

          <Button
            label={loading ? 'Updating...' : 'Update Password'}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    top: 20,
    left: 15,
  },

  white: {
    color: palette.white,
  },

  otpContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  otpInput: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    backgroundColor: palette.white,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Saveful-Bold',
  },

  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  infoCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },

  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.radish,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoText: {
    marginTop: 4,
    color: palette.stone,
  },

  inputWrapper: {
    position: 'relative',
  },

  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 42,
  },

  errorText: {
    color: palette.chilli,
    textAlign: 'center',
  },

  rulesCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  submitBtn: {
    backgroundColor: palette.primary,
    marginTop: spacing.sm,
  },
});
