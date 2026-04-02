import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const typo = StyleSheet.create({
    h1: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40
    },
    
    h2: {
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32
    },
    
    h3: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28
    },
    
    h4: {
        marginBottom: spacing.xs,
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24
    },
    
    p: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24
    },

    pBold: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 24
    },

    pMuted: {
        color: colors.textMuted,
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24
    },
    
    small: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 20
    },
});