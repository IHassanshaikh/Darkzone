/**
 * ReliefOS Mobile StorageService
 * Manages local offline persistence using AsyncStorage
 * Implements offline queue with automatic store-and-forward sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_MESSAGES = '@reliefos_citizen_messages';
const STORAGE_KEY_SETTINGS = '@reliefos_citizen_settings';

class StorageService {
  /**
   * Retrieves all saved emergency messages from offline storage
   */
  async getMessages() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('Storage read error, using empty state:', err);
      return [];
    }
  }

  /**
   * Saves a newly created distress message locally
   */
  async saveMessage(message) {
    try {
      const existing = await this.getMessages();
      const updated = [message, ...existing];
      await AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Storage write error:', err);
      return [];
    }
  }

  /**
   * Updates delivery pipeline status (queued -> ble_sent -> volunteer_delivered -> relayed_hq)
   */
  async updateMessageStatus(messageId, status) {
    try {
      const existing = await this.getMessages();
      const updated = existing.map(m => m.id === messageId ? { ...m, status } : m);
      await AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Storage update error:', err);
      return [];
    }
  }

  /**
   * Syncs queued offline messages to ReliefOS Central Backend once an internet gateway is reached
   */
  async syncToCentralHQ(backendUrl = 'http://localhost:3000/api/v1/reports') {
    try {
      const messages = await this.getMessages();
      const unsynced = messages.filter(m => m.status !== 'relayed_hq');

      for (const msg of unsynced) {
        try {
          await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              areaId: 'area-c',
              text: `[CITIZEN SOS MESH] ${msg.text} (Delivered by Volunteer ${msg.recipient})`,
              source: 'citizen_mobile_ble',
              extracted: {
                urgency: msg.category === 'Medical Assistance' ? 'critical' : 'high',
                assistanceNeeded: msg.category || 'Emergency Relief'
              }
            })
          });
          await this.updateMessageStatus(msg.id, 'relayed_hq');
        } catch (postErr) {
          console.warn('Backend sync failed, packet kept in offline queue:', postErr);
        }
      }
    } catch (err) {
      console.warn('Sync loop error:', err);
    }
  }
}

export const storageService = new StorageService();
