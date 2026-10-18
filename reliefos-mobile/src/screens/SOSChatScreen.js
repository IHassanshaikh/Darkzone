import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Switch
} from 'react-native';
import { 
  AlertTriangle, 
  HeartPulse, 
  LifeBuoy, 
  Droplet, 
  Navigation, 
  Bluetooth, 
  Lock, 
  Eye, 
  EyeOff, 
  Send,
  Clock,
  CheckCircle2,
  Users,
  Smartphone,
  Wifi,
  WifiOff,
  Radio,
  ArrowRight
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import SOSButton from '../components/SOSButton';
import DeliveryBadge from '../components/DeliveryBadge';
import { MOCK_VOLUNTEERS } from '../data/mockVolunteers';

export default function SOSChatScreen({
  hasWifi = false,
  onToggleWifi,
  mobileToMobileEnabled = true,
  onToggleMobileToMobile,
  selectedVolunteer = MOCK_VOLUNTEERS[0],
  onSelectVolunteer,
  messages = [],
  onSendSOS,
  onSendChat,
  isSending = false
}) {
  const [inputText, setInputText] = useState('');
  const [showCiphertext, setShowCiphertext] = useState(false);

  const handleSend = () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    onSendChat(text);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        
        {/* MOBILE-TO-MOBILE RELAY OPTION CARD (WHEN NO WI-FI) */}
        <View style={[styles.sectionCard, !hasWifi && styles.meshActiveCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Smartphone color={!hasWifi ? '#92400E' : '#15803D'} size={15} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>
                {!hasWifi ? 'Mobile-to-Mobile Relay Mode' : 'Wi-Fi Cloud Mode'}
              </Text>
            </View>
            <View style={[styles.modeBadge, { backgroundColor: !hasWifi ? '#FEF3C7' : '#DCFCE7' }]}>
              <Text style={[styles.modeBadgeText, { color: !hasWifi ? '#92400E' : '#15803D' }]}>
                {!hasWifi ? 'No Wi-Fi' : 'Online'}
              </Text>
            </View>
          </View>

          {/* Option Toggle */}
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Travel Mobile-to-Mobile (No Wi-Fi)</Text>
              <Text style={styles.optionDesc}>
                {!hasWifi
                  ? 'Active: Distress packets hop from phone to phone (BLE ~30m) until reaching a volunteer or satellite terminal.'
                  : 'Standby: Wi-Fi detected. If Wi-Fi drops, messages automatically switch to phone-to-phone hopping.'}
              </Text>
            </View>
            <Switch
              value={mobileToMobileEnabled}
              onValueChange={onToggleMobileToMobile}
              trackColor={{ false: '#E4E7D7', true: '#2D4A22' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Multi-Hop Visual Diagram */}
          {!hasWifi && mobileToMobileEnabled && (
            <View style={styles.hopRouteBox}>
              <Text style={styles.hopRouteTitle}>OFFLINE MOBILE-TO-MOBILE HOP PATH:</Text>
              <View style={styles.hopStepsRow}>
                <View style={styles.hopNode}>
                  <Smartphone color="#2D4A22" size={13} strokeWidth={2.5} />
                  <Text style={styles.hopNodeText}>Your Phone</Text>
                </View>
                <ArrowRight color="#8F9B8C" size={11} />
                <View style={styles.hopNode}>
                  <Smartphone color="#92400E" size={13} strokeWidth={2.5} />
                  <Text style={styles.hopNodeText}>Peer Phone (14m)</Text>
                </View>
                <ArrowRight color="#8F9B8C" size={11} />
                <View style={styles.hopNode}>
                  <Users color="#15803D" size={13} strokeWidth={2.5} />
                  <Text style={styles.hopNodeText}>Responder</Text>
                </View>
                <ArrowRight color="#8F9B8C" size={11} />
                <View style={styles.hopNode}>
                  <Radio color="#2D4A22" size={13} strokeWidth={2.5} />
                  <Text style={styles.hopNodeText}>ReliefOS HQ</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* PROMINENT RED SOS BANNER FROM SCREENSHOT */}
        <View style={styles.bannerWrapper}>
          <SOSButton
            isBanner={true}
            onPress={() => onSendSOS('Immediate SOS', { text: 'Emergency SOS Broadcast: Citizen trapped in Sector Delta 9, immediate help requested!' })}
            disabled={isSending}
          />
        </View>

        {/* ONE-TAP EMERGENCY SOS GRID */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <AlertTriangle color="#DC2626" size={15} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>One-Tap Emergency SOS</Text>
            </View>
            <Text style={styles.sectionHint}>
              {!hasWifi ? 'Mobile-to-Mobile Hop' : 'Direct Cloud'}
            </Text>
          </View>

          <View style={styles.gridRow}>
            <SOSButton
              title="Medical Help"
              subtitle="Trauma / Insulin"
              badge="CRITICAL"
              Icon={HeartPulse}
              color="#DC2626"
              bgColor="#FEE2E2"
              borderColor="#FECACA"
              onPress={() => onSendSOS('Medical Assistance', { text: 'Urgent medical aid required: Trauma treatment or cold-chain insulin needed.' })}
              disabled={isSending}
            />

            <SOSButton
              title="Rescue Needed"
              subtitle="Trapped / Debris"
              badge="URGENT"
              Icon={LifeBuoy}
              color="#7C3AED"
              bgColor="#F3E8FF"
              borderColor="#E9D5FF"
              onPress={() => onSendSOS('Rescue Needed', { text: 'Trapped on rooftop due to rising floodwaters and structural debris.' })}
              disabled={isSending}
            />
          </View>

          <View style={styles.gridRow}>
            <SOSButton
              title="Clean Water"
              subtitle="Rations Depleted"
              badge="SUPPLY"
              Icon={Droplet}
              color="#0284C7"
              bgColor="#E0F2FE"
              borderColor="#BAE6FD"
              onPress={() => onSendSOS('Clean Water', { text: 'Drinking water exhausted for 12 individuals including infants.' })}
              disabled={isSending}
            />

            <SOSButton
              title="Evacuation Boat"
              subtitle="Flooding Level 2"
              badge="BOAT"
              Icon={Navigation}
              color="#16A34A"
              bgColor="#DCFCE7"
              borderColor="#BBF7D0"
              onPress={() => onSendSOS('Evacuation Boat', { text: 'Boat evacuation requested: Ground level fully submerged.' })}
              disabled={isSending}
            />
          </View>
        </View>

        {/* VOLUNTEER MESH TARGET SELECTOR */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Users color="#2D4A22" size={15} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Relay via Nearby Volunteer</Text>
            </View>
            <Text style={styles.sectionHint}>Nearest Responder Node</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.volunteerScroll}>
            {MOCK_VOLUNTEERS.map(v => {
              const isSelected = selectedVolunteer.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.volunteerPill, isSelected && styles.volunteerPillSelected]}
                  onPress={() => onSelectVolunteer(v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.volIconBox, isSelected && styles.volIconBoxSelected]}>
                    <Users color={isSelected ? '#FFFFFF' : '#2D4A22'} size={12} />
                  </View>
                  <View>
                    <Text style={[styles.volName, isSelected && styles.volNameSelected]}>{v.name}</Text>
                    <Text style={styles.volDistance}>{v.distanceText} • {v.signalQuality}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SECURE DIRECT CHAT & TRANSMISSION PIPELINE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Lock color="#15803D" size={14} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>E2EE Message Thread</Text>
            </View>
            <TouchableOpacity 
              style={styles.cipherToggle}
              onPress={() => setShowCiphertext(prev => !prev)}
            >
              {showCiphertext ? <EyeOff color="#576356" size={12} /> : <Eye color="#576356" size={12} />}
              <Text style={styles.cipherToggleText}>{showCiphertext ? 'Hide Cipher' : 'Inspect AES-256'}</Text>
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          <View style={styles.messagesList}>
            {messages.map(m => {
              const isUser = !m.isFromVolunteer;
              return (
                <View 
                  key={m.id} 
                  style={[
                    styles.messageBubble, 
                    isUser ? styles.userBubble : styles.volunteerBubble
                  ]}
                >
                  <View style={styles.messageMeta}>
                    <Text style={styles.senderName}>
                      {isUser ? `You -> ${m.recipient || selectedVolunteer.name}` : m.volunteerName}
                    </Text>
                    <Text style={styles.timestamp}>{m.timestamp}</Text>
                  </View>

                  <Text style={styles.messageText}>{m.text}</Text>

                  {/* Cryptographic Ciphertext Display */}
                  {showCiphertext && m.cipher && (
                    <View style={styles.cipherBox}>
                      <Text style={styles.cipherHashText}>Cipher: {m.cipher}</Text>
                    </View>
                  )}

                  {/* Hop info for Mobile-to-Mobile */}
                  {m.hopRoute && (
                    <Text style={styles.routeText}>Relay Route: {m.hopRoute}</Text>
                  )}

                  {/* 4-Step Delivery Pipeline Badge */}
                  <DeliveryBadge 
                    status={m.status} 
                    isMobileToMobile={!hasWifi && mobileToMobileEnabled}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM INPUT BAR */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={`Send distress msg to ${selectedVolunteer.name.split(' ')[0]}...`}
          placeholderTextColor="#8F9B8C"
          value={inputText}
          onChangeText={setInputText}
          multiline={false}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Send color="#FFFFFF" size={14} />
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5EB',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  sectionCard: {
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
  meshActiveCard: {
    borderColor: '#F59E0B',
    backgroundColor: '#FAFBF8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
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
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHint: {
    color: '#576356',
    fontSize: 9.5,
    fontWeight: '600',
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: '#1A251B',
    fontSize: 12,
    fontWeight: '700',
  },
  optionDesc: {
    color: '#576356',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  hopRouteBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hopRouteTitle: {
    color: '#92400E',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  hopStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hopNode: {
    alignItems: 'center',
    gap: 2,
  },
  hopNodeText: {
    color: '#1A251B',
    fontSize: 8,
    fontWeight: '700',
  },
  bannerWrapper: {
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 4,
  },
  volunteerScroll: {
    flexDirection: 'row',
  },
  volunteerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFBF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  volunteerPillSelected: {
    backgroundColor: '#E8EFE5',
    borderColor: '#2D4A22',
  },
  volIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E4E7D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volIconBoxSelected: {
    backgroundColor: '#2D4A22',
  },
  volName: {
    color: '#1A251B',
    fontSize: 11,
    fontWeight: '700',
  },
  volNameSelected: {
    color: '#2D4A22',
  },
  volDistance: {
    color: '#576356',
    fontSize: 9.5,
  },
  cipherToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F5EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cipherToggleText: {
    color: '#576356',
    fontSize: 9,
    fontWeight: '700',
  },
  messagesList: {
    gap: 8,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  userBubble: {
    backgroundColor: '#FAFBF8',
    borderColor: '#D1DEC9',
    marginLeft: 16,
  },
  volunteerBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E7D7',
    marginRight: 16,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  senderName: {
    color: '#2D4A22',
    fontSize: 9.5,
    fontWeight: '700',
  },
  timestamp: {
    color: '#8F9B8C',
    fontSize: 9,
  },
  messageText: {
    color: '#1A251B',
    fontSize: 12,
    lineHeight: 17,
  },
  cipherBox: {
    backgroundColor: '#1E2922',
    padding: 6,
    borderRadius: 6,
    marginTop: 2,
  },
  cipherHashText: {
    color: '#86EFAC',
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  routeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7D7',
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F5EB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E7D7',
    color: '#1A251B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D4A22',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
