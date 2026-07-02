import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { BOTTOM_SHEET_MAX_HEIGHT, modalLayout } from './modalLayout';
import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

type SavefulModalProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  error?: string;
}>;

export function SavefulModal({
  visible,
  onClose,
  title,
  subtitle,
  error,
  children,
}: SavefulModalProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, Platform.OS === 'ios' ? 80 : 150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const sheetLift = Math.max(0, keyboardHeight - insets.bottom);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={modalLayout.bottomOverlay}>
        <Pressable style={modalLayout.backdrop} onPress={onClose} accessibilityRole="button" />

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + hp(2),
              marginBottom: sheetLift,
            },
          ]}
        >
          <View style={modalLayout.sheetHandle} />

          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={normalize(22)} color={palette.textMuted} />
          </Pressable>

          <ScrollView
            ref={scrollRef}
            style={modalLayout.bottomSheetScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={keyboardHeight > 0}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require('../../assets/intro/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.headerCopy}>
              <AppText variant="h6" color={palette.primary} style={styles.title}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="bodySmall" color={palette.textMuted} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={normalize(16)} color={palette.validation} />
                <AppText variant="bodySmall" style={styles.errorBannerText}>
                  {error}
                </AppText>
              </View>
            ) : null}

            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: palette.creme,
    borderTopLeftRadius: normalize(28),
    borderTopRightRadius: normalize(28),
    borderWidth: 1,
    borderColor: palette.strokecream,
    paddingTop: hp(1.2),
    paddingHorizontal: wp(5),
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: hp(1.6),
    right: wp(4),
    zIndex: 2,
    padding: normalize(4),
  },
  scrollContent: {
    gap: hp(1.6),
    paddingBottom: hp(1),
  },
  logo: {
    width: wp(38),
    height: hp(5),
    alignSelf: 'center',
  },
  headerCopy: {
    alignItems: 'center',
    gap: hp(0.6),
    paddingHorizontal: wp(2),
  },
  title: {
    textAlign: 'center',
    fontSize: normalize(22),
    lineHeight: normalize(28),
    textTransform: 'none',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: normalize(14),
    lineHeight: normalize(20),
    textTransform: 'none',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: palette.validation,
    borderRadius: normalize(12),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
  },
  errorBannerText: {
    flex: 1,
    color: palette.validation,
    textTransform: 'none',
    lineHeight: normalize(18),
  },
});
