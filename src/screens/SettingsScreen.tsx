import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Share,
  Vibration,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions
} from 'react-native';
import {
  Palette,
  Volume2,
  Compass,
  Sparkles,
  Clock,
  Award,
  Info,
  Share2,
  ChevronRight,
  Plus,
  X,
  VolumeX,
  Shield,
  Settings
} from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import {
  requestPermissionsAsync,
  scheduleDailyReminderAsync,
  cancelAllRemindersAsync
} from '../utils/notifications';
import { AppState, CounterStyle } from '../types';
import { THEMES } from '../theme/themes';

interface SettingsScreenProps {
  state: AppState;
  toggleSetting: (k: 'hapticEnabled' | 'soundEnabled' | 'bounceEnabled' | 'parikramaEnabled' | 'blessingsEnabled' | 'sakhisEnabled' | 'satsangEnabled' | 'celebrationEnabled' | 'glowEffectsEnabled' | 'progressRingEnabled' | 'streakStatsEnabled' | 'dragPhysicsEnabled' | 'remindersEnabled' | 'marqueeEnabled') => void;
  setThemeId: (themeId: string) => void;
  setSelectedMantra: (mantra: string) => void;
  setBeadDesign: (beadDesign: 'saffron-sphere' | 'rudraksha' | 'lotus' | 'sphatik' | 'gold-chakra' | 'tulsi') => void;
  setParticleEffect: (particleEffect: 'none' | 'float' | 'drop' | 'expand' | 'spin') => void;
  setCounterStyle: (counterStyle: CounterStyle) => void;
  addCustomMantra: (mantra: string) => void;
  deleteCustomMantra: (mantra: string) => void;
  setReminderTime: (time: string) => void;
  clearAll: () => void;
  setCustomNavTabs: (tabs: string[]) => void;
  setMarqueeText: (text: string) => void;
  setMarqueeDirection: (dir: 'ltr' | 'rtl') => void;
}

type ModalType = 'theme' | 'bead' | 'counter' | 'mantra' | 'feedback' | 'reminders' | 'marquee' | 'features' | 'profile' | null;

