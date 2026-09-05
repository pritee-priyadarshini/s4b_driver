import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { InputField } from '../components/InputField';
import { SavefulModal } from '../components/SavefulModal';
import { useAuth } from '../store/AuthContext';
import { palette } from '../theme/colors';
import { authService } from '../services/authService';
import type { AuthStackParamList } from '../navigation/types';
import {
  getForgotPasswordErrorMessage,
  getForgotPasswordSuccessMessage,
  getLoginErrorMessage,
  getOtpVerificationErrorMessage,
} from '../utils/apiError';
import { showSuccessAlert } from '../utils/appAlert';
import { useTransparentStatusBar } from '../hooks/useTransparentStatusBar';
import { hp, normalize, wp } from '../utils/responsive';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from '../utils/rememberedCredentials';

type Mode = 'login' | 'forgot';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const valueProps = [
  {
    image: require('../../assets/intro/welcome_reduce_waste.png'),
    label: 'SAVE \n FOOD',
  },
  {
    image: require('../../assets/intro/welcome_feed_communities.png'),
    label: 'FEED \n COMMUNITIES',
  },
  {
    image: require('../../assets/intro/welcome_connect_locally.png'),
    label: 'CONNECT \n LOCALLY',
  },
];

const MODE_COPY: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to manage your pickup routes.',
  },
  forgot: {
    title: 'Forgot password?',
    subtitle: 'Enter your registered email and we’ll send a verification code.',
  },
};

function FormErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={normalize(16)} color={palette.validation} />
      <AppText variant="bodySmall" style={styles.errorBannerText}>
        {message}
      </AppText>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  showArrow = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  showArrow?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <AppText variant="bodyBold" style={styles.primaryButtonText}>
        {label}
      </AppText>
      {showArrow ? (
        <View style={styles.primaryButtonArrow}>
          <Ionicons name="arrow-forward" size={16} color={palette.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

type ResetPasswordModalFieldsProps = {
  step: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
  otp: string[];
  inputs: React.MutableRefObject<(TextInput | null)[]>;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  resending: boolean;
  onOtpChange: (text: string, index: number) => void;
  onOtpBackspace: (digit: string, index: number) => void;
  onResendCode: () => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onReset: () => void;
  onCancel: () => void;
  onSetError: (message: string) => void;
  onClearError: () => void;
};

function ResetPasswordModalFields({
  step,
  onStepChange,
  otp,
  inputs,
  newPassword,
  confirmPassword,
  loading,
  resending,
  onOtpChange,
  onOtpBackspace,
  onResendCode,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onReset,
  onCancel,
  onSetError,
  onClearError,
}: ResetPasswordModalFieldsProps) {
  const handleOtpInput = (text: string, index: number) => {
    onOtpChange(text, index);
    const nextDigit = text.replace(/[^0-9]/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = nextDigit;

    if (nextOtp.join('').length === 6) {
      onClearError();
      Keyboard.dismiss();
      setTimeout(() => onStepChange(2), 280);
    }
  };

  const handleContinueFromOtp = () => {
    if (otp.join('').length !== 6) {
      onSetError('Please enter the 6-digit verification code.');
      return;
    }
    onClearError();
    Keyboard.dismiss();
    onStepChange(2);
  };

  return (
    <View style={styles.modalFields}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <AppText variant="bodyBold" style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>
              1
            </AppText>
          </View>
          <AppText variant="caption" color={step === 1 ? palette.primary : palette.textMuted} style={styles.stepLabel}>
            Verify code
          </AppText>
        </View>

        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <AppText variant="bodyBold" style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>
              2
            </AppText>
          </View>
          <AppText variant="caption" color={step === 2 ? palette.primary : palette.textMuted} style={styles.stepLabel}>
            New password
          </AppText>
        </View>
      </View>

      {step === 1 ? (
        <>
          <View style={styles.otpSection}>
            <AppText variant="label" style={styles.otpLabel}>
              Enter verification code
            </AppText>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(t) => handleOtpInput(t, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      onOtpBackspace(digit, index);
                    }
                  }}
                />
              ))}
            </View>

            <Pressable
              onPress={onResendCode}
              disabled={resending || loading}
              style={styles.resendButton}
            >
              <AppText variant="bodySmall" color={palette.primary} style={styles.resendText}>
                {resending ? 'Resending...' : 'Resend code'}
              </AppText>
            </Pressable>
          </View>

          <PrimaryButton label="Continue" onPress={handleContinueFromOtp} showArrow />

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <AppText variant="bodyBold" color={palette.primary} style={styles.secondaryButtonText}>
              Cancel
            </AppText>
          </Pressable>
        </>
      ) : (
        <>
          <InputField
            label="New password"
            placeholder="Enter new password"
            value={newPassword}
            secureTextEntry
            isPassword
            formStyle
            onChangeText={onNewPasswordChange}
          />

          <InputField
            label="Confirm password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            secureTextEntry
            isPassword
            formStyle
            onChangeText={onConfirmPasswordChange}
          />

          <PrimaryButton
            label={loading ? 'Resetting...' : 'Reset password'}
            onPress={onReset}
            disabled={loading}
          />

          <Pressable
            onPress={() => {
              onClearError();
              onStepChange(1);
            }}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <AppText variant="bodyBold" color={palette.primary} style={styles.secondaryButtonText}>
              Back
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}

export function LoginScreen() {
  const { login, authLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  useTransparentStatusBar('dark');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const passwordRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);

  const trimmedEmail = email.trim().toLowerCase();
  const copy = MODE_COPY[mode];
  const isBusy = authLoading || loading;
  const keyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    let mounted = true;

    void loadRememberedCredentials()
      .then((creds) => {
        if (!mounted) return;
        setRememberMe(creds.rememberMe);
        if (creds.email) setEmail(creds.email);
        if (creds.password) setPassword(creds.password);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const closeResetModal = () => {
    setResetModalVisible(false);
    setResetError('');
    setResetStep(1);
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    closeResetModal();
  };

  const handleLogin = async () => {
    try {
      if (isBusy) return;
      setError('');

      if (!trimmedEmail || !password) {
        setError('Please enter email and password.');
        return;
      }

      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }

      Keyboard.dismiss();
      await login(trimmedEmail, password);

      // Persist after a successful login only — never block sign-in on SecureStore.
      try {
        if (rememberMe) {
          await saveRememberedCredentials(trimmedEmail, password);
        } else {
          await clearRememberedCredentials();
        }
      } catch {
        // Ignore persistence failures; session is already established.
      }
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    }
  };

  const handleSendCode = async () => {
    try {
      if (isBusy) return;
      setError('');

      if (!trimmedEmail) {
        setError('Please enter your email address.');
        return;
      }

      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      const res = await authService.forgotPassword(trimmedEmail);
      const responseMessage = (res.data as { message?: string } | undefined)?.message;

      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setResetError('');
      setResetStep(1);
      setMode('login');
      setResetModalVisible(true);
      showSuccessAlert(
        getForgotPasswordSuccessMessage(responseMessage),
        'Code sent',
      );
    } catch (e: unknown) {
      setError(getForgotPasswordErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || isBusy) return;
    setResetError('');

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResending(true);
    try {
      const res = await authService.forgotPassword(trimmedEmail);
      const responseMessage = (res.data as { message?: string } | undefined)?.message;
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      showSuccessAlert(
        getForgotPasswordSuccessMessage(responseMessage),
        'Code resent',
      );
    } catch (e: unknown) {
      setResetError(getForgotPasswordErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  const handleReset = async () => {
    try {
      if (isBusy) return;
      setResetError('');
      const enteredOtp = otp.join('');

      if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
        setResetError('Please enter a valid email address.');
        return;
      }

      if (enteredOtp.length !== 6) {
        setResetError('Please enter the 6-digit verification code.');
        return;
      }

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        setResetError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }

      if (newPassword !== confirmPassword) {
        setResetError('Passwords do not match. Please re-enter.');
        return;
      }

      setLoading(true);
      await authService.resetPassword(trimmedEmail, enteredOtp, newPassword);
      closeResetModal();
      showSuccessAlert('Password reset successful. You can sign in now.', 'Success');
    } catch (e: unknown) {
      setResetError(
        getOtpVerificationErrorMessage(
          e,
          'Could not reset password. Please try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const next = [...otp];
    next[index] = text.replace(/[^0-9]/g, '');
    setOtp(next);
    setResetError('');

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleOtpBackspace = (digit: string, index: number) => {
    if (!digit && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const scrollFieldIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <Screen backgroundColor={palette.creme} scrollable={false} transparentTop>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View style={styles.topAccent} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={keyboardVisible}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + hp(1.5),
              paddingBottom: keyboardVisible
                ? keyboardHeight + hp(3)
                : insets.bottom + hp(1.5),
              paddingHorizontal: wp(5),
            },
          ]}
          showsVerticalScrollIndicator={keyboardVisible}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={styles.phoneColumn}>
            <Pressable
              style={styles.backRow}
              onPress={() => {
                if (resetModalVisible) {
                  closeResetModal();
                  return;
                }
                if (mode === 'login') {
                  navigation.navigate('Welcome');
                } else {
                  switchMode('login');
                }
              }}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={normalize(20)} color={palette.kale} />
              <AppText variant="bodyBold" style={styles.backRowText}>
                {mode === 'login' ? 'Back' : 'Back to sign in'}
              </AppText>
            </Pressable>

            <View style={styles.formShell}>
              {mode === 'login' ? (
                <View style={styles.iconRow}>
                  {valueProps.map((item) => (
                    <View key={item.label} style={styles.iconItem}>
                      <Image source={item.image} style={styles.valuePropImage} resizeMode="contain" />
                      <AppText variant="caption" color={palette.textMuted} style={styles.iconLabel}>
                        {item.label}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.formCard}>
                <View style={styles.formHeaderBand}>
                  <Image
                    source={require('../../assets/intro/logo.png')}
                    style={styles.formLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.driverBadge}>
                    <AppText variant="caption" color={palette.middlegreen} style={styles.driverBadgeText}>
                      for Drivers
                    </AppText>
                  </View>
                  <AppText variant="h6" color={palette.primary} style={styles.formTitle}>
                    {copy.title}
                  </AppText>
                  <AppText variant="bodySmall" color={palette.textMuted} style={styles.formSubtitle}>
                    {copy.subtitle}
                  </AppText>
                </View>

                <View style={styles.fieldsPanel}>
                  <InputField
                    label="Email address"
                    placeholder="your@email.com"
                    formStyle
                    value={email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    returnKeyType={mode === 'login' ? 'next' : 'send'}
                    onSubmitEditing={() => {
                      if (mode === 'login') {
                        passwordRef.current?.focus();
                      } else {
                        void handleSendCode();
                      }
                    }}
                    onFocus={scrollFieldIntoView}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                  />

                  {mode === 'login' ? (
                    <>
                      <InputField
                        label="Password"
                        placeholder="Enter your password"
                        formStyle
                        value={password}
                        secureTextEntry
                        isPassword
                        textContentType="password"
                        returnKeyType="go"
                        inputRef={passwordRef}
                        onSubmitEditing={() => {
                          void handleLogin();
                        }}
                        onFocus={scrollFieldIntoView}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                      />

                      <View style={styles.rememberRow}>
                        <Pressable
                          onPress={() => {
                            setRememberMe((prev) => {
                              const next = !prev;
                              if (!next) {
                                void clearRememberedCredentials().catch(() => undefined);
                              }
                              return next;
                            });
                          }}
                          style={styles.rememberMeBtn}
                          hitSlop={6}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: rememberMe }}
                          accessibilityLabel="Remember me"
                        >
                          <Ionicons
                            name={rememberMe ? 'checkbox' : 'square-outline'}
                            size={normalize(20)}
                            color={rememberMe ? palette.primary : palette.stone}
                          />
                          <AppText variant="bodySmall" style={styles.rememberMeLabel}>
                            Remember me
                          </AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => switchMode('forgot')}
                          style={styles.forgotLinkWrap}
                          hitSlop={4}
                        >
                          <AppText variant="bodySmall" color={palette.primary} style={styles.forgotLink}>
                            Forgot password?
                          </AppText>
                        </Pressable>
                      </View>
                    </>
                  ) : null}

                  <FormErrorBanner message={error} />

                  {mode === 'login' ? (
                    <PrimaryButton
                      label={isBusy ? 'Signing in...' : 'Sign in'}
                      onPress={handleLogin}
                      disabled={isBusy}
                      showArrow
                    />
                  ) : null}

                  {mode === 'forgot' ? (
                    <>
                      <PrimaryButton
                        label={isBusy ? 'Sending...' : 'Send verification code'}
                        onPress={handleSendCode}
                        disabled={isBusy}
                      />
                      <Pressable
                        onPress={() => switchMode('login')}
                        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                      >
                        <AppText variant="bodyBold" color={palette.primary} style={styles.secondaryButtonText}>
                          Back to sign in
                        </AppText>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SavefulModal
        visible={resetModalVisible}
        onClose={closeResetModal}
        title={resetStep === 1 ? 'Verify your code' : 'Set new password'}
        subtitle={
          resetStep === 1
            ? trimmedEmail
              ? `Enter the 6-digit code sent to ${trimmedEmail}.`
              : 'Enter the 6-digit code from your email.'
            : 'Choose a secure password for your account.'
        }
        error={resetError}
      >
        <ResetPasswordModalFields
          step={resetStep}
          onStepChange={(step) => {
            setResetError('');
            setResetStep(step);
          }}
          otp={otp}
          inputs={inputs}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          loading={loading}
          resending={resending}
          onOtpChange={handleOtpChange}
          onOtpBackspace={handleOtpBackspace}
          onResendCode={handleResendCode}
          onNewPasswordChange={(value) => {
            setNewPassword(value);
            setResetError('');
          }}
          onConfirmPasswordChange={(value) => {
            setConfirmPassword(value);
            setResetError('');
          }}
          onReset={handleReset}
          onCancel={closeResetModal}
          onSetError={setResetError}
          onClearError={() => setResetError('')}
        />
      </SavefulModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topAccent: {
    width: '100%',
    height: hp(0.35),
    backgroundColor: palette.middlegreen,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: hp(1.2),
  },
  phoneColumn: {
    width: '100%',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(0.5),
    paddingVertical: hp(0.3),
    marginBottom: hp(0.5),
  },
  backRowText: {
    color: palette.kale,
    textTransform: 'none',
    fontSize: normalize(15),
  },
  formShell: {
    gap: hp(1.4),
    marginTop: hp(0.8),
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
    gap: wp(2),
  },
  iconItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(0.5),
    minWidth: 0,
  },
  valuePropImage: {
    width: 64,
    height: 64,
  },
  iconLabel: {
    textAlign: 'center',
    fontSize: normalize(12),
    lineHeight: normalize(14),
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: palette.white,
    borderRadius: normalize(24),
    borderWidth: 1,
    borderColor: palette.strokecream,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  formHeaderBand: {
    alignItems: 'center',
    gap: hp(0.6),
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    backgroundColor: palette.creme,
    borderBottomWidth: 1,
    borderBottomColor: palette.strokecream,
  },
  formLogo: {
    width: 140,
    height: 44,
  },
  driverBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.3),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(64, 146, 91, 0.12)',
  },
  driverBadgeText: {
    textTransform: 'none',
    fontSize: normalize(12),
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  formTitle: {
    textAlign: 'center',
    fontSize: normalize(24),
    lineHeight: normalize(30),
    textTransform: 'none',
  },
  formSubtitle: {
    textAlign: 'center',
    fontSize: normalize(14),
    lineHeight: normalize(20),
    textTransform: 'none',
    maxWidth: '100%',
    paddingHorizontal: wp(2),
  },
  fieldsPanel: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2.2),
    gap: hp(1.5),
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    marginTop: -hp(0.2),
  },
  rememberMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    flexShrink: 1,
    minHeight: normalize(32),
  },
  rememberMeLabel: {
    color: palette.black,
    textTransform: 'none',
    fontSize: normalize(13),
  },
  forgotLinkWrap: {
    flexShrink: 0,
  },
  forgotLink: {
    textTransform: 'none',
    textDecorationLine: 'underline',
    fontSize: normalize(13),
  },
  modalFields: {
    gap: hp(1.6),
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: wp(2),
    paddingBottom: hp(0.5),
  },
  stepItem: {
    alignItems: 'center',
    gap: hp(0.5),
    width: wp(24),
  },
  stepDot: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    borderWidth: 2,
    borderColor: palette.strokecream,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: palette.kale,
    backgroundColor: palette.kale,
  },
  stepDotText: {
    fontSize: normalize(14),
    color: palette.textMuted,
    textTransform: 'none',
  },
  stepDotTextActive: {
    color: palette.white,
  },
  stepLabel: {
    textAlign: 'center',
    fontSize: normalize(10),
    letterSpacing: 0.3,
  },
  stepLine: {
    width: wp(12),
    height: 2,
    backgroundColor: palette.strokecream,
    marginTop: normalize(15),
  },
  stepLineActive: {
    backgroundColor: palette.kale,
  },
  otpSection: {
    gap: hp(0.8),
  },
  otpLabel: {
    textTransform: 'none',
    color: palette.black,
    fontSize: normalize(16),
  },
  otpRow: {
    flexDirection: 'row',
    gap: wp(1.5),
  },
  otpInput: {
    flex: 1,
    height: normalize(48),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: normalize(10),
    backgroundColor: palette.white,
    textAlign: 'center',
    fontSize: normalize(18),
    color: palette.text,
  },
  otpInputFilled: {
    borderColor: palette.kale,
    backgroundColor: '#F4FAF6',
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: hp(0.4),
  },
  resendText: {
    textTransform: 'none',
    textDecorationLine: 'underline',
    fontSize: normalize(13),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: palette.validation,
    borderRadius: normalize(10),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
  },
  errorBannerText: {
    flex: 1,
    minWidth: 0,
    color: palette.validation,
    textTransform: 'none',
    lineHeight: normalize(18),
  },
  primaryButton: {
    backgroundColor: palette.eggplant,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: wp(5),
    borderRadius: normalize(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: hp(0.4),
    ...Platform.select({
      ios: {
        shadowColor: palette.eggplant,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: normalize(16),
    textTransform: 'none',
  },
  secondaryButton: {
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: palette.strokecream,
    backgroundColor: palette.creme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    textTransform: 'none',
    fontSize: normalize(15),
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
