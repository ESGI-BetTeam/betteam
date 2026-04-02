import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

export const fonts = {
  // Teko — titres, headings, impact
  heading: 'Teko-Bold',
  headingSemiBold: 'Teko-SemiBold',
  headingMedium: 'Teko-Medium',
  headingRegular: 'Teko-Regular',

  // Inter — body text, UI
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
} as const;

export const typo = StyleSheet.create({
    h1: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        fontFamily: fonts.heading,
    },
    
    h2: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        fontFamily: fonts.heading,
    },
    
    h3: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        fontFamily: fonts.headingSemiBold,
    },
    
    h4: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        fontFamily: fonts.headingSemiBold,
    },
    
    p: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: fonts.body,
    },

    pBold: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 24,
        fontFamily: fonts.bodyBold,
    },

    pMuted: {
        color: colors.textMuted,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: fonts.body,
    },
    
    small: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 20,
        fontFamily: fonts.body,
    },
});