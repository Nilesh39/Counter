import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Animated,
  Dimensions,
  Vibration,
  Easing,
  Platform
} from 'react-native';
import {
  Calendar as CalendarIcon,
  BookOpen,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Sun,
  Flame,
  Award,
  Sparkles,
  Heart
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppState, SadhanaPatrika } from '../types';
import { getLocalDateString } from '../hooks/useJapStorage';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SadhanaScreenProps {
  state: AppState;
  updateSadhanaPatrika: (date: string, data: {
    wokeUpBrahmaMuhurta: boolean;
    readScriptures: boolean;
    scriptureDuration: number;
    naamLekhanCount: number;
    diaryNote: string;
  }) => Promise<void>;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  yAnim: Animated.Value;
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const SACRED_NAMES = [
  'राधा', 'राधे', 'श्याम', 'राम', 'कृष्ण', 'हरि', 'ॐ',
  'radha', 'radhe', 'shyam', 'ram', 'krishna', 'hari', 'om'
];

export const SadhanaScreen: React.FC<SadhanaScreenProps> = ({ state, updateSadhanaPatrika }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;

  const todayStr = useMemo(() => getLocalDateString(), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Naam Lekhan input & particles
  const [naamInput, setNaamInput] = useState('');
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  
  // Audio playback ref
  const typeSoundRef = useRef<Audio.Sound | null>(null);

  // Load sound once
  useEffect(() => {
    let soundObj: Audio.Sound | null = null;
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/tap_click.mp3')
        );
        soundObj = sound;
        typeSoundRef.current = sound;
      } catch (err) {
        console.warn('Failed to load typing click sound in SadhanaScreen', err);
      }
    };
    loadSound();
    return () => {
      if (soundObj) {
        soundObj.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Get log for currently selected day or provide defaults
  const selectedLog = useMemo<SadhanaPatrika>(() => {
    const logs = state.sadhanaPatrikaLogs || {};
    return logs[selectedDateStr] || {
      date: selectedDateStr,
      wokeUpBrahmaMuhurta: false,
      readScriptures: false,
      scriptureDuration: 0,
      naamLekhanCount: 0,
      diaryNote: ''
    };
  }, [state.sadhanaPatrikaLogs, selectedDateStr]);

  // Local state for diary note to avoid render lag while typing, syncs on selected date change
  const [noteText, setNoteText] = useState(selectedLog.diaryNote);
  useEffect(() => {
    setNoteText(selectedLog.diaryNote);
  }, [selectedDateStr, selectedLog.diaryNote]);

  // Handle auto-save utility
  const handleSaveField = async (updatedFields: Partial<SadhanaPatrika>) => {
    const nextLog = {
      wokeUpBrahmaMuhurta: selectedLog.wokeUpBrahmaMuhurta,
      readScriptures: selectedLog.readScriptures,
      scriptureDuration: selectedLog.scriptureDuration,
      naamLekhanCount: selectedLog.naamLekhanCount,
      diaryNote: noteText,
      ...updatedFields
    };
    await updateSadhanaPatrika(selectedDateStr, nextLog);
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate Calendar Month Grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string | null; dayNum: number | null }[] = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dateStr: null, dayNum: null });
    }

    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = getLocalDateString(dateObj);
      days.push({ dateStr, dayNum: d });
    }

    return days;
  }, [currentMonth]);

  // Month Title Label
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Handle Naam Lekhan inputs
  const submitSacredName = (name: string) => {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return;

    // Check if it is a sacred name
    const isSacred = SACRED_NAMES.some(s => cleaned.includes(s));
    
    if (isSacred) {
      // Play sound
      if (state.settings.soundEnabled && typeSoundRef.current) {
        typeSoundRef.current.replayAsync().catch(() => {});
      }

      // Vibrate
      if (state.settings.hapticEnabled) {
        Vibration.vibrate(25);
      }

      // Add to Naam Lekhan tally
      const nextCount = selectedLog.naamLekhanCount + 1;
      handleSaveField({ naamLekhanCount: nextCount });

      // Spawn floating Sanskrit text particle
      const id = Math.random().toString(36).substring(7);
      const randomX = Math.floor(Math.random() * (SCREEN_WIDTH - 140)) + 40;
      
      const yAnim = new Animated.Value(0);
      const opacityAnim = new Animated.Value(1);
      const scaleAnim = new Animated.Value(0.6);

      const newParticle: FloatingText = {
        id,
        text: name.trim(),
        x: randomX,
        yAnim,
        opacityAnim,
        scaleAnim
      };

      setFloatingTexts(prev => {
        const active = prev.length >= 8 ? prev.slice(prev.length - 7) : prev;
        return [...active, newParticle];
      });

      // Animate
      Animated.parallel([
        Animated.timing(yAnim, {
          toValue: -150,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.6,
          duration: 1200,
          useNativeDriver: true
        })
      ]).start(() => {
        // Remove particle
        setFloatingTexts(prev => prev.filter(p => p.id !== id));
      });
    } else {
      // Gentle notification/vibe for non-matching inputs
      if (state.settings.hapticEnabled) {
        Vibration.vibrate([0, 40, 40, 40]);
      }
    }
  };

  const handleNaamSubmit = () => {
    submitSacredName(naamInput);
    setNaamInput('');
  };

  const getDayStatus = (dateStr: string) => {
    const logs = state.sadhanaPatrikaLogs || {};
    const log = logs[dateStr];
    const chantLog = state.historyLogs[dateStr];

    const hasWakeup = log?.wokeUpBrahmaMuhurta ?? false;
    const hasReading = log?.readScriptures ?? false;
    const hasWriting = (log?.naamLekhanCount ?? 0) > 0;
    const hasChants = (chantLog?.count ?? 0) >= state.dailyGoalChants;

    return { hasWakeup, hasReading, hasWriting, hasChants };
  };

  const readableSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDateStr]);

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Calendar Card */}
        <View 
          style={[
            styles.sectionCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          {/* Month Header */}
          <View style={styles.calendarHeader}>
            <Text style={[styles.calendarTitle, { color: activeTheme.colors.textPrimary }]}>
              Devotional Calendar
            </Text>
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <ChevronLeft size={18} color={activeTheme.colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <Text style={[styles.monthLabel, { color: activeTheme.colors.textPrimary }]}>
                {monthName}
              </Text>
              <View style={{ width: 10 }} />
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <ChevronRight size={18} color={activeTheme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={[styles.weekdayText, { color: activeTheme.colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.gridRow}>
            {calendarDays.map((day, idx) => {
              if (!day.dateStr || !day.dayNum) {
                return <View key={`empty-${idx}`} style={styles.dayCellPlaceholder} />;
              }

              const { dateStr, dayNum } = day;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const { hasWakeup, hasReading, hasWriting, hasChants } = getDayStatus(dateStr);

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => {
                    Vibration.vibrate(20);
                    setSelectedDateStr(dateStr);
                  }}
                  style={[
                    styles.dayCell,
                    isToday && { borderColor: activeTheme.colors.accent, borderWidth: 1.5 },
                    isSelected && { backgroundColor: activeTheme.colors.accent + '22', borderColor: activeTheme.colors.accent, borderWidth: 1 },
                    hasChants && styles.glowingGoldBorder
                  ]}
                >
                  <Text 
                    style={[
                      styles.dayNumberText,
                      { color: isSelected ? activeTheme.colors.accent : activeTheme.colors.textPrimary },
                      isToday && { fontWeight: '900' }
                    ]}
                  >
                    {dayNum}
                  </Text>
                  
                  {/* Indicator icons */}
                  <View style={styles.indicatorContainer}>
                    {hasWakeup && <Text style={styles.indicatorMiniIcon}>🌅</Text>}
                    {hasReading && <Text style={styles.indicatorMiniIcon}>📖</Text>}
                    {hasWriting && <Text style={styles.indicatorMiniIcon}>✍️</Text>}
                    {hasChants && <Text style={styles.indicatorMiniIcon}>🪷</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>🌅</Text><View style={{ width: 4 }} /><Text style={[styles.legendText, { color: activeTheme.colors.textSecondary }]}>Wakeup</Text></View>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>📖</Text><View style={{ width: 4 }} /><Text style={[styles.legendText, { color: activeTheme.colors.textSecondary }]}>Read</Text></View>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>✍️</Text><View style={{ width: 4 }} /><Text style={[styles.legendText, { color: activeTheme.colors.textSecondary }]}>Written</Text></View>
            <View style={styles.legendItem}><Text style={styles.legendEmoji}>🪷</Text><View style={{ width: 4 }} /><Text style={[styles.legendText, { color: activeTheme.colors.textSecondary }]}>Goal</Text></View>
          </View>
        </View>

        {/* Selected Date Header */}
        <View style={styles.selectedDateHeader}>
          <CalendarIcon size={16} color={activeTheme.colors.accent} />
          <Text style={[styles.selectedDateTitle, { color: activeTheme.colors.textPrimary }]}>
            {readableSelectedDate}
          </Text>
          {selectedDateStr === todayStr && (
            <View style={[styles.todayBadge, { backgroundColor: activeTheme.colors.accent + '1E' }]}>
              <Text style={[styles.todayBadgeText, { color: activeTheme.colors.accent }]}>TODAY</Text>
            </View>
          )}
        </View>

        {/* SECTION 2: Daily Sadhana Checklist */}
        <View 
          style={[
            styles.sectionCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          {/* Brahma Muhurta Wakeup */}
          <View style={[styles.optionRow, { borderBottomColor: activeTheme.colors.cardBorder, borderBottomWidth: 1 }]}>
            <View style={styles.optionInfo}>
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionEmoji}>🌅</Text>
                <Text style={[styles.optionTitle, { color: activeTheme.colors.textPrimary }]}>Brahma Muhurta Wakeup</Text>
              </View>
              <Text style={[styles.optionDesc, { color: activeTheme.colors.textSecondary }]}>
                Woke up between 4:00 AM - 6:00 AM for early meditation
              </Text>
            </View>
            <Switch
              value={selectedLog.wokeUpBrahmaMuhurta}
              onValueChange={(val) => {
                Vibration.vibrate(30);
                handleSaveField({ wokeUpBrahmaMuhurta: val });
              }}
              trackColor={{ false: '#767577', true: activeTheme.colors.accent + '99' }}
              thumbColor={selectedLog.wokeUpBrahmaMuhurta ? activeTheme.colors.accent : '#f4f3f4'}
            />
          </View>

          {/* Scripture Reading */}
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionEmoji}>📖</Text>
                <Text style={[styles.optionTitle, { color: activeTheme.colors.textPrimary }]}>Scripture Study</Text>
              </View>
              <Text style={[styles.optionDesc, { color: activeTheme.colors.textSecondary }]}>
                Studied Bhagavad Gita, Srimad Bhagavatam, or other scriptures
              </Text>
            </View>
            <Switch
              value={selectedLog.readScriptures}
              onValueChange={(val) => {
                Vibration.vibrate(30);
                handleSaveField({ readScriptures: val, scriptureDuration: val ? 15 : 0 });
              }}
              trackColor={{ false: '#767577', true: activeTheme.colors.accent + '99' }}
              thumbColor={selectedLog.readScriptures ? activeTheme.colors.accent : '#f4f3f4'}
            />
          </View>

          {/* Duration pills if study is enabled */}
          {selectedLog.readScriptures && (
            <View style={styles.durationPillsRow}>
              {[15, 30, 45, 60].map(mins => {
                const isActive = selectedLog.scriptureDuration === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => {
                      Vibration.vibrate(20);
                      handleSaveField({ scriptureDuration: mins });
                    }}
                    style={[
                      styles.durationPill,
                      { borderColor: activeTheme.colors.cardBorder, backgroundColor: activeTheme.colors.background },
                      isActive && { backgroundColor: activeTheme.colors.accent, borderColor: activeTheme.colors.accent },
                      { marginHorizontal: 4 }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.durationPillText,
                        { color: activeTheme.colors.textPrimary },
                        isActive && { color: '#ffffff', fontWeight: '900' }
                      ]}
                    >
                      {mins} mins
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* SECTION 3: Naam Lekhan (Written Chants Typing Pad) */}
        <View 
          style={[
            styles.sectionCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View style={styles.naamLekhanHeader}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionEmoji}>✍️</Text>
              <View>
                <Text style={[styles.optionTitle, { color: activeTheme.colors.textPrimary }]}>Naam Lekhan Typing Pad</Text>
                <Text style={[styles.optionDesc, { color: activeTheme.colors.textSecondary }]}>
                  Type "राधे", "राधा", "राम", "कृष्ण", or "Hari"
                </Text>
              </View>
            </View>
            
            <View style={[styles.tallyBadge, { backgroundColor: activeTheme.colors.accent + '15' }]}>
              <Text style={[styles.tallyLabel, { color: activeTheme.colors.textSecondary }]}>Written Today: </Text>
              <Text style={[styles.tallyCount, { color: activeTheme.colors.accent }]}>{selectedLog.naamLekhanCount}</Text>
            </View>
          </View>

          {/* Daily Written Sankalpa Progress Bar */}
          {(() => {
            const lekhanGoal = 108;
            const lekhanProgressPercent = Math.min(selectedLog.naamLekhanCount / lekhanGoal, 1);
            return (
              <View style={styles.lekhanProgressWrapper}>
                <View style={styles.lekhanProgressHeader}>
                  <Text style={[styles.lekhanProgressLabel, { color: activeTheme.colors.textSecondary }]}>
                    Daily Written Sankalpa Goal
                  </Text>
                  <Text style={[styles.lekhanProgressVal, { color: activeTheme.colors.accent }]}>
                    {selectedLog.naamLekhanCount} / {lekhanGoal}
                  </Text>
                </View>
                <View style={[styles.lekhanProgressBg, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <View 
                    style={[
                      styles.lekhanProgressFill, 
                      { 
                        width: `${lekhanProgressPercent * 100}%`,
                        backgroundColor: activeTheme.colors.accent
                      }
                    ]} 
                  />
                </View>
                {selectedLog.naamLekhanCount >= lekhanGoal && (
                  <View style={[styles.lekhanCompletedRow, { backgroundColor: '#fbbf241A', borderColor: '#fbbf2433' }]}>
                    <Sparkles size={12} color="#fbbf24" />
                    <View style={{ width: 4 }} />
                    <Text style={[styles.lekhanCompletedText, { color: '#fbbf24' }]}>Daily Written Sankalpa Completed! 🪷</Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Quick Tap Sacred Name pills */}
          <View style={styles.quickPillsRow}>
            {['राधा', 'राधे', 'कृष्ण', 'राम', 'ॐ', 'Hari'].map((name) => (
              <TouchableOpacity
                key={name}
                onPress={() => {
                  submitSacredName(name);
                }}
                style={[
                  styles.quickPill,
                  { 
                    backgroundColor: activeTheme.colors.background,
                    borderColor: activeTheme.colors.cardBorder,
                    marginRight: 6,
                    marginBottom: 6
                  }
                ]}
              >
                <Text style={[styles.quickPillText, { color: activeTheme.colors.accentLight }]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.typingInputRow}>
            <TextInput
              style={[
                styles.naamTextInput,
                { 
                  color: activeTheme.colors.textPrimary,
                  backgroundColor: activeTheme.colors.background,
                  borderColor: activeTheme.colors.cardBorder
                }
              ]}
              placeholder="Type holy name here..."
              placeholderTextColor={activeTheme.colors.textSecondary + '70'}
              value={naamInput}
              onChangeText={setNaamInput}
              onSubmitEditing={handleNaamSubmit}
              blurOnSubmit={false}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ width: 8 }} />
            <TouchableOpacity 
              onPress={handleNaamSubmit}
              style={[styles.submitNaamBtn, { backgroundColor: activeTheme.colors.accent }]}
            >
              <Check size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Floating particle text container */}
          <View style={styles.particlesContainer} pointerEvents="none">
            {floatingTexts.map(part => (
              <Animated.View
                key={part.id}
                style={[
                  styles.floatingTextContainer,
                  {
                    left: part.x,
                    opacity: part.opacityAnim,
                    transform: [
                      { translateY: part.yAnim },
                      { scale: part.scaleAnim }
                    ]
                  }
                ]}
              >
                <Text style={[styles.floatingSanskritText, { color: activeTheme.colors.accent }]}>
                  {part.text}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* SECTION 4: Spiritual Reflections Note */}
        <View 
          style={[
            styles.sectionCard,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View style={styles.optionTitleRow}>
            <Edit3 size={16} color={activeTheme.colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.optionTitle, { color: activeTheme.colors.textPrimary }]}>Divine Reflection / Diary Note</Text>
          </View>
          <Text style={[styles.optionDesc, { color: activeTheme.colors.textSecondary, marginBottom: 10 }]}>
            Write a small prayer, reflection, or summary of your spiritual realizations
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            style={[
              styles.reflectionInput,
              {
                color: activeTheme.colors.textPrimary,
                backgroundColor: activeTheme.colors.background,
                borderColor: activeTheme.colors.cardBorder
              }
            ]}
            placeholder="Type your prayer or reflections here..."
            placeholderTextColor={activeTheme.colors.textSecondary + '70'}
            value={noteText}
            onChangeText={setNoteText}
            onBlur={() => {
              handleSaveField({ diaryNote: noteText });
            }}
          />
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
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    padding: 4,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 90,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    width: 38,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    backgroundColor: 'rgba(255,255,255,0.01)',
    marginVertical: 4,
  },
  dayCellPlaceholder: {
    width: 38,
    height: 48,
    marginVertical: 4,
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  indicatorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  indicatorMiniIcon: {
    fontSize: 7,
    marginHorizontal: 0.5,
  },
  glowingGoldBorder: {
    borderColor: '#fbbf24',
    borderWidth: 1,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 10,
  },
  legendText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedDateTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionInfo: {
    flex: 1,
    paddingRight: 16,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  optionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '500',
  },
  durationPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  naamLekhanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tallyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tallyLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  tallyCount: {
    fontSize: 10,
    fontWeight: '900',
  },
  lekhanProgressWrapper: {
    marginBottom: 14,
  },
  lekhanProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lekhanProgressLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  lekhanProgressVal: {
    fontSize: 10,
    fontWeight: '900',
  },
  lekhanProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  lekhanProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  lekhanCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 0.5,
    marginTop: 6,
  },
  lekhanCompletedText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  typingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  naamTextInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  submitNaamBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -100,
    bottom: 0,
    zIndex: 1,
  },
  floatingTextContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSanskritText: {
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  reflectionInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11.5,
    fontWeight: '600',
    textAlignVertical: 'top',
    height: 80,
  }
});

export default SadhanaScreen;
