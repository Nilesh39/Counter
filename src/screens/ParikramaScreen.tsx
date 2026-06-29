import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
  Easing,
  Animated
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import {
  MapPin,
  Volume2,
  Lock,
  Sprout,
  Heart,
  Waves,
  Mountain,
  Crown,
  Sparkles,
  Trophy,
  Droplet,
  Gem,
  Award,
  Info
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppState } from '../types';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ParikramaScreenProps {
  state: AppState;
}

interface StageData {
  id: number;
  name: string;
  desc: string;
  lila: string;
  quote: string;
  minChants: number;
  maxChants: number;
  color: string;
  bgImage: any;
  icon: any;
  blessingName: string;
  blessingDesc: string;
  blessingIcon: any;
  blessingColor: string;
}

const STAGES: StageData[] = [
  {
    id: 1,
    name: 'Nidhivan Forest Gate',
    desc: 'Mystical forest of Vrindavan Dham, where eternal divine Raas Leela occurs under the moonlight.',
    lila: 'In Nidhivan, the trees (represented as Gopis) twist downward in devotion. It is believed that Radha and Krishna perform their nocturnal pastimes here even today, and no one is allowed to remain in the forest overnight.',
    quote: '"Vrindavanam parityajya padam ekam na gacchati" - Lord Krishna never leaves the soil of Vrindavan.',
    minChants: 0,
    maxChants: 500,
    color: '#10b981', // Emerald Green
    bgImage: require('../../assets/parikrama/stage1.jpg'),
    icon: Sprout,
    blessingName: 'Nidhivan Raj',
    blessingDesc: 'Holy sacred dust of Nidhivan forest, granting pure seed of devotion.',
    blessingIcon: Sprout,
    blessingColor: '#10b981'
  },
  {
    id: 2,
    name: 'Seva Kunj (Radha Mandir)',
    desc: 'Sacred grove of Seva Kunj, where Lord Krishna serves the lotus feet of Shri Radha Rani.',
    lila: 'Here, Lord Krishna personally decorated Kishori Ju’s hair and massaged Her lotus feet after the Raas Leela. This grove signifies that in the highest realm of devotion, service (Seva) to Radha is the ultimate path.',
    quote: '"Radha Dasi Bhav" - Cultivate the mood of being the servant of the servant of Radha.',
    minChants: 500,
    maxChants: 1200,
    color: '#0ea5e9', // Sky Blue
    bgImage: require('../../assets/parikrama/stage2.jpg'),
    icon: Heart,
    blessingName: 'Seva Rasa Lotus',
    blessingDesc: 'Lotus of selfless divine service, softening the chanter’s heart.',
    blessingIcon: Heart,
    blessingColor: '#38bdf8'
  },
  {
    id: 3,
    name: 'Radha Kund & Syama Kund',
    desc: 'Chanting along the banks of Radha Kund, the most supreme and holy lake in existence.',
    lila: 'Formed by Radha Rani and Her sakhis digging the earth with their bangles, Radha Kund contains the liquid form of Radha’s love. Bathing or chanting here grants the highest ecstatic love of Krishna.',
    quote: '"Yathā rādhā priyā viṣṇos-tasyāḥ kuṇḍaṁ priyaṁ tathā" - As Radha is dear to Krishna, so is Her Kund.',
    minChants: 1200,
    maxChants: 2500,
    color: '#6366f1', // Indigo Blue
    bgImage: require('../../assets/parikrama/stage3.jpg'),
    icon: Waves,
    blessingName: 'Radha Kund Jal',
    blessingDesc: 'Holy water of Radha Kund, washing away spiritual dryness.',
    blessingIcon: Droplet,
    blessingColor: '#818cf8'
  },
  {
    id: 4,
    name: 'Maan Garh Peak (Barsana)',
    desc: 'Devotional peak of love on the golden hills where Radha hides in Her loving pride.',
    lila: 'The hill representing Barsana is Brahma himself in the form of a mountain. On this peak, Radha Rani exhibits Her sweet "Maan" (loving anger), and Krishna assumes various disguises to win back Her glance.',
    quote: '"Radhe Radhe Govinda, Govinda Radhe" - Chanting in the mood of Barsana.',
    minChants: 2500,
    maxChants: 4500,
    color: '#ec4899', // Rose Pink
    bgImage: require('../../assets/parikrama/stage4.jpg'),
    icon: Mountain,
    blessingName: 'Maan-Mukti Pearl',
    blessingDesc: 'Pearl of humility, removing pride and building sincere surrender.',
    blessingIcon: Gem,
    blessingColor: '#f472b6'
  },
  {
    id: 5,
    name: 'Shriji Mandir Palace Temple',
    desc: 'The highest palace temple of Barsana Dham, home of Kishori Ju.',
    lila: 'Arriving at the crowning palace temple of Shriji Mandir, situated at the peak of Bhanugarh hill. You have completed the parikrama loop and received the full shelter of Shri Radha Rani’s lotus feet.',
    quote: '"Radha Charana Sarana" - Obtaining shelter at the lotus feet of Shri Radha.',
    minChants: 4500,
    maxChants: 5400,
    color: '#eab308', // Gold
    bgImage: require('../../assets/parikrama/stage5.jpg'),
    icon: Crown,
    blessingName: 'Radha Charan Blessing',
    blessingDesc: 'Lotus feet shelter of Shri Radha Rani, granting eternal spiritual bliss.',
    blessingIcon: Award,
    blessingColor: '#facc15'
  }
];

