import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Easing
} from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import { Award, Compass, Star } from 'lucide-react-native';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationOverlayProps {
  themeId: string;
  completedMalasToday: number;
  lifetimeTotalChants: number;
  onDismiss: () => void;
}

interface ParticleState {
  id: string;
  x: number;
  scale: number;
  type: 'petal' | 'sparkle';
  yAnim: Animated.Value;
  rotateAnim: Animated.Value;
  swayAnim: Animated.Value;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  themeId,
  completedMalasToday,
  lifetimeTotalChants,
  onDismiss
}) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const [particles, setParticles] = useState<ParticleState[]>([]);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Play Bell Audio and fade in overlay on mount
  useEffect(() => {
    // 1. Play Sound
    const playBell = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2030/2030-84.wav' },
          { shouldPlay: true, volume: 0.85 }
        );
        soundRef.current = sound;
      } catch (err) {
        console.warn('Failed to load or play celebration bell audio', err);
      }
    };
    playBell();

    // 2. Animate Overlay Fade In
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // 3. Initialize Particles
    const spawnedParticles: ParticleState[] = [];
    for (let i = 0; i < 35; i++) {
      spawnedParticles.push(createParticle(i.toString()));
    }
    setParticles(spawnedParticles);

    // 4. Start Particle Falling Animations
    const particleAnimations = spawnedParticles.map(p => animateParticle(p));
    Animated.parallel(particleAnimations).start();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Create a single particle configuration
  const createParticle = (id: string): ParticleState => {
    const isPetal = Math.random() > 0.45;
    return {
      id,
      x: Math.random() * SCREEN_WIDTH,
      scale: 0.4 + Math.random() * 1.1,
      type: isPetal ? 'petal' : 'sparkle',
      yAnim: new Animated.Value(-60),
      rotateAnim: new Animated.Value(0),
      swayAnim: new Animated.Value(0)
    };
  };

  // Run timing loops for a particle
  const animateParticle = (p: ParticleState): Animated.CompositeAnimation => {
    // Random duration: 4.5s to 7.5s
    const fallDuration = 4500 + Math.random() * 3000;
    const swayDuration = 1500 + Math.random() * 1000;
    
    // Reset starting point
    p.yAnim.setValue(-60);
    p.rotateAnim.setValue(0);
    p.swayAnim.setValue(0);

    const fall = Animated.timing(p.yAnim, {
      toValue: SCREEN_HEIGHT + 60,
      duration: fallDuration,
      easing: Easing.linear,
      useNativeDriver: true
    });

    const rotate = Animated.timing(p.rotateAnim, {
      toValue: 1,
      duration: fallDuration,
      easing: Easing.linear,
      useNativeDriver: true
    });

    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(p.swayAnim, {
          toValue: 1,
          duration: swayDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(p.swayAnim, {
          toValue: -1,
          duration: swayDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    sway.start();

    return Animated.parallel([
      fall,
      rotate
    ]);
  };

  // Keep particles looping in the background
  useEffect(() => {
    if (particles.length === 0) return;

    const listeners = particles.map(p => {
      const id = p.yAnim.addListener(({ value }) => {
        if (value >= SCREEN_HEIGHT + 50) {
          // Reset particle to top and trigger animation again
          p.yAnim.setValue(-60);
          p.rotateAnim.setValue(0);
          p.swayAnim.setValue(0);
          animateParticle(p).start();
        }
      });
      return { p, id };
    });

    return () => {
      listeners.forEach(({ p, id }) => p.yAnim.removeListener(id));
    };
  }, [particles]);

  const handleDismiss = () => {
    // Spring pop button
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true
      })
    ]).start();

    // Fade out and close
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true
      }),
      Animated.timing(cardScale, {
        toValue: 0.7,
        duration: 350,
        useNativeDriver: true
      })
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          opacity: overlayOpacity,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 999
        }
      ]}
      className="items-center justify-center"
    >
      
      {/* Background Particles Rendering */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {particles.map(p => {
          const rotation = p.rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '720deg']
          });

          const translateX = p.swayAnim.interpolate({
            inputRange: [-1, 1],
            outputRange: [-35, 35]
          });

          return (
            <Animated.View
              key={p.id}
              style={{
                position: 'absolute',
                left: p.x,
                transform: [
                  { translateY: p.yAnim },
                  { translateX },
                  { rotate: rotation },
                  { scale: p.scale }
                ],
                opacity: p.yAnim.interpolate({
                  inputRange: [-60, 0, SCREEN_HEIGHT - 100, SCREEN_HEIGHT + 60],
                  outputRange: [0, 0.9, 0.9, 0]
                })
              }}
            >
              {p.type === 'petal' ? (
                // Elegant pink lotus petal SVG
                <Svg width="20" height="20" viewBox="0 0 100 100">
                  <Path
                    d="M 50 15 C 38 45 42 65 50 75 C 58 65 62 45 50 15 Z"
                    fill="#fda4af"
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                    opacity="0.8"
                  />
                  <Path
                    d="M 50 25 C 22 45 32 68 50 75 C 38 60 38 40 50 25 Z"
                    fill="#f43f5e"
                    opacity="0.3"
                  />
                </Svg>
              ) : (
                // Sparkling gold star SVG
                <Svg width="16" height="16" viewBox="0 0 24 24">
                  <Path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#fbcfe8"
                    stroke="#db2777"
                    strokeWidth="1.5"
                    opacity="0.75"
                  />
                </Svg>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Central Glassmorphic Card */}
      <Animated.View
        style={[
          styles.glassCard,
          {
            transform: [{ scale: cardScale }],
            borderColor: activeTheme.colors.accent + '33',
            backgroundColor: activeTheme.colors.cardBackground + 'EB' // high opacity glass
          }
        ]}
        className="w-[85%] max-w-sm rounded-[32px] p-7 items-center border border-white/5 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle radial ambient background light inside the card */}
        <View
          style={{
            position: 'absolute',
            width: 250,
            height: 250,
            borderRadius: 999,
            backgroundColor: activeTheme.colors.accent,
            opacity: 0.08,
            top: -100,
            left: -30
          }}
          pointerEvents="none"
        />

        {/* Sacred Glowing Award Badge Icon */}
        <View
          style={{
            backgroundColor: activeTheme.colors.accent + '1C',
            borderColor: activeTheme.colors.accent + '4D'
          }}
          className="w-20 h-20 rounded-full items-center justify-center border-2 mb-5 shadow-inner"
        >
          <Award size={42} color={activeTheme.colors.accent} />
        </View>

        <Text
          style={{ color: activeTheme.colors.textPrimary }}
          className="text-2xl font-black tracking-wider text-center"
        >
          Goal Achieved!
        </Text>

        <Text
          style={{ color: activeTheme.colors.textSecondary }}
          className="text-xs font-semibold text-center mt-2 px-3 leading-relaxed"
        >
          Your devotion shines bright. You have successfully achieved your chanting goal with complete mindfulness.
        </Text>

        {/* Horizontal Divider */}
        <View
          style={{ backgroundColor: activeTheme.colors.cardBorder }}
          className="h-[1px] w-full my-6"
        />

        {/* Session Stats Grid */}
        <View className="flex-row justify-around w-full mb-6">
          <View className="items-center flex-1">
            <Text
              style={{ color: activeTheme.colors.textSecondary }}
              className="text-[9px] uppercase tracking-widest font-extrabold"
            >
              Malas Today
            </Text>
            <Text
              style={{ color: activeTheme.colors.accent }}
              className="text-2xl font-black mt-1"
            >
              {completedMalasToday}
            </Text>
          </View>
          
          <View
            style={{ backgroundColor: activeTheme.colors.cardBorder, width: 1 }}
            className="h-10 align-self-center"
          />

          <View className="items-center flex-1">
            <Text
              style={{ color: activeTheme.colors.textSecondary }}
              className="text-[9px] uppercase tracking-widest font-extrabold"
            >
              Lifetime Chants
            </Text>
            <Text
              style={{ color: activeTheme.colors.accent }}
              className="text-2xl font-black mt-1"
            >
              {lifetimeTotalChants.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Continue Sadhana Dismiss Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.85}
            style={{
              backgroundColor: activeTheme.colors.accent,
              shadowColor: activeTheme.colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5
            }}
            className="w-full py-4 rounded-2xl items-center justify-center flex-row"
          >
            <Compass size={18} color="#FFFFFF" className="mr-2" />
            <Text className="text-white font-extrabold tracking-widest text-sm uppercase">
              Continue Sadhana
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glassCard: {}
});

export default CelebrationOverlay;
