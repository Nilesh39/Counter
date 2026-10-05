import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View, StyleSheet, Dimensions } from 'react-native';

interface MarqueeProps {
  text: string;
  speed?: number; // Pixels per second
  direction?: 'ltr' | 'rtl';
  textStyle?: any;
}

export const Marquee: React.FC<MarqueeProps> = React.memo(({ 
  text, 
  speed = 40, 
  direction = 'rtl', 
  textStyle 
}) => {
  const [textWidth, setTextWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pad the text with a premium lotus separator to make it scroll seamlessly
  const formattedText = `${text}    🪷    `;

  useEffect(() => {
    if (textWidth === 0) return;

    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Seamless loop calculations:
    // Move translateX by exactly one copy width (textWidth)
    // RTL: Start at 0, slide left to -textWidth, then loop instantly back to 0
    // LTR: Start at -textWidth, slide right to 0, then loop instantly back to -textWidth
    const startVal = direction === 'rtl' ? 0 : -textWidth;
    const endVal = direction === 'rtl' ? -textWidth : 0;

    animatedValue.setValue(startVal);

    // Duration is calculated relative to speed and width of one copy of the text
    const duration = (textWidth / speed) * 1000;

    animationRef.current = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: endVal,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [text, textWidth, direction, speed]);

  return (
    <View style={styles.container}>
      {/* 
        Hidden Off-screen Measurer Text:
        This is absolutely positioned at left: -9999 so it layouts at its natural 
        unconstrained width on both Android/iOS without being squeezed to 0.
      */}
      <Text
        numberOfLines={1}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== textWidth) {
            setTextWidth(w);
          }
        }}
        style={[
          textStyle,
          {
            position: 'absolute',
            opacity: 0,
            left: -9999,
          },
        ]}
      >
        {formattedText}
      </Text>

      {/* Render the animated view only after width is measured */}
      {textWidth > 0 && (
        <Animated.View
          style={{
            flexDirection: 'row',
            transform: [{ translateX: animatedValue }],
            width: textWidth * 3, // Ensure space for three copies for seamless overlap
          }}
        >
          <Text numberOfLines={1} style={[textStyle, { flexShrink: 0 }]}>
            {formattedText}
          </Text>
          <Text numberOfLines={1} style={[textStyle, { flexShrink: 0 }]}>
            {formattedText}
          </Text>
          <Text numberOfLines={1} style={[textStyle, { flexShrink: 0 }]}>
            {formattedText}
          </Text>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
});

export default Marquee;
