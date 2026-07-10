import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  SlideInUp,
  SlideInRight,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Share2,
  Wifi,
  RefreshCw,
  Server,
  School,
  Users,
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Network,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useMeshStore } from '@/src/store/meshStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { MeshNodeCard } from '@/src/components/MeshNodeCard';
import { StatCard } from '@/src/components/StatCard';
import { formatTimeAgo } from '@/src/utils/format';
import type { MeshNode } from '@/src/types';

const { width, height } = Dimensions.get('window');
const GRAPH_SIZE = width - 32;
const GRAPH_CENTER = GRAPH_SIZE / 2;

export default function MeshScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);

  const nodes = useMeshStore((s) => s.nodes);
  const status = useMeshStore((s) => s.status);
  const isSyncing = useMeshStore((s) => s.isSyncing);
  const lastSync = useMeshStore((s) => s.lastSync);
  const meshHealth = useMeshStore((s) => s.meshHealth);
  const contentSynced = useMeshStore((s) => s.contentSynced);
  const syncHistory = useMeshStore((s) => s.syncHistory);
  const triggerSync = useMeshStore((s) => s.triggerSync);
  const selectNode = useMeshStore((s) => s.selectNode);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic('medium');
    await triggerSync();
    setRefreshing(false);
  }, [triggerSync]);

  const handleSync = useCallback(async () => {
    triggerHaptic('medium');
    await triggerSync();
    triggerHaptic('success');
  }, [triggerSync]);

  const handleNodePress = useCallback((node: MeshNode) => {
    triggerHaptic('light');
    setSelectedNode(node);
    selectNode(node.id);
  }, [selectNode]);

  const connectedCount = nodes.filter((n) => n.status === 'connected').length;
  const weakCount = nodes.filter((n) => n.status === 'weak').length;
  const offlineCount = nodes.filter((n) => n.status === 'offline').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
      >
        <ScreenHeader title="Mesh Network" subtitle="Community" large />

        {/* Sync status hero */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={['#0A1014', '#0E2A33', '#0A1014']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.syncHeroCard}
            >
              <View style={styles.syncHeroOrb} />
              <View style={styles.syncHeroContent}>
                <View style={styles.syncHeaderRow}>
                  <View style={styles.syncStatusWrap}>
                    <View style={styles.syncDot} />
                    <Text style={styles.syncStatusLabel}>MESH STATUS</Text>
                  </View>
                  <Pressable
                    onPress={handleSync}
                    disabled={isSyncing}
                    style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
                  >
                    {isSyncing ? (
                      <RefreshCw size={14} color="#17C3B2" strokeWidth={2.5} style={{ transform: [{ rotate: '0deg' }] }} />
                    ) : (
                      <RefreshCw size={14} color="#17C3B2" strokeWidth={2.5} />
                    )}
                    <Text style={styles.syncBtnText}>
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.syncStatusBig}>
                  {isSyncing ? 'Syncing knowledge...' : 'Mesh Connected'}
                </Text>
                <Text style={styles.syncSubtitle}>
                  Last sync {formatTimeAgo(lastSync)} • {contentSynced}% content synced
                </Text>

                {/* Health bar */}
                <View style={styles.healthBarWrap}>
                  <View style={styles.healthBarRow}>
                    <Text style={styles.healthLabel}>Mesh Health</Text>
                    <Text style={styles.healthValue}>{meshHealth}%</Text>
                  </View>
                  <View style={styles.healthBarTrack}>
                    <Animated.View
                      style={[
                        styles.healthBarFill,
                        { width: `${meshHealth}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Network Visualization */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Network size={16} color={theme.colors.accent} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Network Graph
              </Text>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Connected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Weak</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.textTertiary }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Offline</Text>
              </View>
            </View>
          </View>

          <Animated.View entering={FadeIn.delay(200).duration(800)}>
            <MeshGraph nodes={nodes} theme={theme} onNodePress={handleNodePress} selectedId={selectedNode?.id} />
          </Animated.View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={styles.statsRow}>
            <Animated.View entering={SlideInRight.delay(300).duration(500)} style={{ flex: 1 }}>
              <StatCard
                label="Connected"
                value={connectedCount}
                icon={<CheckCircle size={16} color="#FFFFFF" strokeWidth={2.3} />}
                gradient={['#4CAF50', '#2E7D32']}
                style={styles.statCardSmall}
              />
            </Animated.View>
            <View style={{ width: 10 }} />
            <Animated.View entering={SlideInRight.delay(360).duration(500)} style={{ flex: 1 }}>
              <StatCard
                label="Weak Signal"
                value={weakCount}
                icon={<Activity size={16} color="#FFFFFF" strokeWidth={2.3} />}
                gradient={['#FFC107', '#F59E0B']}
                style={styles.statCardSmall}
              />
            </Animated.View>
            <View style={{ width: 10 }} />
            <Animated.View entering={SlideInRight.delay(420).duration(500)} style={{ flex: 1 }}>
              <StatCard
                label="Offline"
                value={offlineCount}
                icon={<X size={16} color="#FFFFFF" strokeWidth={2.3} />}
                gradient={['#6B7280', '#4B5563']}
                style={styles.statCardSmall}
              />
            </Animated.View>
          </View>
        </View>

        {/* Node list */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Server size={16} color={theme.colors.primary} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Nearby Devices
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
              {nodes.length} nodes
            </Text>
          </View>
          <View style={{ gap: 10, marginTop: 12 }}>
            {nodes.map((node, i) => (
              <Animated.View
                key={node.id}
                entering={FadeInDown.delay(400 + i * 60).duration(400)}
              >
                <MeshNodeCard
                  node={node}
                  onPress={() => handleNodePress(node)}
                  selected={selectedNode?.id === node.id}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Sync history */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Clock size={16} color={theme.colors.textSecondary} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Sync History
              </Text>
            </View>
          </View>
          <View style={{ gap: 8, marginTop: 12 }}>
            {syncHistory.map((event, i) => (
              <Animated.View
                key={event.id}
                entering={FadeInDown.delay(500 + i * 60).duration(400)}
              >
                <View style={[styles.syncHistoryRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[
                    styles.syncHistoryIcon,
                    {
                      backgroundColor:
                        event.status === 'success'
                          ? 'rgba(76,175,80,0.12)'
                          : event.status === 'partial'
                          ? 'rgba(255,193,7,0.12)'
                          : 'rgba(239,68,68,0.12)',
                    },
                  ]}>
                    {event.status === 'success' ? (
                      <CheckCircle size={14} color={theme.colors.success} strokeWidth={2.5} />
                    ) : event.status === 'partial' ? (
                      <Activity size={14} color={theme.colors.warning} strokeWidth={2.5} />
                    ) : (
                      <X size={14} color={theme.colors.error} strokeWidth={2.5} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.syncHistoryTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {event.items} items synced
                    </Text>
                    <Text style={[styles.syncHistoryMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      From {event.from} • {event.type === 'manual' ? 'Manual' : 'Auto'}
                    </Text>
                  </View>
                  <Text style={[styles.syncHistoryTime, { color: theme.colors.textTertiary }]}>
                    {formatTimeAgo(event.timestamp)}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const MeshGraph: React.FC<{
  nodes: MeshNode[];
  theme: any;
  onNodePress: (node: MeshNode) => void;
  selectedId?: string;
}> = ({ nodes, theme, onNodePress, selectedId }) => {
  const nodePositions = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      px: n.x * GRAPH_SIZE,
      py: n.y * GRAPH_SIZE * 0.85,
    }));
  }, [nodes]);

  const links = useMemo(() => {
    const result: Array<{ from: typeof nodePositions[0]; to: typeof nodePositions[0]; strength: string }> = [];
    nodePositions.forEach((n) => {
      n.connections.forEach((connId) => {
        const target = nodePositions.find((p) => p.id === connId);
        if (target) {
          const strength = n.status === 'offline' || target.status === 'offline' ? 'offline' : n.status === 'weak' || target.status === 'weak' ? 'weak' : 'strong';
          result.push({ from: n, to: target, strength });
        }
      });
    });
    return result;
  }, [nodePositions]);

  const getStatusColor = (status: string) => {
    if (status === 'connected') return theme.colors.success;
    if (status === 'weak') return theme.colors.warning;
    return theme.colors.textTertiary;
  };

  return (
    <View style={[styles.graphContainer, { backgroundColor: theme.mode === 'dark' ? '#0E1A22' : '#F0F5F8', borderColor: theme.colors.border }]}>
      <Svg width={GRAPH_SIZE} height={GRAPH_SIZE * 0.85}>
        {/* Background grid */}
        {[0.25, 0.5, 0.75].map((p) => (
          <G key={`grid-${p}`}>
            <Line x1={p * GRAPH_SIZE} y1={0} x2={p * GRAPH_SIZE} y2={GRAPH_SIZE * 0.85} stroke={theme.colors.border} strokeWidth={0.5} opacity={0.3} />
            <Line x1={0} y1={p * GRAPH_SIZE * 0.85} x2={GRAPH_SIZE} y2={p * GRAPH_SIZE * 0.85} stroke={theme.colors.border} strokeWidth={0.5} opacity={0.3} />
          </G>
        ))}

        {/* Connection lines */}
        {links.map((link, i) => (
          <AnimatedLink
            key={`link-${i}`}
            x1={link.from.px}
            y1={link.from.py}
            x2={link.to.px}
            y2={link.to.py}
            color={link.strength === 'strong' ? theme.colors.success : link.strength === 'weak' ? theme.colors.warning : theme.colors.textTertiary}
            delay={i * 60}
            dashed={link.strength === 'offline'}
          />
        ))}

        {/* Nodes */}
        {nodePositions.map((n, i) => (
          <AnimatedGraphNode
            key={n.id}
            node={n}
            color={getStatusColor(n.status)}
            delay={i * 100}
            selected={selectedId === n.id}
            theme={theme}
            onPress={() => onNodePress(n)}
          />
        ))}
      </Svg>
    </View>
  );
};

const AnimatedLink: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  delay: number;
  dashed?: boolean;
}> = ({ x1, y1, x2, y2, color, delay, dashed = false }) => {
  const opacity = useSharedValue(0);
  const dashOffset = useSharedValue(100);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 500 }));
    if (dashed) {
      dashOffset.value = withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [delay, opacity, dashOffset, dashed]);

  const AnimatedLine = React.useMemo(() => Animated.createAnimatedComponent(Line), []);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    strokeDashoffset: dashed ? dashOffset.value : 0,
  }));

  return (
    <AnimatedLine
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={dashed ? 1 : 1.5}
      animatedProps={animatedProps}
      strokeDasharray={dashed ? '4 4' : undefined}
    />
  );
};

const AnimatedGraphNode: React.FC<{
  node: any;
  color: string;
  delay: number;
  selected: boolean;
  theme: any;
  onPress: () => void;
}> = ({ node, color, delay, selected, theme, onPress }) => {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 200 }));
    glowOpacity.value = withDelay(
      delay + 300,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, glowOpacity]);

  const AnimatedCircle = React.useMemo(() => Animated.createAnimatedComponent(Circle), []);
  const AnimatedG = React.useMemo(() => Animated.createAnimatedComponent(G), []);

  const nodeAnimatedProps = useAnimatedProps(() => ({
    transform: [{ scaleX: scale.value }, { scaleY: scale.value }],
    transformOrigin: `${node.px}px ${node.py}px`,
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  const isHub = node.type === 'hub';
  const nodeRadius = isHub ? 14 : node.type === 'school' ? 11 : 8;
  const glowRadius = isHub ? 26 : node.type === 'school' ? 20 : 16;

  return (
    <G onPressIn={onPress}>
      {/* Glow */}
      <AnimatedCircle
        cx={node.px}
        cy={node.py}
        r={glowRadius}
        fill={color}
        animatedProps={glowAnimatedProps}
      />
      {/* Outer ring (selected) */}
      {selected && (
        <Circle
          cx={node.px}
          cy={node.py}
          r={nodeRadius + 6}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.6}
        />
      )}
      {/* Node */}
      <AnimatedCircle
        cx={node.px}
        cy={node.py}
        r={nodeRadius}
        fill={color}
        animatedProps={nodeAnimatedProps}
      />
      {/* Inner highlight */}
      <Circle
        cx={node.px - nodeRadius * 0.3}
        cy={node.py - nodeRadius * 0.3}
        r={nodeRadius * 0.35}
        fill="#FFFFFF"
        opacity={0.4}
      />
    </G>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Sync hero
  syncHeroCard: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  syncHeroOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(23,193,178,0.08)',
  },
  syncHeroContent: {
    gap: 14,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17C3B2',
  },
  syncStatusLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(23,193,178,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23,193,178,0.3)',
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: '#17C3B2',
    fontSize: 12,
    fontWeight: '700',
  },
  syncStatusBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  syncSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  healthBarWrap: {
    marginTop: 4,
  },
  healthBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  healthLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  healthValue: {
    color: '#17C3B2',
    fontSize: 13,
    fontWeight: '800',
  },
  healthBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#17C3B2',
    borderRadius: 3,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Graph
  graphContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
  },
  statCardSmall: {
    padding: 12,
  },
  // Sync history
  syncHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncHistoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  syncHistoryMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  syncHistoryTime: {
    fontSize: 11,
    fontWeight: '600',
  },
});
