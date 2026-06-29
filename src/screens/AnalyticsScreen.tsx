import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration
} from 'react-native';
import { TrendingUp, Calendar as CalendarIcon, Clock, Sun, Moon, BarChart2 } from 'lucide-react-native';
import Svg, { Rect, Path, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppState, ChantLog } from '../types';
import { getLocalDateString } from '../hooks/useJapStorage';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper: Calculate duration string based on count and selected mantra
export const getDurationString = (count: number, mantra: string): string => {
  if (count <= 0) return '0 mins';
  
  // Base seconds per chant depending on mantra length/type
  let multiplier = 1.8; // default
  const lower = (mantra || '').toLowerCase();
  if (lower.includes('hare krishna') || lower.includes('कृष्णा')) {
    multiplier = 5.0; // long Mahamantra
  } else if (lower.includes('narayanaya') || lower.includes('नारायणाय')) {
    multiplier = 2.0;
  } else if (lower.includes('shivaya') || lower.includes('शिवाय')) {
    multiplier = 1.8;
  } else if (lower.includes('radha') || lower.includes('राधा')) {
    multiplier = 0.8;
  } else if (lower.includes('ram') || lower.includes('राम')) {
    multiplier = 0.8;
  } else if (lower.includes('ॐ') || lower === 'om') {
    multiplier = 0.5;
  } else if (mantra && mantra.length > 20) {
    multiplier = 3.5;
  } else if (mantra && mantra.length > 10) {
    multiplier = 1.8;
  } else if (mantra && mantra.length > 5) {
    multiplier = 1.2;
  } else {
    multiplier = 0.8;
  }

  const totalSeconds = Math.round(count * multiplier);
  if (totalSeconds < 60) {
    return `${totalSeconds} secs`;
  }
  
  const totalMins = Math.round(totalSeconds / 60);
  if (totalMins < 60) {
    return `${totalMins} mins`;
  }
  
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs}h ${mins}m`;
};

// --- Main Interactive History Graph ---
interface HistoryGraphProps {
  logs: Record<string, ChantLog>;
  mode: '7days' | '4weeks' | '6months';
  themeId: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const HistoryGraph: React.FC<HistoryGraphProps> = ({ logs, mode, themeId, selectedDate, onSelectDate }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  
  const chartData = useMemo(() => {
    const today = new Date();
    const data: { label: string; value: number; dateStr?: string }[] = [];
    
    if (mode === '7days') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(date);
        const log = logs[dateStr];
        
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
        data.push({
          label: dayLabel,
          value: log ? log.count : 0,
          dateStr: dateStr
        });
      }
    } else if (mode === '4weeks') {
      for (let i = 3; i >= 0; i--) {
        let weeklySum = 0;
        let representativeDateStr = '';
        for (let j = 0; j < 7; j++) {
          const date = new Date(today);
          date.setDate(today.getDate() - (i * 7 + j));
          const dateStr = getLocalDateString(date);
          const log = logs[dateStr];
          if (log) weeklySum += log.count;
          if (j === 3) representativeDateStr = dateStr; // center of week
        }
        data.push({
          label: `Wk -${i}`,
          value: weeklySum,
          dateStr: representativeDateStr
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        
        let monthlySum = 0;
        let representativeDateStr = '';
        Object.keys(logs).forEach(dateStr => {
          const [year, month] = dateStr.split('-');
          if (parseInt(year) === date.getFullYear() && parseInt(month) - 1 === date.getMonth()) {
            monthlySum += logs[dateStr].count;
            representativeDateStr = dateStr;
          }
        });
        
        data.push({
          label: monthLabel,
          value: monthlySum,
          dateStr: representativeDateStr || getLocalDateString(date)
        });
      }
    }
    return data;
  }, [logs, mode]);

  const maxValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.value), 108);
    return Math.ceil(max * 1.15);
  }, [chartData]);

  const chartHeight = 165;
  const chartWidth = SCREEN_WIDTH - 64; // responsive to padding
  const paddingBottom = 25;
  const paddingTop = 18;
  const paddingLeft = 36;
  const paddingRight = 10;
  
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  return (
    <View style={styles.graphContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id={`barGrad-${themeId}`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={activeTheme.colors.accent} stopOpacity={0.25} />
            <Stop offset="60%" stopColor={activeTheme.colors.accent} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={activeTheme.colors.accentLight} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Y Axis Gridlines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * ratio;
          const valLabel = Math.round(maxValue * (1 - ratio));
          return (
            <G key={idx}>
              <Path
                d={`M ${paddingLeft} ${y} L ${chartWidth - paddingRight} ${y}`}
                stroke={activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill={activeTheme.colors.textSecondary}
                fontSize="9.5"
                fontWeight="700"
                textAnchor="end"
              >
                {valLabel >= 1000 ? `${(valLabel / 1000).toFixed(1)}k` : valLabel}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {chartData.map((d, idx) => {
          const numBars = chartData.length;
          const barWidth = graphWidth / numBars * 0.55;
          const spacing = graphWidth / numBars;
          const x = paddingLeft + (idx * spacing) + (spacing - barWidth) / 2;
          
          const barHeight = (d.value / maxValue) * graphHeight;
          const y = paddingTop + graphHeight - barHeight;

          const isSelected = d.dateStr === selectedDate && mode === '7days';

          return (
            <G key={idx}>
              {/* Tap Hotspot */}
              <Rect
                x={x - spacing * 0.2}
                y={paddingTop}
                width={barWidth + spacing * 0.4}
                height={graphHeight}
                fill="transparent"
                onPress={() => {
                  if (d.dateStr) {
                    Vibration.vibrate(25);
                    onSelectDate(d.dateStr);
                  }
                }}
              />

              {/* Main Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2.5)}
                rx={barWidth / 2}
                ry={barWidth / 2}
                fill={isSelected ? activeTheme.colors.accent : `url(#barGrad-${themeId})`}
                stroke={isSelected ? '#ffffff' : 'transparent'}
                strokeWidth={isSelected ? 1 : 0}
                onPress={() => {
                  if (d.dateStr) {
                    Vibration.vibrate(25);
                    onSelectDate(d.dateStr);
                  }
                }}
              />
              
              {/* Highlight Ring for Selected Day */}
              {isSelected && (
                <Rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={Math.max(barHeight, 2.5) + 4}
                  rx={(barWidth + 4) / 2}
                  ry={(barWidth + 4) / 2}
                  fill="transparent"
                  stroke={activeTheme.colors.accent}
                  strokeWidth="1.5"
                  opacity={0.65}
                />
              )}
              
              {d.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill={isSelected ? activeTheme.colors.accent : activeTheme.colors.textPrimary}
                  fontSize="9.5"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                </SvgText>
              )}

              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 6}
                fill={isSelected ? activeTheme.colors.accent : activeTheme.colors.textSecondary}
                fontSize="10"
                fontWeight={isSelected ? 'bold' : '500'}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// --- Secondary Hourly Distribution Graph ---
