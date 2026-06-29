import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
  Image,
} from 'react-native';
import { Flame, Award, RefreshCw, MapPin, ChevronRight, Compass, BookOpen, Pin, PinOff } from 'lucide-react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { AppState } from '../types';
import ProgressRing from '../components/ProgressRing';
import TactileBeadButton from '../components/TactileBeadButton';
import Marquee from '../components/Marquee';
import CelebrationOverlay from '../components/CelebrationOverlay';
import RadhaBlessings from '../components/RadhaBlessings';
import { THEMES } from '../theme/themes';
import { getLocalDateString } from '../hooks/useJapStorage';

interface DashboardScreenProps {
  state: AppState;
  increment: () => Promise<boolean> | any;
  resetMala: () => void;
  setDailyGoal: (g: number) => void;
  setTab: (tab: string) => void;
  setActiveDashboardGoal: (goalId: string) => void;
}

const SPIRITUAL_QUOTES = [
  { text: "He who remembers Me constantly, without deviation, easily attains Me.", source: "Bhagavad Gita 8.14" },
  { text: "Concentrate the mind on the sacred sound, for it leads to supreme peace.", source: "Upanishad" },
  { text: "Chanting the holy name dissolves all illusion and invokes the divine presence.", source: "Adi Shankara" },
  { text: "Fix your mind on Me, be devoted to Me, and you shall reach Me without fail.", source: "Bhagavad Gita 18.65" },
  { text: "By constant remembrance and love, the devotee merges with the supreme light.", source: "Srimad Bhagavatam" },
  { text: "The holy name is the ship that crosses the ocean of material existence.", source: "Chaitanya Charitamrita" }
];

