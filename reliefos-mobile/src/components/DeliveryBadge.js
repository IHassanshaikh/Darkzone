import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Smartphone, CheckCircle2, ShieldCheck, Wifi } from 'lucide-react-native';

export default function DeliveryBadge({ status, isMobileToMobile = true, hopInfo }) {
  if (status === 'queued') {
    return (
      <View style={[styles.badge, styles.queuedBadge]}>
        <Clock color="#92400E" size={11} strokeWidth={2.5} />
        <Text style={[styles.text, { color: '#92400E' }]}>
          {isMobileToMobile ? 'No Wi-Fi • Stored on Mobile Phone' : 'Queued for Cloud Upload'}
        </Text>
      </View>
    );
  }

  if (status === 'ble_sent') {
    return (
      <View style={[styles.badge, styles.hoppingBadge]}>
        <Smartphone color="#92400E" size={11} strokeWidth={2.5} />
        <Text style={[styles.text, { color: '#92400E' }]}>
          Mobile-to-Mobile Hop 1 (Nearest Citizen Phone)
        </Text>
      </View>
    );
  }

  if (status === 'volunteer_delivered') {
    return (
      <View style={[styles.badge, styles.deliveredBadge]}>
        <CheckCircle2 color="#15803D" size={11} strokeWidth={2.5} />
        <Text style={[styles.text, { color: '#15803D' }]}>
          Delivered to Responder Mobile (Sara Khan)
        </Text>
      </View>
    );
  }

  if (status === 'relayed_hq') {
    return (
      <View style={[styles.badge, styles.hqBadge]}>
        <ShieldCheck color="#15803D" size={11} strokeWidth={2.5} />
        <Text style={[styles.text, { color: '#15803D', fontWeight: '800' }]}>
          {isMobileToMobile ? 'Relayed via Mesh to ReliefOS HQ' : 'Direct Cloud Upload to HQ'}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  queuedBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  hoppingBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  deliveredBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  hqBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  text: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
