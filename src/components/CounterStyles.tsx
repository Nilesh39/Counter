import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, RadialGradient, Ellipse, Text as SvgText, TextPath } from 'react-native-svg';
import { Sparkles, Heart } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface StyleProps {
  currentCount: number;
  progress: number; // 0 to 1
  activeTheme: any;
  beadDesign: string;
  selectedMantra: string;
  scaleAnim: Animated.Value;
  textScaleAnim: Animated.Value;
  malaRotationAnim: Animated.Value;
  isPressed: boolean;
  sakhisEnabled: boolean;
  glowEffectsEnabled: boolean;
}

// 2. Minimalist Ring (Simple) - Clean progress ring & central number
export const MinimalRingStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  selectedMantra,
  textScaleAnim,
}) => {
  const size = 220;
  const radius = 90;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="minimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeTheme.colors.accentLight} />
            <Stop offset="100%" stopColor={activeTheme.colors.accent} />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeTheme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#minimalGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Central counter */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.minimalCountText,
            { color: activeTheme.colors.textPrimary, transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
        <Text style={[styles.minimalMantraText, { color: activeTheme.colors.accent }]}>
          {selectedMantra.length > 10 ? selectedMantra.substring(0, 10) + '...' : selectedMantra}
        </Text>
      </View>
    </View>
  );
};

// 3. Radha Rani Style - Pink/gold, peacock feather, lotus & rotating names
const RADHA_NAMES = [
  'राधे राधे',
  'श्री राधा',
  'किशोरी जी',
  'श्यामा जी',
  'लाड़ली जी',
  'वृषभानुसुता',
  'वृंदावनेश्वरी',
  'स्वामिनी जी',
  'कृपा सिंधु',
  'राधा रानी'
];

const SAKHIS = ['Lalita', 'Vishakha', 'Chitra', 'Indulekha', 'Champakalata', 'Rangadevi', 'Tungavidya', 'Sudevi'];

