import React from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { Compass, Map, Sparkles, Menu, Award, BookOpen, Target, BarChart2, Settings, Coins, Heart } from 'lucide-react-native';
import { THEMES } from '../theme/themes';

interface NavBarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  themeId: string;
  customNavTabs?: string[];
}

const iconMap: Record<string, any> = {
  'Dashboard': Compass,
  'Parikrama': Map,
  'Puja': Sparkles,
  'BhaktiMarg': Award,
  'Sadhana': BookOpen,
  'Goals': Target,
  'Analytics': BarChart2,
  'Settings': Settings,
  'Passbook': Coins,
  'RadhaJap': Heart
};

const labelMap: Record<string, string> = {
  'Dashboard': 'Home',
  'Parikrama': 'Parikrama',
  'Puja': 'Mandir',
  'BhaktiMarg': 'Vriksha',
  'Sadhana': 'Sadhana',
  'Goals': 'Vows',
  'Analytics': 'Charts',
  'Settings': 'Settings',
  'Passbook': 'Passbook',
  'RadhaJap': '11 Crore'
};

export const FloatingNavBar: React.FC<NavBarProps> = React.memo(({ currentTab, setTab, themeId, customNavTabs }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;
  
  const navTabs = customNavTabs || ['Dashboard', 'Puja', 'RadhaJap'];
  
  const tabs = navTabs.map(t => ({
    name: t,
    label: labelMap[t] || t,
    icon: iconMap[t] || Compass
  }));

  // Append Menu
  tabs.push({ name: 'Menu', label: 'More', icon: Menu });

  return (
    <View className="absolute bottom-6 left-0 right-0 items-center justify-center px-6 z-20">
      {/* Floating Pill Container */}
      <View
        style={{
          backgroundColor: activeTheme.colors.cardBackground + 'E6', // E6 = 90% opacity for glassmorphism
          borderColor: activeTheme.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 9999,
          // Neumorphic/Glassmorphic Floating Shadows
          shadowColor: activeTheme.colors.shadowColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 15,
          elevation: 10,
        }}
        className="flex-row items-center justify-around w-full py-3 px-4 backdrop-blur-md"
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          
          // Determine if tab is active
          const isSubpage = ['Goals', 'Analytics', 'Settings', 'BhaktiMarg', 'Sadhana', 'Passbook', 'RadhaJap'].includes(currentTab);
          const isActive = (tab.name === 'Menu' && isSubpage && !navTabs.includes(currentTab)) || (currentTab === tab.name);
          
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                Vibration.vibrate(30);
                setTab(tab.name);
              }}
              className="items-center justify-center py-1 px-3 rounded-full relative"
              style={{
                backgroundColor: isActive 
                  ? (activeTheme.colors.accent + '22') // ~13% opacity accent glow
                  : 'transparent'
              }}
            >
              <IconComponent
                size={22}
                color={isActive 
                  ? activeTheme.colors.accent 
                  : activeTheme.colors.textSecondary
                }
              />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontWeight: isActive ? '700' : '500',
                  color: isActive 
                    ? activeTheme.colors.accent 
                    : activeTheme.colors.textSecondary
                }}
              >
                {tab.label}
              </Text>
              
              {/* Active Dot */}
              {isActive && (
                <View 
                  style={{ backgroundColor: activeTheme.colors.accent }}
                  className="absolute bottom-0 w-1 h-1 rounded-full" 
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

export default FloatingNavBar;
