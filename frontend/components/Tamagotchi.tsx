import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { PlantState } from '../store/plantStore';

export const MOUTH_PATHS: Record<PlantState, string> = {
  happy: 'M 35 58 Q 50 72 65 58',
  thirsty: 'M 35 66 Q 50 56 65 66',
  hot: 'M 40 58 Q 50 70 60 58 Q 50 50 40 58',
  noLight: 'M 35 64 L 65 64',
  sick: 'M 38 70 Q 50 60 62 70',
  sleeping: 'M 42 62 Q 50 65 58 62',
};

const EYE_RX = 6;
const EYE_OPEN_RY = 6;
const EYE_CLOSED_RY = 1;

const PARTICLES: Partial<Record<PlantState, { testId: string; label: string }>> = {
  thirsty: { testId: 'tamagotchi-particle-drop', label: '💧' },
  hot: { testId: 'tamagotchi-particle-heat', label: '🔥' },
  sleeping: { testId: 'tamagotchi-particle-zzz', label: 'Z Z Z' },
};

export interface TamagotchiProps {
  state: PlantState;
}

export function Tamagotchi({ state }: TamagotchiProps) {
  const [eyesOpen, setEyesOpen] = useState(true);
  const sway = useSharedValue(0);
  const particlePulse = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, [sway]);

  useEffect(() => {
    if (state === 'sleeping') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        setEyesOpen(false);
        timeoutId = setTimeout(() => {
          setEyesOpen(true);
          scheduleBlink();
        }, 150);
      }, 3000 + Math.random() * 2000);
    };
    scheduleBlink();

    return () => clearTimeout(timeoutId);
  }, [state]);

  const particle = PARTICLES[state];

  useEffect(() => {
    if (!particle) {
      return;
    }
    particlePulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [particle, particlePulse]);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(sway.value - 0.5) * 6}deg` }],
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + particlePulse.value * 0.5,
  }));

  const eyesClosed = state === 'sleeping' || !eyesOpen;
  const eyeRy = eyesClosed ? EYE_CLOSED_RY : EYE_OPEN_RY;

  return (
    <View testID="tamagotchi">
      <Animated.View style={swayStyle}>
        <Svg testID="tamagotchi-svg" viewBox="0 0 100 100" width="100%" height="100%">
          <Circle cx={50} cy={50} r={45} fill="#A5D6A7" />
          <Ellipse testID="tamagotchi-eye-left" cx={35} cy={40} rx={EYE_RX} ry={eyeRy} fill="#37474F" />
          <Ellipse testID="tamagotchi-eye-right" cx={65} cy={40} rx={EYE_RX} ry={eyeRy} fill="#37474F" />
          <Path
            testID="tamagotchi-mouth"
            d={MOUTH_PATHS[state]}
            stroke="#37474F"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      {particle && (
        <Animated.View testID={particle.testId} style={particleStyle}>
          <Text>{particle.label}</Text>
        </Animated.View>
      )}
    </View>
  );
}
