import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Vibration
} from 'react-native';
import {
  Target,
  Plus,
  Trash2,
  Award,
  CheckCircle2,
  Pin,
  PinOff,
  ChevronRight,
  Clock,
  Calendar,
  X,
  History,
  Sparkles
} from 'lucide-react-native';
import { AppState } from '../types';
import { getLocalDateString } from '../hooks/useJapStorage';
import { THEMES } from '../theme/themes';

interface GoalsScreenProps {
  state: AppState;
  addGoal: (name: string, target: number, targetDate: string, type: 'one-time' | 'daily') => void;
  deleteGoal: (id: string) => void;
  setActiveDashboardGoal: (goalId: string) => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ state, addGoal, deleteGoal, setActiveDashboardGoal }) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTargetText, setGoalTargetText] = useState('');
  const [daysText, setDaysText] = useState('30');
  const [goalType, setGoalType] = useState<'one-time' | 'daily'>('one-time');
  const [selectedHistoryGoal, setSelectedHistoryGoal] = useState<any | null>(null);

  const handleCreateGoal = () => {
    const target = parseInt(goalTargetText);
    const days = parseInt(daysText);
    
    if (goalName.trim() && !isNaN(target) && target > 0 && !isNaN(days) && days > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = getLocalDateString(targetDate);
      
      addGoal(goalName, target, targetDateStr, goalType);
      setModalVisible(false);
      setGoalName('');
      setGoalTargetText('');
      setDaysText('30');
      setGoalType('one-time');
    }
  };

  const dailyProgressPercent = Math.min(state.totalChantsToday / state.dailyGoalChants, 1);

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Commitment Progress Card */}
        <View 
          style={[
            styles.dailyCard, 
            {
              backgroundColor: activeTheme.colors.cardBackground,
              borderColor: activeTheme.colors.cardBorder
            }
          ]}
        >
          <View style={styles.dailyHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.dailySubtitle, { color: activeTheme.colors.textSecondary }]}>
                DAILY COMMITMENT TRACKER
              </Text>
              <Text style={[styles.dailyTitle, { color: activeTheme.colors.textPrimary }]}>
                Sankalpa Progress
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate(25);
                setActiveDashboardGoal('daily');
              }}
              style={[
                styles.pinButton,
                { 
                  backgroundColor: state.settings.activeDashboardGoalId === 'daily' 
                    ? activeTheme.colors.accent + '22' 
                    : 'transparent',
                  borderColor: state.settings.activeDashboardGoalId === 'daily'
                    ? activeTheme.colors.accent
                    : activeTheme.colors.cardBorder,
                  borderWidth: 1
                }
              ]}
            >
              <Pin size={11} color={state.settings.activeDashboardGoalId === 'daily' ? activeTheme.colors.accent : activeTheme.colors.textSecondary} />
              <Text style={[styles.pinButtonText, { color: state.settings.activeDashboardGoalId === 'daily' ? activeTheme.colors.accent : activeTheme.colors.textSecondary }]}>
                {state.settings.activeDashboardGoalId === 'daily' ? 'Pinned' : 'Pin to Dash'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dailyProgressDetails}>
            <View>
              <Text style={[styles.dailyCountsText, { color: activeTheme.colors.textPrimary }]}>
                {state.totalChantsToday.toLocaleString()}
                <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  {` / ${state.dailyGoalChants.toLocaleString()} chants`}
                </Text>
              </Text>
              <Text style={[styles.malasCountBadge, { color: activeTheme.colors.accent }]}>
                ({(state.totalChantsToday / 108).toFixed(1)} Malas completed)
              </Text>
            </View>
            <Text style={[styles.dailyPercentText, { color: activeTheme.colors.accent }]}>
              {Math.round(dailyProgressPercent * 100)}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.barBg, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View 
              style={[
                styles.barFill, 
                { 
                  width: `${dailyProgressPercent * 100}%`,
                  backgroundColor: activeTheme.colors.accent
                }
              ]}
            />
          </View>
        </View>

        {/* Vows (Custom Milestones) Section */}
        <View style={styles.milestonesSection}>
          <View style={styles.milestonesHeaderRow}>
            <View style={styles.milestonesHeaderTitle}>
              <Target size={18} color={activeTheme.colors.accent} />
              <Text style={[styles.milestonesTitle, { color: activeTheme.colors.textPrimary }]}>
                Spiritual Vows & Milestones
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate(30);
                setModalVisible(true);
              }}
              style={[styles.addButton, { backgroundColor: activeTheme.colors.accent }]}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Vow</Text>
            </TouchableOpacity>
          </View>

          {/* List of active vows */}
          {state.bigGoals.length === 0 ? (
            <View 
              style={[
                styles.emptyStateContainer, 
                { borderColor: activeTheme.colors.cardBorder }
              ]}
            >
              <Target size={32} color={activeTheme.colors.textSecondary} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: activeTheme.colors.textPrimary }]}>
                No custom vows active
              </Text>
              <Text style={[styles.emptyDesc, { color: activeTheme.colors.textSecondary }]}>
                Create milestones for upcoming festivals, Kartik vows, or specific chanting goals.
              </Text>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {state.bigGoals.map((goal) => {
                const isDaily = goal.type === 'daily';
                const progress = Math.min(goal.current / goal.target, 1);
                const remaining = Math.max(goal.target - goal.current, 0);
                
                // Calculate required daily average (Sankalpa Predictor)
                const targetDateObj = new Date(goal.targetDate);
                const todayObj = new Date();
                todayObj.setHours(0, 0, 0, 0);
                targetDateObj.setHours(0, 0, 0, 0);
                const timeDiff = targetDateObj.getTime() - todayObj.getTime();
                const daysRemaining = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 1);
                
                const dailyAvgRequired = isDaily ? goal.target : Math.ceil(remaining / daysRemaining);
                const malasRequired = (dailyAvgRequired / 108).toFixed(1);

                // For daily stats
                const historyList = Object.values(goal.history || {});
                const completedDaysCount = historyList.filter((h: any) => h.completed).length + (goal.completed ? 1 : 0);
                const totalDaysCount = historyList.length + 1;

                return (
                  <TouchableOpacity
                    key={goal.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      Vibration.vibrate(25);
                      setSelectedHistoryGoal(goal);
                    }}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: activeTheme.colors.cardBackground,
                        borderColor: activeTheme.colors.cardBorder
                      }
                    ]}
                  >
                    {/* Card Top */}
                    <View style={styles.goalCardTop}>
                      <View style={[styles.goalInfo, { flex: 1, paddingRight: 8 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <Text style={[styles.goalName, { color: activeTheme.colors.textPrimary }]} numberOfLines={1}>
                            {goal.name}
                          </Text>
                          <View style={{ backgroundColor: isDaily ? '#3b82f620' : '#f59e0b20', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                            <Text style={{ color: isDaily ? '#3b82f6' : '#f59e0b', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>
                              {isDaily ? 'दैनिक (Daily)' : 'एक बार (One-time)'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.goalDate, { color: activeTheme.colors.textSecondary }]}>
                          Target Date: {goal.targetDate}
                        </Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => {
                            Vibration.vibrate(25);
                            setActiveDashboardGoal(goal.id);
                          }}
                          style={[
                            styles.pinButton,
                            { 
                              backgroundColor: state.settings.activeDashboardGoalId === goal.id 
                                ? activeTheme.colors.accent + '22' 
                                : 'transparent',
                              borderColor: state.settings.activeDashboardGoalId === goal.id
                                ? activeTheme.colors.accent
                                : activeTheme.colors.cardBorder,
                              borderWidth: 1
                            }
                          ]}
                        >
                          <Pin size={11} color={state.settings.activeDashboardGoalId === goal.id ? activeTheme.colors.accent : activeTheme.colors.textSecondary} />
                          <Text style={[styles.pinButtonText, { color: state.settings.activeDashboardGoalId === goal.id ? activeTheme.colors.accent : activeTheme.colors.textSecondary }]}>
                            {state.settings.activeDashboardGoalId === goal.id ? 'Pinned' : 'Pin'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => {
                            Vibration.vibrate(30);
                            deleteGoal(goal.id);
                          }}
                          style={[styles.trashBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                        >
                          <Trash2 size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Metrics */}
                    <View style={styles.goalProgressStats}>
                      <View style={styles.goalProgressTextColumn}>
                        <Text style={[styles.goalProgressTitle, { color: activeTheme.colors.textSecondary }]}>
                          {isDaily ? 'TODAY\'S PROGRESS' : 'TOTAL PROGRESS'}
                        </Text>
                        <Text style={[styles.goalCounts, { color: activeTheme.colors.textPrimary }]}>
                          {goal.current.toLocaleString()}
                          <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                            {` / ${goal.target.toLocaleString()}`}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.goalProgressBadge}>
                        {goal.completed ? (
                          <View style={styles.completedBadge}>
                            <CheckCircle2 size={11} color="#10B981" />
                            <Text style={styles.completedBadgeText}>Completed</Text>
                          </View>
                        ) : (
                          <Text style={[styles.leftText, { color: activeTheme.colors.accent }]}>
                            {remaining.toLocaleString()} left
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Sankalpa Predictor Info Box */}
                    <View 
                      style={[
                        styles.predictorBox,
                        { 
                          backgroundColor: activeTheme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          borderColor: activeTheme.colors.cardBorder 
                        }
                      ]}
                    >
                      <Text style={[styles.predictorLabel, { color: activeTheme.colors.accent }]}>
                        SANKALPA PREDICTOR
                      </Text>
                      {isDaily ? (
                        goal.completed ? (
                          <Text style={styles.predictorTextSuccess}>
                            🎉 Daily target met today! Keep it up tomorrow.
                          </Text>
                        ) : (
                          <Text style={[styles.predictorText, { color: activeTheme.colors.textPrimary }]}>
                            ⏰ Chant <Text style={{ color: activeTheme.colors.accent, fontWeight: '800' }}>{remaining.toLocaleString()}</Text> more today to achieve your daily target of <Text style={{ fontWeight: '800' }}>{goal.target.toLocaleString()} ({malasRequired} Malas)</Text>.
                          </Text>
                        )
                      ) : (
                        goal.completed ? (
                          <Text style={styles.predictorTextSuccess}>
                            🎉 Vow completed successfully! Haribol!
                          </Text>
                        ) : (
                          <Text style={[styles.predictorText, { color: activeTheme.colors.textPrimary }]}>
                            ⏰ <Text style={{ fontWeight: '800' }}>{daysRemaining} days</Text> left. You need to chant <Text style={{ color: activeTheme.colors.accent, fontWeight: '800' }}>{dailyAvgRequired.toLocaleString()}</Text> times (<Text style={{ color: activeTheme.colors.accent, fontWeight: '800' }}>{malasRequired} Malas</Text>) daily to finish on time.
                          </Text>
                        )
                      )}
                    </View>

                    {/* Bar Fill */}
                    <View style={[styles.goalBarBg, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                      <View 
                        style={[
                          styles.goalBarFill, 
                          { 
                            width: `${progress * 100}%`,
                            backgroundColor: goal.completed ? '#10B981' : activeTheme.colors.accent
                          }
                        ]}
                      />
                    </View>

                    {/* Card Footer */}
                    <View style={styles.goalCardFooter}>
                      <View style={[styles.badgeContainer, { backgroundColor: activeTheme.colors.accent + '15' }]}>
                        <Award size={10} color={activeTheme.colors.accent} />
                        <Text style={[styles.badgeLabelText, { color: activeTheme.colors.accent }]}>
                          {isDaily ? `${completedDaysCount} / ${totalDaysCount} Days Met` : `${Math.round(progress * 100)}% Done`}
                        </Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <History size={10} color={activeTheme.colors.textSecondary} />
                        <Text style={[styles.etaText, { color: activeTheme.colors.textSecondary }]}>
                          Click to view history
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Custom Vow Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View 
            style={[
              styles.modalContent,
              {
                backgroundColor: activeTheme.colors.cardBackground,
                borderColor: activeTheme.colors.cardBorder
              }
            ]}
          >
            <View style={[styles.modalSwipeBar, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
            
            <Text style={[styles.modalTitle, { color: activeTheme.colors.textPrimary }]}>
              New Spiritual Sankalpa
            </Text>
            
            <View style={styles.modalFields}>
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.fieldLabel, { color: activeTheme.colors.textPrimary }]}>संकल्प का प्रकार (Vow Type)</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Vibration.vibrate(20);
                      setGoalType('one-time');
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      backgroundColor: goalType === 'one-time' ? activeTheme.colors.accent + '1A' : 'transparent',
                      borderColor: goalType === 'one-time' ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: goalType === 'one-time' ? activeTheme.colors.accent : activeTheme.colors.textSecondary }}>
                      एक बार (One-time)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Vibration.vibrate(20);
                      setGoalType('daily');
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      backgroundColor: goalType === 'daily' ? activeTheme.colors.accent + '1A' : 'transparent',
                      borderColor: goalType === 'daily' ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: goalType === 'daily' ? activeTheme.colors.accent : activeTheme.colors.textSecondary }}>
                      दैनिक (Daily Recurring)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: activeTheme.colors.textPrimary }]}>Sankalpa / Vow Name</Text>
                <TextInput
                  placeholder={goalType === 'daily' ? "e.g. Daily Kartik Vow 10 Malas" : "e.g. Kartik Vow 100K Jaap"}
                  placeholderTextColor={activeTheme.colors.textSecondary + '77'}
                  value={goalName}
                  onChangeText={setGoalName}
                  style={[
                    styles.inputField,
                    {
                      borderColor: activeTheme.colors.cardBorder,
                      color: activeTheme.colors.textPrimary,
                      backgroundColor: activeTheme.colors.background
                    }
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: activeTheme.colors.textPrimary }]}>
                  {goalType === 'daily' ? "Daily Target Chants (दैनिक लक्ष्य)" : "Total Target Chants Count"}
                </Text>
                <TextInput
                  placeholder={goalType === 'daily' ? "e.g. 1080 (10 Malas)" : "e.g. 100000"}
                  placeholderTextColor={activeTheme.colors.textSecondary + '77'}
                  value={goalTargetText}
                  onChangeText={setGoalTargetText}
                  keyboardType="numeric"
                  style={[
                    styles.inputField,
                    {
                      borderColor: activeTheme.colors.cardBorder,
                      color: activeTheme.colors.textPrimary,
                      backgroundColor: activeTheme.colors.background
                    }
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: activeTheme.colors.textPrimary }]}>
                  {goalType === 'daily' ? "Challenge Duration (Number of Days)" : "Timeframe (Number of Days)"}
                </Text>
                <TextInput
                  placeholder="e.g. 30"
                  placeholderTextColor={activeTheme.colors.textSecondary + '77'}
                  value={daysText}
                  onChangeText={setDaysText}
                  keyboardType="numeric"
                  style={[
                    styles.inputField,
                    {
                      borderColor: activeTheme.colors.cardBorder,
                      color: activeTheme.colors.textPrimary,
                      backgroundColor: activeTheme.colors.background
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[
                  styles.modalCancelButton, 
                  { 
                    backgroundColor: activeTheme.colors.background, 
                    borderColor: activeTheme.colors.cardBorder 
                  }
                ]}
              >
                <Text style={[styles.modalCancelText, { color: activeTheme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGoal}
                style={[styles.modalApplyButton, { backgroundColor: activeTheme.colors.accent }]}
              >
                <Text style={styles.modalApplyText}>Take Vow</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Goal History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedHistoryGoal !== null}
        onRequestClose={() => setSelectedHistoryGoal(null)}
      >
        <View style={styles.modalBg}>
          <View 
            style={[
              styles.modalContent,
              {
                backgroundColor: activeTheme.colors.cardBackground,
                borderColor: activeTheme.colors.cardBorder,
                maxHeight: '80%'
              }
            ]}
          >
            <View style={[styles.modalSwipeBar, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 10, color: activeTheme.colors.accent, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  SANKALPA LOGS & HISTORY
                </Text>
                <Text style={{ fontSize: 16, color: activeTheme.colors.textPrimary, fontWeight: '900' }} numberOfLines={1}>
                  {selectedHistoryGoal?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedHistoryGoal(null)}
                style={{ padding: 6, borderRadius: 99, backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                <X size={16} color={activeTheme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable logs list */}
            <ScrollView style={{ width: '100%', marginBottom: 12 }} showsVerticalScrollIndicator={false}>
              
              {/* Overall Success rate summary box */}
              {(() => {
                if (!selectedHistoryGoal) return null;
                const historyList = Object.values(selectedHistoryGoal.history || {});
                const completedCount = historyList.filter((h: any) => h.completed).length + (selectedHistoryGoal.completed ? 1 : 0);
                const totalDaysCount = historyList.length + 1;
                const successRate = Math.round((completedCount / totalDaysCount) * 100);

                return (
                  <View style={{ padding: 14, borderRadius: 16, backgroundColor: activeTheme.colors.accent + '10', borderWidth: 1, borderColor: activeTheme.colors.accent + '22', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: activeTheme.colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: activeTheme.colors.accent }}>
                        {successRate}%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: activeTheme.colors.textPrimary }}>
                        Sankalpa Success Rate
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: activeTheme.colors.textSecondary, marginTop: 1 }}>
                        Target achieved on {completedCount} out of {totalDaysCount} days tracked.
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <Text style={{ fontSize: 11, fontWeight: '800', color: activeTheme.colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Daily Performance Timeline
              </Text>

              {/* Today's active log */}
              {selectedHistoryGoal && (
                <View 
                  style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingVertical: 12, 
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: activeTheme.colors.background,
                    borderWidth: 1,
                    borderColor: activeTheme.colors.accent + '33',
                    marginBottom: 8
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: activeTheme.colors.textPrimary }}>
                      Today (Active)
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: activeTheme.colors.textSecondary, marginTop: 2 }}>
                      {selectedHistoryGoal.current.toLocaleString()} / {selectedHistoryGoal.target.toLocaleString()} chants
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: selectedHistoryGoal.completed ? '#10B981' : activeTheme.colors.accent }}>
                      {Math.round((selectedHistoryGoal.current / selectedHistoryGoal.target) * 100)}%
                    </Text>
                    <Text style={{ fontSize: 8.5, fontWeight: '700', color: activeTheme.colors.textSecondary, marginTop: 1 }}>
                      {selectedHistoryGoal.completed ? 'Achieved ✓' : 'In Progress'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Historical logs */}
              {selectedHistoryGoal && (() => {
                const historyEntries = Object.entries(selectedHistoryGoal.history || {}).sort((a, b) => b[0].localeCompare(a[0])); // newest first
                if (historyEntries.length === 0) {
                  return (
                    <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: activeTheme.colors.textSecondary, fontWeight: '700', textAlign: 'center', lineHeight: 16 }}>
                        No historical logs yet. Your progress records will automatically appear here starting tomorrow! 🌸
                      </Text>
                    </View>
                  );
                }

                return historyEntries.map(([dateKey, logVal]: [string, any]) => {
                  const percent = Math.round((logVal.current / logVal.target) * 100);
                  const isDayCompleted = logVal.completed;
                  
                  // Format date key (e.g. 2026-06-15 -> 15 Jun 2026)
                  const [y, m, d] = dateKey.split('-');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const formattedDate = `${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;

                  return (
                    <View 
                      key={dateKey}
                      style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        paddingVertical: 12, 
                        paddingHorizontal: 14,
                        borderRadius: 14,
                        backgroundColor: activeTheme.colors.background,
                        borderWidth: 1,
                        borderColor: activeTheme.colors.cardBorder,
                        marginBottom: 8
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: activeTheme.colors.textPrimary }}>
                          {formattedDate}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: activeTheme.colors.textSecondary, marginTop: 2 }}>
                          {logVal.current.toLocaleString()} / {logVal.target.toLocaleString()} chants
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: isDayCompleted ? '#10B981' : activeTheme.colors.textSecondary }}>
                          {percent}%
                        </Text>
                        <Text style={{ fontSize: 8.5, fontWeight: '700', color: isDayCompleted ? '#10B981' : activeTheme.colors.textSecondary, marginTop: 1 }}>
                          {isDayCompleted ? 'Achieved ✓' : 'Incomplete'}
                        </Text>
                      </View>
                    </View>
                  );
                });
              })()}

            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 120,
  },
  dailyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  dailyHeader: {
    marginBottom: 8,
  },
  dailySubtitle: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dailyTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  dailyProgressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dailyCountsText: {
    fontSize: 20,
    fontWeight: '900',
  },
  malasCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  dailyPercentText: {
    fontSize: 18,
    fontWeight: '900',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestonesSection: {
    marginTop: 8,
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  milestonesHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestonesTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 3,
    elevation: 2,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyStateContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.75,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalInfo: {
    flex: 1,
    paddingRight: 8,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '900',
  },
  goalDate: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  trashBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  goalProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  goalProgressTextColumn: {
    flexDirection: 'column',
  },
  goalProgressTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goalCounts: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  goalProgressBadge: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: '#10b981',
    fontSize: 8.5,
    fontWeight: '900',
  },
  leftText: {
    fontSize: 10,
    fontWeight: '800',
  },
  goalBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    gap: 3,
  },
  badgeLabelText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  etaText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
  },
  modalSwipeBar: {
    width: 44,
    height: 4.5,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalFields: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputField: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '800',
    fontSize: 13,
  },
  modalApplyButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  pinButtonText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  predictorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  predictorLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  predictorText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
  },
  predictorTextSuccess: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: '#10B981',
  }
});

export default GoalsScreen;