const STAGE_DETAILS = {
  'Nidhiban': "Sacred forest of Vrindavan where Radha & Krishna perform divine Raas-Leela every night. The trees represent Gopis bending in devotion.",
  'Seva Kunj': "The garden of loving service. Shri Krishna massaged Radha Rani's feet here after dancing, establishing the peak of devotion.",
  'Radha Kund': "The holiest lake created by Radha Rani's foot anklet, representing the pure, ultimate reservoir of divine spiritual love.",
  'Maan Garh': "The hill of Barsana where Radha Rani went in loving transcendental anger (Maan), and Krishna pacified Her with gentle praises.",
  'Shriji Mandir': "The grand crown palace temple atop Bhanugarh hill in Barsana, celebrating the childhood home of Shri Radha Rani."
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ state, increment, resetMala, setDailyGoal, setTab, setActiveDashboardGoal }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  
  const activeGoalId = state.settings.activeDashboardGoalId ?? 'daily';
  
  const pinnedCustomGoal = useMemo(() => {
    if (activeGoalId === 'daily') return null;
    return state.bigGoals.find(g => g.id === activeGoalId) || null;
  }, [state.bigGoals, activeGoalId]);

  const progressPercent = useMemo(() => {
    if (pinnedCustomGoal) {
      return Math.min(pinnedCustomGoal.current / pinnedCustomGoal.target, 1);
    }
    return Math.min(state.totalChantsToday / state.dailyGoalChants, 1);
  }, [state.totalChantsToday, state.dailyGoalChants, pinnedCustomGoal]);

  const malasToday = Math.floor(state.totalChantsToday / 108);

  const [modalVisible, setModalVisible] = useState(false);
  const [goalText, setGoalText] = useState((state.dailyGoalChants / 108).toString());
  const [showCelebration, setShowCelebration] = useState(false);

  // Quote Picker index and transition fade
  const dayOfYear = new Date().getDate() + new Date().getMonth() * 31;
  const [quoteIdx, setQuoteIdx] = useState(dayOfYear % SPIRITUAL_QUOTES.length);
  const quoteOpacity = useRef(new Animated.Value(1)).current;

  // Toggle display modes for progress and stats
  const [progressLabelMode, setProgressLabelMode] = useState<'percent' | 'remaining' | 'count'>('percent');
  const [streakShowLongest, setStreakShowLongest] = useState(false);
  const [lifetimeShowMalas, setLifetimeShowMalas] = useState(false);

  // Parikrama timeline stage details modal state
  const [activeTooltip, setActiveTooltip] = useState<{ name: string; max: number; color: string } | null>(null);

  // Chanting Speed (CPM) tracker states
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [cpm, setCpm] = useState<number>(0);

  // Press Scale Animations for Cards
  const quoteScale = useRef(new Animated.Value(1)).current;
  const progressCardScale = useRef(new Animated.Value(1)).current;
  const parikramaCardScale = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(1)).current;
  const lifetimeScale = useRef(new Animated.Value(1)).current;

  // Loops for Altar elements
  const floatAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const leftFlameScale = useRef(new Animated.Value(1)).current;
  const leftFlameOpacity = useRef(new Animated.Value(0.9)).current;
  const rightFlameScale = useRef(new Animated.Value(1)).current;
  const rightFlameOpacity = useRef(new Animated.Value(0.9)).current;
  const lotusPulseAnim = useRef(new Animated.Value(1)).current;

  // 60FPS Continuous Flower Shower for Radha Rani Premium Theme
  const isRadhaTheme = state.settings.themeId === 'radha-rani-premium';

  interface PetalData {
    id: number;
    xPercent: number;
    scale: number;
    color: string;
    yAnim: Animated.Value;
    rotateAnim: Animated.Value;
    swayAnim: Animated.Value;
  }

  const petalsCount = 15;
  const petalsRef = useRef<PetalData[]>([]);

  if (petalsRef.current.length === 0) {
    for (let i = 0; i < petalsCount; i++) {
      petalsRef.current.push({
        id: i,
        xPercent: Math.random() * 92 + 4,
        scale: Math.random() * 0.45 + 0.45,
        color: Math.random() > 0.4 ? '#f43f5e' : '#f59e0b',
        yAnim: new Animated.Value(0),
        rotateAnim: new Animated.Value(0),
        swayAnim: new Animated.Value(0)
      });
    }
  }

  const animatePetal = (petal: PetalData, isInitial: boolean) => {
    petal.yAnim.setValue(0);
    petal.rotateAnim.setValue(0);
    petal.swayAnim.setValue(0);

    const delay = isInitial ? Math.random() * 8000 : Math.random() * 1500;
    const duration = Math.random() * 4500 + 4000;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(petal.yAnim, {
          toValue: 1,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(petal.rotateAnim, {
          toValue: Math.random() * 720 - 360,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(petal.swayAnim, {
            toValue: Math.random() * 30 + 10,
            duration: duration / 3,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(petal.swayAnim, {
            toValue: -(Math.random() * 30 + 10),
            duration: duration / 3,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(petal.swayAnim, {
            toValue: 0,
            duration: duration / 3,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ])
    ]).start(({ finished }) => {
      if (finished) {
        animatePetal(petal, false);
      }
    });
  };

  useEffect(() => {
    if (isRadhaTheme) {
      petalsRef.current.forEach(petal => {
        animatePetal(petal, true);
      });
    } else {
      petalsRef.current.forEach(petal => {
        petal.yAnim.stopAnimation();
        petal.rotateAnim.stopAnimation();
        petal.swayAnim.stopAnimation();
      });
    }
    return () => {
      petalsRef.current.forEach(petal => {
        petal.yAnim.stopAnimation();
        petal.rotateAnim.stopAnimation();
        petal.swayAnim.stopAnimation();
      });
    };
  }, [isRadhaTheme]);

  useEffect(() => {
    // Float loop for the bead
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );

    // Spin loop for Sanskrit characters
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true })
    );

    // Diya left flame loop
    const leftLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(leftFlameScale, { toValue: 1.25, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(leftFlameScale, { toValue: 0.85, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(leftFlameOpacity, { toValue: 0.7, duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(leftFlameOpacity, { toValue: 1.0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ])
    );

    // Diya right flame loop
    const rightLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rightFlameScale, { toValue: 1.18, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rightFlameScale, { toValue: 0.9, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(rightFlameOpacity, { toValue: 0.75, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rightFlameOpacity, { toValue: 0.95, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ])
    );

    // Lotus pulse loop
    const lotusLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lotusPulseAnim, { toValue: 1.08, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(lotusPulseAnim, { toValue: 1.0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );

    floatLoop.start();
    spinLoop.start();
    leftLoop.start();
    rightLoop.start();
    lotusLoop.start();

    return () => {
      floatLoop.stop();
      spinLoop.stop();
      leftLoop.stop();
      rightLoop.stop();
      lotusLoop.stop();
    };
  }, []);

  // Poll CPM stats decay every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTapTimes(prev => {
        const filtered = prev.filter(t => now - t < 8000);
        if (filtered.length < 2) {
          setCpm(0);
        } else {
          const first = filtered[0];
          const last = filtered[filtered.length - 1];
          const diffSeconds = (last - first) / 1000;
          if (diffSeconds > 0) {
            const tapsPerSecond = (filtered.length - 1) / diffSeconds;
            setCpm(Math.round(tapsPerSecond * 60));
          } else {
            setCpm(0);
          }
        }
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const spinAngle = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleIncrement = async () => {
    const now = Date.now();
    setTapTimes(prev => {
      const filtered = prev.filter(t => now - t < 8000);
      return [...filtered, now];
    });

    const result = await increment();
    if (result && (result.hitDailyGoal || result.hitBigGoal)) {
      setShowCelebration(true);
    }
  };

  const handleUpdateGoal = () => {
    const malas = parseFloat(goalText);
    if (!isNaN(malas) && malas > 0) {
      setDailyGoal(Math.round(malas * 108));
    }
    setModalVisible(false);
  };

  const animatePress = (val: Animated.Value, toVal: number) => {
    Animated.spring(val, {
      toValue: toVal,
      friction: 7,
      tension: 60,
      useNativeDriver: true
    }).start();
  };

  // Scripture Quote transition cycle
  const handleQuoteCycle = () => {
    Vibration.vibrate(20);
    Animated.timing(quoteOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setQuoteIdx(prev => (prev + 1) % SPIRITUAL_QUOTES.length);
      Animated.timing(quoteOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  // Toggle labels inside progress ring
  const toggleProgressMode = () => {
    Vibration.vibrate(25);
    setProgressLabelMode(prev => {
      if (prev === 'percent') return 'remaining';
      if (prev === 'remaining') return 'count';
      return 'percent';
    });
  };

  // Calculate the highest consecutive chanting streak from historyLogs
  const getLongestStreak = () => {
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDateStr: string | null = null;
    const dates = Object.keys(state.historyLogs).sort();

    if (dates.length === 0) return state.streakDays;

    dates.forEach(dStr => {
      const log = state.historyLogs[dStr];
      if (log && (log.count > 0 || log.isShielded)) {
        if (lastDateStr === null) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(lastDateStr);
          prevDate.setDate(prevDate.getDate() + 1);
          const nextExpected = getLocalDateString(prevDate);
          if (dStr === nextExpected) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
        lastDateStr = dStr;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
        lastDateStr = null;
      }
    });

    maxStreak = Math.max(maxStreak, tempStreak);
    return Math.max(maxStreak, state.streakDays);
  };

  const currentQuoteObj = SPIRITUAL_QUOTES[quoteIdx];

  // Extract syllables dynamically based on selected mantra
  const getSanskritLetters = () => {
    const mantra = state.settings.selectedMantra;
    if (mantra.includes('Narayanaya') || mantra.includes('नारायणाय')) {
      return ['ॐ', 'न', 'मो', 'ना', 'रा', 'य', 'णा', 'या', 'य', 'ॐ', 'न', 'मो'];
    }
    if (mantra.includes('Shivaya') || mantra.includes('शिवाय')) {
      return ['ॐ', 'न', 'मः', 'शि', 'वा', 'य', 'ॐ', 'न', 'मः', 'शि', 'वा', 'य'];
    }
    if (mantra.includes('Krishna') || mantra.includes('कृष्ण')) {
      return ['ह', 'रे', 'कृ', 'ष्ण', 'ह', 'रे', 'रा', 'म', 'ह', 'रे', 'कृ', 'ष्ण'];
    }
    if (mantra.includes('Radha') || mantra.includes('राधा')) {
      return ['रा', 'धा', 'रा', 'धा', 'रा', 'धा', 'रा', 'धा', 'रा', 'धा', 'रा', 'धा'];
    }
    if (mantra.includes('Ram') || mantra.includes('राम')) {
      return ['श्री', 'रा', 'म', 'ज', 'य', 'रा', 'म', 'ज', 'य', 'ज', 'य', 'रा'];
    }
    return ['ॐ', 'शां', 'ति', 'ॐ', 'शां', 'ति', 'ॐ', 'शां', 'ति', 'ॐ', 'शां', 'ति'];
  };

  const getCpmFeedback = () => {
    if (cpm === 0) return { label: 'Silent Contemplation', color: activeTheme.colors.textSecondary };
    if (cpm < 15) return { label: 'Dhyana (Deep Focus)', color: '#10b981' };
    if (cpm < 35) return { label: 'Bhakti Mudra (Steady Chanting)', color: activeTheme.colors.accent };
    if (cpm < 55) return { label: 'Sadhana (Intense Meditation)', color: activeTheme.colors.accentLight };
    return { label: 'Tivra Jap (Rapid Chants)', color: '#ec4899' };
  };

  const feedback = getCpmFeedback();

  const renderMiniDiya = (flameScale: Animated.Value, flameOpacity: Animated.Value) => {
    return (
      <View style={styles.diyaWrapper}>
        <Animated.View style={{ transform: [{ scale: flameScale }], opacity: flameOpacity, marginBottom: -3 }}>
          <Svg width="18" height="22" viewBox="0 0 20 24">
            <Path d="M 10 2 C 12 8, 15 12, 13 16 C 11 19, 9 19, 7 16 C 5 12, 8 8, 10 2 Z" fill="#fbbf24" />
            <Path d="M 10 6 C 11 10, 13 13, 12 15 C 11 17, 9 17, 8 15 C 7 10, 9 6, 10 6 Z" fill="#ffffff" opacity={0.75} />
          </Svg>
        </Animated.View>
        <Svg width="34" height="18" viewBox="0 0 36 20">
          <Path d="M 4 10 C 4 15, 32 15, 32 10 C 32 6, 26 5, 18 5 C 10 5, 4 6, 4 10 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="0.5" />
          <Path d="M 8 10 C 8 12, 28 12, 28 10 Z" fill="#d97706" />
        </Svg>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.colors.background }}>
      {state.settings.marqueeEnabled && (
        <View 
          style={{
            backgroundColor: activeTheme.colors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: activeTheme.colors.cardBorder,
            paddingVertical: 4,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
            height: 38
          }}
        >
          <Marquee 
            text={state.settings.marqueeText} 
            direction={state.settings.marqueeDirection} 
            speed={40} 
            textStyle={{
              color: activeTheme.colors.accent,
              fontSize: 12,
              fontWeight: '900',
            }}
          />
        </View>
      )}
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        className="px-5"
      >

      {/* Scripture Quote (Interactive - Tap to Cycle) */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={() => animatePress(quoteScale, 0.97)}
        onPressOut={() => animatePress(quoteScale, 1.0)}
        onPress={handleQuoteCycle}
      >
        <Animated.View 
          style={{
            backgroundColor: activeTheme.colors.cardBackground + 'B3',
            borderColor: activeTheme.colors.cardBorder,
            borderWidth: 1,
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 14,
            marginTop: 16,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: activeTheme.colors.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: activeTheme.isDark ? 0.25 : 0.06,
            shadowRadius: 8,
            elevation: 3,
            transform: [{ scale: quoteScale }]
          }}
        >
          <BookOpen size={18} color={activeTheme.colors.accent} />
          <Animated.View style={{ flex: 1, opacity: quoteOpacity }}>
            <Text style={{ color: activeTheme.colors.textPrimary, fontStyle: 'italic', fontSize: 11, lineHeight: 15, fontWeight: '700' }}>
              "{currentQuoteObj.text}"
            </Text>
            <Text style={{ color: activeTheme.colors.accent, fontSize: 8.5, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              — {currentQuoteObj.source} <Text style={{ fontSize: 8, color: activeTheme.colors.textSecondary }}>• Tap to change</Text>
            </Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {/* Daily Progress Section (Interactive - Tap Ring to Toggle Label) */}
      {state.settings.progressRingEnabled && (
        <TouchableOpacity
          activeOpacity={0.97}
          onPressIn={() => animatePress(progressCardScale, 0.97)}
          onPressOut={() => animatePress(progressCardScale, 1.0)}
          onPress={toggleProgressMode}
          className="items-center mt-6"
        >
          <Animated.View 
            style={{
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder,
              borderWidth: 1,
              borderRadius: 28,
              padding: 24,
              width: '100%',
              alignItems: 'center',
              shadowColor: activeTheme.colors.shadowColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: activeTheme.isDark ? 0.35 : 0.1,
              shadowRadius: 16,
              elevation: 8,
              transform: [{ scale: progressCardScale }]
            }}
          >
            <View className="flex-row justify-between items-center w-full mb-6">
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: activeTheme.colors.textSecondary, letterSpacing: 1.2 }} className="text-[10px] uppercase font-extrabold" numberOfLines={1}>
                  {pinnedCustomGoal ? "Pinned Spiritual Vow" : "Daily Chanting Goal"}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text style={{ color: activeTheme.colors.textPrimary, flexShrink: 1 }} className="text-xl font-black" numberOfLines={1}>
                    {pinnedCustomGoal ? pinnedCustomGoal.name : state.dailyGoalChants}
                  </Text>
                  {!pinnedCustomGoal && (
                    <>
                      <Text style={{ color: activeTheme.colors.textSecondary }} className="text-sm font-bold ml-1.5">
                        chants
                      </Text>
                      <Text style={{ color: activeTheme.colors.accent }} className="text-xs font-black ml-2 bg-orange-500/10 px-2.5 py-0.5 rounded-full">
                        {(state.dailyGoalChants / 108).toFixed(0)} Malas
                      </Text>
                    </>
                  )}
                </View>
              </View>
              
              {pinnedCustomGoal ? (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    Vibration.vibrate(20);
                    setActiveDashboardGoal('daily');
                  }}
                  style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '33' }}
                  className="py-1.5 px-3.5 rounded-full border flex-row items-center gap-1.5"
                >
                  <PinOff size={11} color={activeTheme.colors.accent} />
                  <Text style={{ color: activeTheme.colors.accent }} className="font-extrabold text-xs">Unpin</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    Vibration.vibrate(20);
                    setModalVisible(true);
                  }}
                  style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '33' }}
                  className="py-1.5 px-4 rounded-full border"
                >
                  <Text style={{ color: activeTheme.colors.accent }} className="font-extrabold text-xs">Edit</Text>
                </TouchableOpacity>
              )}
            </View>
  
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              {isRadhaTheme ? (
                <Animated.View 
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: lotusPulseAnim }],
                    opacity: 0.22,
                  }}
                >
                  <Svg width="110" height="110" viewBox="0 0 100 100">
                    <Path
                      d="M 50 15 C 40 35, 45 45, 50 85 C 55 45, 60 35, 50 15 Z"
                      fill="#ec4899"
                    />
                    <Path
                      d="M 50 25 C 28 42, 38 52, 50 85 C 62 52, 72 42, 50 25 Z"
                      fill="#f472b6"
                      opacity={0.8}
                    />
                    <Path
                      d="M 50 35 C 15 50, 28 65, 50 85 C 72 65, 85 50, 50 35 Z"
                      fill="#fda4af"
                      opacity={0.65}
                    />
                    <Path
                      d="M 50 45 C 5 60, 20 78, 50 85 C 80 78, 95 60, 50 45 Z"
                      fill="#f43f5e"
                      opacity={0.5}
                    />
                  </Svg>
                </Animated.View>
              ) : (
                <View 
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: activeTheme.colors.accent,
                    opacity: 0.05,
                  }}
                />
              )}
              <ProgressRing
                size={190}
                strokeWidth={14}
                progress={progressPercent}
                themeId={state.settings.themeId}
              >
                <View className="items-center">
                  {progressLabelMode === 'percent' && (
                    <>
                      <Text style={{ color: activeTheme.colors.accent }} className="text-4xl font-black tracking-tighter">
                        {Math.round(progressPercent * 100)}%
                      </Text>
                      <Text style={{ color: activeTheme.colors.textSecondary, letterSpacing: 0.8 }} className="text-[9px] uppercase mt-1 font-bold">
                        Completed
                      </Text>
                    </>
                  )}
                  {progressLabelMode === 'remaining' && (
                    <>
                      <Text style={{ color: activeTheme.colors.accent }} className="text-3xl font-black tracking-tighter">
                        {pinnedCustomGoal 
                          ? Math.max(0, pinnedCustomGoal.target - pinnedCustomGoal.current)
                          : Math.max(0, state.dailyGoalChants - state.totalChantsToday)}
                      </Text>
                      <Text style={{ color: activeTheme.colors.textSecondary, letterSpacing: 0.8 }} className="text-[9px] uppercase mt-1 font-bold">
                        Chants Left
                      </Text>
                    </>
                  )}
                  {progressLabelMode === 'count' && (
                    <>
                      <Text style={{ color: activeTheme.colors.accent }} className="text-3xl font-black tracking-tighter">
                        {pinnedCustomGoal ? pinnedCustomGoal.current : state.totalChantsToday}
                      </Text>
                      <Text style={{ color: activeTheme.colors.textSecondary, letterSpacing: 0.8 }} className="text-[9px] uppercase mt-1 font-bold">
                        {pinnedCustomGoal ? "Chanted" : "Chanted Today"}
                      </Text>
                    </>
                  )}
                  {pinnedCustomGoal ? (
                    <View style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '22', borderWidth: 0.5 }} className="flex-row items-center rounded-full px-3 py-1 mt-3">
                      <Flame size={12} color={activeTheme.colors.accent} fill={activeTheme.colors.accent} />
                      <Text style={{ color: activeTheme.colors.accent }} className="font-extrabold text-[10px] ml-1.5">
                        {pinnedCustomGoal.current.toLocaleString()} / {pinnedCustomGoal.target.toLocaleString()} Chants
                      </Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '22', borderWidth: 0.5 }} className="flex-row items-center rounded-full px-3 py-1 mt-3">
                      <Flame size={12} color={activeTheme.colors.accent} fill={activeTheme.colors.accent} />
                      <Text style={{ color: activeTheme.colors.accent }} className="font-extrabold text-[10px] ml-1.5">
                        {malasToday} / {(state.dailyGoalChants / 108).toFixed(0)} Malas
                      </Text>
                    </View>
                  )}
                </View>
              </ProgressRing>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Altar Chanting Shrine */}
      <View 
        style={{
          backgroundColor: activeTheme.colors.cardBackground,
          borderColor: activeTheme.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 28,
          padding: 22,
          marginTop: 24,
          width: '100%',
          alignItems: 'center',
          shadowColor: activeTheme.colors.shadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: activeTheme.isDark ? 0.35 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {isRadhaTheme && (
          <View style={{ position: 'absolute', top: -18, zIndex: 10, alignItems: 'center' }} pointerEvents="none">
            <Svg width="70" height="24" viewBox="0 0 70 24">
              <Path
                d="M 5 22 L 15 12 L 25 22 L 35 6 L 45 22 L 55 12 L 65 22 Z"
                fill="#fbbf24"
                stroke="#d97706"
                strokeWidth="1"
              />
              <Circle cx="15" cy="14" r="1.8" fill="#ef4444" />
              <Circle cx="35" cy="9" r="2.2" fill="#ef4444" />
              <Circle cx="55" cy="14" r="1.8" fill="#ef4444" />
              <Path
                d="M 35 5 Q 31 -3, 35 -7 Q 39 -3, 35 5 Z"
                fill="#0284c7"
                stroke="#0d9488"
                strokeWidth="1"
              />
              <Circle cx="35" cy="-1" r="1.5" fill="#f43f5e" />
            </Svg>
          </View>
        )}
        <Text style={{ color: activeTheme.colors.textSecondary, letterSpacing: 0.8 }} className="text-[10px] uppercase font-extrabold mb-4">
          Sacred Chanting Shrine
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 8 }}>
          {renderMiniDiya(leftFlameScale, leftFlameOpacity)}

          <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ position: 'absolute', transform: [{ rotate: spinAngle }] }}>
              <Svg width="210" height="210" viewBox="0 0 220 220">
                <Circle cx="110" cy="110" r="95" stroke={activeTheme.colors.accent} strokeWidth="0.8" strokeDasharray="3 8" opacity={0.25} />
                <G transform="translate(110, 110)">
                  {getSanskritLetters().map((letter, idx) => {
                    const angle = (idx * 360) / 12;
                    const radians = (angle * Math.PI) / 180;
                    const radius = 80;
                    const x = radius * Math.cos(radians);
                    const y = radius * Math.sin(radians);
                    return (
                      <SvgText
                        key={idx}
                        x={x}
                        y={y}
                        fill={activeTheme.colors.accentLight}
                        fontSize="9.5"
                        fontWeight="900"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        opacity={0.7}
                        transform={`rotate(${angle + 90}, ${x}, ${y})`}
                      >
                        {letter}
                      </SvgText>
                    );
                  })}
                </G>
              </Svg>
            </Animated.View>

            <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: activeTheme.colors.accent, opacity: 0.05 }} />

            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <TactileBeadButton
                onPress={handleIncrement}
                currentCount={state.currentChantsInMala}
                themeId={state.settings.themeId}
                selectedMantra={state.settings.selectedMantra}
                beadDesign={state.settings.beadDesign}
                particleEffect={state.settings.particleEffect}
                soundEnabled={state.settings.soundEnabled}
                counterStyle={state.settings.counterStyle}
                bounceEnabled={state.settings.bounceEnabled}
                sakhisEnabled={state.settings.sakhisEnabled}
                glowEffectsEnabled={state.settings.glowEffectsEnabled}
                dragPhysicsEnabled={state.settings.dragPhysicsEnabled}
              />
            </Animated.View>
          </View>

          {renderMiniDiya(rightFlameScale, rightFlameOpacity)}
        </View>

        <View className="flex-row justify-between w-full px-2 mt-4 items-center">
          <View className="items-start">
            <Text style={{ color: activeTheme.colors.textSecondary }} className="text-[9px] uppercase tracking-wider font-extrabold">Current Bead</Text>
            <View className="flex-row items-baseline mt-0.5">
              <Text style={{ color: activeTheme.colors.accentLight }} className="text-xl font-black">
                {state.currentChantsInMala}
              </Text>
              <Text style={{ color: activeTheme.colors.textSecondary }} className="text-xs ml-1 font-bold">
                / 108
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={resetMala}
            style={{ backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.cardBorder }}
            className="flex-row items-center px-4 py-2 rounded-full border shadow-sm"
          >
            <RefreshCw size={11} color={activeTheme.colors.textSecondary} />
            <Text style={{ color: activeTheme.colors.textSecondary }} className="text-xs font-extrabold ml-2">Reset Bead</Text>
          </TouchableOpacity>
        </View>

        {/* Real-time speed gauge */}
        <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: activeTheme.colors.cardBorder, paddingTop: 16, marginTop: 16 }}>
          <View className="flex-row justify-between items-center mb-2">
            <Text style={{ color: activeTheme.colors.textSecondary }} className="text-[10px] uppercase font-extrabold tracking-wider">
              Chanting Tempo
            </Text>
            <Text style={{ color: feedback.color, fontWeight: '900' }} className="text-[10.5px] uppercase">
              {feedback.label}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Text style={{ color: activeTheme.colors.textPrimary }} className="text-lg font-black w-14 text-right">
              {cpm} <Text style={{ fontSize: 9, fontWeight: 'bold', color: activeTheme.colors.textSecondary }}>CPM</Text>
            </Text>
            <View style={{ flex: 1, height: 7, backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 3.5, overflow: 'hidden' }}>
              <View 
                style={{ 
                  width: `${Math.min(100, (cpm / 75) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: feedback.color,
                  borderRadius: 3.5,
                }} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Horizontal Timeline Pilgrim Path Map (Interactive - Tap Nodes for details) */}
      {state.settings.parikramaEnabled && (() => {
        const STAGES = [
          { name: 'Nidhiban', max: 500, color: '#10b981' },
          { name: 'Seva Kunj', max: 1200, color: '#0ea5e9' },
          { name: 'Radha Kund', max: 2500, color: '#6366f1' },
          { name: 'Maan Garh', max: 4500, color: '#ec4899' },
          { name: 'Shriji Mandir', max: 5400, color: '#eab308' },
        ];
        const loopChants = state.lifetimeTotalChants % 5400;
        const completedCycles = Math.floor(state.lifetimeTotalChants / 5400);

        return (
          <TouchableOpacity
            activeOpacity={0.97}
            onPressIn={() => animatePress(parikramaCardScale, 0.97)}
            onPressOut={() => animatePress(parikramaCardScale, 1.0)}
            onPress={() => setTab('Parikrama')}
            style={{ width: '100%', marginTop: 20 }}
          >
            <Animated.View
              style={{
                backgroundColor: activeTheme.colors.cardBackground,
                borderColor: activeTheme.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 28,
                padding: 20,
                shadowColor: activeTheme.colors.shadowColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: activeTheme.isDark ? 0.25 : 0.08,
                shadowRadius: 12,
                elevation: 4,
                transform: [{ scale: parikramaCardScale }]
              }}
            >
              {isRadhaTheme && (
                <View pointerEvents="none" style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Svg width="30" height="30" viewBox="0 0 40 40">
                    <Path d="M20 2 L24 14 L38 14 L27 22 L31 36 L20 28 L9 36 L13 22 L2 14 L16 14 Z" fill="#fbbf24" />
                  </Svg>
                </View>
              )}
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <Compass size={18} color={activeTheme.colors.accent} />
                  <Text style={{ color: activeTheme.colors.accent, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Pilgrimage Journey Path
                  </Text>
                </View>
                {completedCycles > 0 && (
                  <View style={{ backgroundColor: '#ffd7001A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2.5 }}>
                    <Text style={{ color: '#ffd700', fontSize: 9, fontWeight: '900' }}>
                      🌟 {completedCycles} Tour{completedCycles > 1 ? 's' : ''} Completed
                    </Text>
                  </View>
                )}
              </View>

              {/* Horizontal Timeline Path */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, position: 'relative', height: 40, marginVertical: 6 }}>
                <View style={{ position: 'absolute', left: 24, right: 24, top: 18, height: 4, backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 2, zIndex: 1 }} />
                
                {STAGES.map((s, idx) => {
                  const minVal = idx === 0 ? 0 : STAGES[idx - 1].max;
                  const maxVal = s.max;
                  
                  const isCompleted = loopChants >= maxVal;
                  const isActive = loopChants >= minVal && loopChants < maxVal;
                  const isLocked = loopChants < minVal;

                  const nodeColor = isCompleted ? '#10b981' : isActive ? activeTheme.colors.accent : activeTheme.colors.textSecondary + '44';

                  return (
                    <TouchableOpacity 
                      key={s.name} 
                      onPress={(e) => {
                        e.stopPropagation();
                        Vibration.vibrate(30);
                        setActiveTooltip(s);
                      }}
                      style={{ alignItems: 'center', zIndex: 2, width: 50 }}
                    >
                      <View 
                        style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12, 
                          backgroundColor: isCompleted ? '#10b981' : isActive ? activeTheme.colors.cardBackground : activeTheme.colors.background,
                          borderColor: nodeColor,
                          borderWidth: 2.5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: nodeColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isActive ? 0.4 : 0,
                          shadowRadius: 4,
                          elevation: isActive ? 3 : 0,
                        }}
                      >
                        {isCompleted ? (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' }} />
                        ) : isActive ? (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeTheme.colors.accent }} />
                        ) : null}
                      </View>
                      <Text style={{ color: isActive ? activeTheme.colors.textPrimary : activeTheme.colors.textSecondary, fontSize: 8, fontWeight: '800', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })()}
      
      {state.settings.blessingsEnabled && (
        <RadhaBlessings
          themeId={state.settings.themeId}
        />
      )}

      {/* Streak & Lifetime Stats Cards (Interactive - Tap to toggle metrics) */}
      {state.settings.streakStatsEnabled && (
        <View className="flex-row gap-3.5 mt-6 w-full">
          {/* Streak Card */}
          <TouchableOpacity
            activeOpacity={0.96}
            onPressIn={() => animatePress(streakScale, 0.95)}
            onPressOut={() => animatePress(streakScale, 1.0)}
            onPress={() => {
              Vibration.vibrate(20);
              setStreakShowLongest(!streakShowLongest);
            }}
            style={{ flex: 1 }}
          >
            <Animated.View 
              style={{
                backgroundColor: activeTheme.colors.cardBackground,
                borderColor: activeTheme.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 24,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: activeTheme.colors.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: activeTheme.isDark ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 4,
                transform: [{ scale: streakScale }]
              }}
            >
              {isRadhaTheme && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <Animated.View style={{ transform: [{ scale: lotusPulseAnim }] }}>
                    <Text style={{ fontSize: 16 }}>🪷</Text>
                  </Animated.View>
                </View>
              )}
              <View style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '33', borderWidth: 1 }} className="w-12 h-12 rounded-2xl items-center justify-center">
                <Flame size={22} color={activeTheme.colors.accent} fill={activeTheme.colors.accent} />
              </View>
              <View className="ml-3">
                <Text style={{ color: activeTheme.colors.textSecondary }} className="text-[9px] uppercase tracking-widest font-extrabold">
                  {streakShowLongest ? 'Longest Streak' : 'Chant Streak'}
                </Text>
                <Text style={{ color: activeTheme.colors.textPrimary }} className="text-lg font-black mt-0.5">
                  {streakShowLongest ? getLongestStreak() : state.streakDays} Days
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Lifetime Card */}
          <TouchableOpacity
            activeOpacity={0.96}
            onPressIn={() => animatePress(lifetimeScale, 0.95)}
            onPressOut={() => animatePress(lifetimeScale, 1.0)}
            onPress={() => {
              Vibration.vibrate(20);
              setLifetimeShowMalas(!lifetimeShowMalas);
            }}
            style={{ flex: 1 }}
          >
            <Animated.View 
              style={{
                backgroundColor: activeTheme.colors.cardBackground,
                borderColor: activeTheme.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 24,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: activeTheme.colors.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: activeTheme.isDark ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 4,
                transform: [{ scale: lifetimeScale }]
              }}
            >
              <View style={{ backgroundColor: activeTheme.colors.accentLight + '1A', borderColor: activeTheme.colors.accentLight + '33', borderWidth: 1 }} className="w-12 h-12 rounded-2xl items-center justify-center">
                <Award size={22} color={activeTheme.colors.accentLight} />
              </View>
              <View className="ml-3">
                <Text style={{ color: activeTheme.colors.textSecondary }} className="text-[9px] uppercase tracking-widest font-extrabold">
                  {lifetimeShowMalas ? 'Lifetime Malas' : 'Lifetime Total'}
                </Text>
                <Text style={{ color: activeTheme.colors.textPrimary }} className="text-lg font-black mt-0.5">
                  {lifetimeShowMalas 
                    ? `${(state.lifetimeTotalChants / 108).toFixed(1)} Malas`
                    : state.lifetimeTotalChants.toLocaleString()
                  }
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}

      {/* Goal Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View 
            className="p-6 rounded-t-[40px] items-center"
            style={{
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder,
              borderWidth: 1
            }}
          >
            <View className="w-12 h-1.5 bg-gray-500/20 rounded-full mb-6" />
            
            <Text style={{ color: activeTheme.colors.textPrimary }} className="text-xl font-bold mb-1">
              Update Daily Goal
            </Text>
            <Text style={{ color: activeTheme.colors.textSecondary }} className="text-xs text-center mb-6">
              Enter your target in number of Malas. (1 Mala = 108 chants)
            </Text>
            
            <View className="flex-row items-center mb-6 w-full max-w-xs justify-center gap-3">
              <TextInput
                value={goalText}
                onChangeText={setGoalText}
                keyboardType="numeric"
                style={{
                  width: 100,
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: activeTheme.colors.accent,
                  color: activeTheme.colors.textPrimary,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: 'bold',
                  backgroundColor: activeTheme.colors.background
                }}
              />
              <Text style={{ color: activeTheme.colors.textPrimary }} className="text-lg font-bold">
                Malas
              </Text>
            </View>

            <Text style={{ color: activeTheme.colors.accent }} className="text-xs font-bold mb-6">
              Total Chants: {Math.round(parseFloat(goalText || '0') * 108) || 0}
            </Text>

            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.cardBorder }}
                className="flex-1 py-4 rounded-full border items-center"
              >
                <Text style={{ color: activeTheme.colors.textSecondary }} className="font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateGoal}
                style={{ backgroundColor: activeTheme.colors.accent }}
                className="flex-1 py-4 rounded-full items-center shadow-lg"
              >
                <Text className="text-white font-bold">Apply Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Parikrama Node Tooltip Modal overlay */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={activeTooltip !== null}
        onRequestClose={() => setActiveTooltip(null)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setActiveTooltip(null)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder,
              borderWidth: 1.5,
              borderRadius: 28,
              padding: 24,
              width: '100%',
              maxWidth: 320,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 24,
            }}
          >
            <View style={{ backgroundColor: activeTooltip ? activeTooltip.color + '1A' : '#fbbf241A', borderColor: activeTooltip ? activeTooltip.color + '33' : '#fbbf2433', borderWidth: 1.5 }} className="w-16 h-16 rounded-3xl items-center justify-center mb-4">
              <MapPin size={32} color={activeTooltip ? activeTooltip.color : '#fbbf24'} />
            </View>
            <Text style={{ color: activeTheme.colors.textPrimary }} className="text-xl font-black text-center mb-1">
              {activeTooltip?.name}
            </Text>
            <Text style={{ color: activeTheme.colors.accent, fontWeight: '800' }} className="text-xs uppercase tracking-widest mb-4">
              Requires {activeTooltip?.max} Chants
            </Text>
            <Text style={{ color: activeTheme.colors.textSecondary, lineHeight: 18, textAlign: 'center' }} className="text-sm font-semibold mb-6">
              {activeTooltip ? STAGE_DETAILS[activeTooltip.name as keyof typeof STAGE_DETAILS] : ''}
            </Text>

            <TouchableOpacity
              onPress={() => setActiveTooltip(null)}
              style={{ backgroundColor: activeTheme.colors.accent, width: '100%' }}
              className="py-3.5 rounded-full items-center"
            >
              <Text className="text-white font-extrabold text-sm uppercase tracking-wider">Close Details</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Celebration Modal Overlay on Mala Complete */}
      {showCelebration && state.settings.celebrationEnabled && (
        <CelebrationOverlay
          themeId={state.settings.themeId}
          completedMalasToday={malasToday}
          lifetimeTotalChants={state.lifetimeTotalChants}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
    </ScrollView>

    {/* 60FPS Continuous Flower Shower for Radha Rani Premium Theme */}
    {isRadhaTheme && (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {petalsRef.current.map((petal) => {
          const translateY = petal.yAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 1000]
          });
          const translateX = petal.swayAnim;
          const rotate = petal.rotateAnim.interpolate({
            inputRange: [-360, 360],
            outputRange: ['-360deg', '360deg']
          });
          const opacity = petal.yAnim.interpolate({
            inputRange: [0, 0.1, 0.8, 1],
            outputRange: [0, 0.9, 0.9, 0]
          });

          return (
            <Animated.View
              key={petal.id}
              style={{
                position: 'absolute',
                left: `${petal.xPercent}%`,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                  { scale: petal.scale }
                ],
                opacity,
                width: 16,
                height: 16,
              }}
            >
              <Svg width="16" height="16" viewBox="0 0 20 20">
                <Path
                  d="M 10 2 C 12 7, 18 10, 10 18 C 2 10, 8 7, 10 2 Z"
                  fill={petal.color}
                />
                <Path
                  d="M 10 6 C 10 10, 11 12, 10 16"
                  stroke={petal.color === '#f43f5e' ? '#fda4af' : '#fef08a'}
                  strokeWidth="1"
                  fill="none"
                  opacity={0.6}
                />
              </Svg>
            </Animated.View>
          );
        })}
      </View>
    )}
  </View>
);
};

const styles = StyleSheet.create({
  diyaWrapper: {
    alignItems: 'center',
    width: 44,
    height: 54,
  }
});

export default DashboardScreen;
