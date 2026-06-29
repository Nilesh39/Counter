import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { THEMES } from '../theme/themes';

interface VirtualSatsangWidgetProps {
  themeId: string;
}

export const VirtualSatsangWidget: React.FC<VirtualSatsangWidgetProps> = ({ themeId }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const [seekerCount, setSeekerCount] = useState(1400 + Math.floor(Math.random() * 120));
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countScaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse effect for the active indicator dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Organic seeker count fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate count by a random small integer: -4 to +5
      const change = Math.floor(Math.random() * 10) - 4;
      
      // Animate text pop on fluctuation
      Animated.sequence([
        Animated.timing(countScaleAnim, {
          toValue: 1.12,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(countScaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      setSeekerCount(prev => {
        const next = prev + change;
        // Keep bounds reasonable (e.g., between 1200 and 1800)
        if (next < 1200) return 1250;
        if (next > 1800) return 1750;
        return next;
      });
    }, 6000 + Math.random() * 4000); // interval between 6s and 10s

    return () => clearInterval(interval);
  }, [countScaleAnim]);

  return (
    <View className="items-center w-full px-5 mt-2">
      <View
        className="flex-row items-center px-4 py-2 rounded-full border"
        style={{
          backgroundColor: activeTheme.colors.cardBackground + 'E6', // translucent card
          borderColor: activeTheme.colors.cardBorder,
          shadowColor: activeTheme.colors.shadowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 3,
        }}
      >
        {/* Pulsing Active Indicator Dot */}
        <View className="mr-3 items-center justify-center relative w-2.5 h-2.5">
          <Animated.View
            className="absolute rounded-full w-full h-full"
            style={{
              backgroundColor: '#F59E0B',
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1.0, 1.6],
                outputRange: [0.8, 0],
              }),
            }}
          />
          <View
            className="rounded-full w-2 h-2"
            style={{
              backgroundColor: '#D97706',
            }}
          />
        </View>

        <Users size={13} color={activeTheme.colors.textSecondary} className="mr-1.5" />
        
        {/* Seekers Counter Text */}
        <Text style={{ color: activeTheme.colors.textSecondary }} className="text-[11px] font-bold tracking-wide">
          SATSANG:{' '}
          <Animated.Text
            style={{
              color: activeTheme.colors.accent,
              transform: [{ scale: countScaleAnim }],
              fontWeight: '900',
            }}
          >
            {seekerCount.toLocaleString()}
          </Animated.Text>{' '}
          devotees chanting live
        </Text>
      </View>
    </View>
  );
};

export default VirtualSatsangWidget;
