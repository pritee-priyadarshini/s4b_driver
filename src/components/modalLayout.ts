import { Dimensions, Platform, StyleSheet } from 'react-native';

import { palette } from '../theme/colors';
import { hp, normalize, wp } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MODAL_BACKDROP_COLOR = 'rgba(26, 26, 27, 0.45)';
export const CENTERED_MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.82;
export const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;

export const modalLayout = StyleSheet.create({
  centeredOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL_BACKDROP_COLOR,
  },
  centeredCard: {
    width: '100%',
    maxWidth: normalize(360),
    maxHeight: CENTERED_MODAL_MAX_HEIGHT,
    backgroundColor: palette.white,
    borderRadius: normalize(24),
    borderWidth: 1,
    borderColor: palette.strokecream,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  centeredBody: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2.4),
    paddingBottom: hp(1.2),
    alignItems: 'center',
    gap: hp(1),
  },
  centeredFooter: {
    flexShrink: 0,
    width: '100%',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(2.2),
    gap: hp(1),
  },
  centeredFooterRow: {
    flexDirection: 'row',
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    maxHeight: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: palette.white,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    borderWidth: 1,
    borderColor: palette.strokecream,
    paddingTop: hp(1),
    paddingHorizontal: wp(5),
    overflow: 'hidden',
  },
  bottomSheetScroll: {
    flexGrow: 0,
  },
  bottomSheetContent: {
    gap: hp(1),
    paddingBottom: hp(1),
  },
  sheetHandle: {
    width: normalize(40),
    height: normalize(4),
    borderRadius: 2,
    backgroundColor: palette.strokecream,
    alignSelf: 'center',
    marginBottom: hp(1.5),
  },
});
