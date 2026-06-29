import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCw,
  Compass,
  CheckCircle2,
  Lock,
  Flame,
  Award
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppState, ChantLog } from '../types';
import { THEMES } from '../theme/themes';
import { getLocalDateString } from '../hooks/useJapStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate 108 leaf coordinate points distributed in a circular canopy structure
const generateLeafPositions = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const canopyCenters = [
    { cx: 160, cy: 110, r: 40 }, // Top middle
    { cx: 125, cy: 135, r: 35 }, // Mid left
    { cx: 195, cy: 135, r: 35 }, // Mid right
    { cx: 95, cy: 165, r: 30 },  // Low left
    { cx: 225, cy: 165, r: 30 },  // Low right
  ];

  let id = 0;
  while (points.length < 108) {
    const center = canopyCenters[id % canopyCenters.length];
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * center.r;
    const x = center.cx + Math.cos(angle) * distance;
    const y = center.cy + Math.sin(angle) * distance;

    // Filter out points too close to the trunk bottom
    if (y > 205) continue;

    points.push({ x, y });
    id++;
  }
  return points;
};

// Constant coordinates for leaves
const LEAF_POSITIONS = generateLeafPositions();

interface BhaktiMargScreenProps {
  state: AppState;
}

export const BhaktiMargScreen: React.FC<BhaktiMargScreenProps> = ({ state }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  const [activeTab, setActiveTab] = useState<'tree' | 'map'>('tree');
  
  // Audio state
  const [isFlutePlaying, setIsFlutePlaying] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Stop and unload flute on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // 3D-like flip animation of the tree
  const triggerTreeRotation = () => {
    Vibration.vibrate(40);
    rotateAnim.setValue(0);
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }).start();
  };

  // Toggle ambient bansuri audio
  const toggleFluteAudio = async () => {
    if (isAudioLoading) return;
    Vibration.vibrate(30);

    if (isFlutePlaying) {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
      setIsFlutePlaying(false);
    } else {
      setIsAudioLoading(true);
      try {
        if (!soundRef.current) {
          // Play a beautiful copyright-free meditative flute loop
          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
            { shouldPlay: true, isLooping: true, volume: 0.35 }
          );
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        if (isMounted.current) {
          setIsFlutePlaying(true);
        }
      } catch (err) {
        console.warn('Failed to stream audio', err);
        alert('Could not stream ambient audio. Check your internet connection.');
      } finally {
        if (isMounted.current) {
          setIsFlutePlaying(false);
        }
      }
    }
  };

  // Dynamic tree metrics
  const totalMalas = Math.floor(state.lifetimeTotalChants / 108);
  const displayLeavesCount = Math.min(totalMalas, 108);
  const completedBigGoals = state.bigGoals.filter(g => g.completed).length;

  const rotateY = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Navadha Bhakti Quest levels configuration
  const bhaktiQuests = useMemo(() => {
    // Check if Brahma Muhurta chant is completed
    let hasBrahmaChant = false;
    Object.values(state.historyLogs).forEach(log => {
      if (log.hourlyCounts && (log.hourlyCounts[4] > 0 || log.hourlyCounts[5] > 0)) {
        hasBrahmaChant = true;
      }
    });

    return [
      {
        stage: 1,
        name: '1. Shravanam (श्रवणम्)',
        desc: 'Listening to the holy names, glories, and pastimes of the Supreme Lord.',
        challenge: 'Welcome gift for entering the Bhakti Marg. Unlocked immediately.',
        reward: 'Sandalwood bowl (Chandan Paste) for tilak seva.',
        targetVal: 1,
        currentVal: 1,
        isUnlocked: true,
        progressPct: 100
      },
      {
        stage: 2,
        name: '2. Kirtanam (कीर्तनम्)',
        desc: 'Singing, chanting, and praising the sacred name of God aloud.',
        challenge: 'Complete at least 30 Malas (3,240 chants) in lifetime stats.',
        reward: 'Temple Bell (Silver Ghanti) that wiggles and chimes when tapped.',
        targetVal: 3240,
        currentVal: state.lifetimeTotalChants,
        isUnlocked: state.lifetimeTotalChants >= 3240,
        progressPct: Math.min(Math.round((state.lifetimeTotalChants / 3240) * 100), 100)
      },
      {
        stage: 3,
        name: '3. Smaranam (स्मरणम्)',
        desc: 'Constant remembrance of the Lord, keeping the mind always fixed on Him.',
        challenge: 'Maintain an active daily chanting streak of at least 5 days.',
        reward: 'Silver Altar Diya featuring a larger, brighter flickering flame.',
        targetVal: 5,
        currentVal: state.streakDays,
        isUnlocked: state.streakDays >= 5,
        progressPct: Math.min(Math.round((state.streakDays / 5) * 100), 100)
      },
      {
        stage: 4,
        name: '4. Padasevanam (पादसेवनम्)',
        desc: 'Serving the lotus feet of the Lord through early dawn devotion.',
        challenge: 'Chant at least once during the sacred Brahma Muhurta hours (4 AM - 6 AM).',
        reward: 'Premium Gold Bell (Swarna Ghanti) with a deep resonant echo.',
        targetVal: 1,
        currentVal: hasBrahmaChant ? 1 : 0,
        isUnlocked: hasBrahmaChant,
        progressPct: hasBrahmaChant ? 100 : 0
      },
      {
        stage: 5,
        name: '5. Archanam (अर्चनम्)',
        desc: 'Worshiping the Deity with offered elements such as flowers and incense.',
        challenge: 'Offer a total of at least 50 flower showers at your temple Altar.',
        reward: 'Luxurious Golden Diya (Swarna Deepak) for premium altar aesthetics.',
        targetVal: 50,
        currentVal: state.offeredFlowersCount,
        isUnlocked: state.offeredFlowersCount >= 50,
        progressPct: Math.min(Math.round((state.offeredFlowersCount / 50) * 100), 100)
      },
      {
        stage: 6,
        name: '6. Vandanam (वन्दनम्)',
        desc: 'Offering prostrations and bowing with humility before the Deity.',
        challenge: 'Log at least 20,000 total lifetime chants in your history logs.',
        reward: 'Royal Canopy (Chhatra) to hang above your Deity frame.',
        targetVal: 20000,
        currentVal: state.lifetimeTotalChants,
        isUnlocked: state.lifetimeTotalChants >= 20000,
        progressPct: Math.min(Math.round((state.lifetimeTotalChants / 20000) * 100), 100)
      },
      {
        stage: 7,
        name: '7. Dasyam (दास्यम्)',
        desc: 'Serving the Lord with the attitude of a loyal, humble servant.',
        challenge: 'Log at least 50,000 total lifetime chants in your history logs.',
        reward: 'Royal Throne (Gaddi) background cushions behind the deity.',
        targetVal: 50000,
        currentVal: state.lifetimeTotalChants,
        isUnlocked: state.lifetimeTotalChants >= 50000,
        progressPct: Math.min(Math.round((state.lifetimeTotalChants / 50000) * 100), 100)
      },
      {
        stage: 8,
        name: '8. Sakhyam (सख्यम्)',
        desc: 'Developing a friendly and affectionate relationship with God.',
        challenge: 'Reach a long daily chanting streak of at least 15 days.',
        reward: 'Ratna Altar (jeweled gold borders wrapping the temple frame).',
        targetVal: 15,
        currentVal: state.streakDays,
        isUnlocked: state.streakDays >= 15,
        progressPct: Math.min(Math.round((state.streakDays / 15) * 100), 100)
      },
      {
        stage: 9,
        name: '9. Atmanivedanam (आत्मनिवेदनम्)',
        desc: 'Complete self-surrender, offering mind, body, and soul entirely to the Divine.',
        challenge: 'Reach the ultimate milestone of 108,000 total lifetime chants (1,000 Malas).',
        reward: 'Divine Aura pulsing golden light rays emanating from the deity.',
        targetVal: 108000,
        currentVal: state.lifetimeTotalChants,
        isUnlocked: state.lifetimeTotalChants >= 108000,
        progressPct: Math.min(Math.round((state.lifetimeTotalChants / 108000) * 100), 100)
      }
    ];
  }, [state.lifetimeTotalChants, state.streakDays, state.offeredFlowersCount, state.historyLogs]);

  // Compute trunk thickness based on stage
  const trunkWidth = 14 + (state.bhaktiStage || 1) * 2.5;

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      {/* Tab Switch Header */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(15);
            setActiveTab('tree');
          }}
          style={[
            styles.tabButton,
            activeTab === 'tree' && { borderBottomColor: activeTheme.colors.accent, borderBottomWidth: 3 }
          ]}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'tree' ? activeTheme.colors.textPrimary : activeTheme.colors.textSecondary }]}>
            🌳 Jap Vriksha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(15);
            setActiveTab('map');
          }}
          style={[
            styles.tabButton,
            activeTab === 'map' && { borderBottomColor: activeTheme.colors.accent, borderBottomWidth: 3 }
          ]}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'map' ? activeTheme.colors.textPrimary : activeTheme.colors.textSecondary }]}>
            🗺️ Bhakti Quest
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tree' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Legacy Tree Card */}
          <View style={[styles.card, { backgroundColor: activeTheme.colors.cardBackground, borderColor: activeTheme.colors.cardBorder }]}>
            
            {/* Action Bar (Audio Mute, Spin) */}
            <View style={styles.actionBar}>
              <TouchableOpacity onPress={toggleFluteAudio} style={styles.actionBtn}>
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color="#fbbf24" />
                ) : isFlutePlaying ? (
                  <Volume2 size={18} color="#fbbf24" />
                ) : (
                  <VolumeX size={18} color={activeTheme.colors.textSecondary} />
                )}
                <Text style={[styles.actionBtnText, { color: isFlutePlaying ? '#fbbf24' : activeTheme.colors.textSecondary }]}>
                  {isFlutePlaying ? 'Flute Active' : 'Play Flute'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={triggerTreeRotation} style={styles.actionBtn}>
                <RotateCw size={18} color="#10b981" />
                <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Rotate Garden</Text>
              </TouchableOpacity>
            </View>

            {/* SVG Tree Frame Container */}
            <Animated.View style={[styles.treeContainer, { transform: [{ rotateY }] }]}>
              <Svg width="320" height="280" viewBox="0 0 320 280">
                {/* Ground soil mount */}
                <Path d="M 40 250 Q 160 220, 280 250 L 280 280 L 40 280 Z" fill="#2d221c" opacity={0.8} />
                <Path d="M 60 250 Q 160 230, 260 250" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity={0.3} />

                {/* Roots */}
                <Path d="M 145 235 Q 120 250, 110 265" stroke="#4a3728" strokeWidth="3" fill="none" />
                <Path d="M 175 235 Q 200 250, 210 265" stroke="#4a3728" strokeWidth="3" fill="none" />

                {/* Trunk */}
                <Path
                  d={`M ${160 - trunkWidth/2} 240 L ${152} 180 Q 148 150, 130 130 Q 125 125, 115 120 M ${160 + trunkWidth/2} 240 L ${168} 180 Q 172 150, 190 130 Q 195 125, 205 120`}
                  stroke="#4a3728"
                  strokeWidth="3.5"
                  fill="none"
                />
                {/* Trunk solid fill */}
                <Path
                  d={`M ${160 - trunkWidth/2} 240 Q 160 235, ${160 + trunkWidth/2} 240 L 168 180 C 172 150, 190 130, 205 120 L 195 118 C 180 128, 162 145, 158 175 L 146 230 Z`}
                  fill="#5c443c"
                />

                {/* Branches based on Bhakti Stage progression */}
                {/* Stage 1+ Branches */}
                <Path d="M 154 185 Q 130 160, 110 160" stroke="#4a3728" strokeWidth="4.5" fill="none" />
                <Path d="M 166 185 Q 190 160, 210 160" stroke="#4a3728" strokeWidth="4.5" fill="none" />

                {/* Stage 3+ Middle Branches */}
                {(state.bhaktiStage || 1) >= 3 && (
                  <G>
                    <Path d="M 149 140 Q 120 115, 95 120" stroke="#4a3728" strokeWidth="3.5" fill="none" />
                    <Path d="M 171 140 Q 200 115, 225 120" stroke="#4a3728" strokeWidth="3.5" fill="none" />
                  </G>
                )}

                {/* Stage 5+ Upper Branches */}
                {(state.bhaktiStage || 1) >= 5 && (
                  <G>
                    <Path d="M 155 110 Q 140 80, 150 60" stroke="#4a3728" strokeWidth="2.5" fill="none" />
                    <Path d="M 165 110 Q 180 80, 170 60" stroke="#4a3728" strokeWidth="2.5" fill="none" />
                  </G>
                )}

                {/* Dynamic Leaves Rendering (1 Leaf = 1 completed Mala) */}
                {LEAF_POSITIONS.slice(0, displayLeavesCount).map((pt, idx) => (
                  <Path
                    key={idx}
                    d="M 0 0 C 3 -6, 8 -6, 10 0 C 8 6, 3 6, 0 0 Z"
                    fill={idx % 2 === 0 ? '#10b981' : '#059669'}
                    transform={`translate(${pt.x}, ${pt.y}) rotate(${idx * 43}) scale(0.9)`}
                  />
                ))}

                {/* Dynamic Fruits & Flowers (Completed Sankalpas) */}
                {Array.from({ length: completedBigGoals }).map((_, idx) => {
                  const fruitPositions = [
                    { x: 130, y: 130 },
                    { x: 190, y: 130 },
                    { x: 160, y: 90 },
                    { x: 105, y: 160 },
                    { x: 215, y: 160 },
                    { x: 150, y: 65 },
                  ];
                  const pos = fruitPositions[idx % fruitPositions.length];
                  return (
                    <G key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                      {/* Golden glowing fruit */}
                      <Circle cx="0" cy="0" r="7" fill="#fbbf24" opacity={0.4} />
                      <Circle cx="0" cy="0" r="5" fill="#f59e0b" />
                      {/* Lotus star tip */}
                      <Path d="M 0 -2 L 1 1 L 4 1 L 2 3 L 3 6 L 0 4 L -3 6 L -2 3 L -4 1 L -1 1 Z" fill="#ffffff" transform="scale(0.5)" />
                    </G>
                  );
                })}

                {/* Seedling check for brand new users */}
                {displayLeavesCount === 0 && (
                  <G transform="translate(160, 235)">
                    <Circle cx="0" cy="0" r="3" fill="#10b981" />
                    <Path d="M 0 0 Q -5 -8, -12 -8 M 0 0 Q 5 -8, 12 -8" stroke="#10b981" strokeWidth="1.5" fill="none" />
                    <Path d="M -12 -8 C -14 -4, -10 -4, -12 -8 Z" fill="#10b981" />
                    <Path d="M 12 -8 C 14 -4, 10 -4, 12 -8 Z" fill="#10b981" />
                  </G>
                )}
              </Svg>
            </Animated.View>

            {/* Tree Summary HUD */}
            <View style={styles.hudRow}>
              <View style={styles.hudCell}>
                <Text style={[styles.hudLabelText, { color: activeTheme.colors.textSecondary }]}>Total Leaves</Text>
                <Text style={[styles.hudValueText, { color: activeTheme.colors.textPrimary }]}>
                  {displayLeavesCount} <Text style={{ fontSize: 11, fontWeight: 'normal' }}>/ 108</Text>
                </Text>
              </View>

              <View style={styles.hudCell}>
                <Text style={[styles.hudLabelText, { color: activeTheme.colors.textSecondary }]}>Golden Fruits</Text>
                <Text style={[styles.hudValueText, { color: '#fbbf24' }]}>
                  {completedBigGoals} <Text style={{ fontSize: 11, fontWeight: 'normal', color: activeTheme.colors.textSecondary }}>vows met</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Guidance Info Card */}
          <View style={[styles.infoCard, { backgroundColor: activeTheme.colors.cardBackground, borderColor: activeTheme.colors.cardBorder }]}>
            <Award size={18} color={activeTheme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: activeTheme.colors.textPrimary }]}>Legacy Growth Guide</Text>
              <Text style={[styles.infoText, { color: activeTheme.colors.textSecondary }]}>
                • Every **1 completed Mala (108 chants)** adds **1 green leaf** to your Spiritual Tree.
              </Text>
              <Text style={[styles.infoText, { color: activeTheme.colors.textSecondary }]}>
                • Completing a **Spiritual Vow (Sankalpa)** sprouts a glowing **golden fruit** on the branches.
              </Text>
              <Text style={[styles.infoText, { color: activeTheme.colors.textSecondary }]}>
                • Progressing through stages of the **Bhakti Marg** thickens the trunk and sprouts new branches.
              </Text>
            </View>
          </View>

        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollMapContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.mapIntro}>
            <Compass size={22} color={activeTheme.colors.accent} />
            <Text style={[styles.mapIntroTitle, { color: activeTheme.colors.textPrimary }]}>Navadha Bhakti Quest</Text>
            <Text style={[styles.mapIntroText, { color: activeTheme.colors.textSecondary }]}>
              Unlock sacred temple Altar samagri by advancing along the 9 traditional stages of Bhakti Shastras.
            </Text>
          </View>

          {/* Map Quest timeline layout */}
          {bhaktiQuests.map((q, idx) => {
            const isCompleted = state.bhaktiStage > q.stage;
            const isActive = state.bhaktiStage === q.stage;
            const isLocked = state.bhaktiStage < q.stage;

            return (
              <View key={q.stage} style={styles.questTimelineRow}>
                
                {/* Timeline connector and icons */}
                <View style={styles.connectorContainer}>
                  <View 
                    style={[
                      styles.circleNode,
                      {
                        backgroundColor: isCompleted 
                          ? '#10b981' 
                          : isActive 
                            ? activeTheme.colors.accent 
                            : '#2d221c',
                        borderColor: isActive ? '#ffffff' : activeTheme.colors.cardBorder
                      }
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="#ffffff" />
                    ) : isLocked ? (
                      <Lock size={12} color="rgba(255,255,255,0.4)" />
                    ) : (
                      <Flame size={14} color="#ffffff" fill="#ffffff" />
                    )}
                  </View>
                  {idx < bhaktiQuests.length - 1 && (
                    <View 
                      style={[
                        styles.verticalLine,
                        { 
                          backgroundColor: isCompleted 
                            ? '#10b981' 
                            : 'rgba(255,255,255,0.08)' 
                        }
                      ]} 
                    />
                  )}
                </View>

                {/* Quest Details Card */}
                <View 
                  style={[
                    styles.questCard, 
                    {
                      backgroundColor: activeTheme.colors.cardBackground,
                      borderColor: isActive 
                        ? activeTheme.colors.accent 
                        : isCompleted 
                          ? '#10b98133' 
                          : activeTheme.colors.cardBorder,
                      borderWidth: isActive ? 2 : 1
                    }
                  ]}
                >
                  <View style={styles.questHeader}>
                    <Text style={[styles.questNameText, { color: activeTheme.colors.textPrimary }]}>
                      {q.name}
                    </Text>
                    {isActive && (
                      <View style={[styles.statusBadge, { backgroundColor: activeTheme.colors.accent + '22' }]}>
                        <Text style={[styles.statusBadgeText, { color: activeTheme.colors.accent }]}>ACTIVE</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>UNLOCKED</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.questDescText, { color: activeTheme.colors.textSecondary }]}>
                    {q.desc}
                  </Text>

                  <View style={styles.divider} />

                  {/* Challenge Progress */}
                  <View style={styles.challengeBox}>
                    <Text style={[styles.challengeLabel, { color: activeTheme.colors.textSecondary }]}>
                      Challenge: <Text style={{ color: activeTheme.colors.textPrimary, fontWeight: 'bold' }}>{q.challenge}</Text>
                    </Text>
                    
                    {!isLocked && q.targetVal > 1 && (
                      <View style={styles.progressRow}>
                        <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                backgroundColor: isCompleted ? '#10b981' : activeTheme.colors.accent, 
                                width: `${q.progressPct}%` 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressText, { color: activeTheme.colors.textPrimary }]}>
                          {q.currentVal >= 1000 ? `${(q.currentVal / 1000).toFixed(1)}k` : q.currentVal} / {q.targetVal >= 1000 ? `${(q.targetVal / 1000).toFixed(0)}k` : q.targetVal}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Unlocked Reward Panel */}
                  <View style={[styles.rewardPanel, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }]}>
                    <Trophy size={14} color="#fbbf24" />
                    <Text style={[styles.rewardText, { color: activeTheme.colors.textPrimary }]}>
                      Reward: <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>{q.reward}</Text>
                    </Text>
                  </View>

                </View>

              </View>
            );
          })}

        </ScrollView>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  scrollMapContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  treeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 14,
    marginTop: 10,
  },
  hudCell: {
    alignItems: 'center',
  },
  hudLabelText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  hudValueText: {
    fontSize: 16,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  mapIntro: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mapIntroTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 4,
  },
  mapIntroText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 15,
  },
  questTimelineRow: {
    flexDirection: 'row',
    minHeight: 120,
    width: '100%',
  },
  connectorContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 24,
  },
  circleNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  verticalLine: {
    width: 2.5,
    flex: 1,
    marginTop: -2,
    marginBottom: -4,
  },
  questCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questNameText: {
    fontSize: 13,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  questDescText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 10,
  },
  challengeBox: {
    marginBottom: 10,
  },
  challengeLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  progressBarBg: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  rewardPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  rewardText: {
    fontSize: 10,
    flex: 1,
  }
});

export default BhaktiMargScreen;
