import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, Platform } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MapPin, Trophy } from 'lucide-react-native';
import { THEMES } from '../theme/themes';

interface ParikramaProps {
  lifetimeTotalChants: number;
  themeId: string;
}

interface ParikramaStage {
  name: string;
  desc: string;
  minChants: number;
  maxChants: number;
  color: string;
}

const STAGES: ParikramaStage[] = [
  {
    name: 'Nidhiban Forest Gate',
    desc: 'You are entering the mystical forest of Vrindavan Dham, where the divine eternal Raas Leela occurs under the moonlight.',
    minChants: 0,
    maxChants: 500,
    color: '#10b981', // Emerald Green
  },
  {
    name: 'Seva Kunj (Radha Mandir)',
    desc: 'You have arrived at the forest of Seva Kunj. In this sacred garden, Lord Krishna serves the lotus feet of Shri Radha Rani.',
    minChants: 500,
    maxChants: 1200,
    color: '#0ea5e9', // Sky Blue
  },
  {
    name: 'Radha Kund & Syama Kund',
    desc: 'Chanting along the banks of Radha Kund, the most supreme holy lake. Formed by Radha Rani, its water grants pure divine love.',
    minChants: 1200,
    maxChants: 2500,
    color: '#6366f1', // Indigo Blue
  },
  {
    name: 'Maan Garh Peak (Barsana)',
    desc: 'Climbing the sacred golden hills of Barsana Dham, the divine peak of love where Kishori Ju resides in Her sweet loving mood.',
    minChants: 2500,
    maxChants: 4500,
    color: '#ec4899', // Rose Pink
  },
  {
    name: 'Shriji Mandir Peak Palace',
    desc: 'Arriving at the highest palace of Barsana! You have reached the home of Radha Rani, obtaining Her lotus feet blessings. Parikrama Completed!',
    minChants: 4500,
    maxChants: 5400,
    color: '#eab308', // Gold
  },
];

const STAGE_IMAGES = [
  require('../../assets/parikrama/stage1.jpg'),
  require('../../assets/parikrama/stage2.jpg'),
  require('../../assets/parikrama/stage3.jpg'),
  require('../../assets/parikrama/stage4.jpg'),
  require('../../assets/parikrama/stage5.jpg')
];

