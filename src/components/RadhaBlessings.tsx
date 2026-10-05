import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { THEMES } from '../theme/themes';

interface BlessingsProps {
  themeId: string;
}

interface BlessingQuote {
  verse: string;
  hindi: string;
  eng: string;
  source: string;
}

const QUOTES: BlessingQuote[] = [
  {
    verse: 'यस्याः कदापि करुणाअवलोक-शब्दाद्, विश्वं भवेत् वशमपि स्वयं कृष्णचन्द्रः।',
    hindi: 'जिनकी लेश मात्र करुणामयी दृष्टि से, स्वयं कृपासागर श्रीकृष्ण भी वशीभूत हो जाते हैं।',
    eng: 'By whose single drop of merciful glance, even Sri Krishna—the ocean of grace Himself—becomes completely captivated.',
    source: 'Sri Radha Sudha Nidhi',
  },
  {
    verse: 'राधा नाम परम् मन्त्रम्, राधा नाम परम् तपः। राधा नाम परं तत्त्वं, राधा नाम परा गतिः॥',
    hindi: 'राधा नाम ही परम मंत्र है, राधा नाम ही परम तपस्या है, राधा नाम ही परम सत्य है और राधा नाम ही परम गति है।',
    eng: 'The name Radha is the supreme mantra, the ultimate penance, the absolute truth, and the highest destination.',
    source: 'Padma Purana',
  },
  {
    verse: 'राधे तेरे चरणों की धूल मिल जाए, तो मेरी सोई तकदीर जाग जाए।',
    hindi: 'हे श्यामा जू! यदि आपके श्री चरणों की रजोकण मिल जाए, तो मेरा सोई भाग्य उदय हो जाए।',
    eng: 'O Radhey! If I could obtain a single speck of dust from Your lotus feet, my sleeping destiny would awaken.',
    source: 'Traditional Bhajan',
  },
  {
    verse: 'वृषभानुसुता चरणाम्बुजं, भज मन निशिदिनं सुखदम्।',
    hindi: 'हे मन! श्री वृषभानु नंदिनी जी के सुखदायक चरण कमलों का दिन-रात प्रेमपूर्वक भजन करो।',
    eng: 'O my mind! Meditate day and night upon the lotus feet of Radha Rani, the giver of absolute spiritual joy.',
    source: 'Rasika Literature',
  },
  {
    verse: 'करुणा मयी श्यामा प्यारी, तेरी दया का अंत नहीं।',
    hindi: 'हे करुणामयी लाड़ली जी! आपकी असीम दया और वात्सल्य का कोई अंत नहीं है।',
    eng: 'O merciful Syama Pyari! There is no limit to Your boundless compassion and motherly affection.',
    source: 'Hit Chaurasi',
  },
  {
    verse: 'राधे राधे जपो चले आएंगे बिहारी।',
    hindi: 'जो भी राधा नाम का आश्रय लेता है, बांके बिहारी श्रीकृष्ण स्वयं खींचे चले आते हैं।',
    eng: 'Just take shelter of the name Radhey Radhey, and Sri Bankey Bihari will run to you.',
    source: 'Vrindavan Saints',
  },
  {
    verse: 'श्री राधा कृष्णस्वरूपा हि, कृष्णो राधास्वरूपकः। कलास्वपि च भेदस्तु, तयोः वेदेषु गीयते॥',
    hindi: 'श्री राधा ही साक्षात् श्रीकृष्ण हैं, और श्रीकृष्ण ही श्री राधा का स्वरूप हैं। इनमें कोई भेद नहीं है।',
    eng: 'Sri Radha is the embodiment of Sri Krishna, and Sri Krishna is the embodiment of Sri Radha. They are eternally one.',
    source: 'Gopal Tapani Upanishad',
  },
  {
    verse: 'लाड़ली अद्भुत रूप तिहारो, जो जन ध्यावे पावे सुख सारो।',
    hindi: 'हे किशोरी जी! आपका रूप अद्भुत और दिव्य है, जो आपका ध्यान करता है वह परम सुख का सार प्राप्त करता है।',
    eng: 'O beloved Kishori! Your form is wonderful; whoever meditates upon You obtains the absolute essence of happiness.',
    source: 'Braj Ras Riti',
  },
  {
    verse: 'वृंदावन की महारानी, श्री राधा नाम सुखदानी।',
    hindi: 'वृंदावन की अधिष्ठात्री देवी श्री राधा का नाम सर्वस्व कल्याण और परम आनंद देने वाला है।',
    eng: 'The Queen of Vrindavan, Sri Radha, her holy name is the giver of ultimate welfare and bliss.',
    source: 'Haridas Banibhav',
  },
  {
    verse: 'जय राधे जय कृष्ण जय वृंदावन, श्री राधा चरण ध्याऊँ हर जनम।',
    hindi: 'हे राधे! मुझे प्रत्येक जन्म में आपके युगल चरणों की अविचल सेवा और ध्यान प्राप्त हो।',
    eng: 'Glory to Radha and Krishna, glory to Vrindavan! May I remain devoted to Radha\'s feet in every lifetime.',
    source: 'Braj Rasik Prayer',
  },
];

export const RadhaBlessings: React.FC<BlessingsProps> = React.memo(({ themeId }) => {
  const activeTheme = THEMES[themeId] || THEMES['saffron-divine'];
  const [index, setIndex] = useState(0);

  const drawNewBlessing = () => {
    Vibration.vibrate(30);
    // Draw a random quote that is different from current
    let nextIndex = index;
    while (nextIndex === index) {
      nextIndex = Math.floor(Math.random() * QUOTES.length);
    }
    setIndex(nextIndex);
  };

  const activeQuote = QUOTES[index];

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={16} color="#ec4899" />
          <Text style={[styles.title, { color: activeTheme.colors.textPrimary }]}>
            Radha Rani Daily Blessings
          </Text>
        </View>
        <TouchableOpacity 
          onPress={drawNewBlessing}
          style={[styles.drawBtn, { backgroundColor: activeTheme.colors.accent + '13' }]}
        >
          <RefreshCw size={11} color={activeTheme.colors.accent} />
          <Text style={[styles.drawBtnText, { color: activeTheme.colors.accent }]}>Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Quote Display */}
      <View style={styles.quoteBox}>
        <Text style={styles.verseText}>
          "{activeQuote.verse}"
        </Text>
        
        <View style={[styles.divider, { backgroundColor: activeTheme.colors.cardBorder }]} />

        <Text style={[styles.translationText, { color: activeTheme.colors.textPrimary }]}>
          <Text style={styles.langLabel}>Hindi: </Text>{activeQuote.hindi}
        </Text>
        
        <Text style={[styles.translationText, { color: activeTheme.colors.textSecondary, marginTop: 4 }]}>
          <Text style={styles.langLabel}>Eng: </Text>{activeQuote.eng}
        </Text>

        <Text style={styles.sourceText}>
          — {activeQuote.source}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  drawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  drawBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quoteBox: {
    width: '100%',
  },
  verseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#be123c',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    width: '100%',
  },
  translationText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  langLabel: {
    fontWeight: 'bold',
  },
  sourceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#be123c',
    textAlign: 'right',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default RadhaBlessings;