const AnimatedG = Animated.createAnimatedComponent(G);

export const ParikramaScreen: React.FC<ParikramaScreenProps> = ({ state }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  
  const loopChants = state.lifetimeTotalChants % 5400;
  const completedCycles = Math.floor(state.lifetimeTotalChants / 5400);

  const bobbingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobbingAnim, {
          toValue: -8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(bobbingAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Determine current active stage index
  const activeStageIndex = useMemo(() => {
    const idx = STAGES.findIndex(s => loopChants >= s.minChants && loopChants < s.maxChants);
    return idx !== -1 ? idx : STAGES.length - 1;
  }, [loopChants]);

  // Selected stage for inspection (defaults to active stage)
  const [selectedStageId, setSelectedStageId] = useState<number>(activeStageIndex + 1);

  // Sync selected stage with active stage on mount/chant changes
  useEffect(() => {
    setSelectedStageId(activeStageIndex + 1);
  }, [activeStageIndex]);

  const selectedStage = useMemo(() => {
    return STAGES[selectedStageId - 1];
  }, [selectedStageId]);

  const isSelectedLocked = useMemo(() => {
    if (completedCycles > 0) return false; // Unlocked all stages if completed a full tour
    return loopChants < selectedStage.minChants;
  }, [loopChants, selectedStage, completedCycles]);

  const activeStageProgressPercent = useMemo(() => {
    const stage = STAGES[activeStageIndex];
    const chantsInStage = loopChants - stage.minChants;
    const stageSpan = stage.maxChants - stage.minChants;
    return Math.min(Math.max(chantsInStage / stageSpan, 0), 1);
  }, [loopChants, activeStageIndex]);

  // SVG Coordinates for vertical winding path
  // Canvas: Width 350, Height 320
  const nodes = useMemo(() => [
    { id: 1, x: 70, y: 280 },   // Nidhivan
    { id: 2, x: 280, y: 220 },  // Seva Kunj
    { id: 3, x: 70, y: 160 },   // Radha Kund
    { id: 4, x: 280, y: 100 },  // Maan Garh
    { id: 5, x: 175, y: 30 }    // Shriji Mandir
  ], []);

  // Curved vertical path
  const windingPathD = "M 70 280 C 175 250, 175 250, 280 220 C 175 190, 175 190, 70 160 C 175 130, 175 130, 280 100 C 220 65, 220 65, 175 30";

  // Calculate coordinates of the pilgrim avatar dot
  const avatarCoords = useMemo(() => {
    if (loopChants >= 5400) return nodes[4];
    
    let segment = 0;
    for (let i = 0; i < 4; i++) {
      if (loopChants >= STAGES[i].minChants && loopChants < STAGES[i].maxChants) {
        segment = i;
        break;
      }
    }
    if (loopChants >= STAGES[4].minChants) segment = 3; // cap at segment 3 (connecting 4 to 5)

    const stage = STAGES[segment];
    const nextStage = STAGES[segment + 1];
    
    // progress fraction along the current segment
    const segmentChants = loopChants - stage.minChants;
    const segmentSpan = stage.maxChants - stage.minChants;
    const factor = Math.min(Math.max(segmentChants / segmentSpan, 0), 1);

    const currNode = nodes[segment];
    const nextNode = nodes[segment + 1];

    // Linear interpolation
    return {
      x: currNode.x + (nextNode.x - currNode.x) * factor,
      y: currNode.y + (nextNode.y - currNode.y) * factor
    };
  }, [loopChants, nodes]);

  // Audio Playback
  const playBellSound = async () => {
    try {
      Vibration.vibrate(50);
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/1655/1655-84.wav' }
      );
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.warn('Could not play temple bell sound', err);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: activeTheme.colors.background }]}
    >
      {/* 1. Main Darshan Inspector Card */}
      <View 
        style={[
          styles.darshanCard, 
          { 
            borderColor: activeTheme.colors.cardBorder,
            backgroundColor: activeTheme.colors.cardBackground
          }
        ]}
      >
        <ImageBackground
          source={selectedStage.bgImage}
          style={styles.imageBackground}
          imageStyle={styles.imageBackgroundStyle}
        >
          {/* Translucent Glass Overlay */}
          <View style={styles.glassOverlay}>
            
            {/* Lock Cover if the inspected stage is locked */}
            {isSelectedLocked && (
              <View style={styles.lockOverlay}>
                <View style={styles.lockBadge}>
                  <Lock size={22} color="#f59e0b" />
                </View>
                <Text style={styles.lockText}>Stage Locked</Text>
                <Text style={styles.lockSubtext}>
                  Reach {selectedStage.minChants.toLocaleString()} total chants to enter this holy site.
                </Text>
                <Text style={styles.lockChantsProgress}>
                  Current progress: {loopChants.toLocaleString()} / {selectedStage.minChants.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Stage Title and Location Info */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.stageIndexText}>STAGE {selectedStage.id} OF 5</Text>
                <Text style={styles.stageTitleText}>{selectedStage.name}</Text>
              </View>
              
              <TouchableOpacity
                onPress={playBellSound}
                style={[styles.bellButton, { backgroundColor: selectedStage.color + '33' }]}
              >
                <Volume2 size={16} color={selectedStage.color} />
              </TouchableOpacity>
            </View>

            {/* Description & Lilas */}
            <ScrollView style={styles.lilaScroll} nestedScrollEnabled={true}>
              <Text style={styles.descriptionText}>{selectedStage.desc}</Text>
              
              <View style={[styles.lilaBox, { borderLeftColor: selectedStage.color }]}>
                <Text style={styles.lilaTitle}>Divine Pastime (Lila):</Text>
                <Text style={styles.lilaText}>{selectedStage.lila}</Text>
              </View>

              <Text style={styles.quoteText}>{selectedStage.quote}</Text>
            </ScrollView>

            {/* Current Selected Stage Status Footer */}
            <View style={styles.cardFooter}>
              {completedCycles > 0 || loopChants >= selectedStage.maxChants ? (
                <View style={styles.statusBadgeCompleted}>
                  <Sparkles size={12} color="#ffffff" />
                  <Text style={styles.statusBadgeTextCompleted}>STAGE COMPLETED</Text>
                </View>
              ) : loopChants >= selectedStage.minChants ? (
                <View style={styles.statusBadgeActive}>
                  <View style={[styles.pulseDot, { backgroundColor: selectedStage.color }]} />
                  <Text style={styles.statusBadgeTextActive}>ACTIVE YATRA STAGE</Text>
                </View>
              ) : (
                <View style={styles.statusBadgeLocked}>
                  <Lock size={10} color="#94a3b8" />
                  <Text style={styles.statusBadgeTextLocked}>STAGE LOCKED</Text>
                </View>
              )}
              
              <Text style={styles.chantsSpanText}>
                {selectedStage.minChants} - {selectedStage.maxChants} Chants
              </Text>
            </View>

          </View>
        </ImageBackground>
      </View>

      {/* 2. Climbing SVG Map Path Container */}
      <View 
        style={[
          styles.mapContainer, 
          { 
            backgroundColor: activeTheme.colors.cardBackground, 
            borderColor: activeTheme.colors.cardBorder 
          }
        ]}
      >
        <View style={styles.mapHeader}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.textPrimary }]}>
            Barsana Hills Road
          </Text>
          <View style={styles.cyclesRow}>
            <Trophy size={14} color="#eab308" />
            <Text style={styles.cyclesText}>
              {completedCycles} Mala {completedCycles === 1 ? 'Tour' : 'Tours'}
            </Text>
          </View>
        </View>

        {/* SVG Path Canvas */}
        <View style={styles.svgWrapper}>
          <Svg width="100%" height="320" viewBox="0 0 350 320" style={styles.svgMap}>
            
            {/* Scenery Background: Yamuna River */}
            <Path
              d="M -20 270 Q 90 290, 180 260 T 370 280"
              stroke="#0ea5e9"
              strokeWidth="8"
              fill="none"
              opacity={activeTheme.isDark ? 0.18 : 0.12}
            />
            <Path
              d="M -20 270 Q 90 290, 180 260 T 370 280"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              opacity={activeTheme.isDark ? 0.25 : 0.18}
            />

            {/* Scenery Background: Nidhivan Forest Groves */}
            {/* Grove 1 (Bottom Left) */}
            <Circle cx="40" cy="290" r="18" fill="#10b981" opacity={activeTheme.isDark ? 0.15 : 0.1} />
            <Circle cx="25" cy="300" r="14" fill="#059669" opacity={activeTheme.isDark ? 0.15 : 0.1} />
            <Circle cx="50" cy="305" r="12" fill="#047857" opacity={activeTheme.isDark ? 0.12 : 0.08} />

            {/* Grove 2 (Seva Kunj - Middle Right) */}
            <Circle cx="320" cy="240" r="16" fill="#10b981" opacity={activeTheme.isDark ? 0.15 : 0.1} />
            <Circle cx="330" cy="225" r="12" fill="#059669" opacity={activeTheme.isDark ? 0.15 : 0.1} />

            {/* Grove 3 (Radha Kund - Middle Left) */}
            <Circle cx="35" cy="180" r="15" fill="#10b981" opacity={activeTheme.isDark ? 0.15 : 0.1} />
            <Circle cx="20" cy="165" r="12" fill="#047857" opacity={activeTheme.isDark ? 0.12 : 0.08} />

            {/* Grove 4 (Maan Garh - Top Right) */}
            <Circle cx="320" cy="120" r="16" fill="#10b981" opacity={activeTheme.isDark ? 0.15 : 0.1} />
            <Circle cx="305" cy="135" r="12" fill="#059669" opacity={activeTheme.isDark ? 0.15 : 0.1} />

            {/* Scenery Background: Fluffy Clouds (Top) */}
            <G opacity={activeTheme.isDark ? 0.08 : 0.06} fill={activeTheme.colors.textPrimary}>
              {/* Cloud Left */}
              <Circle cx="60" cy="40" r="12" />
              <Circle cx="74" cy="36" r="9" />
              <Circle cx="48" cy="42" r="8" />
              {/* Cloud Right */}
              <Circle cx="290" cy="35" r="14" />
              <Circle cx="306" cy="32" r="10" />
              <Circle cx="276" cy="38" r="9" />
            </G>

            {/* Winding Base Road Path */}
            <Path
              d={windingPathD}
              stroke={activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />

            {/* Completed Path Glow/Gold Overlay */}
            {loopChants > 0 && (
              <Path
                d={windingPathD}
                stroke="url(#goldGrad)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="450"
                strokeDashoffset={450 * (1 - (loopChants / 5400))}
              />
            )}

            <Defs>
              <LinearGradient id="goldGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor="#d97706" />
                <Stop offset="50%" stopColor="#f59e0b" />
                <Stop offset="100%" stopColor="#fbbf24" />
              </LinearGradient>
            </Defs>

            {/* Active stage node breathing ring */}
            <Circle
              cx={nodes[activeStageIndex].x}
              cy={nodes[activeStageIndex].y}
              r="22"
              fill={STAGES[activeStageIndex].color}
              opacity={0.16}
            />

            {/* Selected Node Ring Highlight */}
            <Circle
              cx={nodes[selectedStageId - 1].x}
              cy={nodes[selectedStageId - 1].y}
              r="28"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4,4"
              fill="none"
            />
          </Svg>

          {/* Winding Pilgrim Avatar Group */}
          <Animated.View
            style={{
              position: 'absolute',
              left: avatarCoords.x * (SCREEN_WIDTH - 64) / 350 - 15,
              top: avatarCoords.y - 15,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: activeTheme.colors.accent + '55',
              borderWidth: 1.5,
              borderColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transform: [{ translateY: bobbingAnim }]
            }}
          >
            <Text style={{ fontSize: 13 }}>🚶</Text>
          </Animated.View>

          {/* Absolute Positioned Screen Node Buttons with Custom Icons */}
          {nodes.map((node, idx) => {
            const stage = STAGES[idx];
            const isCompleted = completedCycles > 0 || loopChants >= stage.maxChants;
            const isActive = loopChants >= stage.minChants && loopChants < stage.maxChants;
            const isLocked = !isCompleted && !isActive;
            
            const Icon = stage.icon;
            
            return (
              <TouchableOpacity
                key={`node-${node.id}`}
                onPress={() => {
                  Vibration.vibrate(25);
                  setSelectedStageId(node.id);
                }}
                style={[
                  styles.nodeButton,
                  {
                    left: node.x - 20,
                    top: node.y - 20,
                    borderColor: isActive ? stage.color : isCompleted ? '#eab308' : activeTheme.colors.cardBorder,
                    backgroundColor: isCompleted 
                      ? '#ffd700' 
                      : isActive 
                        ? activeTheme.colors.background 
                        : activeTheme.colors.cardBackground,
                    shadowColor: stage.color,
                    elevation: isActive ? 6 : 0,
                  }
                ]}
              >
                {isLocked ? (
                  <Lock size={13} color={activeTheme.colors.textSecondary} />
                ) : (
                  <Icon 
                    size={16} 
                    color={isCompleted ? '#78350f' : isActive ? stage.color : activeTheme.colors.textSecondary} 
                    fill={isCompleted ? '#78350f' : 'transparent'}
                  />
                )}
                
                {/* Node Number Label */}
                <View 
                  style={[
                    styles.nodeNumberLabel, 
                    { 
                      backgroundColor: isCompleted ? '#b45309' : isActive ? stage.color : '#64748b' 
                    }
                  ]}
                >
                  <Text style={styles.nodeNumberText}>{node.id}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Real-time Progress Bar */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarHeader}>
            <Text style={[styles.progressLabel, { color: activeTheme.colors.textSecondary }]}>
              Active Stage Progress
            </Text>
            <Text style={[styles.progressVal, { color: STAGES[activeStageIndex].color }]}>
              {Math.round(activeStageProgressPercent * 100)}% Complete
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${activeStageProgressPercent * 100}%`,
                  backgroundColor: STAGES[activeStageIndex].color
                }
              ]} 
            />
          </View>
          <Text style={[styles.stageCountsInfo, { color: activeTheme.colors.textSecondary }]}>
            Chanted {loopChants - STAGES[activeStageIndex].minChants} / {STAGES[activeStageIndex].maxChants - STAGES[activeStageIndex].minChants} stage target chants.
          </Text>
        </View>
      </View>

      {/* 3. Spiritual Blessings Inventory */}
      <View 
        style={[
          styles.blessingsContainer, 
          { 
            backgroundColor: activeTheme.colors.cardBackground, 
            borderColor: activeTheme.colors.cardBorder 
          }
        ]}
      >
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textPrimary, marginBottom: 12 }]}>
          Braj Dham Blessings Shelf
        </Text>
        <Text style={[styles.shelfSubtitle, { color: activeTheme.colors.textSecondary }]}>
          Complete stages to unlock sacred spiritual relics from Vrindavan & Barsana.
        </Text>

        <View style={styles.blessingShelf}>
          {STAGES.map((stage) => {
            const isUnlocked = completedCycles > 0 || loopChants >= stage.maxChants;
            const BlessingIcon = stage.blessingIcon;

            return (
              <View 
                key={`blessing-${stage.id}`}
                style={[
                  styles.blessingItemCard,
                  { 
                    backgroundColor: activeTheme.colors.background,
                    borderColor: isUnlocked ? stage.blessingColor + '40' : activeTheme.colors.cardBorder,
                    opacity: isUnlocked ? 1 : 0.4
                  }
                ]}
              >
                <View 
                  style={[
                    styles.blessingIconContainer, 
                    { 
                      backgroundColor: isUnlocked ? stage.blessingColor + '1D' : 'rgba(255,255,255,0.02)',
                      borderColor: isUnlocked ? stage.blessingColor + '40' : 'rgba(255,255,255,0.04)'
                    }
                  ]}
                >
                  {isUnlocked ? (
                    <BlessingIcon size={20} color={stage.blessingColor} />
                  ) : (
                    <Lock size={16} color={activeTheme.colors.textSecondary} />
                  )}
                </View>
                
                <Text 
                  numberOfLines={1} 
                  style={[
                    styles.blessingNameText, 
                    { color: isUnlocked ? activeTheme.colors.textPrimary : activeTheme.colors.textSecondary }
                  ]}
                >
                  {stage.blessingName}
                </Text>
                
                <Text numberOfLines={2} style={styles.blessingDescText}>
                  {isUnlocked ? stage.blessingDesc : `Locked. Complete Stage ${stage.id}.`}
                </Text>
              </View>
            );
          })}
        </View>
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
  darshanCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    height: SCREEN_WIDTH * 0.9,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageBackgroundStyle: {
    opacity: 0.95,
  },
  glassOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    padding: 18,
    justifyContent: 'flex-end',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  lockBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1.5,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockSubtext: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  lockChantsProgress: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageIndexText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stageTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lilaScroll: {
    flex: 1,
    marginVertical: 4,
  },
  descriptionText: {
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  lilaBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 8,
  },
  lilaTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  lilaText: {
    color: '#cbd5e1',
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  quoteText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 10,
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeTextActive: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeTextCompleted: {
    color: '#78350f',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeTextLocked: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chantsSpanText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
  },
  mapContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cyclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  cyclesText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  svgWrapper: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  svgMap: {
    ...StyleSheet.absoluteFillObject,
  },
  nodeButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  nodeNumberLabel: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  nodeNumberText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: '900',
  },
  progressBarWrapper: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 14,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressVal: {
    fontSize: 10,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stageCountsInfo: {
    fontSize: 9,
    fontWeight: '600',
  },
  blessingsContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  shelfSubtitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  blessingShelf: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  blessingItemCard: {
    width: (SCREEN_WIDTH - 64 - 8) / 2, // 2 items per row
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  blessingIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  blessingNameText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  blessingDescText: {
    color: '#94a3b8',
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  }
});

export default ParikramaScreen;
