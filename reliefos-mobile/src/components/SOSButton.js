import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function SOSButton({ 
  title, 
  subtitle, 
  badge, 
  Icon, 
  color = '#DC2626', 
  bgColor = '#FEE2E2', 
  borderColor = '#FECACA',
  onPress,
  disabled = false,
  isBanner = false
}) {
  if (isBanner) {
    return (
      <TouchableOpacity
        style={[styles.bannerButton, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View style={styles.bannerRow}>
          <AlertTriangle color="#FFFFFF" size={16} strokeWidth={2.5} />
          <Text style={styles.bannerTitle}>SOS / Request</Text>
        </View>
        <Text style={styles.bannerSubtitle}>Emergency Help • Tap to notify nearest team</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor: borderColor },
        disabled && styles.disabled
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <View style={styles.topRow}>
        <Icon color={color} size={20} strokeWidth={2.5} />
        {badge && (
          <View style={[styles.badge, { backgroundColor: '#FFFFFF', borderColor: color }]}>
            <Text style={[styles.badgeText, { color: color }]}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: '#1A251B' }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: '#576356' }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 90,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    margin: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  bannerButton: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    color: '#FEE2E2',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
