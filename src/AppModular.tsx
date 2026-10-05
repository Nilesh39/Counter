import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Platform,
  StatusBar,
  NativeModules,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Flame, Sparkles, Target, BarChart2, Settings as SettingsIcon, X, Award, BookOpen, Coins, Heart } from 'lucide-react-native';
import { useJapStorage } from './hooks/useJapStorage';
import FloatingNavBar from './components/FloatingNavBar';
import DashboardScreen from './screens/DashboardScreen';
import ParikramaScreen from './screens/ParikramaScreen';
import PujaScreen from './screens/PujaScreen';
import GoalsScreen from './screens/GoalsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import BhaktiMargScreen from './screens/BhaktiMargScreen';
import SadhanaScreen from './screens/SadhanaScreen';
import PassbookScreen from './screens/PassbookScreen';
import RadhaJapScreen from './screens/RadhaJapScreen';
import { THEMES } from './theme/themes';

export default function AppModular() {
  const {
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
  } = useJapStorage();

  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleSetTab = useCallback((tab: string) => {
    if (tab === 'Menu') {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
      setActiveTab(tab);
    }
  }, []);

  const activeTheme = state ? (THEMES[state.settings.themeId] || THEMES['saffron-divine']) : THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;

  // Sync status bar theme based on settings
  useEffect(() => {
    if (state) {
      StatusBar.setBarStyle(
        activeTheme.isDark ? 'light-content' : 'dark-content'
      );
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(activeTheme.colors.background);
      }
    }
  }, [state?.settings.themeId, activeTheme]);

  // Sync Android Home Screen Widget on state changes (throttled to avoid IPC/broadcast thrashing on rapid taps)
  const lastWidgetSyncRef = useRef<number>(0);
  const widgetTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (state && Platform.OS === 'android') {
      const { NaamJapWidgetModule } = NativeModules;
      if (!NaamJapWidgetModule) return;

      const now = Date.now();
      if (now - lastWidgetSyncRef.current > 1500 || state.totalChantsToday % 10 === 0) {
        lastWidgetSyncRef.current = now;
        NaamJapWidgetModule.updateWidgetData(
          state.totalChantsToday,
          state.dailyGoalChants,
          state.streakDays
        );
      } else {
        if (widgetTimeoutRef.current) clearTimeout(widgetTimeoutRef.current);
        widgetTimeoutRef.current = setTimeout(() => {
          lastWidgetSyncRef.current = Date.now();
          NaamJapWidgetModule.updateWidgetData(
            state.totalChantsToday,
            state.dailyGoalChants,
            state.streakDays
          );
        }, 1500);
      }
    }
  }, [state?.totalChantsToday, state?.dailyGoalChants, state?.streakDays]);

  if (loading || !state) {
    return (
      <SafeAreaView className="flex-1 bg-[#1C1714] items-center justify-center">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full border-4 border-orange-500/30 border-t-orange-500 items-center justify-center animate-spin mb-6">
            <Sparkles size={36} color="#EA580C" />
          </View>
          <Text className="text-[#FDFBF7] text-xl font-bold tracking-widest uppercase">
            Naam Jap
          </Text>
          <Text className="text-orange-200/60 text-xs tracking-wide uppercase mt-1">
            Modular Scaled Mode
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get localized header titles for tabs
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'Goals':
        return 'Spiritual Vows';
      case 'Analytics':
        return 'Jap Analytics';
      case 'BhaktiMarg':
        return 'Bhakti Marg';
      case 'Sadhana':
        return 'Sadhana Patrika';
      case 'Passbook':
        return 'Bhakti Passbook';
      case 'RadhaJap':
        return '11 Crore Radha Jap';
      default:
        return activeTab;
    }
  };

  return (
    <SafeAreaView 
      className="flex-1"
      style={{
        backgroundColor: activeTheme.colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
      }}
    >
      <StatusBar />
      
      {/* Header Bar */}
      <View 
        className="flex-row justify-between items-center px-6 py-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: activeTheme.colors.cardBorder
        }}
      >
        <View>
          <Text style={{ color: activeTheme.colors.accent }} className="text-xs uppercase tracking-widest font-extrabold">
            Om Namo Narayanaya
          </Text>
          <Text style={{ color: activeTheme.colors.textPrimary }} className="text-2xl font-extrabold">
            {getHeaderTitle()}
          </Text>
        </View>
        
        {/* Streak indicator on top-right */}
        <View 
          style={{ backgroundColor: activeTheme.colors.accent + '1A', borderColor: activeTheme.colors.accent + '33' }} 
          className="flex-row items-center px-3 py-1.5 rounded-full border"
        >
          <Flame size={14} color={activeTheme.colors.accent} fill={activeTheme.colors.accent} />
          <Text style={{ color: activeTheme.colors.accent }} className="text-xs font-extrabold ml-1.5">
            {state.streakDays}d Streak
          </Text>
        </View>
      </View>

      {/* Main Screen Content */}
      <View className="flex-1">
        {activeTab === 'Dashboard' && (
          <DashboardScreen
            state={state}
            increment={incrementChant}
            resetMala={resetMalaCounter}
            setDailyGoal={setDailyGoal}
            setTab={setActiveTab}
            setActiveDashboardGoal={setActiveDashboardGoal}
          />
        )}
        {activeTab === 'Parikrama' && (
          <ParikramaScreen
            state={state}
          />
        )}
        {activeTab === 'Puja' && (
          <PujaScreen
            state={state}
            purchaseStreakShield={purchaseStreakShield}
            offerFlower={offerFlowerToDeity}
            setDiyaStyle={setDiyaStyle}
            setBellStyle={setBellStyle}
            applyChandanTilak={applyChandanTilak}
          />
        )}
        {activeTab === 'BhaktiMarg' && (
          <BhaktiMargScreen
            state={state}
          />
        )}
        {activeTab === 'Sadhana' && (
          <SadhanaScreen
            state={state}
            updateSadhanaPatrika={updateSadhanaPatrika}
          />
        )}
        {activeTab === 'Goals' && (
          <GoalsScreen
            state={state}
            addGoal={addBigGoal}
            deleteGoal={deleteBigGoal}
            setActiveDashboardGoal={setActiveDashboardGoal}
          />
        )}
        {activeTab === 'Analytics' && (
          <AnalyticsScreen
            state={state}
          />
        )}
        {activeTab === 'Settings' && (
          <SettingsScreen
            state={state}
            toggleSetting={toggleSetting}
            setThemeId={setThemeId}
            setSelectedMantra={setSelectedMantra}
            setBeadDesign={setBeadDesign}
            setParticleEffect={setParticleEffect}
            setCounterStyle={setCounterStyle}
            addCustomMantra={addCustomMantra}
            deleteCustomMantra={deleteCustomMantra}
            setReminderTime={setReminderTime}
            clearAll={clearAllData}
            setCustomNavTabs={setCustomNavTabs}
            setMarqueeText={setMarqueeText}
            setMarqueeDirection={setMarqueeDirection}
          />
        )}
        {activeTab === 'Passbook' && (
          <PassbookScreen
            state={state}
            buyStreakShieldWithSukriti={buyStreakShieldWithSukriti}
            buyPujaItem={buyPujaItem}
          />
        )}
        {activeTab === 'RadhaJap' && (
          <RadhaJapScreen
            state={state}
          />
        )}
      </View>

      {/* Floating Pill Nav Bar */}
      <FloatingNavBar
        currentTab={activeTab}
        setTab={handleSetTab}
        themeId={state.settings.themeId}
        customNavTabs={state.settings.customNavTabs}
      />

      {/* Slide-Up Bottom Drawer Sheet for Menu Options */}
      <Modal
        transparent={true}
        visible={isMenuOpen}
        animationType="slide"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View 
                style={[
                  styles.sheetContainer,
                  { 
                    backgroundColor: activeTheme.colors.cardBackground, 
                    borderColor: activeTheme.colors.cardBorder 
                  }
                ]}
              >
                {/* Drag Handle Bar */}
                <View 
                  style={[
                    styles.dragHandle, 
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                  ]} 
                />
                
                {/* Drawer Header */}
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: activeTheme.colors.textPrimary }]}>
                    More Options
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setIsMenuOpen(false)} 
                    style={[
                      styles.closeButton, 
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                    ]}
                  >
                    <X size={16} color={activeTheme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Grid layout containing Goals, Analytics, and Settings */}
                <View style={styles.menuGrid}>
                  
                  {/* Bhakti Marg */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('BhaktiMarg');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#fbbf241A', 
                          borderColor: activeTab === 'BhaktiMarg' ? '#fbbf24' : 'transparent',
                          borderWidth: activeTab === 'BhaktiMarg' ? 2 : 0
                        }
                      ]}
                    >
                      <Award size={24} color="#fbbf24" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Bhakti Marg
                    </Text>
                  </TouchableOpacity>

                  {/* Sadhana Patrika */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('Sadhana');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#ec48991A', 
                          borderColor: activeTab === 'Sadhana' ? '#ec4899' : 'transparent',
                          borderWidth: activeTab === 'Sadhana' ? 2 : 0
                        }
                      ]}
                    >
                      <BookOpen size={24} color="#ec4899" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Sadhana Patrika
                    </Text>
                  </TouchableOpacity>

                  {/* Goals */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('Goals');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#f59e0b1A', 
                          borderColor: activeTab === 'Goals' ? '#f59e0b' : 'transparent',
                          borderWidth: activeTab === 'Goals' ? 2 : 0
                        }
                      ]}
                    >
                      <Target size={24} color="#f59e0b" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Spiritual Vows
                    </Text>
                  </TouchableOpacity>

                  {/* Analytics */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('Analytics');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#10b9811A', 
                          borderColor: activeTab === 'Analytics' ? '#10b981' : 'transparent',
                          borderWidth: activeTab === 'Analytics' ? 2 : 0
                        }
                      ]}
                    >
                      <BarChart2 size={24} color="#10b981" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Stats & Charts
                    </Text>
                  </TouchableOpacity>

                  {/* Settings */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('Settings');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#3b82f61A', 
                          borderColor: activeTab === 'Settings' ? '#3b82f6' : 'transparent',
                          borderWidth: activeTab === 'Settings' ? 2 : 0
                        }
                      ]}
                    >
                      <SettingsIcon size={24} color="#3b82f6" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Settings
                    </Text>
                  </TouchableOpacity>

                  {/* Bhakti Passbook */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('Passbook');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#fbbf241A', 
                          borderColor: activeTab === 'Passbook' ? '#fbbf24' : 'transparent',
                          borderWidth: activeTab === 'Passbook' ? 2 : 0
                        }
                      ]}
                    >
                      <Coins size={24} color="#fbbf24" />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      Passbook
                    </Text>
                  </TouchableOpacity>

                  {/* 11 Crore Radha Jap */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('RadhaJap');
                      setIsMenuOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View 
                      style={[
                        styles.iconCircle, 
                        { 
                          backgroundColor: '#ec48991A', 
                          borderColor: activeTab === 'RadhaJap' ? '#ec4899' : 'transparent',
                          borderWidth: activeTab === 'RadhaJap' ? 2 : 0
                        }
                      ]}
                    >
                      <Heart size={24} color="#ec4899" fill={activeTab === 'RadhaJap' ? '#ec4899' : 'transparent'} />
                    </View>
                    <Text style={[styles.menuItemLabel, { color: activeTheme.colors.textPrimary }]}>
                      11 Crore
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 24,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    padding: 6,
    borderRadius: 99,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  menuItem: {
    alignItems: 'center',
    width: 90,
    marginVertical: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
