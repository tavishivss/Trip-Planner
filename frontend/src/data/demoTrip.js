export const demoKpis = [
  { label: 'Total distance', value: '1,426', unit: 'mi', trend: '+3 stops planned' },
  { label: 'Drive time', value: '25.1', unit: 'hrs', trend: 'HOS compliant' },
  { label: 'Trip length', value: '3', unit: 'days', trend: '2 reset windows' },
  { label: 'Fuel stops', value: '2', unit: 'planned', trend: '1,000 mi cadence' },
];

export const demoEvents = [
  {
    type: 'Pickup',
    location: 'Dallas, TX terminal',
    time: 'Today, 8:00 AM',
    detail: '1.0h loading window',
    tone: 'blue',
  },
  {
    type: 'Break',
    location: 'I-40 rest area',
    time: 'Today, 3:30 PM',
    detail: '30 min HOS break',
    tone: 'amber',
  },
  {
    type: 'Fuel',
    location: 'Amarillo, TX',
    time: 'Tonight, 7:10 PM',
    detail: 'Fuel and inspection',
    tone: 'slate',
  },
  {
    type: 'Reset',
    location: 'Albuquerque, NM',
    time: 'Tomorrow, 6:00 AM',
    detail: '10h off-duty reset',
    tone: 'emerald',
  },
];

export const demoLogs = [
  { day: 'Day 1', drive: '9.4h', duty: '11.2h', status: 'Compliant' },
  { day: 'Day 2', drive: '10.6h', duty: '12.8h', status: 'Compliant' },
  { day: 'Day 3', drive: '5.1h', duty: '6.0h', status: 'Pending' },
];
