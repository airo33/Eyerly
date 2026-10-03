import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ExerciseAnim } from '@/constants/eyerly';
import { useTheme } from '@/hooks/use-theme';

const FIELD = 200;
const R = 72;
const DOT = 26;

type Props = { type: ExerciseAnim };

export function ExerciseAnimation({ type }: Props) {
  const theme = useTheme();
  const t = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    if (type === 'blink') {
      blink.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 900 }),
          withTiming(1, { duration: 110 }),
          withTiming(0, { duration: 110 }),
        ),
        -1,
        false,
      );
      return () => cancelAnimation(blink);
    }

    const period =
      type === 'nearfar' || type === 'palming'
        ? 4000
        : type === 'figure8' || type === 'circle'
          ? 4200
          : 2600;

    t.value = withRepeat(
      withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
      -1,
      type === 'horizontal' || type === 'vertical' ? true : false,
    );
    return () => cancelAnimation(t);
  }, [type, t, blink]);

  const dotStyle = useAnimatedStyle(() => {
    'worklet';
    const a = t.value * Math.PI * 2;
    let x = 0;
    let y = 0;
    let scale = 1;

    if (type === 'figure8') {
      x = R * Math.sin(a);
      y = (R * 0.9) * Math.sin(a) * Math.cos(a);
    } else if (type === 'circle') {
      x = R * Math.cos(a);
      y = R * Math.sin(a);
    } else if (type === 'horizontal') {
      x = R * (t.value * 2 - 1);
    } else if (type === 'vertical') {
      y = R * (t.value * 2 - 1);
    } else if (type === 'nearfar') {
      scale = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(a));
    } else if (type === 'palming') {
      scale = 0.75 + 0.35 * (0.5 - 0.5 * Math.cos(a));
    }

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  const eyeStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scaleY: 1 - blink.value * 0.9 }] };
  });

  if (type === 'blink') {
    return (
      <View style={styles.field}>
        <Animated.View
          style={[
            styles.eye,
            { backgroundColor: theme.accent },
            eyeStyle,
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Animated.View
        style={[styles.dot, { backgroundColor: theme.accent }, dotStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: FIELD,
    height: FIELD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  eye: {
    width: 96,
    height: 56,
    borderRadius: 28,
  },
});
