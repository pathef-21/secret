import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

/**
 * Smooth staggered entrance animation (fade + slide up)
 */
export function FadeSlideIn({ children, delay = 0, distance = 22, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: USE_NATIVE,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Organic heartbeat or gentle breathing pulse animation
 */
export function PulseView({ children, active = true, mode = 'heartbeat', style }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return;
    }

    const seq =
      mode === 'heartbeat'
        ? Animated.sequence([
            Animated.timing(scale, { toValue: 1.18, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: USE_NATIVE }),
            Animated.timing(scale, { toValue: 1.0, duration: 160, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
            Animated.timing(scale, { toValue: 1.12, duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: USE_NATIVE }),
            Animated.timing(scale, { toValue: 1.0, duration: 240, easing: Easing.in(Easing.ease), useNativeDriver: USE_NATIVE }),
            Animated.delay(900),
          ])
        : Animated.sequence([
            Animated.timing(scale, { toValue: 1.08, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
            Animated.timing(scale, { toValue: 1.0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
          ]);

    const loop = Animated.loop(seq);
    loop.start();
    return () => loop.stop();
  }, [active, mode, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Full-screen burst of floating hearts & sparkles on special romantic actions.
 * Increment `triggerKey` (number > 0) to fire a new burst!
 */
const BURST_EMOJIS = ['❤️', '💖', '✨', '💕', '🔥', '💘', '❤️', '✨', '💗', '💖', '❤️', '✨'];

export function FloatingHeartsBurst({ triggerKey = 0 }) {
  const particles = useRef(
    BURST_EMOJIS.map((emoji, idx) => ({
      emoji,
      leftPct: 10 + ((idx * 7.2) % 80),
      anim: new Animated.Value(0),
      drift: (idx % 2 === 0 ? 1 : -1) * (18 + (idx % 4) * 14),
      size: 20 + (idx % 3) * 8,
      delay: (idx % 5) * 65,
    }))
  ).current;

  useEffect(() => {
    if (!triggerKey) return;

    const anims = particles.map((p) => {
      p.anim.setValue(0);
      return Animated.timing(p.anim, {
        toValue: 1,
        duration: 1650 + (p.delay * 2),
        delay: p.delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE,
      });
    });

    Animated.parallel(anims).start();
  }, [triggerKey, particles]);

  if (!triggerKey) return null;

  return (
    <View style={styles.burstOverlay} pointerEvents="none">
      {particles.map((p, idx) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -340],
        });
        const translateX = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, p.drift, p.drift * 0.5],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.15, 0.75, 1],
          outputRange: [0, 1, 0.9, 0],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.25, 1],
          outputRange: [0.4, 1.25, 0.85],
        });

        return (
          <Animated.Text
            key={idx}
            style={[
              styles.burstItem,
              {
                left: `${p.leftPct}%`,
                fontSize: p.size,
                opacity,
                transform: [{ translateY }, { translateX }, { scale }],
              },
            ]}
          >
            {p.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/**
 * Dreamy ambient background floating sparkles/hearts (ultra-lightweight)
 */
const AMBIENT_ITEMS = [
  { left: '8%', top: '14%', emoji: '✨', size: 14, dur: 4200 },
  { left: '84%', top: '18%', emoji: '💕', size: 15, dur: 5100 },
  { left: '16%', top: '58%', emoji: '✨', size: 12, dur: 4600 },
  { left: '88%', top: '66%', emoji: '❤️', size: 13, dur: 5400 },
  { left: '52%', top: '8%', emoji: '✨', size: 11, dur: 4800 },
];

export function AmbientFloatingParticles() {
  const anims = useRef(AMBIENT_ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = anims.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: AMBIENT_ITEMS[i].dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: AMBIENT_ITEMS[i].dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View style={styles.ambientWrap} pointerEvents="none">
      {AMBIENT_ITEMS.map((item, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        });
        const opacity = anims[i].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.16, 0.45, 0.16],
        });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left: item.left,
              top: item.top,
              fontSize: item.size,
              opacity,
              transform: [{ translateY }],
            }}
          >
            {item.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  burstOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    height: 360,
    zIndex: 999,
    overflow: 'visible',
  },
  burstItem: {
    position: 'absolute',
    bottom: 0,
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
});
