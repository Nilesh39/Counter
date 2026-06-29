import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import Svg, { Path, Circle, G, Line, RadialGradient, Stop, Defs } from 'react-native-svg';
import {
  Sparkles,
  Flame,
  Camera,
  RotateCcw,
  Heart,
  Shield,
  Award
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { AppState } from '../types';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALTAR_PHOTO_KEY = '@naam_jap_altar_photo_uri_v2';

interface PujaScreenProps {
  state: AppState;
  purchaseStreakShield: () => Promise<boolean>;
  offerFlower: () => Promise<void>;
  setDiyaStyle: (style: 'brass-diya' | 'silver-diya' | 'gold-diya') => Promise<void>;
  setBellStyle: (style: 'none' | 'silver-bell' | 'gold-bell') => Promise<void>;
  applyChandanTilak: (applied: boolean) => Promise<void>;
}

interface FlowerPetal {
  id: string;
  x: number; // horizontal offset percentage
  yAnim: Animated.Value;
  rotateAnim: Animated.Value;
  opacityAnim: Animated.Value;
  swayAnim: Animated.Value;
  scale: number;
  color: string;
}

export const PujaScreen: React.FC<PujaScreenProps> = ({
  state,
  purchaseStreakShield,
  offerFlower,
  setDiyaStyle,
  setBellStyle,
  applyChandanTilak
}) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];

  // Altar states
  const [deityPhotoUri, setDeityPhotoUri] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);
  const [petals, setPetals] = useState<FlowerPetal[]>([]);
  const [chandanSelected, setChandanSelected] = useState<boolean>(false);

  // Diya flame animations
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(0.95)).current;

  // Bell ring animation
  const bellRotate = useRef(new Animated.Value(0)).current;

  // Pulsing Divine Aura animation
  const auraAnim = useRef(new Animated.Value(0.7)).current;

  // Ref trackers for memory leak / tab freeze prevention
  const isMounted = useRef<boolean>(true);
  const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

  // Initialize Audio settings and load cache
  useEffect(() => {
    isMounted.current = true;

    const initAltar = async () => {
      try {
        // Allow sounds to route correctly
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });

        // Load cached photo
        const cachedPhoto = await AsyncStorage.getItem(ALTAR_PHOTO_KEY);
        if (isMounted.current && cachedPhoto) {
          setDeityPhotoUri(cachedPhoto);
        }
      } catch (err) {
        console.warn('Failed to load altar cache', err);
      }
    };
    initAltar();

    return () => {
      isMounted.current = false;
      // Stop all active flower and flame animations immediately when user switches tabs
      activeAnimations.current.forEach(anim => {
        try {
          anim.stop();
        } catch (e) {}
      });
      activeAnimations.current = [];
    };
  }, []);

  // Diya Flame flickering loop
  useEffect(() => {
    const flameAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flameScale, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(flameScale, {
            toValue: 0.9,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(flameOpacity, {
            toValue: 0.8,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(flameOpacity, {
            toValue: 1.0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ])
    );
    flameAnimation.start();
    activeAnimations.current.push(flameAnimation);

    return () => {
      flameAnimation.stop();
      activeAnimations.current = activeAnimations.current.filter(a => a !== flameAnimation);
    };
  }, []);

  // Pulse Divine Aura animation if unlocked
  useEffect(() => {
    let auraLoop: Animated.CompositeAnimation | null = null;
    if (state.unlockedSamagri.includes('divine-aura')) {
      auraLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auraAnim, {
            toValue: 1.1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(auraAnim, {
            toValue: 0.7,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      auraLoop.start();
      activeAnimations.current.push(auraLoop);
    }
    return () => {
      if (auraLoop) {
        auraLoop.stop();
        activeAnimations.current = activeAnimations.current.filter(a => a !== auraLoop);
      }
    };
  }, [state.unlockedSamagri]);

  // Pick Deity Image from Phone Gallery
  const handlePickDeity = async () => {
    try {
      Vibration.vibrate(35);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Media library permissions are required to set your Deity photo!');
        return;
      }

      setIsPhotoLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.95,
      });

      if (isMounted.current && !result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setDeityPhotoUri(uri);
        await AsyncStorage.setItem(ALTAR_PHOTO_KEY, uri);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      if (isMounted.current) {
        setIsPhotoLoading(false);
      }
    }
  };

  // Reset Deity Image to default
  const handleResetDeity = async () => {
    try {
      Vibration.vibrate(40);
      setDeityPhotoUri(null);
      await AsyncStorage.removeItem(ALTAR_PHOTO_KEY);
    } catch (err) {
      console.warn(err);
    }
  };

  // Trigger Flower Shower (Pushpanjali)
  const triggerFlowerShower = () => {
    Vibration.vibrate([0, 30, 60, 30]);
    
    // Play light bell chime sound
    try {
      Audio.Sound.createAsync(
        require('../../assets/radha_chime.mp3'),
        { shouldPlay: true, volume: 0.85 }
      ).then(({ sound }) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
      });
    } catch (e) {
      console.warn(e);
    }

    // Update offered flowers counter
    offerFlower();

    // Spawn 12 falling flower petal particles
    const newPetals = Array.from({ length: 12 }).map(() => {
      const pId = Math.random().toString(36).substring(2, 9);
      const yAnim = new Animated.Value(0);
      const rotateAnim = new Animated.Value(0);
      const opacityAnim = new Animated.Value(1);
      const swayAnim = new Animated.Value(0);

      const x = Math.random() * 80 + 10; // offset percentage from left
      const scale = Math.random() * 0.5 + 0.45;
      const duration = Math.random() * 1500 + 2000;
      const color = Math.random() > 0.45 ? '#f43f5e' : '#f59e0b'; // Rose pink or Marigold saffron

      const anim = Animated.parallel([
        Animated.timing(yAnim, {
          toValue: 300, // fall down past the deity frame
          duration,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: Math.random() * 720 - 360,
          duration,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          delay: duration - 600,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: Math.random() * 40 - 20,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(swayAnim, {
            toValue: Math.random() * 40 - 20,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ]);

      activeAnimations.current.push(anim);

      anim.start((result) => {
        activeAnimations.current = activeAnimations.current.filter(a => a !== anim);
        if (result.finished && isMounted.current) {
          setPetals(prev => prev.filter(p => p.id !== pId));
        }
      });

      return {
        id: pId,
        x,
        yAnim,
        rotateAnim,
        opacityAnim,
        swayAnim,
        scale,
        color
      };
    });

    setPetals(prev => [...prev, ...newPetals]);
  };

  // Ring Altar Bell animation
  const triggerBellRing = () => {
    Vibration.vibrate(35);
    
    // Play sweet chime
    try {
      Audio.Sound.createAsync(
        require('../../assets/radha_chime.mp3'),
        { shouldPlay: true, volume: 0.9 }
      ).then(({ sound }) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
        });
      });
    } catch(e){}

    bellRotate.setValue(0);
    Animated.sequence([
      Animated.timing(bellRotate, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: -1, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: 1, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true })
    ]).start();
  };

  const bellRotationString = bellRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg']
  });

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: activeTheme.colors.background }]}
    >
      
      {/* HUD Header */}
      <View style={styles.hudHeader}>
        <View style={styles.hudLeft}>
          <Sparkles size={16} color="#fbbf24" />
          <View style={{ width: 6 }} />
          <Text style={[styles.hudTitle, { color: activeTheme.colors.textPrimary }]}>Mera Mandir Altar</Text>
        </View>
        <View style={[styles.hudBadge, { backgroundColor: activeTheme.colors.accent + '1A' }]}>
          <Text style={[styles.hudBadgeText, { color: activeTheme.colors.accent }]}>
            {state.offeredFlowersCount} Offerings
          </Text>
        </View>
      </View>

      {/* Altar Card (Temple Frame) */}
      <View 
        style={[
          styles.altarCard, 
          { 
            borderColor: state.unlockedSamagri.includes('ratna-altar') ? '#fbbf24' : activeTheme.colors.cardBorder,
            borderWidth: state.unlockedSamagri.includes('ratna-altar') ? 3.5 : 1,
            backgroundColor: activeTheme.colors.cardBackground
          }
        ]}
      >
        {/* Divine Aura Glow behind Deity */}
        {state.unlockedSamagri.includes('divine-aura') && (
          <Animated.View 
            style={[
              styles.auraContainer, 
              { transform: [{ scale: auraAnim }], opacity: 0.3 }
            ]} 
            pointerEvents="none"
          >
            <Svg width="300" height="300" viewBox="0 0 300 300">
              <Circle cx="150" cy="150" r="120" fill="url(#auraGrad)" />
              <Defs>
                <RadialGradient id="auraGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                  <Stop offset="70%" stopColor="#ea580c" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#1f1a17" stopOpacity={0} />
                </RadialGradient>
              </Defs>
            </Svg>
          </Animated.View>
        )}

        {/* Mandir Arch SVG Background */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="340" viewBox="0 0 320 340" style={styles.templeSvg}>
            {/* Pillars */}
            <Path d="M 20 340 L 20 70 L 30 70 L 30 340" fill="#d97706" opacity={0.12} />
            <Path d="M 290 340 L 290 70 L 300 70 L 300 340" fill="#d97706" opacity={0.12} />
            
            {/* Arch */}
            <Path
              d="M 15 340 L 15 100 C 15 45, 80 15, 160 15 C 240 15, 305 45, 305 100 L 305 340"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              opacity={0.45}
            />
          </Svg>
        </View>

        {/* Royal Canopy (Chhatra) Hanging above deity photo */}
        {state.unlockedSamagri.includes('royal-canopy') && (
          <View style={styles.canopyContainer} pointerEvents="none">
            <Svg width="110" height="36" viewBox="0 0 120 40">
              <Path d="M 10 30 Q 60 -5, 110 30 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              <Circle cx="15" cy="34" r="2" fill="#ffffff" />
              <Circle cx="35" cy="36" r="2" fill="#ffffff" />
              <Circle cx="60" cy="38" r="2.5" fill="#ffffff" />
              <Circle cx="85" cy="36" r="2" fill="#ffffff" />
              <Circle cx="105" cy="34" r="2" fill="#ffffff" />
              <Line x1="15" y1="30" x2="15" y2="34" stroke="#ea580c" strokeWidth="1.5" />
              <Line x1="35" y1="30" x2="35" y2="36" stroke="#ea580c" strokeWidth="1.5" />
              <Line x1="60" y1="30" x2="60" y2="38" stroke="#ea580c" strokeWidth="1.5" />
              <Line x1="85" y1="30" x2="85" y2="36" stroke="#ea580c" strokeWidth="1.5" />
              <Line x1="105" y1="30" x2="105" y2="34" stroke="#ea580c" strokeWidth="1.5" />
            </Svg>
          </View>
        )}

        {/* Royal Gaddi Throne cushions behind Deity frame */}
        {state.unlockedSamagri.includes('royal-gaddi') && (
          <View style={styles.gaddiContainer} pointerEvents="none">
            <View style={[styles.cushion, styles.leftCushion]} />
            <View style={[styles.cushion, styles.rightCushion]} />
          </View>
        )}

        {/* Center Deity Photo Frame Container */}
        <View style={styles.deityFrameContainer}>
          <View 
            style={[
              styles.deityFrame, 
              { 
                borderColor: '#fbbf24', 
                borderWidth: state.unlockedSamagri.includes('ratna-altar') ? 6 : 4,
                shadowColor: '#d97706' 
              }
            ]}
          >
            {isPhotoLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fbbf24" />
              </View>
            ) : deityPhotoUri ? (
              <Image source={{ uri: deityPhotoUri }} style={styles.deityImage} />
            ) : (
              <Image source={require('../../assets/parikrama/stage5.jpg')} style={styles.deityImage} />
            )}

            {/* Alternating Ruby and Sapphire jewels overlay for Ratna Altar */}
            {state.unlockedSamagri.includes('ratna-altar') && (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Svg width="220" height="220" viewBox="0 0 220 220" style={StyleSheet.absoluteFill}>
                  <Circle cx="110" cy="110" r="107" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="3 15" />
                  <Circle cx="110" cy="110" r="107" stroke="#3b82f6" strokeWidth="2.2" strokeDasharray="3 15" strokeDashoffset="7.5" />
                </Svg>
              </View>
            )}

            {/* Saffron and Yellow Chandan Tilak Dot Overlay on deity forehead */}
            {state.chandanApplied && (
              <View style={styles.chandanTilakContainer} pointerEvents="none">
                <Svg width="20" height="30" viewBox="0 0 20 30">
                  <Path
                    d="M 5 3 C 5 16, 15 16, 15 3 M 7.5 3 C 7.5 13, 12.5 13, 12.5 3"
                    stroke="#ea580c"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d="M 7.5 3 C 7.5 11, 12.5 11, 12.5 3"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Circle cx="10" cy="15" r="3" fill="#ef4444" />
                </Svg>
              </View>
            )}

            {/* Chandan painting touch hotspot overlay */}
            {chandanSelected && !state.chandanApplied && (
              <TouchableOpacity
                style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
                onPress={async () => {
                  Vibration.vibrate(60);
                  try {
                    Audio.Sound.createAsync(
                      require('../../assets/radha_chime.mp3'),
                      { shouldPlay: true, volume: 0.7 }
                    ).then(({ sound }) => {
                      sound.setOnPlaybackStatusUpdate((st) => {
                        if (st.isLoaded && st.didJustFinish) sound.unloadAsync();
                      });
                    });
                  } catch(e){}
                  await applyChandanTilak(true);
                  setChandanSelected(false);
                }}
              >
                {/* Visual target guide: a pulsing ring on the forehead */}
                <View 
                  style={{
                    position: 'absolute',
                    top: '25%',
                    left: '50%',
                    marginLeft: -25,
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderWidth: 2,
                    borderColor: '#f59e0b',
                    borderStyle: 'dashed',
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#FFF', textAlign: 'center' }}>
                    Tap
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Camera Picker Overlay */}
            <TouchableOpacity
              onPress={handlePickDeity}
              style={[styles.cameraOverlayBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            >
              <Camera size={16} color="#fbbf24" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lit Diya sitting peacefully below the Deity Frame */}
        <View style={styles.restingDiyaContainer}>
          <Animated.View 
            style={[
              styles.restingDiya,
              {
                transform: [{ scale: flameScale }],
                opacity: flameOpacity
              }
            ]}
          >
            <Svg width="44" height="44" viewBox="0 0 40 40">
              {/* Dynamic Aura glow radius */}
              <Circle cx="20" cy="12" r={state.selectedDiya === 'gold-diya' ? 8 : 6} fill={state.selectedDiya === 'gold-diya' ? '#fbbf24' : '#f59e0b'} opacity={0.25} />
              
              {/* Customizable Diya Base render */}
              {state.selectedDiya === 'brass-diya' ? (
                <G>
                  <Path d="M 8 26 C 8 33, 32 33, 32 26 C 32 23, 27 22, 20 22 C 13 22, 8 23, 8 26 Z" fill="#b45309" />
                  <Path d="M 12 26 C 12 29, 28 29, 28 26 Z" fill="#d97706" stroke="#fbbf24" strokeWidth="0.5" />
                </G>
              ) : state.selectedDiya === 'silver-diya' ? (
                <G>
                  <Path d="M 8 26 C 8 33, 32 33, 32 26 C 32 23, 27 22, 20 22 C 13 22, 8 23, 8 26 Z" fill="#94a3b8" />
                  <Path d="M 12 26 C 12 29, 28 29, 28 26 Z" fill="#cbd5e1" stroke="#e2e8f0" strokeWidth="0.5" />
                </G>
              ) : (
                <G>
                  <Path d="M 8 26 C 8 33, 32 33, 32 26 C 32 23, 27 22, 20 22 C 13 22, 8 23, 8 26 Z" fill="#fbbf24" />
                  <Path d="M 12 26 C 12 29, 28 29, 28 26 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5" />
                  {/* Jewel decorations on Golden Diya */}
                  <Circle cx="14" cy="29" r="1.5" fill="#ef4444" />
                  <Circle cx="20" cy="29" r="1.5" fill="#3b82f6" />
                  <Circle cx="26" cy="29" r="1.5" fill="#ef4444" />
                </G>
              )}

              {/* Flickering Flame */}
              <Path 
                d="M 20 5 C 22 10, 24 14, 22 17 C 20 19, 18 19, 18 17 C 16 14, 18 10, 20 5 Z" 
                fill={state.selectedDiya === 'gold-diya' ? '#f59e0b' : '#fbbf24'} 
              />
              <Path d="M 20 9 C 21 11, 22 13, 21 15 C 20 16, 19 16, 20 9 Z" fill="#ffffff" />
            </Svg>
          </Animated.View>
        </View>

        {/* Falling Flower Petals Layer (Overlay on top of photo & frame) */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {petals.map(p => (
            <Animated.View
              key={p.id}
              style={[
                styles.petalParticle,
                {
                  left: `${p.x}%`,
                  transform: [
                    { translateY: p.yAnim },
                    { translateX: p.swayAnim },
                    { rotate: p.rotateAnim.interpolate({
                        inputRange: [-360, 360],
                        outputRange: ['-360deg', '360deg']
                      })
                    },
                    { scale: p.scale }
                  ],
                  opacity: p.opacityAnim
                }
              ]}
            >
              {/* Petal SVG */}
              <Svg width="12" height="12" viewBox="0 0 20 20">
                <Path
                  d="M 10 2 C 15 2, 18 8, 16 13 C 14 17, 6 17, 4 13 C 2 8, 5 2, 10 2 Z"
                  fill={p.color}
                  opacity={0.8}
                />
              </Svg>
            </Animated.View>
          ))}
        </View>

      </View>

      {/* Redesigned Pooja Thali (Spiritual Worship Plate) */}
      <View 
        style={[
          styles.actionCard,
          { 
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder,
            padding: 24,
            alignItems: 'center',
          }
        ]}
      >
        <Text style={[styles.cardTitle, { color: activeTheme.colors.textPrimary }]}>
          Seva Samagri Tray (Thali)
        </Text>
        <Text style={[styles.cardSubtitle, { color: activeTheme.colors.textSecondary, marginBottom: 16 }]}>
          Equip or tap items on your holy tray to perform temple seva.
        </Text>

        {/* Circular Pooja Thali container */}
        <View 
          style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: activeTheme.isDark ? '#2e1905' : '#f5e6d3', // metallic wood/copper base
            borderColor: '#ca8a04', // golden border
            borderWidth: 6,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#a16207',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
            elevation: 10,
            padding: 10,
            position: 'relative',
          }}
        >
          {/* Subtle concentric plate rings (like real metal thali) using absolute SVGs */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 280 280" style={{ position: 'absolute' }}>
              <Circle cx="140" cy="140" r="120" stroke="#ca8a04" strokeWidth="1" strokeDasharray="4 2" opacity={0.3} fill="none" />
              <Circle cx="140" cy="140" r="100" stroke="#a16207" strokeWidth="1" opacity={0.2} fill="none" />
              <Circle cx="140" cy="140" r="75" stroke="#ca8a04" strokeWidth="0.8" opacity={0.15} fill="none" />
            </Svg>
          </View>

          {/* Seva items layout inside Thali: arranged in a beautiful arc or triangle */}
          <View 
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%',
              paddingHorizontal: 20,
            }}
          >
            {/* Chandan Paste Bowl */}
            {state.unlockedSamagri.includes('chandan-bowl') && (
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(20);
                  if (state.chandanApplied) {
                    applyChandanTilak(false);
                  } else {
                    setChandanSelected(!chandanSelected);
                  }
                }}
                style={[
                  styles.trayItem,
                  chandanSelected && styles.selectedTrayItem,
                  state.chandanApplied && styles.appliedTrayItem,
                  {
                    backgroundColor: activeTheme.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.65)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                ]}
              >
                <Svg width="40" height="40" viewBox="0 0 40 40">
                  <Circle cx="20" cy="22" r="14" fill="#f59e0b" opacity={0.2} />
                  <Path d="M 8 22 C 8 32, 32 32, 32 22 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="1" />
                  <Circle cx="20" cy="20" r="8" fill="#f59e0b" />
                  <Circle cx="18" cy="18" r="2.5" fill="#ffffff" opacity={0.5} />
                </Svg>
                <Text style={[styles.trayItemLabel, { color: activeTheme.colors.textPrimary }]}>
                  {state.chandanApplied ? 'Wipe Chandan' : chandanSelected ? 'Tilak Active' : 'Chandan Bowl'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Temple Bell (Ghanti) */}
            {state.selectedBell !== 'none' && (
              <Animated.View style={{ transform: [{ rotate: bellRotationString }] }}>
                <TouchableOpacity
                  onPress={triggerBellRing}
                  style={[
                    styles.trayItem,
                    {
                      backgroundColor: activeTheme.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.65)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }
                  ]}
                >
                  <Svg width="40" height="40" viewBox="0 0 40 40">
                    <Path
                      d="M 20 6 L 20 12 M 13 28 C 13 20, 27 20, 27 28 Z"
                      stroke={state.selectedBell === 'gold-bell' ? '#fbbf24' : '#94a3b8'}
                      strokeWidth="2.5"
                      fill={state.selectedBell === 'gold-bell' ? '#fbbf24' : '#cbd5e1'}
                    />
                    <Path d="M 10 28 L 30 28" stroke={state.selectedBell === 'gold-bell' ? '#d97706' : '#64748b'} strokeWidth="2" />
                    <Circle cx="20" cy="31" r="2" fill={state.selectedBell === 'gold-bell' ? '#d97706' : '#64748b'} />
                  </Svg>
                  <Text style={[styles.trayItemLabel, { color: activeTheme.colors.textPrimary }]}>
                    Ring Bell
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Guidance prompt displayed at the bottom inside Thali if Chandan is selected */}
          {chandanSelected && !state.chandanApplied && (
            <View 
              style={{
                position: 'absolute',
                bottom: 25,
                backgroundColor: 'rgba(234, 88, 12, 0.9)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#fbbf24',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Tap deity forehead to apply tilak
              </Text>
            </View>
          )}
        </View>

        {/* Inventory Customizer Selection */}
        <View style={styles.inventorySection}>
          <Text style={[styles.inventoryTitle, { color: activeTheme.colors.textPrimary }]}>
            Altar Customization
          </Text>

          <View style={styles.inventoryRow}>
            {/* Diya Customizer */}
            <View style={styles.inventoryColumn}>
              <Text style={[styles.inventoryLabel, { color: activeTheme.colors.textSecondary }]}>Style Diya</Text>
              <View style={styles.inventoryButtons}>
                <TouchableOpacity
                  onPress={() => setDiyaStyle('brass-diya')}
                  style={[styles.invBtn, state.selectedDiya === 'brass-diya' && styles.invBtnActive]}
                >
                  <Text style={[styles.invBtnText, state.selectedDiya === 'brass-diya' && styles.invBtnTextActive]}>Brass</Text>
                </TouchableOpacity>
                {state.unlockedSamagri.includes('silver-diya') && (
                  <TouchableOpacity
                    onPress={() => setDiyaStyle('silver-diya')}
                    style={[styles.invBtn, state.selectedDiya === 'silver-diya' && styles.invBtnActive]}
                  >
                    <Text style={[styles.invBtnText, state.selectedDiya === 'silver-diya' && styles.invBtnTextActive]}>Silver</Text>
                  </TouchableOpacity>
                )}
                {state.unlockedSamagri.includes('gold-diya') && (
                  <TouchableOpacity
                    onPress={() => setDiyaStyle('gold-diya')}
                    style={[styles.invBtn, state.selectedDiya === 'gold-diya' && styles.invBtnActive]}
                  >
                    <Text style={[styles.invBtnText, state.selectedDiya === 'gold-diya' && styles.invBtnTextActive]}>Gold</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bell Customizer */}
            {(state.unlockedSamagri.includes('silver-bell') || state.unlockedSamagri.includes('gold-bell')) && (
              <View style={styles.inventoryColumn}>
                <Text style={[styles.inventoryLabel, { color: activeTheme.colors.textSecondary }]}>Style Bell</Text>
                <View style={styles.inventoryButtons}>
                  <TouchableOpacity
                    onPress={() => setBellStyle('none')}
                    style={[styles.invBtn, state.selectedBell === 'none' && styles.invBtnActive]}
                  >
                    <Text style={[styles.invBtnText, state.selectedBell === 'none' && styles.invBtnTextActive]}>None</Text>
                  </TouchableOpacity>
                  {state.unlockedSamagri.includes('silver-bell') && (
                    <TouchableOpacity
                      onPress={() => setBellStyle('silver-bell')}
                      style={[styles.invBtn, state.selectedBell === 'silver-bell' && styles.invBtnActive]}
                    >
                      <Text style={[styles.invBtnText, state.selectedBell === 'silver-bell' && styles.invBtnTextActive]}>Silver</Text>
                    </TouchableOpacity>
                  )}
                  {state.unlockedSamagri.includes('gold-bell') && (
                    <TouchableOpacity
                      onPress={() => setBellStyle('gold-bell')}
                      style={[styles.invBtn, state.selectedBell === 'gold-bell' && styles.invBtnActive]}
                    >
                      <Text style={[styles.invBtnText, state.selectedBell === 'gold-bell' && styles.invBtnTextActive]}>Gold</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

      </View>

      {/* Altar Seva Control Card */}
      <View 
        style={[
          styles.actionCard, 
          { 
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <Text style={[styles.cardTitle, { color: activeTheme.colors.textPrimary }]}>
          Pushpanjali Seva
        </Text>
        <Text style={[styles.cardSubtitle, { color: activeTheme.colors.textSecondary }]}>
          Offer fresh flowers (rose & marigold petals) to your Deity with sweet temple chimes.
        </Text>

        {/* Pushpanjali Flower Offer Button */}
        <TouchableOpacity
          onPress={triggerFlowerShower}
          style={[styles.flowerButton, { backgroundColor: activeTheme.colors.accent, shadowColor: activeTheme.colors.accent }]}
        >
          <Heart size={20} color="#ffffff" fill="#ffffff" />
          <View style={{ width: 8 }} />
          <Text style={styles.flowerButtonText}>Offer Flowers</Text>
        </TouchableOpacity>

        {/* Deity Photo Settings Row */}
        <View style={styles.deityPhotoRow}>
          <TouchableOpacity
            onPress={handlePickDeity}
            style={[
              styles.deityButton,
              { 
                backgroundColor: activeTheme.colors.background,
                borderColor: activeTheme.colors.cardBorder
              }
            ]}
          >
            <Camera size={16} color={activeTheme.colors.textPrimary} />
            <View style={{ width: 6 }} />
            <Text style={[styles.deityButtonText, { color: activeTheme.colors.textPrimary }]}>
              Choose Photo
            </Text>
          </TouchableOpacity>

          {deityPhotoUri && (
            <>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                onPress={handleResetDeity}
                style={[
                  styles.deityButton,
                  { 
                    backgroundColor: activeTheme.colors.background,
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <RotateCcw size={16} color="#ef4444" />
                <View style={{ width: 6 }} />
                <Text style={[styles.deityButtonText, { color: '#ef4444' }]}>
                  Reset Deity
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>

      {/* Dharma Suraksha (Streak Shield) Card */}
      <View 
        style={[
          styles.actionCard, 
          { 
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <View style={styles.shieldHeaderRow}>
          <Shield size={20} color="#fbbf24" fill="#fbbf24" />
          <Text style={[styles.cardTitle, { color: activeTheme.colors.textPrimary, marginLeft: 8 }]}>
            Dharma Suraksha (Streak Shield)
          </Text>
        </View>

        <View style={styles.shieldStatusContainer}>
          <Text style={[styles.shieldCountText, { color: activeTheme.colors.textPrimary }]}>
            Active Shields: <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{state.streakShields ?? 0}</Text>
          </Text>
          <View style={[styles.shieldStatusBadge, { backgroundColor: (state.streakShields ?? 0) > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
            <Text style={[styles.shieldStatusText, { color: (state.streakShields ?? 0) > 0 ? '#10b981' : '#ef4444' }]}>
              {(state.streakShields ?? 0) > 0 ? "PROTECTED 🛡️" : "NO SHIELD"}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardSubtitle, { color: activeTheme.colors.textSecondary, marginTop: 8 }]}>
          A Streak Shield protects your daily Naam Jaap streak from breaking on days you are unable to chant due to emergencies.
        </Text>

        <TouchableOpacity
          onPress={async () => {
            if (state.offeredFlowersCount < 10) {
              Vibration.vibrate(100);
              alert("You need to offer at least 10 flowers at the altar to exchange for a shield!");
              return;
            }
            Vibration.vibrate([0, 40, 50, 40]);
            const success = await purchaseStreakShield();
            if (success) {
              alert("Streak Shield acquired successfully! Saffron grace protects your streak.");
            } else {
              alert("Failed to purchase streak shield. Please try again.");
            }
          }}
          disabled={state.offeredFlowersCount < 10}
          style={[
            styles.shieldExchangeButton, 
            { 
              backgroundColor: state.offeredFlowersCount >= 10 ? '#fbbf24' : 'rgba(251, 191, 36, 0.12)', 
              borderColor: state.offeredFlowersCount >= 10 ? '#d97706' : 'rgba(255, 255, 255, 0.08)' 
            }
          ]}
        >
          <Text style={[styles.shieldExchangeButtonText, { color: state.offeredFlowersCount >= 10 ? '#1f1a17' : 'rgba(255, 255, 255, 0.4)' }]}>
            Exchange 10 Flowers for 1 Shield
          </Text>
        </TouchableOpacity>
      </View>

      {/* Altar Instructions */}
      <View 
        style={[
          styles.instructionsContainer,
          { 
            backgroundColor: activeTheme.colors.cardBackground, 
            borderColor: activeTheme.colors.cardBorder 
          }
        ]}
      >
        <Text style={[styles.instructTitle, { color: activeTheme.colors.textPrimary }]}>
          Altar Guide
        </Text>
        <Text style={[styles.instructText, { color: activeTheme.colors.textSecondary }]}>
          • Tap "Choose Photo" or the camera icon overlay to select any picture of Thakurji from your phone gallery.
        </Text>
        <Text style={[styles.instructText, { color: activeTheme.colors.textSecondary }]}>
          • Tap "Offer Flowers" to trigger a beautiful flower shower with soft temple bell sound.
        </Text>
        <Text style={[styles.instructText, { color: activeTheme.colors.textSecondary }]}>
          • Tap the **Chandan bowl** on the Pooja Thali, then tap on the Deity's forehead to apply a Tilak!
        </Text>
        <Text style={[styles.instructText, { color: activeTheme.colors.textSecondary }]}>
          • Tap the **Bell** on the Pooja Thali to ring it and trigger a wiggle chime animation.
        </Text>
        <Text style={[styles.instructText, { color: activeTheme.colors.textSecondary }]}>
          • Progress along the **Bhakti Marg** (found in the grid menu) to unlock Silver and Gold Diyas/Bells!
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  hudBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hudBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  altarCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    height: 340,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templeSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  auraContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    zIndex: 1,
  },
  canopyContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 4,
  },
  gaddiContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: 70,
    width: 250,
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  cushion: {
    width: 44,
    height: 120,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: '#ea580c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  leftCushion: {
    transform: [{ rotate: '-15deg' }],
  },
  rightCushion: {
    transform: [{ rotate: '15deg' }],
  },
  deityFrameContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: 40,
    zIndex: 5,
  },
  deityFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    backgroundColor: '#1f1a17',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  deityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlayBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  chandanTilakContainer: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -10,
    alignItems: 'center',
    zIndex: 15,
  },
  restingDiyaContainer: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  restingDiya: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  petalParticle: {
    position: 'absolute',
    top: -10,
    zIndex: 15,
  },
  actionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  flowerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 99,
    width: '85%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  flowerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  deityPhotoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  deityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  deityButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 8,
  },
  trayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.02)',
    width: 96,
  },
  selectedTrayItem: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  appliedTrayItem: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  trayItemLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  inventorySection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
    marginTop: 16,
  },
  inventoryTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  inventoryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  inventoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  inventoryButtons: {
    flexDirection: 'row',
  },
  invBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginHorizontal: 3,
  },
  invBtnActive: {
    borderColor: '#fbbf24',
    backgroundColor: '#fbbf2422',
  },
  invBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  invBtnTextActive: {
    color: '#fbbf24',
  },
  shieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shieldStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  shieldCountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  shieldStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shieldStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shieldExchangeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 14,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shieldExchangeButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  instructionsContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  instructTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  instructText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: 6,
  }
});

export default PujaScreen;
