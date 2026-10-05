import { useState, useEffect, useRef } from 'react';
import { Vibration, NativeModules, AppState as RNAppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, ChantLog, BigGoal, AppSettings, CounterStyle, SukritiTransaction } from '../types';

const STORAGE_KEY = '@naam_jap_state_v1';

// Helper: Format Date to YYYY-MM-DD local time
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Format Date and Time
export const getLocalDateTimeString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Helper: Seed Mock Hourly Counts for past data
const seedMockHourlyCounts = (totalChants: number): Record<number, number> => {
  const hourly: Record<number, number> = {};
  const peakHours = [5, 8, 18, 21]; // Brahma Muhurta, morning, evening, night
  let remaining = totalChants;
  while (remaining > 0) {
    const hr = peakHours[Math.floor(Math.random() * peakHours.length)];
    const chunk = Math.min(Math.floor(Math.random() * 200) + 50, remaining);
    hourly[hr] = (hourly[hr] || 0) + chunk;
    remaining -= chunk;
  }
  return hourly;
};

// Seed Mock Data
const seedMockData = (): Record<string, ChantLog> => {
  const logs: Record<string, ChantLog> = {};
  const today = new Date();
  
  for (let i = 15; i >= 1; i--) {
    const prevDate = new Date(today);
    prevDate.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(prevDate);
    
    const malas = Math.floor(Math.random() * 8) + 2;
    const count = malas * 108 + (Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0);
    
    logs[dateStr] = {
      date: dateStr,
      count,
      malas: Math.floor(count / 108),
      hourlyCounts: seedMockHourlyCounts(count)
    };
  }
  
  return logs;
};

