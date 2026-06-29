import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Vibration,
  FlatList,
  Platform
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Coins,
  History,
  ShoppingBag,
  Info,
  CheckCircle,
  Lock
} from 'lucide-react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { AppState, SukritiTransaction } from '../types';
import { THEMES } from '../theme/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PassbookScreenProps {
  state: AppState;
  buyStreakShieldWithSukriti: () => Promise<boolean>;
  buyPujaItem: (itemId: string, cost: number, itemName: string) => Promise<boolean>;
}

export const PassbookScreen: React.FC<PassbookScreenProps> = ({
  state,
  buyStreakShieldWithSukriti,
  buyPujaItem
}) => {
  const activeTheme = THEMES[state.settings.themeId] || THEMES['saffron-divine'];
  const isDark = activeTheme.isDark;

  const [activeTab, setActiveTab] = useState<'ledger' | 'store'>('ledger');
  const [purchaseStatus, setPurchaseStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Extract Sukriti states safely
  const balance = state.sukritiBalance ?? 50;
  const transactions = useMemo(() => {
    return state.sukritiTransactions || [];
  }, [state.sukritiTransactions]);

  // Calculate statistics
  const stats = useMemo(() => {
    let earned = 0;
    let spent = 0;
    transactions.forEach(t => {
      if (t.type === 'earn') earned += t.amount;
      else spent += t.amount;
    });
    return { earned, spent };
  }, [transactions]);

  // Shop items list
  const shopItems = useMemo(() => [
    {
      id: 'streak-shield',
      name: 'Streak Shield (Dharma Suraksha)',
      description: 'Protects your active chanting streak when you miss a day.',
      cost: 50,
      isShield: true,
      milestone: 'Store Exclusive'
    },
    {
      id: 'silver-diya',
      name: 'Silver Diya (Rajat Deep)',
      description: 'A beautiful silver oil lamp with steady, glowing flame particles.',
      cost: 150,
      isShield: false,
      milestone: '5-Day Streak Unlock'
    },
    {
      id: 'gold-bell',
      name: 'Golden Temple Bell (Swarna Ghanti)',
      description: 'A rich golden bell that rings with a resonant temple sound.',
      cost: 200,
      isShield: false,
      milestone: 'Brahma Muhurta Chanting'
    },
    {
      id: 'gold-diya',
      name: 'Golden Diya (Swarna Deep)',
      description: 'A premium brass-gold diya with larger flickering flame particles.',
      cost: 250,
      isShield: false,
      milestone: '50 Altar Flower Offerings'
    },
    {
      id: 'royal-canopy',
      name: 'Royal Canopy (Shri Chhatra)',
      description: 'A beautiful decorative royal canopy hanging above your Deity.',
      cost: 300,
      isShield: false,
      milestone: '20,000 Chants Unlock'
    },
    {
      id: 'royal-gaddi',
      name: 'Throne Cushion (Royal Gaddi)',
      description: 'Plush velvet cushions placed on the sides of the shrine altar.',
      cost: 400,
      isShield: false,
      milestone: '50,000 Chants Unlock'
    },
    {
      id: 'ratna-altar',
      name: 'Jeweled Shrine Borders (Ratna Altar)',
      description: 'A gorgeous, gold border studded with alternating red/blue jewels.',
      cost: 500,
      isShield: false,
      milestone: '15-Day Streak Unlock'
    },
    {
      id: 'divine-aura',
      name: 'Deity Divine Aura (Shri Prabhashala)',
      description: 'A glowing, pulsing cosmic aura particle effect behind the deity.',
      cost: 1080,
      isShield: false,
      milestone: '108,000 Chants Unlock'
    }
  ], []);

  const handleBuyShield = async () => {
    Vibration.vibrate(40);
    if (balance < 50) {
      triggerStatus(false, 'Insufficient Sukriti Balance! Chant more to earn.');
      return;
    }
    const success = await buyStreakShieldWithSukriti();
    if (success) {
      triggerStatus(true, 'Successfully purchased Streak Shield! 🛡️');
    } else {
      triggerStatus(false, 'Purchase failed. Please try again.');
    }
  };

  const handleBuyItem = async (itemId: string, cost: number, itemName: string) => {
    Vibration.vibrate(40);
    if (balance < cost) {
      triggerStatus(false, 'Insufficient Sukriti Balance! Chant more to earn.');
      return;
    }
    const success = await buyPujaItem(itemId, cost, itemName);
    if (success) {
      triggerStatus(true, `Unlocked ${itemName} successfully! 🪷`);
    } else {
      triggerStatus(false, 'Failed to unlock item. Please try again.');
    }
  };

  const triggerStatus = (success: boolean, message: string) => {
    setPurchaseStatus({ success, message });
    setTimeout(() => {
      setPurchaseStatus(null);
    }, 3000);
  };

  const renderTransactionItem = ({ item }: { item: SukritiTransaction }) => {
    const isEarn = item.type === 'earn';
    return (
      <View
        style={[
          styles.txItem,
          {
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <View style={styles.txLeft}>
          <View
            style={[
              styles.txIconContainer,
              {
                backgroundColor: isEarn
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
                borderColor: isEarn
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)'
              }
            ]}
          >
            {isEarn ? (
              <TrendingUp size={16} color="#10B981" />
            ) : (
              <TrendingDown size={16} color="#EF4444" />
            )}
          </View>
          <View style={styles.txMeta}>
            <Text style={[styles.txReason, { color: activeTheme.colors.textPrimary }]} numberOfLines={1}>
              {item.reason}
            </Text>
            <Text style={[styles.txTime, { color: activeTheme.colors.textSecondary }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: isEarn ? '#10B981' : '#EF4444', fontWeight: 'bold' }
          ]}
        >
          {isEarn ? '+' : '-'}{item.amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      
      {/* Wallet Card */}
      <View 
        style={[
          styles.walletCard,
          {
            backgroundColor: activeTheme.colors.cardBackground,
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <View style={styles.walletHeader}>
          <View>
            <Text style={[styles.walletSub, { color: activeTheme.colors.textSecondary }]}>
              DEVOTIONAL SUKRITI WALLET
            </Text>
            <Text style={[styles.walletVal, { color: activeTheme.colors.textPrimary }]}>
              {balance.toLocaleString()}
              <Text style={{ fontSize: 13, color: activeTheme.colors.textSecondary, fontWeight: 'normal' }}>
                {' '}sukriti points
              </Text>
            </Text>
          </View>
          
          <View style={styles.coinWrapper}>
            <Svg width="54" height="54" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="coinGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                  <Stop offset="70%" stopColor="#d97706" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor="#78350f" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="46" fill="url(#coinGlow)" />
              <Circle cx="50" cy="50" r="34" fill="#fbbf24" stroke="#d97706" strokeWidth="4" />
              <Circle cx="50" cy="50" r="26" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
              <SvgText
                x="50"
                y="59"
                fontSize="27"
                fontWeight="bold"
                fill="#78350f"
                textAnchor="middle"
              >
                ॐ
              </SvgText>
            </Svg>
          </View>
        </View>

        {/* Mini stats */}
        <View style={[styles.walletStats, { borderTopColor: activeTheme.colors.cardBorder }]}>
          <View style={styles.walletStatItem}>
            <Text style={[styles.walletStatLabel, { color: activeTheme.colors.textSecondary }]}>Total Earned</Text>
            <Text style={styles.walletStatValEarned}>+{stats.earned}</Text>
          </View>
          <View style={[styles.walletStatDivider, { backgroundColor: activeTheme.colors.cardBorder }]} />
          <View style={styles.walletStatItem}>
            <Text style={[styles.walletStatLabel, { color: activeTheme.colors.textSecondary }]}>Total Spent</Text>
            <Text style={styles.walletStatValSpent}>-{stats.spent}</Text>
          </View>
        </View>
      </View>

      {/* Screen Tabs Selector */}
      <View 
        style={[
          styles.tabSelectorBg,
          {
            backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
            borderColor: activeTheme.colors.cardBorder
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(15);
            setActiveTab('ledger');
          }}
          style={[
            styles.tabButton,
            activeTab === 'ledger' && {
              backgroundColor: activeTheme.colors.accent,
              shadowColor: activeTheme.colors.accent,
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 }
            }
          ]}
        >
          <History size={14} color={activeTab === 'ledger' ? '#FFFFFF' : activeTheme.colors.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'ledger' ? '#FFFFFF' : activeTheme.colors.textSecondary }
            ]}
          >
            Bhakti Ledger
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(15);
            setActiveTab('store');
          }}
          style={[
            styles.tabButton,
            activeTab === 'store' && {
              backgroundColor: activeTheme.colors.accent,
              shadowColor: activeTheme.colors.accent,
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 }
            }
          ]}
        >
          <ShoppingBag size={14} color={activeTab === 'store' ? '#FFFFFF' : activeTheme.colors.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'store' ? '#FFFFFF' : activeTheme.colors.textSecondary }
            ]}
          >
            Bhakti Store
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification Toast */}
      {purchaseStatus && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor: purchaseStatus.success ? '#10B981' : '#EF4444'
            }
          ]}
        >
          <Text style={styles.toastText}>{purchaseStatus.message}</Text>
        </View>
      )}

      {/* Main Content Area */}
      {activeTab === 'ledger' ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={36} color={activeTheme.colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: activeTheme.colors.textPrimary }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtitle, { color: activeTheme.colors.textSecondary }]}>
                Chant mantras or log your daily sadhana logs to earn your first Sukriti points!
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.shopGrid}
          showsVerticalScrollIndicator={false}
        >
          {shopItems.map((item) => {
            const isUnlocked = item.isShield 
              ? false 
              : state.unlockedSamagri?.includes(item.id);
            const canAfford = balance >= item.cost;

            return (
              <View
                key={item.id}
                style={[
                  styles.shopCard,
                  {
                    backgroundColor: activeTheme.colors.cardBackground,
                    borderColor: activeTheme.colors.cardBorder
                  }
                ]}
              >
                <View style={styles.shopCardTop}>
                  <View style={styles.shopItemHeader}>
                    <Text style={[styles.shopItemName, { color: activeTheme.colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    {isUnlocked && (
                      <View style={styles.unlockedBadge}>
                        <CheckCircle size={10} color="#10B981" />
                        <Text style={styles.unlockedBadgeText}>Unlocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.shopItemDesc, { color: activeTheme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                  
                  <View style={styles.shopItemMeta}>
                    <Text style={[styles.shopItemMilestone, { color: activeTheme.colors.accent }]}>
                      🎯 {item.milestone}
                    </Text>
                    {item.isShield && (
                      <Text style={[styles.shieldCount, { color: activeTheme.colors.textSecondary }]}>
                        Owned: {state.streakShields ?? 0}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Purchase Button */}
                <TouchableOpacity
                  disabled={isUnlocked}
                  onPress={() => {
                    if (item.isShield) {
                      handleBuyShield();
                    } else {
                      handleBuyItem(item.id, item.cost, item.name);
                    }
                  }}
                  style={[
                    styles.buyButton,
                    {
                      backgroundColor: isUnlocked
                        ? 'rgba(16, 185, 129, 0.08)'
                        : canAfford
                        ? activeTheme.colors.accent
                        : 'rgba(255,255,255,0.03)',
                      borderColor: isUnlocked
                        ? '#10B981'
                        : canAfford
                        ? activeTheme.colors.accent
                        : activeTheme.colors.cardBorder,
                      borderWidth: 1
                    }
                  ]}
                >
                  {isUnlocked ? (
                    <Text style={[styles.buyButtonText, { color: '#10B981' }]}>
                      Samagri Inventory Unlocked 🪷
                    </Text>
                  ) : (
                    <View style={styles.buyButtonActiveContent}>
                      {!canAfford && <Lock size={12} color={activeTheme.colors.textSecondary} style={{ marginRight: 4 }} />}
                      <Text
                        style={[
                          styles.buyButtonText,
                          { color: canAfford ? '#FFFFFF' : activeTheme.colors.textSecondary }
                        ]}
                      >
                        {item.isShield 
                          ? `Acquire for ${item.cost} Sukriti`
                          : `Unlock ahead of milestones for ${item.cost} Sukriti`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16
  },
  walletCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  walletSub: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800'
  },
  walletVal: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  coinWrapper: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12
  },
  walletStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  walletStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  walletStatDivider: {
    width: 1,
    height: 20
  },
  walletStatValEarned: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2
  },
  walletStatValSpent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2
  },
  tabSelectorBg: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800'
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 100,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center'
  },
  listContainer: {
    paddingBottom: 24
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12
  },
  txIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  txMeta: {
    flex: 1
  },
  txReason: {
    fontSize: 12,
    fontWeight: '800'
  },
  txTime: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600'
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '600'
  },
  shopGrid: {
    paddingBottom: 32
  },
  shopCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  shopCardTop: {
    marginBottom: 14
  },
  shopItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  shopItemName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3
  },
  unlockedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800'
  },
  shopItemDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600'
  },
  shopItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  shopItemMilestone: {
    fontSize: 10,
    fontWeight: '800'
  },
  shieldCount: {
    fontSize: 10,
    fontWeight: '700'
  },
  buyButton: {
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buyButtonActiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyButtonText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  }
});

export default PassbookScreen;