export const BarsanaParikrama: React.FC<ParikramaProps> = ({ lifetimeTotalChants, themeId }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  
  // Calculate index along the loop cycle of 5400 chants (approx 50 malas)
  const loopChants = lifetimeTotalChants % 5400;
  const completedCycles = Math.floor(lifetimeTotalChants / 5400);

  const activeStageIndex = useMemo(() => {
    const idx = STAGES.findIndex(s => loopChants >= s.minChants && loopChants < s.maxChants);
    return idx !== -1 ? idx : STAGES.length - 1;
  }, [loopChants]);

  const activeStage = STAGES[activeStageIndex];
  const activeStageImage = STAGE_IMAGES[activeStageIndex];
  const progressPercent = Math.min(loopChants / 5400, 1);

  // Winding path nodes coordinates for 300x100 Svg canvas
  const nodes = useMemo(() => [
    { x: 30, y: 50 },  // Nidhivan
    { x: 90, y: 22 },  // Seva Kunj
    { x: 150, y: 78 }, // Radha Kund
    { x: 210, y: 28 }, // Maan Garh
    { x: 270, y: 62 }  // Shriji Mandir
  ], []);

  // Winding path bezier string representation
  const windingPathD = "M 30 50 C 60 22, 60 22, 90 22 C 120 78, 120 78, 150 78 C 180 28, 180 28, 210 28 C 240 62, 240 62, 270 62";

  // Calculate pilgrim avatar coordinates
  const avatar = useMemo(() => {
    const boundaries = [0, 500, 1200, 2500, 4500, 5400];
    
    let segment = 0;
    for (let i = 0; i < 5; i++) {
      if (loopChants >= boundaries[i] && loopChants < boundaries[i+1]) {
        segment = i;
        break;
      }
    }
    if (loopChants >= 5400) return nodes[4];
    
    const startChants = boundaries[segment];
    const endChants = boundaries[segment+1];
    const factor = (loopChants - startChants) / (endChants - startChants);
    
    const currNode = nodes[segment];
    const nextNode = nodes[segment + 1] || nodes[segment];
    
    return {
      x: currNode.x + (nextNode.x - currNode.x) * factor,
      y: currNode.y + (nextNode.y - currNode.y) * factor
    };
  }, [loopChants, nodes]);

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: activeTheme.colors.cardBackground, 
          borderColor: activeTheme.colors.cardBorder 
        }
      ]}
    >
      {/* 1. Header with Stage Background Image */}
      <ImageBackground
        source={activeStageImage}
        style={styles.imageHeader}
        imageStyle={styles.imageHeaderStyle}
      >
        {/* Dark overlay to guarantee typography legibility */}
        <View style={styles.imageOverlay}>
          <View style={styles.headerRow}>
            <MapPin size={13} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.headerTitle}>Vrindavan-Barsana Parikrama</Text>
            {completedCycles > 0 && (
              <View style={styles.badge}>
                <Trophy size={9} color="#ffd700" />
                <Text style={styles.badgeText}>
                  {completedCycles} {completedCycles === 1 ? 'Mala Tour' : 'Mala Tours'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.stageName}>
            Stage {activeStageIndex + 1}: {activeStage.name}
          </Text>
          <Text style={styles.stageDesc}>
            {activeStage.desc}
          </Text>
        </View>
      </ImageBackground>

      {/* 2. Interactive SVG Roadmap & Tracker */}
      <View style={styles.mapSection}>
        <Text style={[styles.mapLabel, { color: activeTheme.colors.textSecondary }]}>
          Pilgrimage Roadmap
        </Text>

        <Svg width="100%" height="90" viewBox="0 0 300 90" style={styles.svgMap}>
          {/* Base Winding Path */}
          <Path
            d={windingPathD}
            stroke={activeTheme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />

          {/* Completed/Active Progress Path Overlay */}
          {loopChants > 0 && (
            <Path
              d={windingPathD}
              stroke="url(#pathGoldGrad)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset={300 * (1 - progressPercent)}
            />
          )}

          <Defs>
            <LinearGradient id="pathGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#ffd700" />
              <Stop offset="50%" stopColor="#f59e0b" />
              <Stop offset="100%" stopColor="#eab308" />
            </LinearGradient>
          </Defs>
          
          {/* Node Rings */}
          {nodes.map((node, idx) => {
            const isNodeCompleted = loopChants >= STAGES[idx].maxChants || lifetimeTotalChants >= 5400;
            const isNodeActive = loopChants >= STAGES[idx].minChants && loopChants < STAGES[idx].maxChants;
            const nodeColor = STAGES[idx].color;

            return (
              <G key={`node-group-${idx}`}>
                {/* Active node breathing outer halo */}
                {isNodeActive && (
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r="12"
                    fill={nodeColor}
                    opacity={0.25}
                  />
                )}

                {/* Outer Ring */}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r="8.5"
                  fill={isNodeCompleted ? '#ffd700' : isNodeActive ? '#fff' : activeTheme.isDark ? '#27272a' : '#f4f4f5'}
                  stroke={isNodeCompleted ? '#d4af37' : isNodeActive ? nodeColor : activeTheme.colors.cardBorder}
                  strokeWidth={isNodeActive ? 2.5 : 1.5}
                />

                {/* Inner Stage Index Text */}
                <SvgText
                  x={node.x}
                  y={node.y + (Platform.OS === 'android' ? 3.2 : 2.5)}
                  fontSize="7.5"
                  fontWeight="bold"
                  fill={isNodeCompleted ? '#78350f' : isNodeActive ? nodeColor : activeTheme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {idx + 1}
                </SvgText>
              </G>
            );
          })}

          {/* Winding Pilgrim Avatar */}
          <G transform={`translate(${avatar.x}, ${avatar.y})`}>
            <Circle
              cx="0"
              cy="0"
              r="7"
              fill="#ec4899"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <Circle
              cx="0"
              cy="0"
              r="2.5"
              fill="#ffffff"
            />
          </G>
        </Svg>

        {/* Progress Text Details */}
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: activeTheme.colors.textSecondary }]}>
            Current Loop Progress: {loopChants} / 5,400 Chants
          </Text>
          <Text style={[styles.percentLabel, { color: activeTheme.colors.accent }]}>
            {Math.round(progressPercent * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    width: '100%',
    overflow: 'hidden',
  },
  imageHeader: {
    width: '100%',
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  imageHeaderStyle: {
    opacity: 0.95,
  },
  imageOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 3,
  },
  badgeText: {
    color: '#ffd700',
    fontSize: 7.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stageName: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  stageDesc: {
    color: '#f3f4f6',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 3,
    opacity: 0.95,
  },
  mapSection: {
    padding: 16,
  },
  mapLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  svgMap: {
    marginVertical: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  percentLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
});

export default BarsanaParikrama;