// Streak Calculation
export const calculateStreak = (history: Record<string, ChantLog>, todayStr: string): number => {
  let streak = 0;
  const checkDate = new Date();
  const todayCount = history[todayStr]?.count || 0;
  const todayShielded = history[todayStr]?.isShielded || false;
  
  if (todayCount === 0 && !todayShielded) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = getLocalDateString(checkDate);
    const dayLog = history[dateStr];
    
    if (dayLog && (dayLog.count > 0 || dayLog.isShielded)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const evaluateBhaktiProgress = (state: AppState): AppState => {
  const currentStage = state.bhaktiStage ?? 1;
  const unlocked = [...(state.unlockedSamagri || ['brass-diya'])];
  
  if (!unlocked.includes('brass-diya')) unlocked.push('brass-diya');
  if (!unlocked.includes('chandan-bowl')) unlocked.push('chandan-bowl');

  let nextStage = currentStage;
  
  if (state.lifetimeTotalChants >= 3240 && !unlocked.includes('silver-bell')) {
    unlocked.push('silver-bell');
    nextStage = Math.max(nextStage, 2);
  } else if (state.lifetimeTotalChants >= 3240) {
    nextStage = Math.max(nextStage, 2);
  }

  if (state.streakDays >= 5 && !unlocked.includes('silver-diya')) {
    unlocked.push('silver-diya');
    nextStage = Math.max(nextStage, 3);
  } else if (state.streakDays >= 5) {
    nextStage = Math.max(nextStage, 3);
  }

  let hasBrahmaMuhurtaChant = false;
  if (!unlocked.includes('gold-bell')) {
    const currentHour = new Date().getHours();
    if (currentHour === 4 || currentHour === 5) {
      hasBrahmaMuhurtaChant = true;
    } else {
      for (const log of Object.values(state.historyLogs || {})) {
        if (log.hourlyCounts && (log.hourlyCounts[4] > 0 || log.hourlyCounts[5] > 0)) {
          hasBrahmaMuhurtaChant = true;
          break;
        }
      }
    }
  }
  if (hasBrahmaMuhurtaChant && !unlocked.includes('gold-bell')) {
    unlocked.push('gold-bell');
    nextStage = Math.max(nextStage, 4);
  } else if (unlocked.includes('gold-bell')) {
    nextStage = Math.max(nextStage, 4);
  }

  if (state.offeredFlowersCount >= 50 && !unlocked.includes('gold-diya')) {
    unlocked.push('gold-diya');
    nextStage = Math.max(nextStage, 5);
  } else if (state.offeredFlowersCount >= 50) {
    nextStage = Math.max(nextStage, 5);
  }

  if (state.lifetimeTotalChants >= 20000 && !unlocked.includes('royal-canopy')) {
    unlocked.push('royal-canopy');
    nextStage = Math.max(nextStage, 6);
  } else if (state.lifetimeTotalChants >= 20000) {
    nextStage = Math.max(nextStage, 6);
  }

  if (state.lifetimeTotalChants >= 50000 && !unlocked.includes('royal-gaddi')) {
    unlocked.push('royal-gaddi');
    nextStage = Math.max(nextStage, 7);
  } else if (state.lifetimeTotalChants >= 50000) {
    nextStage = Math.max(nextStage, 7);
  }

  if (state.streakDays >= 15 && !unlocked.includes('ratna-altar')) {
    unlocked.push('ratna-altar');
    nextStage = Math.max(nextStage, 8);
  } else if (state.streakDays >= 15) {
    nextStage = Math.max(nextStage, 8);
  }

  if (state.lifetimeTotalChants >= 108000 && !unlocked.includes('divine-aura')) {
    unlocked.push('divine-aura');
    nextStage = Math.max(nextStage, 9);
  } else if (state.lifetimeTotalChants >= 108000) {
    nextStage = Math.max(nextStage, 9);
  }

  return {
    ...state,
    bhaktiStage: nextStage,
    unlockedSamagri: unlocked
  };
};

export const useJapStorage = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef<AppState | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const pendingSaveStateRef = useRef<AppState | null>(null);
  const lastVibrationTimeRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncWidgetChants = async () => {
    try {
      const { NaamJapWidgetModule } = NativeModules;
      if (!NaamJapWidgetModule) return;
      
      const unsynced = await NaamJapWidgetModule.getUnsyncedChants();
      if (unsynced > 0) {
        setState(prevState => {
          if (!prevState) return prevState;
          
          const todayStr = getLocalDateString();
          const nextTotalToday = prevState.totalChantsToday + unsynced;
          const nextLifetimeTotal = prevState.lifetimeTotalChants + unsynced;
          
          const totalMantraChants = prevState.currentChantsInMala + unsynced;
          const additionalMalas = Math.floor(totalMantraChants / 108);
          const nextChantsInMala = totalMantraChants % 108;
          const nextCompletedMalas = prevState.completedMalasToday + additionalMalas;
          
          const updatedHistory = { ...prevState.historyLogs };
          const existingLog = updatedHistory[todayStr] || {
            date: todayStr,
            count: 0,
            malas: 0,
            hourlyCounts: {}
          };
          
          const currentHour = new Date().getHours();
          const nextHourlyCounts = { ...(existingLog.hourlyCounts || {}) };
          nextHourlyCounts[currentHour] = (nextHourlyCounts[currentHour] || 0) + unsynced;
          
          updatedHistory[todayStr] = {
            date: todayStr,
            count: nextTotalToday,
            malas: nextCompletedMalas,
            hourlyCounts: nextHourlyCounts
          };
          
          const updatedStreak = calculateStreak(updatedHistory, todayStr);
          
          const updatedBigGoals = prevState.bigGoals.map(goal => {
            if (!goal.completed) {
              const nextCurrent = Math.min(goal.target, goal.current + unsynced);
              return {
                ...goal,
                current: nextCurrent,
                completed: nextCurrent >= goal.target
              };
            }
            return goal;
          });
          
          const updatedState = evaluateBhaktiProgress({
            ...prevState,
            currentChantsInMala: nextChantsInMala,
            completedMalasToday: nextCompletedMalas,
            totalChantsToday: nextTotalToday,
            lifetimeTotalChants: nextLifetimeTotal,
            historyLogs: updatedHistory,
            streakDays: updatedStreak,
            bigGoals: updatedBigGoals
          });
          
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState)).then(() => {
            NaamJapWidgetModule.clearUnsyncedChants().then(() => {
              NaamJapWidgetModule.updateWidgetData(
                updatedState.totalChantsToday,
                updatedState.dailyGoalChants,
                updatedState.streakDays
              );
            });
          });
          
          return updatedState;
        });
      } else {
        if (stateRef.current) {
          NaamJapWidgetModule.updateWidgetData(
            stateRef.current.totalChantsToday,
            stateRef.current.dailyGoalChants,
            stateRef.current.streakDays
          );
        }
      }
    } catch (e) {
      console.warn('Failed to sync widget chants:', e);
    }
  };

  const purchaseStreakShield = async (): Promise<boolean> => {
    try {
      return new Promise<boolean>((resolve) => {
        setState(prevState => {
          if (!prevState || prevState.offeredFlowersCount < 10) {
            resolve(false);
            return prevState;
          }
          const nextFlowers = prevState.offeredFlowersCount - 10;
          const nextShields = (prevState.streakShields ?? 0) + 1;
          const updatedState = evaluateBhaktiProgress({
            ...prevState,
            offeredFlowersCount: nextFlowers,
            streakShields: nextShields
          });
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState)).then(() => {
            AsyncStorage.setItem('@naam_jap_altar_flowers_count_v2', nextFlowers.toString()).then(() => {
              const { NaamJapWidgetModule } = NativeModules;
              if (NaamJapWidgetModule) {
                NaamJapWidgetModule.updateWidgetData(
                  updatedState.totalChantsToday,
                  updatedState.dailyGoalChants,
                  updatedState.streakDays
                );
              }
              resolve(true);
            });
          });
          return updatedState;
        });
      });
    } catch (e) {
      console.warn('Failed to purchase streak shield', e);
      return false;
    }
  };

  useEffect(() => {
    const loadState = async () => {
      try {
        const rawJson = await AsyncStorage.getItem(STORAGE_KEY);
        const todayStr = getLocalDateString();
        
        if (rawJson) {
          const parsed = JSON.parse(rawJson) as AppState;
          
          // Schema Migration: Ensure all settings fields are initialized for existing stores
          parsed.streakShields = parsed.streakShields ?? 1; // Welcome gift of 1 shield
          parsed.bhaktiStage = parsed.bhaktiStage ?? 1;
          parsed.unlockedSamagri = parsed.unlockedSamagri ?? ['brass-diya', 'chandan-bowl'];
          parsed.selectedDiya = parsed.selectedDiya ?? 'brass-diya';
          parsed.selectedBell = parsed.selectedBell ?? 'none';
          parsed.chandanApplied = parsed.chandanApplied ?? false;
          parsed.sadhanaPatrikaLogs = parsed.sadhanaPatrikaLogs || {};
          
          parsed.sukritiBalance = parsed.sukritiBalance ?? 50;
          if (!parsed.sukritiTransactions || parsed.sukritiTransactions.length === 0) {
            parsed.sukritiTransactions = [
              {
                id: 'welcome',
                type: 'earn',
                amount: 50,
                reason: 'Welcome Blessing Reward 🪷',
                timestamp: getLocalDateTimeString()
              }
            ];
          }
          
          if (parsed.offeredFlowersCount === undefined) {
            const cachedFlowers = await AsyncStorage.getItem('@naam_jap_altar_flowers_count_v2');
            parsed.offeredFlowersCount = parseInt(cachedFlowers || '0') || 0;
          }

          const migratedParsed = evaluateBhaktiProgress(parsed);

          parsed.settings = {
            themeId: parsed.settings.themeId || 'saffron-divine',
            selectedMantra: parsed.settings.selectedMantra || 'Om Namo Narayanaya',
            beadDesign: parsed.settings.beadDesign || 'saffron-sphere',
            particleEffect: parsed.settings.particleEffect || 'float',
            counterStyle: parsed.settings.counterStyle || 'classic-3d',
            hapticEnabled: parsed.settings.hapticEnabled ?? true,
            soundEnabled: parsed.settings.soundEnabled ?? true,
            bounceEnabled: parsed.settings.bounceEnabled ?? true,
            parikramaEnabled: parsed.settings.parikramaEnabled ?? true,
            blessingsEnabled: parsed.settings.blessingsEnabled ?? true,
            sakhisEnabled: parsed.settings.sakhisEnabled ?? true,
            satsangEnabled: parsed.settings.satsangEnabled ?? true,
            celebrationEnabled: parsed.settings.celebrationEnabled ?? true,
            glowEffectsEnabled: parsed.settings.glowEffectsEnabled ?? true,
            progressRingEnabled: parsed.settings.progressRingEnabled ?? true,
            streakStatsEnabled: parsed.settings.streakStatsEnabled ?? true,
            dragPhysicsEnabled: parsed.settings.dragPhysicsEnabled ?? false,
            remindersEnabled: parsed.settings.remindersEnabled ?? false,
            reminderTime: parsed.settings.reminderTime || '04:30',
            customMantras: parsed.settings.customMantras || [],
            activeDashboardGoalId: parsed.settings.activeDashboardGoalId ?? 'daily',
            customNavTabs: parsed.settings.customNavTabs || ['Dashboard', 'Puja', 'RadhaJap'],
            marqueeEnabled: parsed.settings.marqueeEnabled ?? true,
            marqueeText: parsed.settings.marqueeText || 'राधे राधे, जपते रहिये! 📿',
            marqueeDirection: parsed.settings.marqueeDirection || 'rtl'
          };
          
          if (parsed.lastActiveDate !== todayStr) {
            const updatedLogs = { ...parsed.historyLogs };
            
            if (parsed.lastActiveDate && !updatedLogs[parsed.lastActiveDate]) {
              updatedLogs[parsed.lastActiveDate] = {
                date: parsed.lastActiveDate,
                count: parsed.totalChantsToday,
                malas: parsed.completedMalasToday
              };
            }

            // Consume shields for missed days
            let shieldsRemaining = parsed.streakShields ?? 0;
            if (parsed.lastActiveDate) {
              const [partsYear, partsMonth, partsDay] = parsed.lastActiveDate.split('-').map(Number);
              let currentDate = new Date(partsYear, partsMonth - 1, partsDay);
              currentDate.setDate(currentDate.getDate() + 1);
              
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = getLocalDateString(yesterday);
              
              while (getLocalDateString(currentDate) <= yesterdayStr) {
                const missedDayStr = getLocalDateString(currentDate);
                if (shieldsRemaining > 0) {
                  shieldsRemaining--;
                  updatedLogs[missedDayStr] = {
                    date: missedDayStr,
                    count: 0,
                    malas: 0,
                    isShielded: true
                  };
                }
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }

            const newStreak = calculateStreak(updatedLogs, todayStr);

            const resetBigGoals = (migratedParsed.bigGoals || []).map(goal => {
              if (goal.type === 'daily') {
                const lastReset = goal.lastResetDate || goal.startDate;
                if (parsed.lastActiveDate && lastReset !== todayStr) {
                  const history = goal.history || {};
                  history[parsed.lastActiveDate] = {
                    target: goal.target,
                    current: goal.current,
                    completed: goal.current >= goal.target
                  };
                  return {
                    ...goal,
                    current: 0,
                    completed: false,
                    history,
                    lastResetDate: todayStr
                  };
                }
              }
              return goal;
            });

            const newState = evaluateBhaktiProgress({
              ...migratedParsed,
              bigGoals: resetBigGoals,
              currentChantsInMala: 0,
              completedMalasToday: 0,
              totalChantsToday: 0,
              streakDays: newStreak,
              streakShields: shieldsRemaining,
              lastActiveDate: todayStr,
              historyLogs: updatedLogs
            });
            
            setState(newState);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            
            setTimeout(() => {
              syncWidgetChants();
            }, 200);
          } else {
            setState(migratedParsed);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedParsed));
            
            setTimeout(() => {
              syncWidgetChants();
            }, 200);
          }
        } else {
          const mockHistory = seedMockData();
          const newStreak = calculateStreak(mockHistory, todayStr);
          const initialLifetimeTotal = Object.values(mockHistory).reduce((sum, log) => sum + log.count, 0);

          const initialBigGoals: BigGoal[] = [
            {
              id: '1',
              name: 'Shradhanjali 50K Milestone',
              target: 50000,
              current: 12500,
              startDate: '2026-06-01',
              targetDate: '2026-07-15',
              completed: false
            },
            {
              id: '2',
              name: '11 Malas Daily Streak Goal',
              target: 11880,
              current: 4320,
              startDate: '2026-06-05',
              targetDate: '2026-06-20',
              completed: false
            }
          ];

          const defaultState: AppState = {
            currentChantsInMala: 0,
            completedMalasToday: 0,
            totalChantsToday: 0,
            dailyGoalChants: 1080,
            lifetimeTotalChants: initialLifetimeTotal,
            streakDays: newStreak,
            streakShields: 1, // Welcome gift of 1 shield
            bhaktiStage: 1,
            unlockedSamagri: ['brass-diya', 'chandan-bowl'],
            selectedDiya: 'brass-diya',
            selectedBell: 'none',
            chandanApplied: false,
            offeredFlowersCount: 0,
            lastActiveDate: todayStr,
            historyLogs: mockHistory,
            bigGoals: initialBigGoals,
            sadhanaPatrikaLogs: {},
            sukritiBalance: 50,
            sukritiTransactions: [
              {
                id: 'welcome',
                type: 'earn',
                amount: 50,
                reason: 'Welcome Blessing Reward 🪷',
                timestamp: getLocalDateTimeString()
              }
            ],
            settings: {
              hapticEnabled: true,
              soundEnabled: true,
              bounceEnabled: true,
              parikramaEnabled: true,
              blessingsEnabled: true,
              sakhisEnabled: true,
              satsangEnabled: true,
              celebrationEnabled: true,
              glowEffectsEnabled: true,
              progressRingEnabled: true,
              streakStatsEnabled: true,
              dragPhysicsEnabled: false,
              remindersEnabled: false,
              reminderTime: '04:30',
              customMantras: [],
              themeId: 'saffron-divine',
              selectedMantra: 'Om Namo Narayanaya',
              beadDesign: 'saffron-sphere',
              particleEffect: 'float',
              counterStyle: 'classic-3d',
              activeDashboardGoalId: 'daily',
              customNavTabs: ['Dashboard', 'Puja', 'RadhaJap'],
              marqueeEnabled: true,
              marqueeText: 'राधे राधे, जपते रहिये! 📿',
              marqueeDirection: 'rtl'
            }
          };
          
          const evaluatedDefault = evaluateBhaktiProgress(defaultState);
          setState(evaluatedDefault);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(evaluatedDefault));
          
          setTimeout(() => {
            syncWidgetChants();
          }, 200);
        }
      } catch (e) {
        console.error('Failed to load storage state', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadState();

    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        syncWidgetChants();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (pendingSaveStateRef.current) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSaveStateRef.current)).catch(() => {});
          pendingSaveStateRef.current = null;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const saveState = async (updated: AppState) => {
    setState(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  };

  const incrementChant = () => {
    return new Promise<{ hitMalaComplete: boolean; hitDailyGoal: boolean; hitBigGoal: boolean }>((resolve) => {
      setState(prevState => {
        if (!prevState) {
          resolve({ hitMalaComplete: false, hitDailyGoal: false, hitBigGoal: false });
          return prevState;
        }

        const todayStr = getLocalDateString();
        let nextChantsInMala = prevState.currentChantsInMala + 1;
        let nextCompletedMalas = prevState.completedMalasToday;
        let hitMalaComplete = false;

        const now = Date.now();
        if (prevState.settings.hapticEnabled && (now - lastVibrationTimeRef.current > 120)) {
          Vibration.vibrate(30); // reduced duration slightly to 30ms for snappier feel
          lastVibrationTimeRef.current = now;
        }

        if (nextChantsInMala >= 108) {
          nextChantsInMala = 0;
          nextCompletedMalas += 1;
          hitMalaComplete = true;

          if (prevState.settings.hapticEnabled) {
            Vibration.vibrate([0, 150, 100, 150, 100, 350]);
          }
        }

        const oldTotalToday = prevState.totalChantsToday;
        const nextTotalToday = prevState.totalChantsToday + 1;
        const nextLifetimeTotal = prevState.lifetimeTotalChants + 1;

        // Check if daily goal is hit for the first time today
        const hitDailyGoal = oldTotalToday < prevState.dailyGoalChants && nextTotalToday >= prevState.dailyGoalChants;

        const updatedHistory = { ...prevState.historyLogs };
        const existingLog = updatedHistory[todayStr] || {
          date: todayStr,
          count: 0,
          malas: 0,
          hourlyCounts: {}
        };
        
        const currentHour = new Date().getHours();
        const nextHourlyCounts = { ...(existingLog.hourlyCounts || {}) };
        nextHourlyCounts[currentHour] = (nextHourlyCounts[currentHour] || 0) + 1;

        updatedHistory[todayStr] = {
          date: todayStr,
          count: nextTotalToday,
          malas: nextCompletedMalas,
          hourlyCounts: nextHourlyCounts
        };

        const updatedStreak = oldTotalToday === 0 ? calculateStreak(updatedHistory, todayStr) : prevState.streakDays;

        let hitBigGoal = false;
        const updatedBigGoals = prevState.bigGoals.map(goal => {
          if (goal.type === 'daily') {
            const nextCurrent = goal.current + 1;
            const wasCompleted = goal.completed;
            const isCompleted = nextCurrent >= goal.target;
            if (isCompleted && !wasCompleted) {
              hitBigGoal = true;
            }
            return {
              ...goal,
              current: nextCurrent,
              completed: isCompleted
            };
          } else {
            if (!goal.completed) {
              const nextCurrent = goal.current + 1;
              const isCompleted = nextCurrent >= goal.target;
              if (isCompleted) {
                hitBigGoal = true;
              }
              return {
                ...goal,
                current: nextCurrent,
                completed: isCompleted
              };
            }
            return goal;
          }
        });

        let earnedPoints = 0;
        const newTxs: SukritiTransaction[] = [];
        
        if (hitMalaComplete) {
          earnedPoints += 1;
          newTxs.push({
            id: 'mala-' + Date.now() + Math.random().toString().substring(2, 6),
            type: 'earn',
            amount: 1,
            reason: 'Completed 1 Mala (108 chants) 📿',
            timestamp: getLocalDateTimeString()
          });
        }
        
        if (hitDailyGoal) {
          earnedPoints += 10;
          newTxs.push({
            id: 'daily-' + Date.now() + Math.random().toString().substring(2, 6),
            type: 'earn',
            amount: 10,
            reason: 'Achieved Daily Chanting Sankalpa 🌟',
            timestamp: getLocalDateTimeString()
          });
        }
        
        if (hitBigGoal) {
          earnedPoints += 50;
          newTxs.push({
            id: 'big-' + Date.now() + Math.random().toString().substring(2, 6),
            type: 'earn',
            amount: 50,
            reason: 'Accomplished Spiritual Vow Milestone 🏆',
            timestamp: getLocalDateTimeString()
          });
        }

        const nextSukritiBalance = (prevState.sukritiBalance ?? 50) + earnedPoints;
        const nextSukritiTransactions = newTxs.length > 0 
          ? [...newTxs, ...(prevState.sukritiTransactions || [])]
          : (prevState.sukritiTransactions || []);

        const updatedState = evaluateBhaktiProgress({
          ...prevState,
          currentChantsInMala: nextChantsInMala,
          completedMalasToday: nextCompletedMalas,
          totalChantsToday: nextTotalToday,
          lifetimeTotalChants: nextLifetimeTotal,
          historyLogs: updatedHistory,
          streakDays: updatedStreak,
          bigGoals: updatedBigGoals,
          lastActiveDate: todayStr,
          sukritiBalance: nextSukritiBalance,
          sukritiTransactions: nextSukritiTransactions
        });

        // Debounce storage writes to avoid UI thread lag
        pendingSaveStateRef.current = updatedState;
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          if (pendingSaveStateRef.current) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSaveStateRef.current)).catch(e => {
              console.error('Failed to save state to storage', e);
            });
            pendingSaveStateRef.current = null;
          }
        }, 1000);

        resolve({ hitMalaComplete, hitDailyGoal, hitBigGoal });
        return updatedState;
      });
    });
  };

  const resetMalaCounter = async () => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      currentChantsInMala: 0
    };
    await saveState(updatedState);
  };

  const setDailyGoal = async (targetChants: number) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      dailyGoalChants: targetChants
    };
    await saveState(updatedState);
  };

  const addBigGoal = async (name: string, target: number, targetDate: string, type: 'one-time' | 'daily' = 'one-time') => {
    if (!state) return;
    const newGoal: BigGoal = {
      id: Date.now().toString(),
      name,
      target,
      current: 0,
      startDate: getLocalDateString(),
      targetDate,
      completed: false,
      type,
      history: {},
      lastResetDate: getLocalDateString()
    };

    const updatedState: AppState = {
      ...state,
      bigGoals: [...state.bigGoals, newGoal]
    };
    await saveState(updatedState);
  };

  const deleteBigGoal = async (id: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      bigGoals: state.bigGoals.filter(g => g.id !== id)
    };
    await saveState(updatedState);
  };

  const toggleSetting = async (key: 'hapticEnabled' | 'soundEnabled' | 'bounceEnabled' | 'parikramaEnabled' | 'blessingsEnabled' | 'sakhisEnabled' | 'satsangEnabled' | 'celebrationEnabled' | 'glowEffectsEnabled' | 'progressRingEnabled' | 'streakStatsEnabled' | 'dragPhysicsEnabled' | 'remindersEnabled' | 'marqueeEnabled') => {
    if (!state) return;
    const updatedSettings = {
      ...state.settings,
      [key]: !state.settings[key]
    };
 
    const updatedState: AppState = {
      ...state,
      settings: updatedSettings
    };
    await saveState(updatedState);
  };

  const addCustomMantra = async (mantra: string) => {
    if (!state || !mantra.trim()) return;
    const cleaned = mantra.trim();
    if (state.settings.customMantras.includes(cleaned)) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        customMantras: [...state.settings.customMantras, cleaned]
      }
    };
    await saveState(updatedState);
  };

  const deleteCustomMantra = async (mantra: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        customMantras: state.settings.customMantras.filter(m => m !== mantra),
        selectedMantra: state.settings.selectedMantra === mantra ? 'Om Namo Narayanaya' : state.settings.selectedMantra
      }
    };
    await saveState(updatedState);
  };

  const setReminderTime = async (reminderTime: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        reminderTime
      }
    };
    await saveState(updatedState);
  };

  const setThemeId = async (themeId: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        themeId
      }
    };
    await saveState(updatedState);
  };

  const setMarqueeText = async (marqueeText: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        marqueeText
      }
    };
    await saveState(updatedState);
  };

  const setMarqueeDirection = async (marqueeDirection: 'ltr' | 'rtl') => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        marqueeDirection
      }
    };
    await saveState(updatedState);
  };

  const setActiveDashboardGoal = async (goalId: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        activeDashboardGoalId: goalId
      }
    };
    await saveState(updatedState);
  };

  const setSelectedMantra = async (selectedMantra: string) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        selectedMantra
      }
    };
    await saveState(updatedState);
  };

  const setBeadDesign = async (beadDesign: 'saffron-sphere' | 'rudraksha' | 'lotus' | 'sphatik' | 'gold-chakra' | 'tulsi') => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        beadDesign
      }
    };
    await saveState(updatedState);
  };

  const setParticleEffect = async (particleEffect: 'none' | 'float' | 'drop' | 'expand' | 'spin') => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        particleEffect
      }
    };
    await saveState(updatedState);
  };

  const setCounterStyle = async (counterStyle: CounterStyle) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        counterStyle
      }
    };
    await saveState(updatedState);
  };

  const offerFlowerToDeity = () => {
    return new Promise<void>((resolve) => {
      setState(prevState => {
        if (!prevState) {
          resolve();
          return prevState;
        }
        const nextCount = prevState.offeredFlowersCount + 1;
        
        const updatedState = evaluateBhaktiProgress({
          ...prevState,
          offeredFlowersCount: nextCount
        });
        
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState)).catch(e => {});
        AsyncStorage.setItem('@naam_jap_altar_flowers_count_v2', nextCount.toString()).catch(e => {});
        
        resolve();
        return updatedState;
      });
    });
  };

  const setDiyaStyle = async (style: 'brass-diya' | 'silver-diya' | 'gold-diya') => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      selectedDiya: style
    };
    await saveState(updatedState);
  };

  const setBellStyle = async (style: 'none' | 'silver-bell' | 'gold-bell') => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      selectedBell: style
    };
    await saveState(updatedState);
  };

  const applyChandanTilak = async (applied: boolean) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      chandanApplied: applied
    };
    await saveState(updatedState);
  };

  const updateSadhanaPatrika = async (date: string, data: {
    wokeUpBrahmaMuhurta: boolean;
    readScriptures: boolean;
    scriptureDuration: number;
    naamLekhanCount: number;
    diaryNote: string;
  }) => {
    if (!state) return;
    const oldLog = state.sadhanaPatrikaLogs?.[date] || {
      wokeUpBrahmaMuhurta: false,
      readScriptures: false,
      scriptureDuration: 0,
      naamLekhanCount: 0,
      diaryNote: ''
    };

    let earnedPoints = 0;
    const newTxs: SukritiTransaction[] = [];

    // 1. Brahma Muhurta Wakeup check
    if (!oldLog.wokeUpBrahmaMuhurta && data.wokeUpBrahmaMuhurta) {
      earnedPoints += 5;
      newTxs.push({
        id: `brahma-${date}-${Date.now()}`,
        type: 'earn',
        amount: 5,
        reason: `Brahma Muhurta Wakeup logged for ${date} 🌅`,
        timestamp: getLocalDateTimeString()
      });
    }

    // 2. Scripture Study check
    if (!oldLog.readScriptures && data.readScriptures) {
      earnedPoints += 5;
      newTxs.push({
        id: `scripture-${date}-${Date.now()}`,
        type: 'earn',
        amount: 5,
        reason: `Scripture Study logged for ${date} 📖`,
        timestamp: getLocalDateTimeString()
      });
    }

    // 3. Written Chants (Naam Lekhan) 108 limit check
    const reachedGoalNow = data.naamLekhanCount >= 108;
    const reachedGoalBefore = oldLog.naamLekhanCount >= 108;
    if (!reachedGoalBefore && reachedGoalNow) {
      earnedPoints += 5;
      newTxs.push({
        id: `naamlekhan-${date}-${Date.now()}`,
        type: 'earn',
        amount: 5,
        reason: `Completed 108 Written Chants (Naam Lekhan) on ${date} ✍️`,
        timestamp: getLocalDateTimeString()
      });
    }

    const updatedLogs = { ...(state.sadhanaPatrikaLogs || {}) };
    updatedLogs[date] = {
      date,
      ...data
    };

    const nextBalance = (state.sukritiBalance ?? 50) + earnedPoints;
    const nextTransactions = newTxs.length > 0
      ? [...newTxs, ...(state.sukritiTransactions || [])]
      : (state.sukritiTransactions || []);

    const updatedState: AppState = {
      ...state,
      sadhanaPatrikaLogs: updatedLogs,
      sukritiBalance: nextBalance,
      sukritiTransactions: nextTransactions
    };
    await saveState(updatedState);
  };

  const buyStreakShieldWithSukriti = async (): Promise<boolean> => {
    const cost = 50;
    return new Promise<boolean>((resolve) => {
      setState(prevState => {
        if (!prevState || (prevState.sukritiBalance ?? 0) < cost) {
          resolve(false);
          return prevState;
        }
        const nextBalance = (prevState.sukritiBalance ?? 0) - cost;
        const nextShields = (prevState.streakShields ?? 0) + 1;
        const newTx: SukritiTransaction = {
          id: 'buy-shield-' + Date.now() + Math.random().toString().substring(2, 6),
          type: 'spend',
          amount: cost,
          reason: 'Purchased Streak Shield 🛡️',
          timestamp: getLocalDateTimeString()
        };
        const updatedState = {
          ...prevState,
          sukritiBalance: nextBalance,
          streakShields: nextShields,
          sukritiTransactions: [newTx, ...(prevState.sukritiTransactions || [])]
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState)).then(() => {
          resolve(true);
        });
        return updatedState;
      });
    });
  };

  const buyPujaItem = async (itemId: string, cost: number, itemName: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState(prevState => {
        if (!prevState || (prevState.sukritiBalance ?? 0) < cost) {
          resolve(false);
          return prevState;
        }
        const unlocked = [...(prevState.unlockedSamagri || [])];
        if (unlocked.includes(itemId)) {
          resolve(false);
          return prevState;
        }
        unlocked.push(itemId);
        const nextBalance = (prevState.sukritiBalance ?? 0) - cost;
        const newTx: SukritiTransaction = {
          id: 'buy-item-' + Date.now() + Math.random().toString().substring(2, 6),
          type: 'spend',
          amount: cost,
          reason: `Unlocked Altar Item: ${itemName} 🪷`,
          timestamp: getLocalDateTimeString()
        };
        const updatedState = evaluateBhaktiProgress({
          ...prevState,
          sukritiBalance: nextBalance,
          unlockedSamagri: unlocked,
          sukritiTransactions: [newTx, ...(prevState.sukritiTransactions || [])]
        });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState)).then(() => {
          resolve(true);
        });
        return updatedState;
      });
    });
  };

  const setCustomNavTabs = async (tabs: string[]) => {
    if (!state) return;
    const updatedState: AppState = {
      ...state,
      settings: {
        ...state.settings,
        customNavTabs: tabs
      }
    };
    await saveState(updatedState);
  };

  const clearAllData = async () => {
    const todayStr = getLocalDateString();
    const defaultState: AppState = {
      currentChantsInMala: 0,
      completedMalasToday: 0,
      totalChantsToday: 0,
      dailyGoalChants: 1080,
      lifetimeTotalChants: 0,
      streakDays: 0,
      streakShields: 1, // Welcome gift of 1 shield
      bhaktiStage: 1,
      unlockedSamagri: ['brass-diya', 'chandan-bowl'],
      selectedDiya: 'brass-diya',
      selectedBell: 'none',
      chandanApplied: false,
      offeredFlowersCount: 0,
      lastActiveDate: todayStr,
      historyLogs: {},
      bigGoals: [],
      sadhanaPatrikaLogs: {},
      sukritiBalance: 50,
      sukritiTransactions: [
        {
          id: 'welcome',
          type: 'earn',
          amount: 50,
          reason: 'Welcome Blessing Reward 🪷',
          timestamp: getLocalDateTimeString()
        }
      ],
      settings: {
        hapticEnabled: true,
        soundEnabled: true,
        bounceEnabled: true,
        parikramaEnabled: true,
        blessingsEnabled: true,
        sakhisEnabled: true,
        satsangEnabled: true,
        celebrationEnabled: true,
        glowEffectsEnabled: true,
        progressRingEnabled: true,
        streakStatsEnabled: true,
        dragPhysicsEnabled: false,
        remindersEnabled: false,
        reminderTime: '04:30',
        customMantras: [],
        themeId: 'saffron-divine',
        selectedMantra: 'Om Namo Narayanaya',
        beadDesign: 'saffron-sphere',
        particleEffect: 'float',
        counterStyle: 'classic-3d',
        activeDashboardGoalId: 'daily',
        customNavTabs: ['Dashboard', 'Puja', 'RadhaJap'],
        marqueeEnabled: true,
        marqueeText: 'राधे राधे, जपते रहिये! 📿',
        marqueeDirection: 'rtl'
      }
    };
    await saveState(defaultState);
  };

  return {
    state,
    loading,
    incrementChant,
    resetMalaCounter,
    setDailyGoal,
    addBigGoal,
    deleteBigGoal,
    toggleSetting,
    setThemeId,
    setSelectedMantra,
    setBeadDesign,
    setParticleEffect,
    setCounterStyle,
    addCustomMantra,
    deleteCustomMantra,
    setReminderTime,
    clearAllData,
    purchaseStreakShield,
    syncWidgetChants,
    offerFlowerToDeity,
    setDiyaStyle,
    setBellStyle,
    applyChandanTilak,
    updateSadhanaPatrika,
    setActiveDashboardGoal,
    buyStreakShieldWithSukriti,
    buyPujaItem,
    setCustomNavTabs,
    setMarqueeText,
    setMarqueeDirection
  };
};