interface HourlyGraphProps {
  hourlyCounts: Record<number, number>;
  themeId: string;
}

const HourlyGraph: React.FC<HourlyGraphProps> = ({ hourlyCounts, themeId }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  const blockData = useMemo(() => {
    const data: { label: string; value: number; key: number }[] = [];
    
    // Group 24 hours into 12 two-hour blocks
    for (let b = 0; b < 12; b++) {
      const startHr = b * 2;
      const endHr = startHr + 1;
      const count = (hourlyCounts[startHr] || 0) + (hourlyCounts[endHr] || 0);
      
      const ampm = startHr >= 12 ? 'PM' : 'AM';
      const hrLabel12 = startHr % 12 || 12;
      
      data.push({
        label: `${hrLabel12}${ampm}`,
        value: count,
        key: b
      });
    }
    return data;
  }, [hourlyCounts]);

  const maxVal = useMemo(() => {
    const max = Math.max(...blockData.map(d => d.value), 20);
    return Math.ceil(max * 1.15);
  }, [blockData]);

  const chartHeight = 110;
  const chartWidth = SCREEN_WIDTH - 64;
  const paddingBottom = 20;
  const paddingTop = 12;
  const paddingLeft = 32;
  const paddingRight = 10;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  return (
    <View style={styles.graphContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Gridlines */}
        {[0, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * ratio;
          return (
            <Path
              key={idx}
              d={`M ${paddingLeft} ${y} L ${chartWidth - paddingRight} ${y}`}
              stroke={activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
              strokeWidth="1"
            />
          );
        })}

        {blockData.map((d, idx) => {
          const numBars = blockData.length;
          const barWidth = graphWidth / numBars * 0.6;
          const spacing = graphWidth / numBars;
          const x = paddingLeft + (idx * spacing) + (spacing - barWidth) / 2;
          
          const barHeight = (d.value / maxVal) * graphHeight;
          const y = paddingTop + graphHeight - barHeight;

          const isSelected = selectedBlock === d.key;

          return (
            <G key={idx}>
              {/* Interaction Hotspot */}
              <Rect
                x={x - spacing * 0.15}
                y={paddingTop}
                width={barWidth + spacing * 0.3}
                height={graphHeight}
                fill="transparent"
                onPress={() => {
                  Vibration.vibrate(15);
                  setSelectedBlock(isSelected ? null : d.key);
                }}
              />

              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={1.5}
                ry={1.5}
                fill={isSelected ? '#fbbf24' : activeTheme.colors.accent + '99'}
                onPress={() => {
                  Vibration.vibrate(15);
                  setSelectedBlock(isSelected ? null : d.key);
                }}
              />

              {/* Tooltip on Tap */}
              {isSelected && d.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 3}
                  fill="#fbbf24"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {d.value}
                </SvgText>
              )}

              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 4}
                fill={isSelected ? '#fbbf24' : activeTheme.colors.textSecondary}
                fontSize="8"
                fontWeight="700"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// --- Main Analytics Screen ---
interface AnalyticsScreenProps {
  state: AppState;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ state }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  
  const [graphMode, setGraphMode] = useState<'7days' | '4weeks' | '6months'>('7days');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(getLocalDateString());

  // Calculations for average, peak, and completion rates
  const stats = useMemo(() => {
    const logsList = Object.values(state.historyLogs);
    if (logsList.length === 0) {
      return { average: 0, highest: 0, completionRate: 0, totalDurationHrs: '0 hrs', totalLifetimeChants: 0 };
    }
    
    const sum = logsList.reduce((acc, log) => acc + log.count, 0);
    const average = Math.round(sum / logsList.length);
    const highest = Math.max(...logsList.map(log => log.count));
    
    const metGoalCount = logsList.filter(log => log.count >= state.dailyGoalChants).length;
    const completionRate = Math.round((metGoalCount / logsList.length) * 100);

    const totalDurationHrs = getDurationString(state.lifetimeTotalChants, state.settings.selectedMantra);
    
    return { average, highest, completionRate, totalDurationHrs };
  }, [state.historyLogs, state.dailyGoalChants, state.lifetimeTotalChants]);

  // Selected Log Summary (count, malas, duration)
  const selectedLogSummary = useMemo(() => {
    const log = state.historyLogs[selectedHistoryDate];
    const todayStr = getLocalDateString();
    
    let count = 0;
    let malas = 0;
    let hourly: Record<number, number> = {};
    let isShielded = false;

    if (selectedHistoryDate === todayStr) {
      count = state.totalChantsToday;
      malas = state.completedMalasToday;
      // Get today's logs hourlyCounts from the history map if updated
      hourly = state.historyLogs[todayStr]?.hourlyCounts || {};
    } else if (log) {
      count = log.count;
      malas = log.malas;
      hourly = log.hourlyCounts || {};
      isShielded = !!log.isShielded;
    }

    const durationStr = getDurationString(count, state.settings.selectedMantra);

    // Find peak hour of selected day
    let peakHr = -1;
    let peakCount = 0;
    Object.entries(hourly).forEach(([hrStr, hrCount]) => {
      if (hrCount > peakCount) {
        peakCount = hrCount;
        peakHr = parseInt(hrStr);
      }
    });

    return {
      count,
      malas,
      durationStr,
      hourlyCounts: hourly,
      peakHour: peakHr,
      goalMet: count >= state.dailyGoalChants,
      isShielded
    };
  }, [state.historyLogs, state.totalChantsToday, state.completedMalasToday, state.dailyGoalChants, selectedHistoryDate]);

  // Lifetime Peak Chanting Period (Time of Day)
  const overallPeakChantingHour = useMemo(() => {
    const hourlyTotals: Record<number, number> = {};
    Object.values(state.historyLogs).forEach(log => {
      if (log.hourlyCounts) {
        Object.entries(log.hourlyCounts).forEach(([hrStr, count]) => {
          const hr = parseInt(hrStr);
          hourlyTotals[hr] = (hourlyTotals[hr] || 0) + count;
        });
      }
    });

    // include today's current session logs
    const todayStr = getLocalDateString();
    const todayHourly = state.historyLogs[todayStr]?.hourlyCounts || {};
    Object.entries(todayHourly).forEach(([hrStr, count]) => {
      const hr = parseInt(hrStr);
      hourlyTotals[hr] = (hourlyTotals[hr] || 0) + count;
    });

    let maxHr = -1;
    let maxCount = 0;
    Object.entries(hourlyTotals).forEach(([hrStr, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxHr = parseInt(hrStr);
      }
    });

    return maxHr;
  }, [state.historyLogs, state.totalChantsToday]);

  // Format hour 0-23 to 12-hour label
  const formatHourLabel = (hr: number) => {
    if (hr === -1) return 'No data logged';
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    const endHr = (hr + 1) % 12 || 12;
    const endAmpm = (hr + 1) >= 12 && (hr + 1) < 24 ? 'PM' : ((hr + 1) >= 24 || (hr + 1) < 12 ? 'AM' : ampm);
    return `${hr12} ${ampm} - ${endHr} ${endAmpm}`;
  };

  // Resolve Peak Period Name
  const getPeakPeriodName = (hr: number) => {
    if (hr === -1) return 'Not Chanted';
    if (hr >= 4 && hr < 7) return 'Brahma Muhurta (Early Dawn)';
    if (hr >= 7 && hr < 12) return 'Pratahkal (Morning Devotions)';
    if (hr >= 12 && hr < 16) return 'Madhya-kal (Afternoon Meditations)';
    if (hr >= 16 && hr < 20) return 'Sandhyakal (Evening Aarti Hour)';
    return 'Ratri-seva (Night-time Chanting)';
  };

  const calendarDates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      list.push(date);
    }
    return list;
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: activeTheme.colors.background }]}
    >
      {/* Analytics Graph Card */}
      <View 
        style={[
          styles.cardContainer,
          {
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitle}>
            <TrendingUp size={18} color={activeTheme.colors.accent} />
            <Text style={[styles.cardTitleText, { color: activeTheme.colors.textPrimary }]}>
              Chanting Metrics (Interactive)
            </Text>
          </View>
          
          <View style={[styles.segmentedWrapper, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            {(['7days', '4weeks', '6months'] as const).map(mode => {
              const label = mode === '7days' ? '7D' : mode === '4weeks' ? '4W' : '6M';
              const isSelected = graphMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    Vibration.vibrate(20);
                    setGraphMode(mode);
                  }}
                  style={[
                    styles.segmentOptionBtn,
                    { backgroundColor: isSelected ? activeTheme.colors.accent : 'transparent' }
                  ]}
                >
                  <Text style={[styles.segmentLabelText, { color: isSelected ? '#FFFFFF' : activeTheme.colors.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <HistoryGraph
          logs={state.historyLogs}
          mode={graphMode}
          themeId={state.settings.themeId}
          selectedDate={selectedHistoryDate}
          onSelectDate={setSelectedHistoryDate}
        />
        
        {graphMode === '7days' && (
          <Text style={[styles.chartInstructionText, { color: activeTheme.colors.textSecondary }]}>
            💡 Tap any bar above to select and view data for that specific day.
          </Text>
        )}
      </View>

      {/* Primary Analytics Summary Panel */}
      <View className="flex-row gap-3 mt-4">
        {/* Avg Chants Daily */}
        <View 
          style={[
            styles.statBlock,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>Daily Avg</Text>
          <Text style={[styles.statCount, { color: activeTheme.colors.textPrimary }]}>
            {stats.average.toLocaleString()}
          </Text>
          <Text style={[styles.statSubtext, { color: activeTheme.colors.textSecondary }]}>chants / day</Text>
        </View>

        {/* Chanting Time Duration (Estimated) */}
        <View 
          style={[
            styles.statBlock,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Clock size={10} color={activeTheme.colors.accent} />
            <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>Time Spent</Text>
          </View>
          <Text style={[styles.statCount, { color: activeTheme.colors.textPrimary }]}>
            {stats.totalDurationHrs}
          </Text>
          <Text style={[styles.statSubtext, { color: activeTheme.colors.textSecondary }]}>lifetime jaap</Text>
        </View>

        {/* Peak Chanting Hour Overall */}
        <View 
          style={[
            styles.statBlock,
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Sun size={10} color={activeTheme.colors.accent} />
            <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>Peak Time</Text>
          </View>
          <Text style={[styles.statCountText, { color: activeTheme.colors.textPrimary }]}>
            {overallPeakChantingHour !== -1 ? formatHourLabel(overallPeakChantingHour).replace(' - ', '\n') : 'No data'}
          </Text>
          <Text style={[styles.statSubtext, { color: activeTheme.colors.textSecondary }]}>frequent hour</Text>
        </View>
      </View>

      {/* Selected Day Stats & Details Lookup */}
      <View style={styles.detailsHeaderRow}>
        <CalendarIcon size={18} color={activeTheme.colors.accent} />
        <Text style={[styles.detailsSectionTitle, { color: activeTheme.colors.textPrimary }]}>
          Daily Details & Calendar Lookup
        </Text>
      </View>
      
      {/* 30 Days Horizontal Scroll Calendar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalCalendarScroll}
      >
        {calendarDates.map((date, idx) => {
          const dateStr = getLocalDateString(date);
          const isSelected = dateStr === selectedHistoryDate;
          const log = state.historyLogs[dateStr];
          const count = dateStr === getLocalDateString() ? state.totalChantsToday : (log ? log.count : 0);
          const isShielded = log && log.isShielded;
          
          let borderStyle = {};
          if (isShielded) {
            borderStyle = { borderColor: '#10b981', borderWidth: 1.5 };
          } else if (count >= state.dailyGoalChants) {
            borderStyle = { borderColor: activeTheme.colors.accent, borderWidth: 1.5 };
          } else if (count > 0) {
            borderStyle = { borderColor: activeTheme.colors.accentLight, borderWidth: 1.5 };
          } else {
            borderStyle = { borderColor: 'transparent', borderWidth: 1.5 };
          }

          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
          const dayNum = date.getDate();

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                Vibration.vibrate(20);
                setSelectedHistoryDate(dateStr);
              }}
              style={[
                styles.calendarDateBox,
                borderStyle,
                { 
                  backgroundColor: isSelected 
                    ? activeTheme.colors.accent 
                    : activeTheme.colors.cardBackground
                }
              ]}
            >
              <Text style={[styles.calendarDayText, { color: isSelected ? '#FFFFFF' : activeTheme.colors.textSecondary }]}>
                {dayName}
              </Text>
              <Text style={[styles.calendarNumText, { color: isSelected ? '#FFFFFF' : activeTheme.colors.textPrimary }]}>
                {dayNum}
              </Text>
              {isShielded && (
                <Text style={{ fontSize: 8, color: '#10b981', marginTop: -2, fontWeight: 'bold' }}>🛡️</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Day Detailed Dashboard Summary */}
      <View 
        style={[
          styles.summaryCard,
          {
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <View style={styles.summaryCardHeader}>
          <Text style={[styles.summarySubtitle, { color: activeTheme.colors.textSecondary }]}>
            Chant Analysis For:
          </Text>
          <Text style={[styles.summaryTitle, { color: activeTheme.colors.textPrimary }]}>
            {new Date(selectedHistoryDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Selected Day Statistics Grid */}
        <View style={styles.detailStatsGrid}>
          {/* Chants count */}
          <View style={styles.detailStatCell}>
            <Text style={[styles.detailCellLabel, { color: activeTheme.colors.textSecondary }]}>Total Chants</Text>
            <Text style={[styles.detailCellVal, { color: activeTheme.colors.textPrimary }]}>
              {selectedLogSummary.count.toLocaleString()}
            </Text>
            <Text style={[styles.detailCellSub, { color: activeTheme.colors.accent }]}>
              {selectedLogSummary.malas} Malas
            </Text>
          </View>

          {/* Time spent duration */}
          <View style={styles.detailStatCell}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={11} color={activeTheme.colors.accent} />
              <Text style={[styles.detailCellLabel, { color: activeTheme.colors.textSecondary }]}>Jaap Session</Text>
            </View>
            <Text style={[styles.detailCellVal, { color: activeTheme.colors.textPrimary }]}>
              {selectedLogSummary.durationStr}
            </Text>
            <Text style={[styles.detailCellSub, { color: activeTheme.colors.textSecondary }]}>approx duration</Text>
          </View>

          {/* Time of Day Chanted */}
          <View style={styles.detailStatCell}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              {selectedLogSummary.peakHour !== -1 && selectedLogSummary.peakHour >= 6 && selectedLogSummary.peakHour < 18 ? (
                <Sun size={11} color="#f59e0b" />
              ) : (
                <Moon size={11} color="#6366f1" />
              )}
              <Text style={[styles.detailCellLabel, { color: activeTheme.colors.textSecondary }]}>Peak Hour</Text>
            </View>
            <Text style={[styles.detailCellValCompact, { color: activeTheme.colors.textPrimary }]}>
              {selectedLogSummary.peakHour !== -1 ? formatHourLabel(selectedLogSummary.peakHour) : 'No logs'}
            </Text>
            <Text style={[styles.detailCellSubLabel, { color: activeTheme.colors.textSecondary }]} numberOfLines={1}>
              {getPeakPeriodName(selectedLogSummary.peakHour)}
            </Text>
          </View>
        </View>

        {/* Selected Day Hourly Distribution Chart */}
        {selectedLogSummary.count > 0 && (
          <View style={styles.hourlyDistributionSection}>
            <View style={styles.hourlyHeaderRow}>
              <BarChart2 size={13} color={activeTheme.colors.accent} />
              <Text style={[styles.hourlyTitleText, { color: activeTheme.colors.textPrimary }]}>
                Hourly Chanting Distribution
              </Text>
            </View>
            <HourlyGraph
              hourlyCounts={selectedLogSummary.hourlyCounts}
              themeId={state.settings.themeId}
            />
            <Text style={[styles.hourlyInstructionText, { color: activeTheme.colors.textSecondary }]}>
              💡 Tap on any bar above to display the exact chant count for that 2-hour window.
            </Text>
          </View>
        )}

        {/* Goal Met Indicator badge */}
        <View style={styles.summaryFooterBadgeRow}>
          {selectedLogSummary.count > 0 ? (
            <View 
              style={[
                styles.goalBadgeWrapper,
                { backgroundColor: selectedLogSummary.goalMet ? 'rgba(16, 185, 129, 0.12)' : activeTheme.colors.accent + '1A' }
              ]}
            >
              <Text style={{ color: selectedLogSummary.goalMet ? '#10B981' : activeTheme.colors.accent, fontWeight: '900', fontSize: 10.5 }}>
                {selectedLogSummary.goalMet 
                  ? '🎉 Daily Goal Complete (Om Chants Target Met)' 
                  : `🌱 Active chanting day (${(state.dailyGoalChants - selectedLogSummary.count).toLocaleString()} remaining to hit goal)`
                }
              </Text>
            </View>
          ) : selectedLogSummary.isShielded ? (
            <View style={[styles.goalBadgeWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10.5 }}>
                🛡️ Dharma Suraksha: Streak protected on this day by a Streak Shield
              </Text>
            </View>
          ) : (
            <View style={styles.noChantsBadge}>
              <Text style={[styles.noChantsText, { color: activeTheme.colors.textSecondary }]}>
                📿 Silence day. Tap bead in Dashboard to record counts.
              </Text>
            </View>
          )}
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
    paddingBottom: 130,
  },
  cardContainer: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginTop: 18,
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  segmentedWrapper: {
    flexDirection: 'row',
    borderRadius: 99,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  segmentOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  segmentLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  chartInstructionText: {
    fontSize: 9.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.75,
  },
  graphContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statBlock: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statCountText: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
    lineHeight: 13,
  },
  statSubtext: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 4,
  },
  detailsSectionTitle: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  horizontalCalendarScroll: {
    marginTop: 10,
    paddingVertical: 2,
  },
  calendarDateBox: {
    width: 46,
    height: 60,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarDayText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  calendarNumText: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  summaryCardHeader: {
    marginBottom: 10,
  },
  summarySubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  detailStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  detailStatCell: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
  },
  detailCellLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailCellVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  detailCellValCompact: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },
  detailCellSub: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  detailCellSubLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1.5,
    opacity: 0.85,
  },
  hourlyDistributionSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  hourlyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  hourlyTitleText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  hourlyInstructionText: {
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.75,
  },
  summaryFooterBadgeRow: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  goalBadgeWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  noChantsBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    width: '100%',
    alignItems: 'center',
  },
  noChantsText: {
    fontSize: 10,
    fontWeight: '800',
  }
});

export default AnalyticsScreen;
