import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, Droplet, Package, HeartPulse, Tent, ChevronRight, CheckCircle2, Clock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function CampCard({ camp, onShowOnMap, isSelected = false }) {
  const occupancyPct = Math.min(100, Math.round((camp.occupancy / camp.capacity) * 100));
  const isCrowded = occupancyPct >= 90;

  return (
    <View style={[styles.card, isSelected && styles.selectedCard]}>
      {/* Camp Header with Status */}
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.campName}>{camp.name}</Text>
            <View style={styles.activeDotBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.distanceText}>{camp.distanceText}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.walkTimeText}>{camp.walkTime}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.bearingText}>{camp.bearing}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.navigateBtn} 
          onPress={() => onShowOnMap(camp)}
          activeOpacity={0.8}
        >
          <Navigation color="#FFFFFF" size={12} />
          <Text style={styles.navigateBtnText}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Camp Status Overview Progress Section */}
      <View style={styles.overviewSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Camp Status Overview</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.liveText}>Live Updates</Text>
          </View>
        </View>

        {/* Water Stock Bar */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelRow}>
            <View style={styles.iconAndName}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Droplet color="#0284C7" size={12} />
              </View>
              <Text style={styles.metricName}>Water</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricNumbers}>320 / 500 L</Text>
              <Text style={styles.metricPct}>64%</Text>
              <View style={styles.lowStockPill}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '64%', backgroundColor: '#2E7D32' }]} />
          </View>
        </View>

        {/* Food Stock Bar */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelRow}>
            <View style={styles.iconAndName}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Package color="#15803D" size={12} />
              </View>
              <Text style={styles.metricName}>Food</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricNumbers}>480 / 800 kg</Text>
              <Text style={styles.metricPct}>60%</Text>
              <View style={styles.lowStockPill}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '60%', backgroundColor: '#2E7D32' }]} />
          </View>
        </View>

        {/* Medical Stock Bar */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelRow}>
            <View style={styles.iconAndName}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <HeartPulse color="#DC2626" size={12} />
              </View>
              <Text style={styles.metricName}>Medical Goods</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricNumbers}>12 / 50 kits</Text>
              <Text style={styles.metricPct}>24%</Text>
              <View style={styles.lowStockPill}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '24%', backgroundColor: '#EF4444' }]} />
          </View>
        </View>
      </View>

      {/* Shelter Capacity Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.shelterCountText}>
          Shelter Capacity: {camp.occupancy} / {camp.capacity} residents ({occupancyPct}%)
        </Text>
        <Text style={styles.bearingText}>Bearing: {camp.bearing}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2D4A22',
    backgroundColor: '#FAFBF8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2E9',
  },
  titleInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campName: {
    color: '#1A251B',
    fontSize: 14,
    fontWeight: '800',
  },
  activeDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeText: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  distanceText: {
    color: '#16A34A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  dot: {
    color: '#8F9B8C',
    fontSize: 10,
  },
  walkTimeText: {
    color: '#576356',
    fontSize: 10.5,
  },
  bearingText: {
    color: '#8F9B8C',
    fontSize: 10,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D4A22',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  overviewSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#1A251B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricRow: {
    marginBottom: 8,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricName: {
    color: '#1A251B',
    fontSize: 11,
    fontWeight: '600',
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricNumbers: {
    color: '#576356',
    fontSize: 10,
    fontWeight: '600',
  },
  metricPct: {
    color: '#1A251B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  lowStockPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#DC2626',
    fontSize: 8.5,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E9EBE0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F2E9',
  },
  shelterCountText: {
    color: '#576356',
    fontSize: 10,
    fontWeight: '600',
  },
});
