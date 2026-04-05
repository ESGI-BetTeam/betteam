import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typo } from '@/theme';
import { PIConfetti, PIConfettiMethods } from 'react-native-fast-confetti';
import { TickCircle } from 'iconsax-react-nativejs';

const CIRCLE_SIZE = 42;

interface TimelineProps {
  stepCount: number;
  currentStep: number;
  done?: boolean;
}

export function Timeline({ stepCount, currentStep, done = false }: TimelineProps) {
  const [viewDimensions, setViewDimensions] = useState({ height: 0, width: 0 })
  const confettiRef = useRef<PIConfettiMethods>(null);
  const animations = useRef(
    Array.from({ length: stepCount }, () => new Animated.Value(0))
  ).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (done) {
      Animated.sequence([
        Animated.timing(lineOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.stagger(50,
          animations.map((anim, i) => {
            const center = (stepCount - 1) / 2;
            const offset = (center - i) * (CIRCLE_SIZE + 10 + 4);
            return Animated.spring(anim, {
              toValue: offset,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
            });
          })
        ),
      ]).start(() => {
        confettiRef.current?.restart();
      });
    } else {
      Animated.parallel([
        Animated.timing(lineOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        ...animations.map(anim =>
          Animated.spring(anim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          })
        ),
      ]).start();
    }
  }, [done]);

  return (
    <View style={styles.container} onLayout={(e) => setViewDimensions(e.nativeEvent.layout)}>
      {Array.from({ length: stepCount }, (_, i) => {
        const step        = i + 1;
        const isCompleted = done || step < currentStep;
        const isActive    = !done && step === currentStep;
        const isPending   = !done && step > currentStep;

        return (
          <React.Fragment key={step}>
            <Animated.View style={{ transform: [{ translateX: animations[i] }] }}>
              <View style={[styles.circle, isActive && styles.circleActive]}>
                <View style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isActive    && styles.dotActive,
                  isPending   && styles.dotPending,
                ]}>
                  {isCompleted
                    ? <TickCircle size="90%" color={colors.accent} variant='Bulk' />
                    : <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                        {step}
                      </Text>
                  }
                </View>
              </View>
            </Animated.View>

            {step < stepCount && (
              <Animated.View
                style={[
                  styles.line,
                  isCompleted && styles.lineCompleted,
                  { opacity: lineOpacity },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}

      {done && (
        <PIConfetti
          ref={confettiRef}
          count={80}
          colors={[colors.accent, colors.accent, colors.textPrimary, colors.accentLight]}
          containerStyle={styles.confetti}
          blastDuration={500}
          fadeOutOnEnd={true}
          blastPosition={{ x: (viewDimensions.width / 2) + 50, y: (viewDimensions.height / 2) + 150 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  circle: {
    width: CIRCLE_SIZE + 10,
    height: CIRCLE_SIZE + 10,
    borderRadius: (CIRCLE_SIZE + 10) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  circleActive: {
    borderColor: colors.accent,
  },

  dot: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  dotCompleted: {
    backgroundColor: colors.background,
  },
  dotPending: {
    backgroundColor: colors.textMuted,
  },

  stepNumber: {
    ...typo.p,
    color: colors.white,
  },
  stepNumberActive: {
    color: colors.white,
  },

  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  lineCompleted: {
    backgroundColor: colors.accent,
  },

  confetti: {
    position: 'absolute',
    top: -150,
    left: -50,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 1500,
    width: 800,
  },
});