export const RadhaRaniStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  textScaleAnim,
  malaRotationAnim,
  sakhisEnabled,
  glowEffectsEnabled
}) => {
  const size = 220;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // local states for name transitions
  const [displayName, setDisplayName] = useState(RADHA_NAMES[currentCount % RADHA_NAMES.length]);
  const nameOpacity = React.useRef(new Animated.Value(1)).current;
  const nameTranslateY = React.useRef(new Animated.Value(0)).current;

  // continuous peacock feather sway animation
  const [featherSway] = useState(new Animated.Value(0));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(featherSway, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(featherSway, {
          toValue: -1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // animate names on count changes
  const targetName = RADHA_NAMES[currentCount % RADHA_NAMES.length];
  useEffect(() => {
    if (targetName !== displayName) {
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true
        }),
        Animated.timing(nameTranslateY, {
          toValue: -8,
          duration: 120,
          useNativeDriver: true
        })
      ]).start(() => {
        setDisplayName(targetName);
        nameTranslateY.setValue(8);
        Animated.parallel([
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true
          }),
          Animated.timing(nameTranslateY, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true
          })
        ]).start();
      });
    }
  }, [currentCount, targetName]);

  // Ashtasakhi Blessings popup state
  const [sakhiBlessing, setSakhiBlessing] = useState<string | null>(null);

  // Local pulsing value for the active Gopi dots glow
  const [dotPulse] = useState(new Animated.Value(0.35));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(dotPulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (sakhisEnabled && currentCount > 0 && currentCount % 8 === 0) {
      const sakhiIndex = Math.floor((currentCount / 8) - 1) % SAKHIS.length;
      setSakhiBlessing(`${SAKHIS[sakhiIndex]} Kripa!`);
      const timer = setTimeout(() => {
        setSakhiBlessing(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentCount, sakhisEnabled]);



  // Calculate lotus blooming petals scale/opacity based on progress ranges
  const getPetalProps = (minVal: number, maxVal: number) => {
    if (progress < minVal) return { scale: 0.55, opacity: 0.05 };
    if (progress > maxVal) return { scale: 1.0, opacity: 0.85 };
    const factor = (progress - minVal) / (maxVal - minVal);
    return {
      scale: 0.55 + 0.45 * factor,
      opacity: 0.05 + 0.8 * factor
    };
  };

  const petal1 = getPetalProps(0, 0.33);   // Lower/outer petals
  const petal2 = getPetalProps(0.33, 0.66); // Mid/side petals
  const petal3 = getPetalProps(0.66, 1.0);  // Central core petals

  // Generate 8 Sakhi coordinates relative to center (0,0) so we can rotate the SVG group container
  const sakhis = useMemo(() => {
    const arr = [];
    const sRadius = 82;
    const details = [
      { name: 'Lalita', initial: 'ल' },
      { name: 'Vishakha', initial: 'वि' },
      { name: 'Chitra', initial: 'चि' },
      { name: 'Indulekha', initial: 'इ' },
      { name: 'Champakalata', initial: 'च' },
      { name: 'Rangadevi', initial: 'र' },
      { name: 'Tungavidya', initial: 'तु' },
      { name: 'Sudevi', initial: 'सु' },
    ];
    for (let i = 0; i < 8; i++) {
      const angleDeg = i * 45;
      const angleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2;
      const x = sRadius * Math.cos(angleRad);
      const y = sRadius * Math.sin(angleRad);
      arr.push({ x, y, ...details[i], index: i });
    }
    return arr;
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffd700" />
            <Stop offset="50%" stopColor="#d97706" />
            <Stop offset="100%" stopColor="#ca8a04" />
          </LinearGradient>
          <LinearGradient id="radhaPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f472b6" />
            <Stop offset="50%" stopColor="#ec4899" />
            <Stop offset="100%" stopColor="#db2777" />
          </LinearGradient>
          
          {/* Lotus gradients */}
          <LinearGradient id="lotusCrimsonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff4500" />
            <Stop offset="45%" stopColor="#db7093" />
            <Stop offset="100%" stopColor="#800020" />
          </LinearGradient>
          <LinearGradient id="lotusRoseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff69b4" />
            <Stop offset="100%" stopColor="#c71585" />
          </LinearGradient>
          <LinearGradient id="lotusDeepPinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff85c0" />
            <Stop offset="100%" stopColor="#d81b60" />
          </LinearGradient>
          <LinearGradient id="lotusSoftPinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffd1dc" />
            <Stop offset="100%" stopColor="#ec4899" />
          </LinearGradient>

          <RadialGradient id="sakhiPulseGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffd700" stopOpacity={0.65} />
            <Stop offset="45%" stopColor="#eab308" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="radhaCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fffdf6" />
            <Stop offset="65%" stopColor="#fff0f5" />
            <Stop offset="100%" stopColor="#ffd1dc" />
          </RadialGradient>
        </Defs>

        {/* Central background */}
        <Circle cx={size / 2} cy={size / 2} r={radius - 12} fill="url(#radhaCore)" />

        {/* Swaying Peacock Feather in background */}
        <AnimatedG
          transform={[
            { translateX: size / 2 + 8 },
            { translateY: size / 2 - 58 },
            { rotate: featherSway.interpolate({
                inputRange: [-1, 1],
                outputRange: ['11deg', '21deg']
              })
            },
            { scale: 0.65 }
          ]}
          opacity={0.35}
        >
          {/* Stem */}
          <Path d="M -18 70 C -4 40 8 10 16 -20" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          
          {/* Delicate Barbs */}
          <Path d="M 8 10 Q -15 2 -25 5 M 6 18 Q -18 10 -28 14 M 3 26 Q -22 18 -32 24 M 0 34 Q -25 28 -35 34" stroke="#15803d" strokeWidth="0.8" fill="none" opacity={0.7} />
          <Path d="M 12 2 Q 32 15 42 10 M 10 10 Q 30 23 40 18 M 7 18 Q 27 31 37 26 M 4 26 Q 24 39 34 34" stroke="#15803d" strokeWidth="0.8" fill="none" opacity={0.7} />
          
          {/* Peacock Eye */}
          <Ellipse cx="16" cy="-20" rx="19" ry="23" fill="#ca8a04" />
          <Ellipse cx="16" cy="-18" rx="14" ry="17" fill="#059669" />
          <Ellipse cx="16" cy="-16" rx="10" ry="12" fill="#2563eb" />
          <Path d="M 9 -14 C 9 -21 23 -21 23 -14 C 23 -9 9 -9 9 -14" fill="#1e1b4b" />
          <Circle cx="12" cy="-17" r="2.2" fill="#ffffff" opacity={0.95} />
        </AnimatedG>

        {/* Intricate golden mandala filigree backdrop */}
        <G opacity={0.32}>
          <Circle cx="110" cy="110" r="90" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <Circle cx="110" cy="110" r="76" stroke="#d4af37" strokeWidth="0.8" fill="none" opacity={0.7} />
          <Circle cx="110" cy="110" r="48" stroke="#d4af37" strokeWidth="0.6" fill="none" opacity={0.5} />
          
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => (
            <G key={`filigree-${idx}`} transform={`translate(110, 110) rotate(${deg})`}>
              <Path d="M 0 0 L 0 -88" stroke="#d4af37" strokeWidth="0.5" opacity={0.5} />
              <Path d="M -3.5 -70 L 0 -76 L 3.5 -70 L 0 -64 Z" fill="#d4af37" opacity={0.7} />
              <Path d="M 0 0 C -7 -18 0 -38 0 -42 C 0 -38 7 -18 0 0" stroke="#d4af37" strokeWidth="0.6" fill="none" opacity={0.35} />
            </G>
          ))}
        </G>

        {/* Dynamic Blooming Lotus Petals in Center */}
        <G transform="translate(110, 110)">
          {/* Bottom backdrop petal */}
          <G transform={`rotate(180) scale(${petal1.scale})`} opacity={petal1.opacity * 0.8}>
            <Path d="M 0 -5 C -15 -18 0 -35 0 -38 C 0 -35 15 -18 0 -5 Z" fill="url(#lotusSoftPinkGrad)" />
          </G>
          {/* Left Lower Petal */}
          <G transform={`rotate(-95) scale(${petal1.scale})`} opacity={petal1.opacity}>
            <Path d="M 0 -5 C -25 -15 -20 -38 0 -42 C -10 -32 5 -22 0 -5 Z" fill="url(#lotusSoftPinkGrad)" />
          </G>
          {/* Right Lower Petal */}
          <G transform={`rotate(95) scale(${petal1.scale})`} opacity={petal1.opacity}>
            <Path d="M 0 -5 C -5 -22 10 -32 0 -42 C 20 -38 25 -15 0 -5 Z" fill="url(#lotusSoftPinkGrad)" />
          </G>

          {/* Left Middle Petal */}
          <G transform={`rotate(-62) scale(${petal2.scale})`} opacity={petal2.opacity}>
            <Path d="M 0 -5 C -22 -25 -15 -48 0 -52 C -8 -42 8 -30 0 -5 Z" fill="url(#lotusDeepPinkGrad)" />
          </G>
          {/* Right Middle Petal */}
          <G transform={`rotate(62) scale(${petal2.scale})`} opacity={petal2.opacity}>
            <Path d="M 0 -5 C -8 -30 8 -42 0 -52 C 15 -48 22 -25 0 -5 Z" fill="url(#lotusDeepPinkGrad)" />
          </G>

          {/* Left Upper Petal */}
          <G transform={`rotate(-28) scale(${petal3.scale})`} opacity={petal3.opacity}>
            <Path d="M 0 -5 C -20 -30 -10 -55 0 -60 C -5 -50 10 -35 0 -5 Z" fill="url(#lotusRoseGrad)" />
          </G>
          {/* Right Upper Petal */}
          <G transform={`rotate(28) scale(${petal3.scale})`} opacity={petal3.opacity}>
            <Path d="M 0 -5 C -10 -35 5 -50 0 -60 C 10 -55 20 -30 0 -5 Z" fill="url(#lotusRoseGrad)" />
          </G>
          {/* Central main upright petal */}
          <G transform={`scale(${petal3.scale})`} opacity={petal3.opacity}>
            <Path d="M 0 -5 C -15 -35 0 -60 0 -65 C 0 -60 15 -35 0 -5 Z" fill="url(#lotusCrimsonGrad)" stroke="#ffd700" strokeWidth="0.5" />
          </G>
        </G>

        {/* Thin gold guide circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#d4af37"
          strokeWidth="1.2"
          fill="none"
          opacity={0.35}
        />

        {/* Active pink progress track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#radhaPinkGrad)"
          strokeWidth="4.2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Fixed Gopi Dots Container */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          pointerEvents: 'none'
        }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {sakhis.map((s) => {
            const isCompleted = currentCount >= (s.index + 1) * 13.5;
            const isCurrent = s.index === Math.floor(currentCount / 13.5) && currentCount < 108;
            const isActive = isCompleted || isCurrent;

            return (
              <G key={`sakhi-group-${s.index}`}>
                {/* Active Pulsing Glow Layer */}
                {isCurrent && glowEffectsEnabled && (
                  <AnimatedCircle
                    cx={size / 2 + s.x}
                    cy={size / 2 + s.y}
                    r={20}
                    fill="url(#sakhiPulseGrad)"
                    opacity={dotPulse}
                  />
                )}
                
                {/* Base Outer Circle */}
                <Circle
                  cx={size / 2 + s.x}
                  cy={size / 2 + s.y}
                  r={isCurrent ? 14 : 11}
                  fill={isActive ? '#fffdf6' : 'rgba(255,255,255,0.25)'}
                  stroke={isActive ? 'url(#goldBorderGrad)' : '#fbcfe8'}
                  strokeWidth={isActive ? 1.8 : 1}
                />

                {/* Inner filigree gold line */}
                {isActive && (
                  <Circle
                    cx={size / 2 + s.x}
                    cy={size / 2 + s.y}
                    r={isCurrent ? 11.5 : 9}
                    stroke="#AA771C"
                    strokeWidth={0.4}
                    fill="none"
                  />
                )}

                {/* Orbiting stars sparkles for active Sakhi */}
                {isCurrent && (
                  <G transform={`translate(${size / 2 + s.x}, ${size / 2 + s.y})`}>
                    <Circle cx="-15" cy="-8" r="1.2" fill="#ffd700" />
                    <Circle cx="15" cy="8" r="1.2" fill="#ffd700" />
                  </G>
                )}
                
                {/* Sakhi Sanskrit Initial Text */}
                <SvgText
                  x={size / 2 + s.x}
                  y={size / 2 + s.y + (Platform.OS === 'android' ? 4.2 : 3.5)}
                  fontSize={isCurrent ? "11.5" : "9"}
                  fontWeight="bold"
                  fill={isActive ? '#8b0000' : '#db2777'}
                  textAnchor="middle"
                >
                  {s.initial}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Pulsing Auric Halo behind the central name */}
      {glowEffectsEnabled && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: '#fda4af',
            opacity: textScaleAnim.interpolate({
              inputRange: [1, 1.25],
              outputRange: [0.12, 0.42]
            }),
            transform: [{
              scale: textScaleAnim.interpolate({
                inputRange: [1, 1.25],
                outputRange: [0.8, 1.25]
              })
            }]
          }}
          pointerEvents="none"
        />
      )}

      {/* Central Names with Slide/Fade Transition */}
      <View style={styles.centerAbsolute}>
        <Animated.View
          style={{
            opacity: nameOpacity,
            transform: [{ translateY: nameTranslateY }, { scale: textScaleAnim }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={[
              styles.radhaNameText,
              !glowEffectsEnabled && { textShadowRadius: 0, textShadowOffset: { width: 0, height: 0 } },
            ]}
          >
            {displayName}
          </Text>
        </Animated.View>
        
        {/* Count Label */}
        <View style={styles.radhaCountBadge}>
          <Heart size={11} color="#be123c" fill="#be123c" />
          <Text style={styles.radhaCountText}>{currentCount}</Text>
        </View>

        {/* Temporary Ashtasakhi blessing popup overlay */}
        {sakhiBlessing && (
          <View style={styles.sakhiBlessingBadge}>
            <Sparkles size={8} color="#eab308" fill="#eab308" />
            <Text style={styles.sakhiBlessingText}>{sakhiBlessing}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// 4. Lotus Bloom Style - Lotus petals light up based on progress
export const LotusBloomStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  textScaleAnim,
}) => {
  const size = 220;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="lotusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#fda4af" />
            <Stop offset="50%" stopColor="#f43f5e" />
            <Stop offset="100%" stopColor="#be123c" />
          </LinearGradient>
        </Defs>

        {/* Outer thin progress track */}
        <Circle
          cx="50"
          cy="50"
          r="47"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          fill="none"
          opacity={0.3}
        />
        <Circle
          cx="50"
          cy="50"
          r="47"
          stroke="url(#lotusGrad)"
          strokeWidth="2.5"
          strokeDasharray={2 * Math.PI * 47}
          strokeDashoffset={2 * Math.PI * 47 * (1 - progress)}
          fill="none"
          transform="rotate(-90 50 50)"
        />

        {/* Outer lower petals (Lights up at progress > 0.1) */}
        <Path
          d="M 50 82 C 20 85 10 65 30 55 C 38 68 45 78 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.1 ? 0.35 : 0.08}
        />
        <Path
          d="M 50 82 C 80 85 90 65 70 55 C 62 68 55 78 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.2 ? 0.35 : 0.08}
        />

        {/* Mid-tier side petals (Lights up at progress > 0.3) */}
        <Path
          d="M 50 82 C 12 70 20 40 40 45 C 42 62 48 75 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.4 ? 0.55 : 0.08}
        />
        <Path
          d="M 50 82 C 88 70 80 40 60 45 C 58 62 52 75 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.5 ? 0.55 : 0.08}
        />

        {/* Upper side petals (Lights up at progress > 0.6) */}
        <Path
          d="M 50 82 C 22 50 35 28 47 38 C 45 55 48 70 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.7 ? 0.8 : 0.08}
        />
        <Path
          d="M 50 82 C 78 50 65 28 53 38 C 55 55 52 70 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.8 ? 0.8 : 0.08}
        />

        {/* Center Main vertical petal (Lights up at progress > 0.9) */}
        <Path
          d="M 50 82 C 40 40 42 15 50 12 C 58 15 60 40 50 82 Z"
          fill="url(#lotusGrad)"
          opacity={progress > 0.9 ? 1.0 : 0.12}
        />
      </Svg>

      {/* Central Counter text */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.lotusCountText,
            { transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
        <Sparkles size={14} color="#f43f5e" opacity={0.6} />
      </View>
    </View>
  );
};

// 5. Rudraksha Ring - Circle of 27 flat Rudraksha beads
export const RudrakshaRingStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  textScaleAnim,
}) => {
  const size = 220;
  const radius = 88;
  const N = 27;

  // Generate bead coordinates
  const beads = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N; i++) {
      const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
      const x = size / 2 + radius * Math.cos(angle);
      const y = size / 2 + radius * Math.sin(angle);
      arr.push({ x, y, index: i });
    }
    return arr;
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Active bright rudraksha */}
          <RadialGradient id="rudraActiveGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#eab308" />
            <Stop offset="65%" stopColor="#ca8a04" />
            <Stop offset="100%" stopColor="#713f12" />
          </RadialGradient>
          {/* Inactive dark rudraksha */}
          <RadialGradient id="rudraInactiveGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#5c3a21" />
            <Stop offset="75%" stopColor="#2e1a0c" />
            <Stop offset="100%" stopColor="#150a04" />
          </RadialGradient>
        </Defs>

        {/* Ring connector line */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#713f12"
          strokeWidth="1.5"
          fill="none"
          opacity={0.4}
        />

        {/* Render beads */}
        {beads.map((b) => {
          const beadProgress = b.index / N;
          const isActive = progress >= beadProgress;
          const beadSize = b.index === 0 ? 14 : 10; // Guru bead slightly larger
          
          return (
            <G key={`rudra-ring-bead-${b.index}`} transform={`translate(${b.x - beadSize}, ${b.y - beadSize})`}>
              <Circle
                cx={beadSize}
                cy={beadSize}
                r={beadSize - 0.5}
                fill={isActive ? 'url(#rudraActiveGrad)' : 'url(#rudraInactiveGrad)'}
                stroke={isActive ? '#fef08a' : '#5c3a21'}
                strokeWidth={0.8}
              />
              {/* Textured grooves inside bead */}
              <Path
                d={`M ${beadSize} 0 Q ${beadSize - 2} ${beadSize} ${beadSize} ${beadSize * 2}`}
                stroke={isActive ? '#713f12' : '#150a04'}
                strokeWidth={0.5}
                fill="none"
                opacity={0.5}
              />
              <Path
                d={`M ${beadSize} 0 Q ${beadSize + 2} ${beadSize} ${beadSize} ${beadSize * 2}`}
                stroke={isActive ? '#713f12' : '#150a04'}
                strokeWidth={0.5}
                fill="none"
                opacity={0.5}
              />
            </G>
          );
        })}
      </Svg>

      {/* Central Counter */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.rudraCountText,
            { color: '#F59E0B', transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
        <Text style={styles.rudraSubText}>RUDRA</Text>
      </View>
    </View>
  );
};

// 6. Sudarshan Chakra Style - Gold chakra spins on click
export const SudarshanChakraStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  textScaleAnim,
  malaRotationAnim,
}) => {
  const size = 220;
  const radius = 94;

  // Spin rotation mapping based on continuous mala rotation animation
  const spin = malaRotationAnim.interpolate({
    inputRange: [0, 108],
    outputRange: ['0deg', '3600deg'], // Spins 10 times per mala (33.3 degrees per chant)
  });

  return (
    <View style={styles.container}>
      {/* Background fiery ring */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f97316" />
            <Stop offset="50%" stopColor="#ea580c" />
            <Stop offset="100%" stopColor="#e11d48" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeTheme.isDark ? '#3f3f46' : '#e4e4e7'}
          strokeWidth="3.5"
          fill="none"
          opacity={0.2}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#fireGrad)"
          strokeWidth="5"
          strokeDasharray={2 * Math.PI * radius}
          strokeDashoffset={2 * Math.PI * radius * (1 - progress)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Spinning Golden Chakra Wheel */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={160} height={160} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="chakraGold" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#fef08a" />
              <Stop offset="60%" stopColor="#eab308" />
              <Stop offset="100%" stopColor="#713f12" />
            </RadialGradient>
          </Defs>

          {/* Outer Ring structure */}
          <Circle cx="50" cy="50" r="44" stroke="#eab308" strokeWidth="2.5" fill="none" />
          <Circle cx="50" cy="50" r="40" stroke="#713f12" strokeWidth="0.8" fill="none" />
          <Circle cx="50" cy="50" r="8" fill="url(#chakraGold)" stroke="#fef08a" strokeWidth="1" />
          <Circle cx="50" cy="50" r="3" fill="#fef9c3" />

          {/* Spokes */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => (
            <G key={`spoke-${idx}`} transform={`rotate(${angle}, 50, 50)`}>
              <Path d="M 50 8 L 50 42" stroke="#eab308" strokeWidth="1.2" />
              {/* Outer razor tip */}
              <Path d="M 50 4 L 47 8 L 53 8 Z" fill="#eab308" />
              <Circle cx="50" cy="24" r="1.2" fill="#fef9c3" />
            </G>
          ))}
        </Svg>
      </Animated.View>

      {/* Central Counter Text */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.chakraCountText,
            { transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
      </View>
    </View>
  );
};

// 7. Neon Cyberpunk Glow - Glowing ring with tech digits
export const NeonGlowStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  textScaleAnim,
  glowEffectsEnabled
}) => {
  const size = 220;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="neonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06b6d4" />
            <Stop offset="50%" stopColor="#3b82f6" />
            <Stop offset="100%" stopColor="#d946ef" />
          </LinearGradient>
        </Defs>

        {/* Tech Grid Lines in Background */}
        <Path d="M 20 110 L 200 110" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />
        <Path d="M 110 20 L 110 200" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />
        
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(6, 182, 212, 0.15)"
          strokeWidth="6"
          fill="none"
        />

        {/* Active neon path */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#neonGlowGrad)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="square"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Tech crosshairs */}
        <Path d="M 110 10 L 110 16" stroke="#06b6d4" strokeWidth="2.5" />
        <Path d="M 110 204 L 110 210" stroke="#06b6d4" strokeWidth="2.5" />
        <Path d="M 10 110 L 16 110" stroke="#06b6d4" strokeWidth="2.5" />
        <Path d="M 204 110 L 210 110" stroke="#06b6d4" strokeWidth="2.5" />
      </Svg>

      {/* Central Panel */}
      <View style={[styles.centerAbsolute, glowEffectsEnabled && styles.neonBoxShadow]}>
        <Animated.Text
          style={[
            styles.neonCountText,
            { transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {String(currentCount).padStart(3, '0')}
        </Animated.Text>
        <Text style={styles.neonSubText}>SYSTEM ACTIVE</Text>
      </View>
    </View>
  );
};

// 8. Dotted 108 Style - 108 tiny dots progress ring
export const Dotted108Style: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  textScaleAnim,
}) => {
  const size = 220;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;

  // Render 108 dotted circles:
  // Using single circle with dasharray is highly efficient and maps to exact dots.
  // Circle circumference is ~578px.
  // 108 dots means: each dot + gap fits into 578 / 108 = 5.35px.
  // We can set dasharray to: "1.8 3.55" (dash of 1.8px, gap of 3.55px).
  const dashArrayPattern = "1.8 3.55";

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="dotActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeTheme.colors.accentLight} />
            <Stop offset="100%" stopColor={activeTheme.colors.accent} />
          </LinearGradient>
        </Defs>

        {/* Background track of 108 dots */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeTheme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="6"
          strokeDasharray={dashArrayPattern}
          strokeLinecap="round"
          fill="none"
        />

        {/* Foreground active dots */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dotActiveGrad)"
          strokeWidth="6"
          strokeDasharray={dashArrayPattern}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Central Counter */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.dottedCountText,
            { color: activeTheme.colors.textPrimary, transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
        <Text style={[styles.dottedSubText, { color: activeTheme.colors.textSecondary }]}>MALA DOTS</Text>
      </View>
    </View>
  );
};

// 9. Mantra Orbit Style - Mantra text forms the progress ring
export const MantraOrbitStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  selectedMantra,
  textScaleAnim,
}) => {
  const size = 220;
  const radius = 86;
  const circumference = 2 * Math.PI * radius;

  // Build repeating mantra text
  const repeatedText = useMemo(() => {
    const text = selectedMantra + "  •  ";
    return text.repeat(8).substring(0, 75);
  }, [selectedMantra]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Circular path for text placement */}
          <Path
            id="orbitTextPath"
            d={`M ${size / 2} ${size / 2 - radius} A ${radius} ${radius} 0 1 1 ${size / 2 - 0.1} ${size / 2 - radius}`}
          />
          <LinearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeTheme.colors.accentLight} />
            <Stop offset="100%" stopColor={activeTheme.colors.accent} />
          </LinearGradient>
        </Defs>

        {/* Thin background indicator ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 10}
          stroke={activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth="3.5"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 10}
          stroke="url(#orbitGrad)"
          strokeWidth="4"
          strokeDasharray={2 * Math.PI * (radius + 10)}
          strokeDashoffset={2 * Math.PI * (radius + 10) * (1 - progress)}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Rotating text around path */}
        <G transform={`rotate(15 ${size / 2} ${size / 2})`}>
          <SvgText fill={activeTheme.colors.textSecondary} fontSize="11" fontWeight="bold" letterSpacing="1">
            <TextPath href="#orbitTextPath" startOffset="0%">
              {repeatedText}
            </TextPath>
          </SvgText>
        </G>
      </Svg>

      {/* Center Counter */}
      <View style={styles.centerAbsolute}>
        <Animated.Text
          style={[
            styles.orbitCountText,
            { color: activeTheme.colors.textPrimary, transform: [{ scale: textScaleAnim }] }
          ]}
        >
          {currentCount}
        </Animated.Text>
        <Text style={[styles.orbitSubText, { color: activeTheme.colors.accent }]}>OM</Text>
      </View>
    </View>
  );
};

// 10. Retro Flip Clock Style - Flip panel card display
export const RetroFlipStyle: React.FC<StyleProps> = ({
  currentCount,
  progress,
  activeTheme,
  textScaleAnim,
  glowEffectsEnabled
}) => {
  const size = 220;
  const radius = 90;
  
  // Format count to 3 digits (e.g. 054)
  const displayVal = String(currentCount).padStart(3, '0');

  return (
    <View style={styles.container}>
      {/* Outer framing circle */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFillObject}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeTheme.isDark ? '#3f3f46' : '#e4e4e7'}
          strokeWidth="2.5"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeTheme.colors.accent}
          strokeWidth="4"
          strokeDasharray={2 * Math.PI * radius}
          strokeDashoffset={2 * Math.PI * radius * (1 - progress)}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Mechanical Flip Panel Container */}
      <Animated.View style={[styles.flipContainer, { transform: [{ scale: textScaleAnim }] }]}>
        {displayVal.split('').map((char, index) => {
          return (
            <View 
              key={`flip-card-${index}`} 
              style={[
                styles.flipCard, 
                { backgroundColor: activeTheme.isDark ? '#27272a' : '#f4f4f5', borderColor: activeTheme.colors.cardBorder },
                !glowEffectsEnabled && { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 }
              ]}
            >
              {/* Top half */}
              <View style={styles.flipHalfTop}>
                <Text style={[styles.flipText, { color: activeTheme.colors.textPrimary }]}>
                  {char}
                </Text>
              </View>
              {/* Card Divider Line */}
              <View style={styles.flipDivider} />
              {/* Bottom half */}
              <View style={styles.flipHalfBottom}>
                <Text style={[styles.flipText, { color: activeTheme.colors.textPrimary }]}>
                  {char}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Sublabel below cards */}
      <View style={styles.flipLabelWrapper}>
        <Text style={[styles.flipLabel, { color: activeTheme.colors.textSecondary }]}>MALA INDEX</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalCountText: {
    fontSize: 52,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  minimalMantraText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  radhaNameText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#be123c',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
    textShadowColor: 'rgba(251, 113, 133, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  radhaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#fecdd3',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    gap: 4,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  radhaCountText: {
    color: '#be123c',
    fontWeight: '900',
    fontSize: 12,
  },
  lotusCountText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#be123c',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
    marginBottom: 4,
  },
  rudraCountText: {
    fontSize: 48,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  rudraSubText: {
    color: '#713f12',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 2,
  },
  chakraCountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#eab308',
    textShadowColor: '#713f12',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  neonBoxShadow: {
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 10,
  },
  neonCountText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#22d3ee',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  neonSubText: {
    fontSize: 8,
    color: '#60a5fa',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  dottedCountText: {
    fontSize: 48,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  dottedSubText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  orbitCountText: {
    fontSize: 50,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  orbitSubText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 4,
  },
  flipContainer: {
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  flipCard: {
    width: 44,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  flipHalfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  flipHalfBottom: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  flipDivider: {
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    width: '100%',
    position: 'absolute',
    top: '50%',
    marginTop: -0.75,
    zIndex: 5,
  },
  flipText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed',
  },
  flipLabelWrapper: {
    position: 'absolute',
    bottom: 40,
  },
  flipLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  sakhiBlessingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginTop: 6,
    gap: 4,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  sakhiBlessingText: {
    color: '#b45309',
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
  },
});
