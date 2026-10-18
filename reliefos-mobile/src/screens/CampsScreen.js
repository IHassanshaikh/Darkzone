import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { 
  Search, 
  Compass, 
  Tent, 
  Navigation, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  Droplet,
  Package,
  HeartPulse,
  Home,
  AlertTriangle
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import CampCard from '../components/CampCard';
import SOSButton from '../components/SOSButton';
import { MOCK_CAMPS } from '../data/mockCamps';

export default function CampsScreen({ onShowOnMap, onTriggerSOS }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredCamps = useMemo(() => {
    return MOCK_CAMPS.filter(camp => {
      const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.bearing.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterType === 'open') {
        const occupancyPct = Math.round((camp.occupancy / camp.capacity) * 100);
        return occupancyPct < 90;
      }
      return true;
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [searchQuery, filterType]);

  const nearestCamp = MOCK_CAMPS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* CAMP HERO RESIDENT CARD FROM USER SCREENSHOT */}
      <View style={styles.heroCampCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconBox}>
            <Tent color="#2D4A22" size={20} strokeWidth={2.2} />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Camp 3</Text>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>Khanpur Valley</Text>
            <Text style={styles.heroResidents}>1,240 residents</Text>
          </View>
          <ChevronRight color="#8F9B8C" size={20} />
        </View>
      </View>

      {/* SERVICE STATUS TRACKER FROM USER SCREENSHOT */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <CheckCircle2 color="#2D4A22" size={15} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Service Status Tracker</Text>
          </View>
          <Text style={styles.sectionHint}>Allocated Resources</Text>
        </View>

        {/* Water Service */}
        <View style={styles.serviceRow}>
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Droplet color="#0284C7" size={14} />
            </View>
            <View>
              <Text style={styles.serviceName}>Water</Text>
              <Text style={styles.serviceSub}>500 L allocated</Text>
            </View>
          </View>
          <View style={styles.receivedBadge}>
            <CheckCircle2 color="#16A34A" size={12} strokeWidth={2.5} />
            <Text style={styles.receivedText}>Received</Text>
          </View>
        </View>

        {/* Food Service */}
        <View style={styles.serviceRow}>
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Package color="#15803D" size={14} />
            </View>
            <View>
              <Text style={styles.serviceName}>Food</Text>
              <Text style={styles.serviceSub}>800 kg allocated</Text>
            </View>
          </View>
          <View style={styles.receivedBadge}>
            <CheckCircle2 color="#16A34A" size={12} strokeWidth={2.5} />
            <Text style={styles.receivedText}>Received</Text>
          </View>
        </View>

        {/* Medical Kits Service */}
        <View style={styles.serviceRow}>
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <HeartPulse color="#DC2626" size={14} />
            </View>
            <View>
              <Text style={styles.serviceName}>Medical Kits</Text>
              <Text style={styles.serviceSub}>50 kits allocated</Text>
            </View>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        </View>

        {/* Shelter Service */}
        <View style={[styles.serviceRow, { borderBottomWidth: 0 }]}>
          <View style={styles.serviceLeft}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#E8EFE5' }]}>
              <Home color="#2D4A22" size={14} />
            </View>
            <View>
              <Text style={styles.serviceName}>Shelter</Text>
              <Text style={styles.serviceSub}>12 tents allocated</Text>
            </View>
          </View>
          <View style={styles.receivedBadge}>
            <CheckCircle2 color="#16A34A" size={12} strokeWidth={2.5} />
            <Text style={styles.receivedText}>Verified</Text>
          </View>
        </View>
      </View>

      {/* PROMINENT RED SOS BANNER FROM SCREENSHOT */}
      <View style={styles.bannerWrapper}>
        <SOSButton
          isBanner={true}
          onPress={() => onTriggerSOS && onTriggerSOS()}
        />
      </View>

      {/* ALL NEARBY SHELTERS SECTION */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>NEARBY RELIEF SHELTERS</Text>
        <Text style={styles.listHeaderCount}>{filteredCamps.length} Shelters</Text>
      </View>

      {filteredCamps.map(camp => (
        <CampCard 
          key={camp.id} 
          camp={camp} 
          onShowOnMap={onShowOnMap}
        />
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5EB',
  },
  contentContainer: {
    padding: 12,
  },
  heroCampCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8EFE5',
    borderWidth: 1,
    borderColor: '#D1DEC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#1A251B',
    fontSize: 15,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  activePillText: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#576356',
    fontSize: 11.5,
    marginTop: 2,
  },
  heroResidents: {
    color: '#8F9B8C',
    fontSize: 10.5,
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2E9',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#1A251B',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sectionHint: {
    color: '#576356',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F0',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    color: '#1A251B',
    fontSize: 12,
    fontWeight: '700',
  },
  serviceSub: {
    color: '#576356',
    fontSize: 10,
  },
  receivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  receivedText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },
  bannerWrapper: {
    marginBottom: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  listHeaderTitle: {
    color: '#576356',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listHeaderCount: {
    color: '#8F9B8C',
    fontSize: 10,
    fontWeight: '600',
  },
});
