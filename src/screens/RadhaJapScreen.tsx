import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Vibration
} from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Award, Calendar, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react-native';
import { AppState } from '../types';
import { THEMES } from '../theme/themes';

interface RadhaJapScreenProps {
  state: AppState;
}

const TARGET_CHANKALPA = 110000000; // 11 Crore

const BHAKTI_STAGES = [
  { 
    level: 1, 
    name: '1 करोड़', 
    target: 10000000, 
    desc: 'शरीर और मन पवित्र होने लगते हैं, रजोगुण-तमोगुण कम होते हैं।',
    insight: 'Chanting cleanses the mirror of the mind and reduces material influences, grounding you in pure spiritual energy.'
  },
  { 
    level: 2, 
    name: '2 करोड़', 
    target: 20000000, 
    desc: 'दरिद्रता और अभाव की पीड़ा समाप्त होने लगती है, धन की चाह कम हो जाती है।',
    insight: 'Inner satisfaction arises; the burning desire for worldly accumulation fades as the wealth of devotion fills the heart.'
  },
  { 
    level: 3, 
    name: '3 करोड़', 
    target: 30000000, 
    desc: 'काम, क्रोध आदि पर नियंत्रण बढ़ता है, हृदय अत्यंत पवित्र होता है।',
    insight: 'The heart becomes free from anger and lust. A serene sense of self-discipline and purity of thoughts begins to reign.'
  },
  { 
    level: 4, 
    name: '4 करोड़', 
    target: 40000000, 
    desc: 'सुख-दुःख, मान-अपमान से ऊपर उठने की अवस्था; आत्मबोध की झलक।',
    insight: 'Equanimity in dualities. The seeker starts observing worldly events as a witness, gaining glimpses of the eternal soul.'
  },
  { 
    level: 5, 
    name: '5 करोड़', 
    target: 50000000, 
    desc: 'ज्ञान और विद्या का प्रादुर्भाव, वाणी में शास्त्रीय ज्ञान प्रकट होने लगता है।',
    insight: 'Scriptural intelligence and deep spiritual insights flow naturally. The speech becomes powerful, truth-bound, and soothing.'
  },
  { 
    level: 6, 
    name: '6 करोड़', 
    target: 60000000, 
    desc: 'काम, क्रोध, लोभ, मोह, मद, मत्सर जैसे छह शत्रुओं पर विजय।',
    insight: 'Victory over the six internal blockages (Shad-Ripu). The consciousness finds absolute stability and ultimate freedom.'
  },
  { 
    level: 7, 
    name: '7 करोड़', 
    target: 70000000, 
    desc: 'विषय-वासनाएँ और आकर्षण साधक को विचलित नहीं कर पाते।',
    insight: 'Material attachments lose their grip completely. The mind remains naturally anchored in the remembrance of Sri Radha.'
  },
  { 
    level: 8, 
    name: '8 करोड़', 
    target: 80000000, 
    desc: 'मृत्यु का भय समाप्त, आत्मस्वरूप में स्थिरता।',
    insight: 'The illusion of death is shattered. Absolute conviction in your identity as an eternal servant of the Divine.'
  },
  { 
    level: 9, 
    name: '9 करोड़', 
    target: 90000000, 
    desc: 'इष्टदेव का साक्षात्कार (भगवान का दर्शन) बताया गया है।',
    insight: 'The ultimate grace manifests—divine vision and direct communion with the personal Deity (Darshan).'
  },
  { 
    level: 10, 
    name: '10 करोड़', 
    target: 100000000, 
    desc: 'संचित, प्रारब्ध और क्रियमाण कर्मों का दहन; गहन आध्यात्मिक मुक्ति की अवस्था।',
    insight: 'All layers of karma (accumulated, current, and destiny) are completely burned away, leaving absolute spiritual freedom.'
  },
  { 
    level: 11, 
    name: '11 करोड़', 
    target: 110000000, 
    desc: 'नवधा भक्ति, अष्ट सिद्धियाँ और विभिन्न आध्यात्मिक उपलब्धियाँ सहज उपलब्ध होने की अवस्था।',
    insight: 'The culmination of grace. Nine-fold devotion, divine mystic perfections, and unending ecstatic nectar flow naturally.'
  }
];