// Render bead previews inside modal
const renderBeadPreview = (beadDesign: string, size = 30) => {
  switch (beadDesign) {
    case 'saffron-sphere':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="16" fill="url(#saffronGrad)" />
          <Defs>
            <RadialGradient id="saffronGrad" cx="30%" cy="30%" rx="70%" ry="70%">
              <Stop offset="0%" stopColor="#ffedd5" />
              <Stop offset="50%" stopColor="#f97316" />
              <Stop offset="100%" stopColor="#7c2d12" />
            </RadialGradient>
          </Defs>
        </Svg>
      );
    case 'rudraksha':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="16" fill="#8c583a" />
          <Path d="M 20 4 Q 24 20, 20 36 M 20 4 Q 16 20, 20 36 M 4 20 Q 20 24, 36 20 M 4 20 Q 20 16, 36 20" stroke="#5c3a21" strokeWidth="2.2" fill="none" />
          <Circle cx="20" cy="20" r="13" fill="none" stroke="#3d2211" strokeWidth="1" opacity={0.3} />
        </Svg>
      );
    case 'tulsi':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="15" fill="url(#tulsiGrad)" />
          <Circle cx="20" cy="20" r="15" fill="none" stroke="#653b1b" strokeWidth="0.8" />
          <Defs>
            <RadialGradient id="tulsiGrad" cx="35%" cy="35%" rx="65%" ry="65%">
              <Stop offset="0%" stopColor="#f5e6d3" />
              <Stop offset="70%" stopColor="#d2b48c" />
              <Stop offset="100%" stopColor="#8b5a2b" />
            </RadialGradient>
          </Defs>
        </Svg>
      );
    case 'lotus':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="16" fill="#f43f5e" opacity={0.2} />
          <Path d="M 20 8 C 24 18, 32 24, 20 34 C 8 24, 16 18, 20 8 Z" fill="#f43f5e" />
          <Path d="M 20 14 C 28 22, 28 28, 20 34 C 12 28, 12 22, 20 14 Z" fill="#fb7185" />
        </Svg>
      );
    case 'sphatik':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="16" fill="url(#sphatikGrad)" />
          <Circle cx="20" cy="20" r="16" fill="none" stroke="#bae6fd" strokeWidth="0.5" />
          <Defs>
            <RadialGradient id="sphatikGrad" cx="30%" cy="30%" rx="70%" ry="70%">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="40%" stopColor="#f0f9ff" />
              <Stop offset="80%" stopColor="#bae6fd" />
              <Stop offset="100%" stopColor="#7dd3fc" />
            </RadialGradient>
          </Defs>
        </Svg>
      );
    case 'gold-chakra':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="15" fill="url(#goldGrad)" />
          <Circle cx="20" cy="20" r="15" fill="none" stroke="#ca8a04" strokeWidth="1" />
          <Path d="M 20 5 L 20 35 M 5 20 L 35 20 M 9 9 L 31 31 M 9 31 L 31 9" stroke="#ca8a04" strokeWidth="1.2" />
          <Circle cx="20" cy="20" r="4" fill="#ca8a04" />
          <Defs>
            <RadialGradient id="goldGrad" cx="30%" cy="30%" rx="70%" ry="70%">
              <Stop offset="0%" stopColor="#fef08a" />
              <Stop offset="70%" stopColor="#eab308" />
              <Stop offset="100%" stopColor="#ca8a04" />
            </RadialGradient>
          </Defs>
        </Svg>
      );
    default:
      return null;
  }
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  state,
  toggleSetting,
  setThemeId,
  setSelectedMantra,
  setBeadDesign,
  setParticleEffect,
  setCounterStyle,
  addCustomMantra,
  deleteCustomMantra,
  setReminderTime,
  clearAll,
  setCustomNavTabs,
  setMarqueeText,
  setMarqueeDirection
}) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [customMantraInput, setCustomMantraInput] = useState('');

  const handleReminderToggle = async () => {
    const nextVal = !state.settings.remindersEnabled;
    toggleSetting('remindersEnabled');

    if (nextVal) {
      const granted = await requestPermissionsAsync();
      if (granted) {
        const [h, m] = state.settings.reminderTime.split(':');
        scheduleDailyReminderAsync(parseInt(h), parseInt(m), state.streakDays);
      } else {
        alert("Notification permissions are required to set daily reminders.");
        toggleSetting('remindersEnabled');
      }
    } else {
      cancelAllRemindersAsync();
    }
  };

  const handleTimeChange = async (time: string) => {
    setReminderTime(time);
    if (state.settings.remindersEnabled) {
      const [h, m] = time.split(':');
      scheduleDailyReminderAsync(parseInt(h), parseInt(m), state.streakDays);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `I'm using the Naam Jap Counter to keep track of my chanting spiritual milestones! Daily Streak: ${state.streakDays} days. Grand total: ${state.lifetimeTotalChants} chants. Join me!`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper formatting values for card summaries
  const getActiveThemeName = () => THEMES[state.settings.themeId]?.name || 'Saffron';
  const getActiveBeadName = () => {
    const beadNames: Record<string, string> = {
      'saffron-sphere': 'Saffron Sphere',
      'rudraksha': 'Rudraksha Seed',
      'tulsi': 'Tulsi Wood',
      'lotus': 'Divine Lotus',
      'sphatik': 'Sphatik Quartz',
      'gold-chakra': 'Golden Chakra'
    };
    return beadNames[state.settings.beadDesign] || 'Custom';
  };
  const getActiveLayoutName = () => {
    const layouts: Record<string, string> = {
      'classic-3d': 'Classic 3D Orbit',
      'minimal-ring': 'Minimal Ring',
      'radha-rani': 'Radha Rani',
      'lotus-bloom': 'Lotus Bloom',
      'rudraksha-ring': 'Rudraksha Circle',
      'sudarshan-chakra': 'Sudarshan Chakra',
      'neon-glow': 'Neon Cyberpunk',
      'dotted-108': '108 Mala Dots',
      'mantra-orbit': 'Mantra Orbit',
      'retro-flip': 'Retro Flip Card'
    };
    return layouts[state.settings.counterStyle] || 'Classic';
  };

  const settingsCards = [
    {
      id: 'theme',
      title: 'App Color Theme',
      desc: 'Change spiritual themes and visual designs',
      summary: getActiveThemeName(),
      icon: Palette,
      color: '#fb923c'
    },
    {
      id: 'bead',
      title: 'Bead Material & Design',
      desc: 'Select sacred bead textures and sphere design',
      summary: getActiveBeadName(),
      icon: Settings,
      color: '#a16207'
    },
    {
      id: 'counter',
      title: 'Counter Layout Style',
      desc: 'Customize interactive 3D, Ring, or Flip counts',
      summary: getActiveLayoutName(),
      icon: Compass,
      color: '#0284c7'
    },
    {
      id: 'mantra',
      title: 'Mantra & Particle Effects',
      desc: 'Add custom mantras and select particle physics',
      summary: state.settings.selectedMantra,
      icon: Sparkles,
      color: '#ec4899'
    },
    {
      id: 'feedback',
      title: 'Feedback, Audio & Haptics',
      desc: 'Configure sounds, vibrations, and swipe mode',
      summary: `Haptics: ${state.settings.hapticEnabled ? 'ON' : 'OFF'}`,
      icon: Volume2,
      color: '#10b981'
    },
    {
      id: 'reminders',
      title: 'Auspicious Alarms & Reminders',
      desc: 'Set daily alarms for Brahma Muhurta or Sandhya',
      summary: state.settings.remindersEnabled ? `Active (${state.settings.reminderTime})` : 'Disabled',
      icon: Clock,
      color: '#f59e0b'
    },
    {
      id: 'marquee',
      title: 'Dashboard Moving Marquee',
      desc: 'Setup infinitely scrolling message banner text',
      summary: state.settings.marqueeEnabled ? 'Enabled' : 'Disabled',
      icon: Award,
      color: '#d97706'
    },
    {
      id: 'features',
      title: 'Enable Dashboard Features',
      desc: 'Toggle Vrindavan Parikrama map, blessings, etc.',
      summary: 'Tap to configure',
      icon: Info,
      color: '#6366f1'
    },
    {
      id: 'profile',
      title: 'Devotee Profile & App Data',
      desc: 'Share app milestones or clear app storage values',
      summary: `${state.streakDays}d Streak • Reset`,
      icon: Share2,
      color: '#6b7280'
    }
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textSecondary }]}>
          SYSTEM PROPERTIES & CUSTOMIZATION
        </Text>

        <View style={styles.cardList}>
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => {
                  Vibration.vibrate(20);
                  setActiveModal(card.id as any);
                }}
                activeOpacity={0.8}
                style={[
                  styles.settingsCard,
                  {
                    backgroundColor: activeTheme.colors.cardBackground,
                    borderColor: activeTheme.colors.cardBorder
                  }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: card.color + '1A' }]}>
                  <Icon size={20} color={card.color} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: activeTheme.colors.textPrimary }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardDesc, { color: activeTheme.colors.textSecondary }]}>
                    {card.desc}
                  </Text>
                </View>

                <View style={styles.rightActions}>
                  <View style={[styles.badge, { backgroundColor: activeTheme.colors.accent + '12' }]}>
                    <Text style={[styles.badgeText, { color: activeTheme.colors.accent }]} numberOfLines={1}>
                      {card.summary}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={activeTheme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Unified Settings Bottom Sheet Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={activeModal !== null}
        onRequestClose={() => setActiveModal(null)}
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

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={{ fontSize: 10, color: activeTheme.colors.accent, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {activeModal === 'theme' && 'Spiritual Themes'}
                  {activeModal === 'bead' && 'Bead Customizations'}
                  {activeModal === 'counter' && 'Layout styles'}
                  {activeModal === 'mantra' && 'Mantras & Animations'}
                  {activeModal === 'feedback' && 'Audio & Haptics'}
                  {activeModal === 'reminders' && 'Spiritual Alarms'}
                  {activeModal === 'marquee' && 'Dashboard Marquee'}
                  {activeModal === 'features' && 'Dashboard Widgets'}
                  {activeModal === 'profile' && 'Devotee Profile & Reset'}
                </Text>
                <Text style={[styles.modalTitle, { color: activeTheme.colors.textPrimary }]}>
                  {activeModal === 'theme' && 'Select App Theme'}
                  {activeModal === 'bead' && 'Select Bead Texture'}
                  {activeModal === 'counter' && 'Select Counter Layout'}
                  {activeModal === 'mantra' && 'Choose Mantra'}
                  {activeModal === 'feedback' && 'Feedback Preferences'}
                  {activeModal === 'reminders' && 'Chanting Alarms'}
                  {activeModal === 'marquee' && 'Marquee Configuration'}
                  {activeModal === 'features' && 'Feature Toggles'}
                  {activeModal === 'profile' && 'Profile Actions'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={[styles.closeButton, { backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
              >
                <X size={16} color={activeTheme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginBottom: 12 }}>
              
              {/* Theme Properties */}
              {activeModal === 'theme' && (
                <View style={{ gap: 10 }}>
                  {Object.values(THEMES).map((t) => {
                    const isSelected = state.settings.themeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          Vibration.vibrate(40);
                          setThemeId(t.id);
                        }}
                        style={[
                          styles.selectionRow,
                          {
                            backgroundColor: isSelected ? t.colors.accent + '12' : activeTheme.colors.background,
                            borderColor: isSelected ? t.colors.accent : activeTheme.colors.cardBorder
                          }
                        ]}
                      >
                        <View>
                          <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                            {t.name}
                          </Text>
                          <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                            {t.isDark ? 'Dark Mode' : 'Light Mode'} Theme
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          <View style={{ backgroundColor: t.colors.accent, width: 14, height: 14, borderRadius: 7 }} />
                          <View style={{ backgroundColor: t.colors.accentLight, width: 14, height: 14, borderRadius: 7 }} />
                          <View style={{ backgroundColor: t.colors.background, width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: t.colors.cardBorder }} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Bead Design Selection */}
              {activeModal === 'bead' && (
                <View style={{ gap: 10 }}>
                  {([
                    { id: 'saffron-sphere', name: 'Saffron Sphere', desc: 'Standard orange terracotta sphere' },
                    { id: 'rudraksha', name: 'Rudraksha Seed', desc: 'Sacred ribbed rudraksha wooden seed' },
                    { id: 'tulsi', name: 'Tulsi Wood', desc: 'Soft golden polished Tulsi wooden bead' },
                    { id: 'lotus', name: 'Divine Lotus', desc: 'Transcendental rose blooming lotus bud' },
                    { id: 'sphatik', name: 'Sphatik Quartz', desc: 'Clear transparent crystal quartz bead' },
                    { id: 'gold-chakra', name: 'Golden Chakra', desc: 'Royal golden wheel carved bead' },
                  ] as const).map((d) => {
                    const isSelected = state.settings.beadDesign === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => {
                          Vibration.vibrate(40);
                          setBeadDesign(d.id);
                        }}
                        style={[
                          styles.selectionRow,
                          {
                            backgroundColor: isSelected ? activeTheme.colors.accent + '12' : activeTheme.colors.background,
                            borderColor: isSelected ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                          }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {renderBeadPreview(d.id, 32)}
                          <View>
                            <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                              {d.name}
                            </Text>
                            <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                              {d.desc}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Counter Visual Layout Styles */}
              {activeModal === 'counter' && (
                <View style={{ gap: 10 }}>
                  {([
                    { id: 'classic-3d', name: 'Classic 3D Orbit', desc: 'Rolling perspective loop of beads' },
                    { id: 'minimal-ring', name: 'Minimal Ring', desc: 'Clean, simple progress ring' },
                    { id: 'radha-rani', name: 'Radha Rani Divine', desc: 'Pink/Gold theme, peacock feathers' },
                    { id: 'lotus-bloom', name: 'Lotus Bloom', desc: 'Blooming petals gradient layout' },
                    { id: 'rudraksha-ring', name: 'Rudraksha Circle', desc: '27 static Rudraksha beads path' },
                    { id: 'sudarshan-chakra', name: 'Sudarshan Chakra', desc: 'Golden spinning wheel of light' },
                    { id: 'neon-glow', name: 'Neon Cyberpunk', desc: 'Glowing laser cyan/magenta track' },
                    { id: 'dotted-108', name: '108 Mala Dots', desc: '108 individual dots completion track' },
                    { id: 'mantra-orbit', name: 'Mantra Ring', desc: 'The selected mantra repeats along the circle' },
                    { id: 'retro-flip', name: 'Retro Flip Card', desc: 'Satisfying mechanical digit cards' }
                  ] as const).map((style) => {
                    const isSelected = state.settings.counterStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        onPress={() => {
                          Vibration.vibrate(40);
                          setCounterStyle(style.id);
                        }}
                        style={[
                          styles.selectionRow,
                          {
                            backgroundColor: isSelected ? activeTheme.colors.accent + '12' : activeTheme.colors.background,
                            borderColor: isSelected ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                          }
                        ]}
                      >
                        <View>
                          <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                            {style.name}
                          </Text>
                          <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                            {style.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Mantra & Particle Effect Options */}
              {activeModal === 'mantra' && (
                <View>
                  <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
                    Select Chanting Mantra
                  </Text>
                  
                  {/* List of Mantras */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {[
                      ...['+1', 'ॐ', 'ॐ नमः शिवाय', 'हरे कृष्ण', 'श्री राम', 'राधा राधा', 'ॐ नमो नारायणाय'],
                      ...(state.settings.customMantras || [])
                    ].map((mantra) => {
                      const isSelected = state.settings.selectedMantra === mantra;
                      const isCustom = !(new Set(['+1', 'ॐ', 'ॐ नमः शिवाय', 'हरे कृष्ण', 'श्री राम', 'राधा राधा', 'ॐ नमो नारायणाय']).has(mantra));
                      
                      return (
                        <View key={mantra} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => {
                              Vibration.vibrate(40);
                              setSelectedMantra(mantra);
                            }}
                            style={{
                              backgroundColor: isSelected ? activeTheme.colors.accent : activeTheme.colors.background,
                              borderColor: isSelected ? 'transparent' : activeTheme.colors.cardBorder,
                              borderWidth: 1,
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              borderRadius: 99,
                            }}
                          >
                            <Text style={{ color: isSelected ? '#FFFFFF' : activeTheme.colors.textPrimary, fontWeight: '800', fontSize: 11 }}>
                              {mantra}
                            </Text>
                          </TouchableOpacity>
                          
                          {isCustom && (
                            <TouchableOpacity
                              onPress={() => {
                                Vibration.vibrate(20);
                                deleteCustomMantra(mantra);
                              }}
                              style={{
                                marginLeft: -8,
                                backgroundColor: '#ef4444',
                                borderRadius: 99,
                                width: 16,
                                height: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                borderWidth: 1,
                                borderColor: activeTheme.colors.background
                              }}
                            >
                              <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>×</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Add Custom Mantra */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                    <TextInput
                      placeholder="Add custom mantra..."
                      placeholderTextColor={activeTheme.colors.textSecondary + '77'}
                      value={customMantraInput}
                      onChangeText={setCustomMantraInput}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: activeTheme.colors.cardBorder,
                        color: activeTheme.colors.textPrimary,
                        paddingHorizontal: 12,
                        fontSize: 11.5,
                        fontWeight: '600',
                        backgroundColor: activeTheme.colors.background
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (customMantraInput.trim()) {
                          addCustomMantra(customMantraInput.trim());
                          setCustomMantraInput('');
                          Vibration.vibrate(30);
                        }
                      }}
                      style={{
                        backgroundColor: activeTheme.colors.accent,
                        height: 38,
                        width: 38,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Plus size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
                    Chanting Particle Animation
                  </Text>
                  
                  {/* Particle Animations */}
                  <View style={{ gap: 8 }}>
                    {([
                      { id: 'none', name: 'No Effect' },
                      { id: 'float', name: 'Float Up' },
                      { id: 'drop', name: 'Lotus Fall' },
                      { id: 'expand', name: 'Cosmic Glow' },
                      { id: 'spin', name: 'Spin Vortex' }
                    ] as const).map((a) => {
                      const isSelected = state.settings.particleEffect === a.id;
                      return (
                        <TouchableOpacity
                          key={a.id}
                          onPress={() => {
                            Vibration.vibrate(40);
                            setParticleEffect(a.id);
                          }}
                          style={[
                            styles.selectionRow,
                            {
                              backgroundColor: isSelected ? activeTheme.colors.accent + '12' : activeTheme.colors.background,
                              borderColor: isSelected ? activeTheme.colors.accent : activeTheme.colors.cardBorder,
                              paddingVertical: 10
                            }
                          ]}
                        >
                          <Text style={{ color: activeTheme.colors.textPrimary, fontWeight: '800', fontSize: 12 }}>
                            {a.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Sounds & Vibrations settings */}
              {activeModal === 'feedback' && (
                <View style={styles.toggleCard}>
                  {([
                    {
                      key: 'soundEnabled',
                      label: 'Tap Audio Feedback',
                      desc: 'Play chime/wood tap audio feedback when counting',
                      icon: Volume2
                    },
                    {
                      key: 'hapticEnabled',
                      label: 'Vibration Haptics',
                      desc: 'Soft pulse feedback on click and full Mala completions',
                      icon: Compass
                    },
                    {
                      key: 'bounceEnabled',
                      label: 'Bead Bounce Motion',
                      desc: 'Enable spring-scale pop effect when tapping',
                      icon: Sparkles
                    },
                    {
                      key: 'dragPhysicsEnabled',
                      label: 'Swipe / Drag Bead Mode',
                      desc: 'Pull bead downward to count instead of simple clicking',
                      icon: Compass
                    }
                  ] as const).map((item, idx, arr) => {
                    const IconComp = item.icon;
                    const value = state.settings[item.key] as boolean;
                    return (
                      <View 
                        key={item.key} 
                        style={[
                          styles.toggleRow,
                          { borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: activeTheme.colors.cardBorder }
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 12.5, fontWeight: '800' }}>
                            {item.label}
                          </Text>
                          <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9, fontWeight: '500', marginTop: 1 }}>
                            {item.desc}
                          </Text>
                        </View>
                        <Switch
                          value={value}
                          onValueChange={() => toggleSetting(item.key)}
                          trackColor={{ false: '#767577', true: activeTheme.colors.accent }}
                          thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
                        />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Reminders / Auspicious alarms */}
              {activeModal === 'reminders' && (
                <View>
                  <View style={styles.toggleCard}>
                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                          Chanting Reminder
                        </Text>
                        <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 1 }}>
                          Receive local alarms during auspicious hours
                        </Text>
                      </View>
                      <Switch
                        value={state.settings.remindersEnabled}
                        onValueChange={handleReminderToggle}
                        trackColor={{ false: '#767577', true: activeTheme.colors.accent }}
                        thumbColor={state.settings.remindersEnabled ? '#FFFFFF' : '#f4f3f4'}
                      />
                    </View>

                    {state.settings.remindersEnabled && (
                      <View style={{ padding: 12, backgroundColor: activeTheme.colors.background, borderRadius: 12, marginTop: 4 }}>
                        <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 10.5, fontWeight: '800', marginBottom: 8 }}>
                          Auspicious Hour Selector
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[
                            { time: '04:30', label: 'Brahma M.' },
                            { time: '06:00', label: 'Sunrise' },
                            { time: '18:30', label: 'Sandhya' },
                            { time: '21:00', label: 'Night' }
                          ].map((t) => {
                            const isTimeSelected = state.settings.reminderTime === t.time;
                            return (
                              <TouchableOpacity
                                key={t.time}
                                onPress={() => handleTimeChange(t.time)}
                                style={{
                                  flex: 1,
                                  backgroundColor: isTimeSelected ? activeTheme.colors.accent : activeTheme.colors.cardBackground,
                                  borderColor: isTimeSelected ? 'transparent' : activeTheme.colors.cardBorder,
                                  borderWidth: 1,
                                  paddingVertical: 8,
                                  borderRadius: 10,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ fontSize: 8.5, fontWeight: '900', color: isTimeSelected ? '#FFFFFF' : activeTheme.colors.textSecondary }}>
                                  {t.label}
                                </Text>
                                <Text style={{ fontSize: 9, color: isTimeSelected ? '#FFFFFF' : activeTheme.colors.textPrimary, fontWeight: '800', marginTop: 1 }}>
                                  {t.time}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Dashboard Marquee Config */}
              {activeModal === 'marquee' && (
                <View style={styles.toggleCard}>
                  <View style={[styles.toggleRow, { borderBottomWidth: state.settings.marqueeEnabled ? 1 : 0, borderBottomColor: activeTheme.colors.cardBorder }]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                        Show Marquee Banner
                      </Text>
                      <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 1 }}>
                        Enable custom moving text at the top of Dashboard
                      </Text>
                    </View>
                    <Switch
                      value={state.settings.marqueeEnabled}
                      onValueChange={() => toggleSetting('marqueeEnabled')}
                      trackColor={{ false: '#767577', true: activeTheme.colors.accent }}
                      thumbColor={state.settings.marqueeEnabled ? '#FFFFFF' : '#f4f3f4'}
                    />
                  </View>

                  {state.settings.marqueeEnabled && (
                    <View style={{ padding: 12, gap: 10 }}>
                      <View>
                        <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 10.5, fontWeight: '800', marginBottom: 6 }}>
                          Custom Marquee Message
                        </Text>
                        <TextInput
                          placeholder="e.g. राधे राधे, जपते रहिये! 📿"
                          placeholderTextColor={activeTheme.colors.textSecondary + '77'}
                          value={state.settings.marqueeText}
                          onChangeText={setMarqueeText}
                          style={{
                            height: 38,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: activeTheme.colors.cardBorder,
                            color: activeTheme.colors.textPrimary,
                            paddingHorizontal: 12,
                            fontSize: 11.5,
                            fontWeight: '600',
                            backgroundColor: activeTheme.colors.background
                          }}
                        />
                      </View>

                      <View>
                        <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 10.5, fontWeight: '800', marginBottom: 6 }}>
                          Movement Direction
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => {
                              Vibration.vibrate(20);
                              setMarqueeDirection('rtl');
                            }}
                            style={{
                              flex: 1,
                              paddingVertical: 7,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              alignItems: 'center',
                              backgroundColor: state.settings.marqueeDirection === 'rtl' ? activeTheme.colors.accent + '1A' : 'transparent',
                              borderColor: state.settings.marqueeDirection === 'rtl' ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                            }}
                          >
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: state.settings.marqueeDirection === 'rtl' ? activeTheme.colors.accent : activeTheme.colors.textSecondary }}>
                              Right to Left (←)
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Vibration.vibrate(20);
                              setMarqueeDirection('ltr');
                            }}
                            style={{
                              flex: 1,
                              paddingVertical: 7,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              alignItems: 'center',
                              backgroundColor: state.settings.marqueeDirection === 'ltr' ? activeTheme.colors.accent + '1A' : 'transparent',
                              borderColor: state.settings.marqueeDirection === 'ltr' ? activeTheme.colors.accent : activeTheme.colors.cardBorder
                            }}
                          >
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: state.settings.marqueeDirection === 'ltr' ? activeTheme.colors.accent : activeTheme.colors.textSecondary }}>
                              Left to Right (→)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Dashboard Features */}
              {activeModal === 'features' && (
                <View style={styles.toggleCard}>
                  {([
                    { key: 'parikramaEnabled', label: 'Vrindavan Dham Parikrama', desc: 'Pilgrimage map widget' },
                    { key: 'blessingsEnabled', label: 'Radha Blessings Cards', desc: 'Daily rasika scriptures' },
                    { key: 'sakhisEnabled', label: 'Ashtasakhi Blessings', desc: 'Visual confetti overlay' },
                    { key: 'celebrationEnabled', label: 'Milestone Celebration Screen', desc: 'Show overlay on goal met' },
                    { key: 'glowEffectsEnabled', label: 'Shadows & Glow Effects', desc: 'Turn off to save battery life' },
                    { key: 'progressRingEnabled', label: 'Daily Progress Ring Card', desc: 'Show ring on Dashboard' },
                    { key: 'streakStatsEnabled', label: 'Streak & Lifetime Stats Card', desc: 'Show bottom widgets' }
                  ] as const).map((item, idx, arr) => {
                    const value = state.settings[item.key] as boolean;
                    return (
                      <View 
                        key={item.key} 
                        style={[
                          styles.toggleRow,
                          { borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: activeTheme.colors.cardBorder }
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ color: activeTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                            {item.label}
                          </Text>
                          <Text style={{ color: activeTheme.colors.textSecondary, fontSize: 9.5, fontWeight: '500', marginTop: 1 }}>
                            {item.desc}
                          </Text>
                        </View>
                        <Switch
                          value={value}
                          onValueChange={() => toggleSetting(item.key)}
                          trackColor={{ false: '#767577', true: activeTheme.colors.accent }}
                          thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
                        />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Profile & Reset */}
              {activeModal === 'profile' && (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Vibration.vibrate(30);
                      handleShareApp();
                    }}
                    style={[styles.actionButton, { backgroundColor: activeTheme.colors.accent }]}
                  >
                    <Share2 size={16} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Share Chanting Milestones</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Vibration.vibrate([0, 100, 100, 150, 100, 300]);
                      const confirmReset = confirm ? confirm("Warning: This will clear all chanting history, streak logs, goals, and reset app settings. Proceed?") : true;
                      if (confirmReset) {
                        clearAll();
                        setActiveModal(null);
                      }
                    }}
                    style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }]}
                  >
                    <Shield size={16} color="#ef4444" />
                    <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Clear All App Data</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 6
  },
  cardList: {
    gap: 12
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardContent: {
    flex: 1,
    paddingRight: 6
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  cardDesc: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1.5,
    lineHeight: 12
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 90
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalSwipeBar: {
    width: 40,
    height: 4.5,
    borderRadius: 2.2,
    alignSelf: 'center',
    marginBottom: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  closeButton: {
    padding: 6,
    borderRadius: 99
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  toggleCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 99,
    width: '100%'
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  }
});

export default SettingsScreen;
