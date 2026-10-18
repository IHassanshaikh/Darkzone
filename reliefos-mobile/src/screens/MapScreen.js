import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Navigation, Compass, Radio, Users, Tent, AlertTriangle, ChevronRight, Send, Plus, Minus } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { MOCK_VOLUNTEERS } from '../data/mockVolunteers';
import { MOCK_CAMPS } from '../data/mockCamps';

export default function MapScreen({ onSelectVolunteer, onSelectCamp, onSendFieldTeam }) {
  const [selectedVolunteer, setSelectedVolunteer] = useState(MOCK_VOLUNTEERS[0]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Map Card */}
      <View style={styles.mapCard}>
        {/* Map Header Strip */}
        <View style={styles.mapHeader}>
          <View style={styles.mapTitleLeft}>
            <MapPin color="#2D4A22" size={14} />
            <Text style={styles.mapTitle}>Khanpur Disaster Sector</Text>
          </View>
          <View style={styles.osmBadge}>
            <Text style={styles.osmBadgeText}>OpenStreetMap</Text>
          </View>
        </View>

        {/* Visual Map Canvas with River & Topographic Tones */}
        <View style={styles.mapCanvas}>
          {/* River / Waterway Vector */}
          <View style={styles.riverCurve} />

          {/* Potential Dark Zone Beacon (Purple Concentric Pulse from Screenshot) */}
          <View style={[styles.darkZoneContainer, { top: '38%', right: '28%' }]}>
            <View style={[styles.darkZoneRing, { width: 110, height: 110, borderRadius: 55 }]} />
            <View style={[styles.darkZoneRing, { width: 70, height: 70, borderRadius: 35 }]} />
            <View style={styles.darkZoneCenter}>
              <AlertTriangle color="#FFFFFF" size={12} strokeWidth={2.5} />
            </View>
            <View style={styles.darkZoneCallout}>
              <Text style={styles.darkZoneCalloutTitle}>Potential Dark Zone</Text>
              <Text style={styles.darkZoneCalloutSub}>Silence ratio >= 0.6</Text>
            </View>
          </View>

          {/* Camp 1 Pin (Green Circular Badge) */}
          <TouchableOpacity 
            style={[styles.campPin, { top: '24%', left: '22%' }]}
            onPress={() => onSelectCamp && onSelectCamp(MOCK_CAMPS[0])}
            activeOpacity={0.8}
          >
            <Tent color="#FFFFFF" size={12} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Camp 2 Pin */}
          <TouchableOpacity 
            style={[styles.campPin, { bottom: '32%', left: '38%' }]}
            onPress={() => onSelectCamp && onSelectCamp(MOCK_CAMPS[1])}
            activeOpacity={0.8}
          >
            <Tent color="#FFFFFF" size={12} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Camp 3 Pin */}
          <TouchableOpacity 
            style={[styles.campPin, { bottom: '18%', right: '35%' }]}
            onPress={() => onSelectCamp && onSelectCamp(MOCK_CAMPS[2])}
            activeOpacity={0.8}
          >
            <Tent color="#FFFFFF" size={12} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Volunteer Pin (Sara / Alex) */}
          <TouchableOpacity 
            style={[styles.volunteerPin, { top: '55%', left: '18%' }]}
            onPress={() => onSelectVolunteer && onSelectVolunteer(selectedVolunteer)}
            activeOpacity={0.8}
          >
            <Radio color="#FFFFFF" size={11} strokeWidth={2.5} />
            <View style={styles.volCallout}>
              <Text style={styles.volCalloutText}>Sara (120m)</Text>
            </View>
          </TouchableOpacity>

          {/* Map Controls (+ / -) */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn}>
              <Plus color="#1A251B" size={14} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity style={styles.zoomBtn}>
              <Minus color="#1A251B" size={14} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Map Legend Strip */}
          <View style={styles.legendStrip}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: '#2D4A22' }]}>
                <Tent color="#FFFFFF" size={9} />
              </View>
              <Text style={styles.legendText}>Camp</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: '#7C3AED' }]}>
                <AlertTriangle color="#FFFFFF" size={9} />
              </View>
              <Text style={styles.legendText}>Dark Zone</Text>
            </View>
            <Text style={styles.legendMuted}>Silence Ratio >= 0.6</Text>
          </View>
        </View>
      </View>

      {/* PRIORITY ACTION LIST (FROM SCREENSHOT) */}
      <View style={styles.actionSectionCard}>
        <View style={styles.actionHeader}>
          <View style={styles.actionHeaderLeft}>
            <Text style={styles.actionTitle}>Priority Action List</Text>
            <View style={styles.redCountBadge}>
              <Text style={styles.redCountText}>3</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All {'->'}</Text>
          </TouchableOpacity>
        </View>

        {/* Priority Item 1: Potential Dark Zone */}
        <TouchableOpacity style={styles.priorityItem} activeOpacity={0.8}>
          <View style={[styles.priorityNumber, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.priorityNumberText}>1</Text>
          </View>
          <View style={styles.priorityBody}>
            <Text style={styles.priorityTitle}>Potential Dark Zone — North Valley</Text>
            <Text style={styles.prioritySub}>Silence ratio 0.68 • No recent activity (2h)</Text>
          </View>
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>CRITICAL</Text>
          </View>
          <ChevronRight color="#8F9B8C" size={16} />
        </TouchableOpacity>

        {/* Priority Item 2: Medical Supplies Low */}
        <TouchableOpacity style={styles.priorityItem} activeOpacity={0.8}>
          <View style={[styles.priorityNumber, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.priorityNumberText}>2</Text>
          </View>
          <View style={styles.priorityBody}>
            <Text style={styles.priorityTitle}>Medical Supplies Low — Camp 3</Text>
            <Text style={styles.prioritySub}>Only 12% remaining • 48 people affected</Text>
          </View>
          <View style={styles.highBadge}>
            <Text style={styles.highText}>HIGH</Text>
          </View>
          <ChevronRight color="#8F9B8C" size={16} />
        </TouchableOpacity>

        {/* Priority Item 3: Water Tanker Delayed */}
        <TouchableOpacity style={[styles.priorityItem, { borderBottomWidth: 0 }]} activeOpacity={0.8}>
          <View style={[styles.priorityNumber, { backgroundColor: '#16A34A' }]}>
            <Text style={styles.priorityNumberText}>3</Text>
          </View>
          <View style={styles.priorityBody}>
            <Text style={styles.priorityTitle}>Water Tanker Delayed — Camp 7</Text>
            <Text style={styles.prioritySub}>ETA 3h 20m • Road blockage</Text>
          </View>
          <View style={styles.mediumBadge}>
            <Text style={styles.mediumText}>MEDIUM</Text>
          </View>
          <ChevronRight color="#8F9B8C" size={16} />
        </TouchableOpacity>
      </View>

      {/* SEND FIELD TEAM ACTION BAR (FROM SCREENSHOT) */}
      <TouchableOpacity 
        style={styles.sendFieldTeamBtn} 
        onPress={onSendFieldTeam}
        activeOpacity={0.85}
      >
        <Navigation color="#FFFFFF" size={16} strokeWidth={2.5} />
        <Text style={styles.sendFieldTeamText}>Send Field Team</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5EB',
  },
  scrollContent: {
    padding: 12,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2E9',
  },
  mapTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    color: '#1A251B',
    fontSize: 12,
    fontWeight: '700',
  },
  osmBadge: {
    backgroundColor: '#F4F5EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  osmBadgeText: {
    color: '#576356',
    fontSize: 9.5,
    fontWeight: '600',
  },
  mapCanvas: {
    height: 240,
    backgroundColor: '#E5EDD8',
    position: 'relative',
    overflow: 'hidden',
  },
  riverCurve: {
    position: 'absolute',
    top: 30,
    bottom: -20,
    right: 50,
    width: 60,
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '-35deg' }],
    opacity: 0.7,
    borderRadius: 30,
  },
  darkZoneContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkZoneRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  darkZoneCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  darkZoneCallout: {
    position: 'absolute',
    top: -34,
    backgroundColor: 'rgba(26, 37, 27, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 130,
    alignItems: 'center',
  },
  darkZoneCalloutTitle: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  darkZoneCalloutSub: {
    color: '#D1DEC9',
    fontSize: 8.5,
  },
  campPin: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2D4A22',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  volunteerPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  volCallout: {},
  volCalloutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  zoomControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1DEC9',
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#D1DEC9',
  },
  legendStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E4E7D7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    color: '#1A251B',
    fontSize: 9.5,
    fontWeight: '600',
  },
  legendMuted: {
    color: '#8F9B8C',
    fontSize: 8.5,
    marginLeft: 'auto',
  },
  actionSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2E9',
  },
  actionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionTitle: {
    color: '#1A251B',
    fontSize: 13,
    fontWeight: '800',
  },
  redCountBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  redCountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  viewAllText: {
    color: '#2D4A22',
    fontSize: 10.5,
    fontWeight: '700',
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F0',
  },
  priorityNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  priorityBody: {
    flex: 1,
  },
  priorityTitle: {
    color: '#1A251B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  prioritySub: {
    color: '#576356',
    fontSize: 10,
    marginTop: 1,
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  criticalText: {
    color: '#DC2626',
    fontSize: 8.5,
    fontWeight: '800',
  },
  highBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highText: {
    color: '#D97706',
    fontSize: 8.5,
    fontWeight: '800',
  },
  mediumBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediumText: {
    color: '#16A34A',
    fontSize: 8.5,
    fontWeight: '800',
  },
  sendFieldTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D4A22',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendFieldTeamText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
