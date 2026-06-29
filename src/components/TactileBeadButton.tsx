import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, Animated, Pressable, Platform, StyleSheet, Easing, PanResponder } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, RadialGradient, Ellipse } from 'react-native-svg';
import { Sparkles } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { THEMES } from '../theme/themes';
import { CounterStyle } from '../types';
import {
  MinimalRingStyle,
  RadhaRaniStyle,
  LotusBloomStyle,
  RudrakshaRingStyle,
  SudarshanChakraStyle,
  NeonGlowStyle,
  Dotted108Style,
  MantraOrbitStyle,
  RetroFlipStyle
} from './CounterStyles';

interface TactileBeadProps {
  onPress: () => void;
  currentCount: number;
  themeId: string;
  selectedMantra: string;
  beadDesign: 'saffron-sphere' | 'rudraksha' | 'lotus' | 'sphatik' | 'gold-chakra' | 'tulsi';
  particleEffect: 'none' | 'float' | 'drop' | 'expand' | 'spin';
  soundEnabled: boolean;
  counterStyle: CounterStyle;
  bounceEnabled: boolean;
  sakhisEnabled: boolean;
  glowEffectsEnabled: boolean;
  dragPhysicsEnabled: boolean;
}

interface Particle {
  id: string;
  x: number;
  yAnim: Animated.Value;
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
  rotateAnim: Animated.Value;
  swayAnim: Animated.Value;
}

interface Ripple {
  id: string;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
}

