import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { THEMES } from '../theme/themes';

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  themeId: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = React.memo(({
  size,
  strokeWidth,
  progress,
  themeId,
  children
}) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.round(radius * 2 * Math.PI);
  const strokeDashoffset = Math.round(circumference - Math.min(Math.max(progress, 0), 1) * circumference);
  const trackColor = activeTheme.isDark ? '#221C19' : '#F3EDE4';

  return (
    <View style={{ width: size, height: size }} className="justify-center items-center relative">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeTheme.colors.ringColor1} />
            <Stop offset="100%" stopColor={activeTheme.colors.ringColor2} />
          </LinearGradient>
        </Defs>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject} className="justify-center items-center">
        {children}
      </View>
    </View>
  );
});

export default ProgressRing;