export const RadhaJapScreen: React.FC<RadhaJapScreenProps> = ({ state }) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;

  const totalChants = state.lifetimeTotalChants;
  const progressPercent = Math.min(totalChants / TARGET_CHANKALPA, 1);
  const remainingChants = Math.max(TARGET_CHANKALPA - totalChants, 0);

  // Calculate speed projections
  const dailyAverage = useMemo(() => {
    const logs = Object.values(state.historyLogs);
    if (logs.length === 0) return 1080; // default 10 malas
    const sum = logs.reduce((acc, curr) => acc + curr.count, 0);
    return Math.max(Math.round(sum / logs.length), 108); // floor to 1 mala
  }, [state.historyLogs]);

  const projectedDays = useMemo(() => {
    return Math.ceil(remainingChants / dailyAverage);
  }, [remainingChants, dailyAverage]);

  const yearsLeft = (projectedDays / 365).toFixed(1);

  // Determine current spiritual stage based on total chants
  const currentStage = useMemo(() => {
    for (let i = BHAKTI_STAGES.length - 1; i >= 0; i--) {
      if (totalChants >= BHAKTI_STAGES[i].target) {
        return BHAKTI_STAGES[i];
      }
    }
    return { level: 0, name: 'नाम आरंभ', target: 0, desc: 'नाम जप की दिव्य यात्रा का आरंभ।', insight: 'Begin your chanting journey with pure love and devotion.' };
  }, [totalChants]);

  // Lotus path for central SVG representation
  // Simple beautiful blooming lotus SVG outline
  const lotusPath = "M 50 15 C 55 25, 65 30, 50 50 C 35 30, 45 25, 50 15 Z M 50 30 C 62 38, 70 50, 50 50 C 30 50, 38 38, 50 30 Z M 50 38 C 70 42, 75 52, 50 50 C 25 52, 30 42, 50 38 Z";

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header visual card */}
        <View 
          style={[
            styles.sankalpaCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder,
              shadowColor: activeTheme.colors.shadowColor
            }
          ]}
        >
          <Text style={[styles.sankalpaSubtitle, { color: activeTheme.colors.accent }]} className="text-[10px] uppercase font-extrabold tracking-widest text-center mb-1">
            🔥 Shri Radha Naam 11 Crore Maha Sankalpa
          </Text>
          <Text style={[styles.sankalpaTitle, { color: activeTheme.colors.textPrimary }]} className="text-xl font-black text-center mb-5">
            Sri Radha Madhav Seva
          </Text>

          {/* Central Lotus Visualizer */}
          <View style={styles.visualizerContainer}>
            <Svg width="160" height="160" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="lotusGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor={activeTheme.colors.accent} stopOpacity="0.4" />
                  <Stop offset="100%" stopColor={activeTheme.colors.background} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              
              {/* Outer progress ring track */}
              <Circle cx="50" cy="50" r="44" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} strokeWidth="5.5" fill="url(#lotusGlow)" />
              
              {/* Active progress ring */}
              <Circle 
                cx="50" 
                cy="50" 
                r="44" 
                stroke={activeTheme.colors.accent} 
                strokeWidth="5.5" 
                strokeDasharray={`${276.4 * progressPercent} ${276.4 * (1 - progressPercent)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                fill="none" 
              />

              {/* Blooming lotus in the center */}
              <Path 
                d={lotusPath} 
                fill={progressPercent > 0.05 ? activeTheme.colors.accent : activeTheme.colors.textSecondary}
                opacity={0.8}
                transform="translate(0, 5) scale(1)"
              />
              <Circle cx="50" cy="55" r="3" fill="#fbbf24" />
            </Svg>

            {/* Float percent inside circle */}
            <View style={styles.percentOverlay}>
              <Text style={[styles.percentVal, { color: activeTheme.colors.textPrimary }]}>
                {(progressPercent * 100).toFixed(4)}%
              </Text>
              <Text style={[styles.percentLbl, { color: activeTheme.colors.textSecondary }]}>
                completed
              </Text>
            </View>
          </View>

          {/* Counts */}
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <Text style={[styles.countLabel, { color: activeTheme.colors.textSecondary }]}>LIFETIME CHANTS</Text>
              <Text style={[styles.countValue, { color: activeTheme.colors.textPrimary }]}>
                {totalChants.toLocaleString()}
              </Text>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.countItem}>
              <Text style={[styles.countLabel, { color: activeTheme.colors.textSecondary }]}>REMAINING</Text>
              <Text style={[styles.countValue, { color: activeTheme.colors.accent }]}>
                {remainingChants.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Seeker Stage Card */}
        <View 
          style={[
            styles.stageCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View style={{ backgroundColor: activeTheme.colors.accent + '15', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} color={activeTheme.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stageLabel, { color: activeTheme.colors.textSecondary }]} className="text-[10px] uppercase font-extrabold">
                Current Bhakti Stage
              </Text>
              <Text style={[styles.stageName, { color: activeTheme.colors.textPrimary }]} className="text-base font-extrabold mt-0.5">
                Stage {currentStage.level}: {currentStage.name}
              </Text>
            </View>
          </View>
          <Text style={[styles.stageDesc, { color: activeTheme.colors.textSecondary }]} className="text-xs font-semibold leading-15">
            {currentStage.desc}. Keep chanting daily to cleanse the heart and reach higher stages of divine love.
          </Text>
        </View>

        {/* Prediction Calculator Card */}
        <View 
          style={[
            styles.predictionCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={15} color={activeTheme.colors.accent} />
            <Text style={[styles.predictionTitle, { color: activeTheme.colors.textPrimary }]}>
              Sankalpa Projections & Speed
            </Text>
          </View>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: 12, borderRadius: 14, marginBottom: 16 }}>
            <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
              YOUR DAILY AVERAGE SPEED
            </Text>
            <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
              {dailyAverage.toLocaleString()} chants / day{' '}
              <Text style={{ fontSize: 11, color: activeTheme.colors.textSecondary, fontWeight: 'bold' }}>
                (~{(dailyAverage / 108).toFixed(1)} Malas)
              </Text>
            </Text>
            <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 8 }}>
              ESTIMATED TIME TO FINISH
            </Text>
            <Text style={{ color: activeTheme.colors.accent, fontSize: 16, fontWeight: '900', marginTop: 2 }}>
              {projectedDays.toLocaleString()} days ({yearsLeft} years)
            </Text>
          </View>

          <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 11.5, fontWeight: '800', marginBottom: 10 }}>
            Targets required to complete in:
          </Text>

          {[1, 3, 5, 10, 20].map((years) => {
            const totalTargetDays = years * 365;
            const reqDaily = Math.ceil(remainingChants / totalTargetDays);
            const reqMalas = (reqDaily / 108).toFixed(1);

            return (
              <View 
                key={years} 
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 0.5,
                  borderBottomColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 11, fontWeight: '800' }}>
                  {years} {years === 1 ? 'Year' : 'Years'}
                </Text>
                <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  <Text style={{ color: activeTheme.colors.accent, fontWeight: '900' }}>{reqDaily.toLocaleString()}</Text> chants/day (~{reqMalas} Malas)
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bhakti Stages Milestone Ladder */}
        <View style={styles.milestonesSection}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.textPrimary }]}>
            Sankalpa Bhakti Stages (Progression)
          </Text>
          
          {BHAKTI_STAGES.map((stage) => {
            const isCompleted = totalChants >= stage.target;
            const isNext = totalChants < stage.target && (stage.level === 1 || totalChants >= BHAKTI_STAGES[stage.level - 2].target);
            const isExpanded = expandedStage === stage.level;

            const prevTarget = stage.level === 1 ? 0 : BHAKTI_STAGES[stage.level - 2].target;
            const stageProgress = Math.max(0, Math.min(1, (totalChants - prevTarget) / (stage.target - prevTarget)));
            const stagePercent = (stageProgress * 100).toFixed(1);
            const stageRemaining = Math.max(0, stage.target - totalChants);

            return (
              <TouchableOpacity 
                key={stage.level}
                activeOpacity={0.8}
                onPress={() => {
                  Vibration.vibrate(20);
                  setExpandedStage(isExpanded ? null : stage.level);
                }}
                style={[
                  styles.milestoneItem,
                  { 
                    backgroundColor: isCompleted 
                      ? activeTheme.colors.cardBackground + 'AA' 
                      : isNext 
                      ? activeTheme.colors.cardBackground 
                      : 'rgba(0,0,0,0.02)',
                    borderColor: isNext ? activeTheme.colors.accent : isExpanded ? activeTheme.colors.cardBorder : 'transparent',
                    borderWidth: isNext ? 1.5 : 1,
                  }
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: isCompleted ? '#10b981' : isNext ? activeTheme.colors.accent : activeTheme.colors.textSecondary, fontSize: 12, fontWeight: '900' }}>
                        Stage {stage.level}: {stage.name} {isCompleted ? '✓' : ''}
                      </Text>
                      {isNext && (
                        <View style={{ backgroundColor: activeTheme.colors.accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: activeTheme.colors.accent, fontSize: 8, fontWeight: '900' }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                      {stage.desc}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 11, fontWeight: '800' }}>
                        {stage.target.toLocaleString()}
                      </Text>
                      <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 8.5, fontWeight: '700' }}>
                        chants
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color={activeTheme.colors.textSecondary} />
                    ) : (
                      <ChevronDown size={16} color={activeTheme.colors.textSecondary} />
                    )}
                  </View>
                </View>

                {/* Progress bar for next stage or if expanded */}
                {(isNext || isExpanded) && !isCompleted && (
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginTop: 10, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${stagePercent}%` as any, backgroundColor: activeTheme.colors.accent }} />
                  </View>
                )}

                {/* Expanded Interactive Detail Section */}
                {isExpanded && (
                  <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                        STAGE PROGRESS
                      </Text>
                      <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 10, fontWeight: '800' }}>
                        {stagePercent}% Completed
                      </Text>
                    </View>

                    {!isCompleted ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                          REMAINING TO REACH
                        </Text>
                        <Text style={{ color: activeTheme.colors.accent, fontSize: 10, fontWeight: '800' }}>
                          {stageRemaining.toLocaleString()} chants
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                        <Sparkles size={10} color="#10b981" />
                        <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '800' }}>
                          Milestone achieved! Divine blessings unlocked.
                        </Text>
                      </View>
                    )}

                    <View 
                      style={{ 
                        padding: 10, 
                        borderRadius: 10, 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
                        borderLeftWidth: 3, 
                        borderLeftColor: activeTheme.colors.accent,
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center'
                      }}
                    >
                      <BookOpen size={14} color={activeTheme.colors.accent} />
                      <Text style={{ flex: 1, fontStyle: 'italic', fontSize: 10.5, color: activeTheme.colors.textSecondary, lineHeight: 14 }}>
                        {stage.insight}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
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
  sankalpaCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sankalpaSubtitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  sankalpaTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  visualizerContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  percentOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  percentLbl: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
    marginTop: 4,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
  },
  countLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  dividerLine: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stageCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stageName: {
    fontSize: 14,
    fontWeight: '900',
  },
  stageDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  predictionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  milestonesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  milestoneItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  }
});

export default RadhaJapScreen;