export const TactileBeadButton: React.FC<TactileBeadProps> = ({ 
  onPress, 
  currentCount, 
  themeId,
  selectedMantra,
  beadDesign,
  particleEffect,
  soundEnabled,
  counterStyle,
  bounceEnabled,
  sakhisEnabled,
  glowEffectsEnabled,
  dragPhysicsEnabled
}) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textScaleAnim = useRef(new Animated.Value(1)).current;
  const malaRotationAnim = useRef(new Animated.Value(currentCount)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Dynamic Aura & Chakra Glow (Feature 5)
  const auraProgress = useRef(new Animated.Value(0)).current;
  const goldRotation = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(1)).current;

  // Sync aura progress and loop animations
  useEffect(() => {
    Animated.spring(auraProgress, {
      toValue: currentCount,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start();

    if (currentCount >= 100) {
      // Start slow rotation for golden crown aura
      Animated.loop(
        Animated.timing(goldRotation, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      goldRotation.setValue(0);
    }

    if (currentCount === 108) {
      // Gentle pulsing of golden completed aura
      Animated.loop(
        Animated.sequence([
          Animated.timing(goldPulse, {
            toValue: 1.06,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(goldPulse, {
            toValue: 1.0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      goldPulse.setValue(1);
    }
  }, [currentCount]);
  
  // Track flags using refs to prevent PanResponder stale closures
  const dragPhysicsRef = useRef(dragPhysicsEnabled);
  useEffect(() => {
    dragPhysicsRef.current = dragPhysicsEnabled;
  }, [dragPhysicsEnabled]);

  const handlePressRef = useRef(handlePress);
  
  // Create PanResponder for Swipe/Drag physics
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragPhysicsRef.current,
      onMoveShouldSetPanResponder: () => dragPhysicsRef.current,
      onPanResponderMove: (evt, gestureState) => {
        if (!dragPhysicsRef.current) return;
        // Cap drag Y-offset between 0 and 90px
        const newY = Math.max(0, Math.min(90, gestureState.dy));
        dragY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!dragPhysicsRef.current) return;
        if (gestureState.dy > 55) {
          // Slide down off-screen completely
          Animated.timing(dragY, {
            toValue: 120,
            duration: 120,
            useNativeDriver: true
          }).start(() => {
            // Trigger actual increment count
            handlePressRef.current();
            // Reset to top off-screen
            dragY.setValue(-120);
            // Slide back down to center
            Animated.spring(dragY, {
              toValue: 0,
              friction: 5.5,
              tension: 42,
              useNativeDriver: true
            }).start();
          });
        } else {
          // Snap back to center
          Animated.spring(dragY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;
  
  // Throttle duplicate physical taps
  const lastPressTime = useRef(0);

  // Sound ref for low latency playbacks
  const tapSoundRef = useRef<Audio.Sound | null>(null);
  const radhaSoundRef = useRef<Audio.Sound | null>(null);

  // Sync handlePress ref
  useEffect(() => {
    handlePressRef.current = handlePress;
  }, [handlePress]);

  // Load tap click sound on mount
  useEffect(() => {
    let tapSound: Audio.Sound | null = null;
    let radhaSound: Audio.Sound | null = null;

    const loadTapSound = async () => {
      try {
        const { sound: s1 } = await Audio.Sound.createAsync(
          require('../../assets/tap_click.mp3')
        );
        tapSound = s1;
        tapSoundRef.current = s1;
      } catch (err) {
        console.warn('Failed to pre-load wooden click sound', err);
      }

      try {
        const { sound: s2 } = await Audio.Sound.createAsync(
          require('../../assets/radha_chime.mp3')
        );
        radhaSound = s2;
        radhaSoundRef.current = s2;
      } catch (err) {
        console.warn('Failed to pre-load radha chime sound', err);
      }
    };
    loadTapSound();
    return () => {
      if (tapSound) {
        tapSound.unloadAsync().catch(() => {});
      }
      if (radhaSound) {
        radhaSound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // We track the rotation cumulatively in state so it triggers renders for the 3D ellipse calculations
  const [displayCount, setDisplayCount] = useState(currentCount);

  // Sync external resets or changes (like clearAll or reset bead)
  useEffect(() => {
    const currentMalaIndex = Math.floor(displayCount / 108);
    const expectedCumulative = currentMalaIndex * 108 + currentCount;

    // If there is an external jump or reset, snap rotation to it
    if (Math.abs(displayCount - expectedCumulative) > 1) {
      setDisplayCount(expectedCumulative);
      Animated.spring(malaRotationAnim, {
        toValue: expectedCumulative,
        useNativeDriver: true,
        friction: 8,
        tension: 35
      }).start();
    }
  }, [currentCount]);

  // Interpolations for the layered dynamic aura (Blue, Saffron, Pink, Gold)
  const auraOpacity = useMemo(() => {
    return auraProgress.interpolate({
      inputRange: [0, 36, 72, 108],
      outputRange: [0.65, 0.65, 0.65, 0.95],
      extrapolate: 'clamp'
    });
  }, [auraProgress]);

  const auraScale = useMemo(() => {
    return auraProgress.interpolate({
      inputRange: [0, 54, 108],
      outputRange: [1, 1.05, 1.12],
      extrapolate: 'clamp'
    });
  }, [auraProgress]);

  const goldAuraRotation = useMemo(() => {
    return goldRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
  }, [goldRotation]);

  const renderDynamicAura = () => {
    if (!glowEffectsEnabled) return null;

    let auraColor = '#0ea5e9'; // Blue
    let isGoldCompleted = false;

    if (currentCount >= 108) {
      auraColor = '#fbbf24'; // Gold
      isGoldCompleted = true;
    } else if (currentCount >= 72) {
      auraColor = '#ec4899'; // Pink
    } else if (currentCount >= 36) {
      auraColor = '#f97316'; // Saffron
    }

    return (
      <View style={{ position: 'absolute', width: 320, height: 320, zIndex: 5, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        <Animated.View
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            opacity: auraOpacity,
            transform: [
              { scale: Animated.multiply(auraScale, goldPulse) },
              isGoldCompleted ? { rotate: goldAuraRotation } : { rotate: '0deg' }
            ]
          }}
        >
          <Svg width="300" height="300" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="dynamicAuraGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={auraColor} stopOpacity={0.85} />
                <Stop offset="55%" stopColor={auraColor} stopOpacity={0.25} />
                <Stop offset="100%" stopColor={auraColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#dynamicAuraGlow)" />
            
            {/* Crown of golden rays */}
            {isGoldCompleted && (
              <G transform="translate(50, 50)" stroke="#fbbf24" strokeWidth="0.8" opacity="0.85">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
                  <Path
                    key={i}
                    d="M 0 -25 L 0 -46"
                    transform={`rotate(${deg})`}
                    strokeDasharray="4 2"
                  />
                ))}
              </G>
            )}
          </Svg>
        </Animated.View>
      </View>
    );
  };

  // Pulse the counter text on count change (only if bounceEnabled is true)
  useEffect(() => {
    if (currentCount > 0) {
      textScaleAnim.setValue(1);
      if (bounceEnabled) {
        Animated.sequence([
          Animated.timing(textScaleAnim, {
            toValue: 1.25,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(textScaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          })
        ]).start();
      }
    }
  }, [currentCount]);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const spawnParticle = () => {
    if (particleEffect === 'none') return;
    const id = Math.random().toString(36).substring(7);
    const x = Math.floor(Math.random() * 80) - 40; // horizontal variance
    
    const yAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(1);
    const scaleAnim = new Animated.Value(1);
    const rotateAnim = new Animated.Value(0);
    const swayAnim = new Animated.Value(0);

    const newParticle = { id, x, yAnim, opacityAnim, scaleAnim, rotateAnim, swayAnim };
    setParticles(prev => {
      const active = prev.length >= 8 ? prev.slice(prev.length - 7) : prev;
      return [...active, newParticle];
    });

    const animations = [];

    if (particleEffect === 'float') {
      animations.push(
        Animated.timing(yAnim, {
          toValue: -150,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true
        })
      );
    } else if (particleEffect === 'drop') {
      yAnim.setValue(-130);
      animations.push(
        Animated.timing(yAnim, {
          toValue: 60,
          duration: 950,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 950,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          friction: 3,
          useNativeDriver: true
        })
      );
    } else if (particleEffect === 'expand') {
      scaleAnim.setValue(0.3);
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 2.3,
          duration: 750,
          useNativeDriver: true
        }),
        Animated.timing(yAnim, {
          toValue: -35,
          duration: 750,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true
        })
      );
    } else if (particleEffect === 'spin') {
      animations.push(
        Animated.timing(yAnim, {
          toValue: -150,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      );
    }

    // Run sway loop during flight
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 350 + Math.random() * 150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 350 + Math.random() * 150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    sway.start();

    Animated.parallel(animations).start(() => {
      sway.stop();
      setParticles(prev => prev.filter(p => p.id !== id));
    });
  };

  function handlePress() {
    const now = Date.now();
    // Debounce rapid taps within 120ms to prevent double-counting or skipped frames
    if (now - lastPressTime.current < 120) {
      return;
    }
    lastPressTime.current = now;

    // 1. Play Soft Tactile Wooden Click or Radha Premium Chime sound
    if (soundEnabled) {
      if (themeId === 'radha-rani-premium' && radhaSoundRef.current) {
        radhaSoundRef.current.replayAsync().catch(() => {});
      } else if (tapSoundRef.current) {
        tapSoundRef.current.replayAsync().catch(() => {});
      }
    }

    // 2. Snappy pop bounce animation on tap (only if bounceEnabled is true)
    if (bounceEnabled) {
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.91,
          duration: 70,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3.5,
          tension: 140,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }

    // 3. Increment rotation count forwards (continuous, snappier snap physics)
    const nextCumulative = displayCount + 1;
    setDisplayCount(nextCumulative);
    Animated.spring(malaRotationAnim, {
      toValue: nextCumulative,
      useNativeDriver: true,
      friction: 6,
      tension: 85
    }).start();

    // 4. Spawn floating particles and trigger onPress
    spawnParticle();
    onPress();
  }

  const isRadhaTheme = themeId === 'radha-rani-premium';

  const getParticleText = (id: string) => {
    if (isRadhaTheme) {
      const seed = id.charCodeAt(0) + (id.charCodeAt(1) || 0);
      const choices = ['राधा', 'राधे राधे', 'ॐ', 'राधा'];
      return choices[seed % choices.length];
    }
    return selectedMantra;
  };

  const getParticleStyle = () => {
    if (isRadhaTheme) {
      return {
        color: '#FFF1F2',
        textShadowColor: '#ec4899',
        textShadowRadius: 8,
        fontSize: 22,
        fontWeight: '900' as const,
      };
    }
    return {
      color: (beadDesign === 'rudraksha' || beadDesign === 'tulsi') ? '#F59E0B' : '#FFFFFF',
      fontSize: selectedMantra.length > 5 ? 18 : 24,
      fontWeight: '900' as const,
    };
  };

  const neumorphicStyle = useMemo(() => {
    if (!glowEffectsEnabled) {
      return {};
    }
    if (isDark) {
      return {
        shadowColor: activeTheme.colors.shadowColor,
        shadowOffset: isPressed ? { width: 3, height: 3 } : { width: 12, height: 12 },
        shadowOpacity: 0.85,
        shadowRadius: isPressed ? 6 : 16,
        elevation: isPressed ? 4 : 20,
      };
    } else {
      return {
        shadowColor: activeTheme.colors.shadowColor,
        shadowOffset: isPressed ? { width: 3, height: 3 } : { width: 10, height: 10 },
        shadowOpacity: 0.9,
        shadowRadius: isPressed ? 5 : 12,
        elevation: isPressed ? 3 : 15,
      };
    }
  }, [isDark, isPressed, activeTheme, glowEffectsEnabled]);

  // Get base multiple of 24 to keep the 3D interpolation range centered and infinite
  const baseCount = Math.floor(displayCount / 24) * 24;

  const beadInterpolations = useMemo(() => {
    const interpolations = [];
    const N = 24;
    const radiusX = 132;
    const radiusY = 62;
    
    // We cover a range from baseCount - 24 to baseCount + 48
    const start = baseCount - 24;
    const end = baseCount + 48;
    
    const inputRange = [];
    for (let c = start; c <= end; c++) {
      inputRange.push(c);
    }

    for (let k = 0; k < N; k++) {
      const angle_k = (k * 2 * Math.PI) / N;
      const translateXRange = [];
      const translateYRange = [];
      const scaleRange = [];
      const opacityRange = [];

      for (let c = start; c <= end; c++) {
        // Angle decreases as c increases (moving counter-clockwise)
        const theta = angle_k - (c * 2 * Math.PI) / N;
        const x = radiusX * Math.cos(theta);
        const y = radiusY * Math.sin(theta);
        
        const sinVal = Math.sin(theta);
        const depth = (sinVal + 1) / 2;
        
        translateXRange.push(x);
        translateYRange.push(y);
        scaleRange.push(0.55 + 0.45 * depth);
        opacityRange.push(0.25 + 0.75 * depth);
      }

      interpolations.push({
        translateX: malaRotationAnim.interpolate({
          inputRange,
          outputRange: translateXRange,
          extrapolate: 'clamp'
        }),
        translateY: malaRotationAnim.interpolate({
          inputRange,
          outputRange: translateYRange,
          extrapolate: 'clamp'
        }),
        scale: malaRotationAnim.interpolate({
          inputRange,
          outputRange: scaleRange,
          extrapolate: 'clamp'
        }),
        opacity: malaRotationAnim.interpolate({
          inputRange,
          outputRange: opacityRange,
          extrapolate: 'clamp'
        })
      });
    }
    return interpolations;
  }, [baseCount, malaRotationAnim]);

  const render3DBead = (k: number) => {
    const isSumeru = k === 0;
    const size = isSumeru ? 32 : 24;
    const r = size / 2;
    
    switch (beadDesign) {
      case 'rudraksha':
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`rudraBead-${k}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#b0785a" />
                <Stop offset="65%" stopColor="#5c3a21" />
                <Stop offset="100%" stopColor="#1C0F08" />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#rudraBead-${k})`} stroke="#1C0F08" strokeWidth={0.5} />
            <Path d={`M ${r} 1 Q ${r - 3} ${r} ${r} ${size - 1}`} stroke="#150a04" strokeWidth={0.8} fill="none" opacity={0.7} />
            <Path d={`M ${r} 1 Q ${r + 3} ${r} ${r} ${size - 1}`} stroke="#150a04" strokeWidth={0.8} fill="none" opacity={0.7} />
            {isSumeru && (
              <Circle cx={r} cy={r} r={r - 1} stroke="#ffd700" strokeWidth={1} fill="none" />
            )}
          </Svg>
        );

      case 'tulsi':
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`tulsiBead-${k}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#f7ecd7" />
                <Stop offset="60%" stopColor="#d2b48c" />
                <Stop offset="100%" stopColor="#663c1a" />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#tulsiBead-${k})`} stroke="#5c3a21" strokeWidth={0.5} />
            <Path d={`M 3 ${r - 2} Q ${r} ${r - 4} ${size - 3} ${r - 2}`} stroke="#663c1a" strokeWidth={0.4} fill="none" opacity={0.4} />
            <Path d={`M 3 ${r + 2} Q ${r} ${r} ${size - 3} ${r + 2}`} stroke="#663c1a" strokeWidth={0.4} fill="none" opacity={0.4} />
          </Svg>
        );

      case 'lotus':
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`lotusBead-${k}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#fda4af" />
                <Stop offset="70%" stopColor="#e11d48" />
                <Stop offset="100%" stopColor="#4c0519" />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#lotusBead-${k})`} stroke="#fda4af" strokeWidth={0.5} />
          </Svg>
        );

      case 'sphatik':
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`sphatikBead-${k}`} cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#ffffff" />
                <Stop offset="45%" stopColor="#e0f2fe" />
                <Stop offset="85%" stopColor="#38bdf8" />
                <Stop offset="100%" stopColor="#0284c7" />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#sphatikBead-${k})`} stroke="#bae6fd" strokeWidth={0.5} />
            <Circle cx={r - 3} cy={r - 3} r={size * 0.15} fill="#ffffff" opacity={0.6} />
          </Svg>
        );

      case 'gold-chakra':
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`goldBead-${k}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#fef08a" />
                <Stop offset="60%" stopColor="#eab308" />
                <Stop offset="100%" stopColor="#713f12" />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#goldBead-${k})`} stroke="#fef08a" strokeWidth={0.5} />
            <Circle cx={r} cy={r} r={r - 4} stroke="#fef9c3" strokeWidth={0.5} fill="none" opacity={0.5} />
          </Svg>
        );

      case 'saffron-sphere':
      default:
        return (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id={`saffronBead-${k}`} cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor={activeTheme.colors.beadBgStart} />
                <Stop offset="65%" stopColor={activeTheme.colors.beadBgMiddle} />
                <Stop offset="100%" stopColor={activeTheme.colors.beadBgEnd} />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r - 1} fill={`url(#saffronBead-${k})`} stroke={activeTheme.colors.accentLight} strokeWidth={0.5} />
          </Svg>
        );
    }
  };

  // Render the central bead sphere designs (with style={{ position: 'absolute' }} to prevent layout offsets)
  const renderBeadDesign = () => {
    switch (beadDesign) {
      case 'rudraksha':
        return (
          <Svg width="196" height="196" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="rudraCore" cx="35%" cy="35%" r="70%">
                <Stop offset="0%" stopColor="#8c583a" />
                <Stop offset="50%" stopColor="#5c3a21" />
                <Stop offset="100%" stopColor="#1C0F08" />
              </RadialGradient>
            </Defs>
            <Circle cx="98" cy="98" r="98" fill="url(#rudraCore)" />
            {/* Rough textured knobs */}
            {[
              { cx: 50, cy: 60, r: 8 }, { cx: 140, cy: 70, r: 10 },
              { cx: 80, cy: 130, r: 12 }, { cx: 120, cy: 150, r: 9 },
              { cx: 60, cy: 110, r: 11 }, { cx: 130, cy: 110, r: 7 },
              { cx: 98, cy: 36, r: 10 }, { cx: 98, cy: 160, r: 8 },
              { cx: 40, cy: 90, r: 9 }, { cx: 156, cy: 98, r: 11 }
            ].map((b, idx) => (
              <Circle key={`b1-${idx}`} cx={b.cx} cy={b.cy} r={b.r} fill="#23140b" opacity={0.75} />
            ))}
            {[
              { cx: 55, cy: 65, r: 5 }, { cx: 135, cy: 75, r: 6 },
              { cx: 85, cy: 125, r: 8 }, { cx: 115, cy: 145, r: 5 },
              { cx: 65, cy: 115, r: 7 }, { cx: 125, cy: 105, r: 4 }
            ].map((b, idx) => (
              <Circle key={`b2-${idx}`} cx={b.cx} cy={b.cy} r={b.r} fill="#a06c4c" opacity={0.35} />
            ))}
            {/* Grooves representing segments */}
            <Path d="M 98 0 Q 86 98 98 196" stroke="#0f0703" strokeWidth="4.5" fill="none" opacity={0.85} />
            <Path d="M 98 0 Q 40 98 98 196" stroke="#0f0703" strokeWidth="4.5" fill="none" opacity={0.8} />
            <Path d="M 98 0 Q 156 98 98 196" stroke="#0f0703" strokeWidth="4.5" fill="none" opacity={0.8} />
            <Path d="M 98 0 Q 60 49 30 98 Q 60 147 98 196" stroke="#0f0703" strokeWidth="3" fill="none" opacity={0.7} />
            <Path d="M 98 0 Q 136 49 166 98 Q 136 147 98 196" stroke="#0f0703" strokeWidth="3" fill="none" opacity={0.7} />
          </Svg>
        );

      case 'tulsi':
        return (
          <Svg width="196" height="196" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="tulsiBg" cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#f5ead4" />
                <Stop offset="60%" stopColor="#d2b48c" />
                <Stop offset="100%" stopColor="#784b24" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#tulsiBg)" />
            {/* Horizontal wood grain textures */}
            <Path d="M 10 35 Q 50 25 90 35" stroke="#5c3a21" strokeWidth="0.8" fill="none" opacity="0.3" />
            <Path d="M 5 50 Q 50 42 95 50" stroke="#5c3a21" strokeWidth="1" fill="none" opacity="0.25" />
            <Path d="M 10 65 Q 50 58 90 65" stroke="#5c3a21" strokeWidth="0.8" fill="none" opacity="0.3" />
            <Path d="M 20 80 Q 50 75 80 80" stroke="#5c3a21" strokeWidth="0.6" fill="none" opacity="0.2" />
            <Path d="M 20 20 Q 50 12 80 20" stroke="#5c3a21" strokeWidth="0.6" fill="none" opacity="0.2" />
          </Svg>
        );

      case 'lotus':
        return (
          <Svg width="196" height="196" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="lotusBg" cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#f43f5e" />
                <Stop offset="70%" stopColor="#be123c" />
                <Stop offset="100%" stopColor="#4c0519" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#lotusBg)" />
            
            <G stroke="#fef08a" strokeWidth="1.2" fill="none" transform="translate(10, 15) scale(0.8)">
              <Path d="M 50 15 C 38 45 42 65 50 75 C 58 65 62 45 50 15 Z" fill="#fda4af" opacity={0.2} />
              <Path d="M 50 25 C 22 45 32 68 50 75 C 38 60 38 40 50 25 Z" fill="#fda4af" opacity={0.15} />
              <Path d="M 50 25 C 78 45 68 68 50 75 C 62 60 62 40 50 25 Z" fill="#fda4af" opacity={0.15} />
              <Path d="M 50 38 C 12 50 18 70 42 75 C 28 65 35 52 50 38 Z" fill="#f43f5e" opacity={0.1} strokeWidth="0.8" />
              <Path d="M 50 38 C 88 50 82 70 58 75 C 72 65 65 52 50 38 Z" fill="#f43f5e" opacity={0.1} strokeWidth="0.8" />
              <Path d="M 50 75 C 30 82 25 72 38 68 C 30 72 35 78 50 75 Z" opacity={0.3} strokeWidth="0.8" />
              <Path d="M 50 75 C 70 82 75 72 62 68 C 70 72 65 78 50 75 Z" opacity={0.3} strokeWidth="0.8" />
            </G>
          </Svg>
        );

      case 'sphatik':
        return (
          <Svg width="196" height="196" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="sphatikBg" cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#ffffff" />
                <Stop offset="40%" stopColor="#e0f2fe" />
                <Stop offset="80%" stopColor="#7dd3fc" />
                <Stop offset="100%" stopColor="#0284c7" />
              </RadialGradient>
            </Defs>
            <Circle cx="98" cy="98" r="98" fill="url(#sphatikBg)" />
          </Svg>
        );

      case 'gold-chakra':
        return (
          <Svg width="196" height="196" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="goldBg" cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#fef08a" />
                <Stop offset="60%" stopColor="#ca8a04" />
                <Stop offset="100%" stopColor="#502005" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#goldBg)" />
            
            <G stroke="#fef9c3" strokeWidth="1.2" fill="none" transform="translate(10, 10) scale(0.8)">
              <Circle cx="50" cy="50" r="8" fill="#ca8a04" stroke="#fef9c3" strokeWidth="1.5" />
              <Circle cx="50" cy="50" r="3" fill="#fef9c3" />
              <Circle cx="50" cy="50" r="42" stroke="#fef9c3" strokeWidth="2" />
              <Circle cx="50" cy="50" r="36" stroke="#a16207" strokeWidth="0.8" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
                <G key={`spoke-${idx}`} transform={`rotate(${angle}, 50, 50)`}>
                  <Path d="M 50 16 L 50 42" stroke="#fef9c3" strokeWidth="1.2" />
                  <Circle cx="50" cy="29" r="1.5" fill="#fef9c3" />
                </G>
              ))}
            </G>
          </Svg>
        );

      case 'saffron-sphere':
      default:
        return (
          <Svg width="196" height="196" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id={`beadGrad-${themeId}`} x1="10%" y1="10%" x2="90%" y2="90%">
                <Stop offset="0%" stopColor={activeTheme.colors.beadBgStart} />
                <Stop offset="60%" stopColor={activeTheme.colors.beadBgMiddle} />
                <Stop offset="100%" stopColor={activeTheme.colors.beadBgEnd} />
              </LinearGradient>
            </Defs>
            <Circle cx="98" cy="98" r="98" fill={`url(#beadGrad-${themeId})`} />
          </Svg>
        );
    }
  };

  const renderCounterVisual = () => {
    const progress = currentCount / 108;

    const styleProps = {
      currentCount,
      progress,
      activeTheme,
      beadDesign,
      selectedMantra,
      scaleAnim,
      textScaleAnim,
      malaRotationAnim,
      isPressed,
      sakhisEnabled,
      glowEffectsEnabled
    };

    switch (counterStyle) {
      case 'minimal-ring':
        return <MinimalRingStyle {...styleProps} />;
      case 'radha-rani':
        return <RadhaRaniStyle {...styleProps} />;
      case 'lotus-bloom':
        return <LotusBloomStyle {...styleProps} />;
      case 'rudraksha-ring':
        return <RudrakshaRingStyle {...styleProps} />;
      case 'sudarshan-chakra':
        return <SudarshanChakraStyle {...styleProps} />;
      case 'neon-glow':
        return <NeonGlowStyle {...styleProps} />;
      case 'dotted-108':
        return <Dotted108Style {...styleProps} />;
      case 'mantra-orbit':
        return <MantraOrbitStyle {...styleProps} />;
      case 'retro-flip':
        return <RetroFlipStyle {...styleProps} />;
      case 'classic-3d':
      default:
        return null;
    }
  };

  if (counterStyle !== 'classic-3d') {
    return (
      <View style={{ width: 270, height: 270, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {renderDynamicAura()}
        <Animated.View
          style={[
            neumorphicStyle,
            { transform: [{ scale: scaleAnim }, { translateY: dragY }], zIndex: 20, borderRadius: 9999 }
          ]}
          {...(dragPhysicsEnabled ? panResponder.panHandlers : {})}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={{
              width: 220,
              height: 220,
              backgroundColor: activeTheme.colors.beadContainerBg,
              borderWidth: 6,
              borderColor: activeTheme.colors.beadBorder,
              borderRadius: 110,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderCounterVisual()}
          </Pressable>
        </Animated.View>

        {/* Floating Particles Render */}
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          {particles.map(p => {
            const rotation = p.rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            });

            const translateX = p.swayAnim.interpolate({
              inputRange: [-1, 1],
              outputRange: [p.x - 24, p.x + 24]
            });

            return (
              <Animated.View
                key={p.id}
                style={{
                  position: 'absolute',
                  transform: [
                    { translateX },
                    { translateY: p.yAnim },
                    { scale: p.scaleAnim },
                    { rotate: rotation }
                  ],
                  opacity: p.opacityAnim,
                  zIndex: 99,
                }}
              >
                <Text style={getParticleStyle()}>
                  {getParticleText(p.id)}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Under-shadow light source reflection helper for Neumorphism */}
        {glowEffectsEnabled && (
          <View
            style={{
              width: 192,
              height: 8,
              borderRadius: 9999,
              opacity: 0.3,
              marginTop: 24,
              backgroundColor: activeTheme.colors.highlightColor,
              shadowColor: isDark ? '#FFFFFF' : 'transparent',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ width: 270, height: 270, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {renderDynamicAura()}
      
      {/* 3D Tilted Mala String Thread */}
      <View style={{ position: 'absolute', width: 270, height: 270, zIndex: 8 }} pointerEvents="none">
        <Svg width="270" height="270">
          <Ellipse
            cx="135"
            cy="135"
            rx="132"
            ry="62"
            fill="none"
            stroke={activeTheme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </Svg>
      </View>

      {/* 3D Rotating Mala Beads */}
      {beadInterpolations.map((interp, k) => {
        const N = 24;
        const theta_k = (k * 2 * Math.PI) / N - (displayCount * 2 * Math.PI) / N;
        const isFront = Math.sin(theta_k) >= 0;
        const zIndex = isFront ? 30 : 10;

        return (
          <Animated.View
            key={`bead3d-${k}`}
            style={{
              position: 'absolute',
              left: 135 - (k === 0 ? 16 : 12),
              top: 135 - (k === 0 ? 16 : 12),
              transform: [
                { translateX: interp.translateX },
                { translateY: interp.translateY },
                { scale: interp.scale }
              ],
              opacity: interp.opacity,
              zIndex: zIndex
            }}
            pointerEvents="none"
          >
            {render3DBead(k)}
            
            {/* Hanging tassel for Sumeru bead (index 0) */}
            {k === 0 && (
              <View style={{ position: 'absolute', top: 30, left: 16 - 3, alignItems: 'center' }}>
                <View style={{ width: 6, height: 4, backgroundColor: '#d97706', borderRadius: 1.5 }} />
                <View style={{ width: 4, height: 16, backgroundColor: '#dc2626', borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
              </View>
            )}
          </Animated.View>
        );
      })}


      {/* 3D Chanting Bead Button (Centered inside 270x270 wrapper) */}
      <Animated.View
        style={[
          neumorphicStyle,
          { transform: [{ scale: scaleAnim }, { translateY: dragY }], zIndex: 20, borderRadius: 9999 }
        ]}
        {...(dragPhysicsEnabled ? panResponder.panHandlers : {})}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={{
            width: 220,
            height: 220,
            backgroundColor: activeTheme.colors.beadContainerBg,
            borderWidth: 6,
            borderColor: activeTheme.colors.beadBorder,
            borderRadius: 110,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner Raised Glowing Bead Sphere */}
          <View
            style={{
              width: 196,
              height: 196,
              backgroundColor: activeTheme.colors.accent,
              borderRadius: 98,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Layered Designs (Absolutely Positioned) */}
            {renderBeadDesign()}

            {/* Specular Highlight / Glassy Gloss */}
            {beadDesign !== 'rudraksha' && (
              <>
                <View
                  className="absolute rounded-full"
                  style={{
                    top: 15,
                    left: 20,
                    width: 90,
                    height: 45,
                    backgroundColor: beadDesign === 'sphatik' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.22)',
                    transform: [{ rotate: '-35deg' }],
                  }}
                />
                {beadDesign === 'sphatik' && (
                  <View
                    className="absolute rounded-full"
                    style={{
                      bottom: 22,
                      right: 30,
                      width: 60,
                      height: 25,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      transform: [{ rotate: '145deg' }],
                    }}
                  />
                )}
              </>
            )}

            {/* Inner Ring Glow */}
            <View
              className="absolute rounded-full border-2 border-white/10"
              style={{
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
              }}
            />

            {/* Centered Spiritual Symbol Overlay or Counter */}
            <Animated.View 
              style={{ transform: [{ scale: textScaleAnim }], alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <Text 
                className="text-white text-5xl font-bold tracking-widest text-shadow-lg" 
                style={{ 
                  fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
                }}
              >
                {currentCount}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
                JAP
              </Text>
            </Animated.View>

            {/* Micro-sparkle decorative icon */}
            <View style={{ position: 'absolute', bottom: 24, alignItems: 'center' }}>
              <Sparkles size={16} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Floating Particles Render */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        {particles.map(p => {
          const rotation = p.rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          });

          const translateX = p.swayAnim.interpolate({
            inputRange: [-1, 1],
            outputRange: [p.x - 24, p.x + 24]
          });

          return (
            <Animated.View
              key={p.id}
              style={{
                position: 'absolute',
                transform: [
                  { translateX },
                  { translateY: p.yAnim },
                  { scale: p.scaleAnim },
                  { rotate: rotation }
                ],
                opacity: p.opacityAnim,
                zIndex: 99,
              }}
            >
              <Text style={getParticleStyle()}>
                {getParticleText(p.id)}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Under-shadow light source reflection helper for Neumorphism */}
      {glowEffectsEnabled && (
        <View
          style={{
            width: 192,
            height: 8,
            borderRadius: 9999,
            opacity: 0.3,
            marginTop: 24,
            backgroundColor: activeTheme.colors.highlightColor,
            shadowColor: isDark ? '#FFFFFF' : 'transparent',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
          }}
        />
      )}
    </View>
  );
};

export default TactileBeadButton;
