import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

export const typo = StyleSheet.create({
    h1: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: '400',
        lineHeight: 40,
        fontFamily: 'Teko-Bold',
        textTransform: 'uppercase',
    },
    
    h2: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 26,
        fontWeight: '400',
        lineHeight: 32,
        fontFamily: 'Teko-SemiBold',
    },
    
    h3: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 23,
        fontWeight: '400',
        lineHeight: 28,
        fontFamily: 'Teko-Medium',
    },
    
    h4: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: 'Teko-Medium',
    },
    
    p: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },

    pBold: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },

    pSecondary: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },

    pMuted: {
        color: colors.textMuted,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    
    small: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },

    smallSecondary: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    }
});