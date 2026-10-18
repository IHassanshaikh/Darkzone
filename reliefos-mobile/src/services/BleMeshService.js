/**
 * ReliefOS Mobile BleMeshService
 * Manages Device-to-Device (P2P) Bluetooth Low Energy Mesh
 * - Broadcast range: ~30 meters per hop
 * - Store-and-forward packet propagation
 * - Direct hand-off when in proximity of an on-duty Field Volunteer
 */

import { MOCK_VOLUNTEERS } from '../data/mockVolunteers';

class BleMeshService {
  constructor() {
    this.isAdvertising = true;
    this.isScanning = true;
    this.connectedNodes = [];
    this.maxHopLimit = 5;
    this.bleRangeMeters = 30;
  }

  /**
   * Discovers reachable peer devices within BLE radio radius (~30m)
   */
  async scanNearbyNodes() {
    return MOCK_VOLUNTEERS.map(v => ({
      ...v,
      inDirectRadioRange: v.distanceMeters <= this.bleRangeMeters,
      hopsToReach: Math.max(1, Math.ceil(v.distanceMeters / this.bleRangeMeters))
    }));
  }

  /**
   * Broadcasts an encrypted distress message over BLE mesh
   * Propagates packet hop-by-hop until received by nearest volunteer
   */
  async broadcastPacket(encryptedPacket, targetVolunteerId, onHopProgress) {
    const target = MOCK_VOLUNTEERS.find(v => v.id === targetVolunteerId) || MOCK_VOLUNTEERS[0];
    const totalHops = Math.max(1, Math.ceil(target.distanceMeters / this.bleRangeMeters));

    // Simulate multi-hop mesh propagation
    return new Promise((resolve) => {
      let currentHop = 1;

      if (onHopProgress) {
        onHopProgress({
          status: 'ble_sent',
          hop: currentHop,
          totalHops: totalHops,
          relayNode: currentHop === totalHops ? target.name : `Bystander Relay #${currentHop}`
        });
      }

      const hopInterval = setInterval(() => {
        currentHop++;
        if (currentHop <= totalHops) {
          if (onHopProgress) {
            onHopProgress({
              status: 'hopping',
              hop: currentHop,
              totalHops: totalHops,
              relayNode: currentHop === totalHops ? target.name : `Bystander Relay #${currentHop}`
            });
          }
        } else {
          clearInterval(hopInterval);
          if (onHopProgress) {
            onHopProgress({
              status: 'volunteer_delivered',
              hop: totalHops,
              totalHops: totalHops,
              relayNode: target.name
            });
          }
          resolve({
            delivered: true,
            recipient: target.name,
            totalHops: totalHops,
            deliveredAt: Date.now()
          });
        }
      }, 1200);
    });
  }
}

export const bleMeshService = new BleMeshService();
