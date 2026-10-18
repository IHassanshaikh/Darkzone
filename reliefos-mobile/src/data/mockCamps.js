export const MOCK_CAMPS = [
  {
    id: 'camp-a',
    name: 'Camp Alpha (Central Stadium)',
    lat: 24.8580,
    lng: 67.0420,
    distanceMeters: 450,
    distanceText: '450m away',
    walkTime: '12 min walk',
    bearing: 'Southeast (135°)',
    occupancy: 180,
    capacity: 250,
    status: 'open',
    supplies: {
      water: 'High Reserve (1,200L)',
      food: 'Adequate (3 Days)',
      medical: 'First Aid On-Site'
    }
  },
  {
    id: 'camp-d',
    name: 'Camp Delta (Railway High School)',
    lat: 24.8690,
    lng: 67.0280,
    distanceMeters: 850,
    distanceText: '850m away',
    walkTime: '22 min walk',
    bearing: 'Northwest (315°)',
    occupancy: 95,
    capacity: 150,
    status: 'open',
    supplies: {
      water: 'Available (650L)',
      food: 'High Stock (5 Days)',
      medical: 'Doctor on Standby'
    }
  },
  {
    id: 'camp-b',
    name: 'Camp Beta (Coastal Primary)',
    lat: 24.8450,
    lng: 67.0250,
    distanceMeters: 1400,
    distanceText: '1.4 km away',
    walkTime: '35 min walk',
    bearing: 'South (180°)',
    occupancy: 290,
    capacity: 300,
    status: 'near_capacity',
    supplies: {
      water: 'Shortage (Low Stock)',
      food: 'Rations Running Low',
      medical: 'Emergency Clinic'
    }
  }
];
