import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Bell, Trees, Wifi, WifiOff, Smartphone, Bluetooth, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function HeaderStatusBar({ 
  hasWifi = false, 
  onToggleWifi, 
  userRole = 'Camp Resident',
  badgeCount = 1,
  avatarText = 'CR',
  nearbyPhonesCount = 3,
  onSyncPress
}) {
  return (
    <View style={styles.wrapper}>
      {/* Forest Green Gradient Header Strip */}
      <View style={styles.forestHeader}>
        {/* SVG Vector Gradient Background (#1C3315 -> #2D4A22 -> #3E6630) */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <SvgGradient id="forestHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1C3315" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2D4A22" stopOpacity="1" />
              <Stop offset="100%" stopColor="#3E6630" stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#forestHeaderGrad)" />
        </Svg>

        <View style={styles.leftBrand}>
          <View style={styles.logoBadge}>
            <Trees color="#2D4A22" size={16} strokeWidth={2.5} />
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.brandTitle}>ReliefOS</Text>
            <Text style={styles.roleSubtitle}>{userRole}</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {/* Notification Bell with Red Badge */}
          <View style={styles.bellWrapper}>
            <Bell color="#FFFFFF" size={18} />
            {badgeCount > 0 && (
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>

          {/* User Avatar Circle */}
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
        </View>
      </View>

      {/* Network Mode Status Banner: Wi-Fi vs Mobile-to-Mobile */}
      <View style={[styles.networkBanner, hasWifi ? styles.bannerWifi : styles.bannerMesh]}>
        <TouchableOpacity 
          style={styles.networkLeft} 
          onPress={onToggleWifi}
          activeOpacity={0.8}
        >
          {hasWifi ? (
            <Wifi color="#15803D" size={14} strokeWidth={2.5} />
          ) : (
            <Smartphone color="#92400E" size={14} strokeWidth={2.5} />
          )}

          <View>
            <Text style={[styles.networkTitle, { color: hasWifi ? '#15803D' : '#92400E' }]}>
              {hasWifi 
                ? 'Wi-Fi / Cellular Connected' 
                : 'No Wi-Fi — Mobile-to-Mobile Relay Active'}
            </Text>
            <Text style={styles.networkSub}>
              {hasWifi 
                ? 'Direct cloud transmission to ReliefOS HQ' 
                : `Packets hop phone-to-phone (${nearbyPhonesCount} nearby phones within 30m)`}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.networkToggleBtn, { backgroundColor: hasWifi ? '#15803D' : '#2D4A22' }]} 
          onPress={onToggleWifi}
          activeOpacity={0.85}
        >
          {hasWifi ? (
            <WifiOff color="#FFFFFF" size={10} style={{ marginRight: 3 }} />
          ) : (
            <Wifi color="#FFFFFF" size={10} style={{ marginRight: 3 }} />
          )}
          <Text style={styles.networkToggleBtnText}>
            {hasWifi ? 'Simulate No Wi-Fi' : 'Enable Wi-Fi'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F4F5EB',
  },
  forestHeader: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 13,
  },
  leftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  roleSubtitle: {
    color: '#D1DEC9',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: -1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  bellWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  redBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  avatarPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  networkBanner: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bannerMesh: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#FDE68A',
  },
  bannerWifi: {
    backgroundColor: '#DCFCE7',
    borderBottomColor: '#BBF7D0',
  },
  networkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 6,
  },
  networkTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  networkSub: {
    color: '#78350F',
    fontSize: 9.5,
    marginTop: 0.5,
  },
  networkToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  networkToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
});
