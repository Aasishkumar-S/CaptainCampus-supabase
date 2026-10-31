import dotenv from 'dotenv';
dotenv.config();

import { BusAgent } from './simulator/BusAgent';
import { ROUTE_R1, ROUTE_R2, ROUTE_R3 } from './data/routeData';

// Create 4 BusAgents matching seed data:
// CC-01: Route R1, start stop 0, normal
// CC-02: Route R1, start stop 4, normal (2nd bus same route)
// CC-03: Route R2, start stop 0, normal
// CC-04: Route R3, start stop 0, delayed (demo delay scenario)

const agents: BusAgent[] = [
  new BusAgent({
    busId: 'bus-cc-01',
    busNumber: 'CC-01',
    deviceId: 'SIM-DEVICE-01',
    route: ROUTE_R1,
    startStopIndex: 0,
    scenario: 'normal',
  }),
  new BusAgent({
    busId: 'bus-cc-02',
    busNumber: 'CC-02',
    deviceId: 'SIM-DEVICE-02',
    route: ROUTE_R1,
    startStopIndex: 4,
    scenario: 'normal',
  }),
  new BusAgent({
    busId: 'bus-cc-03',
    busNumber: 'CC-03',
    deviceId: 'SIM-DEVICE-03',
    route: ROUTE_R2,
    startStopIndex: 0,
    scenario: 'normal',
  }),
  new BusAgent({
    busId: 'bus-cc-04',
    busNumber: 'CC-04',
    deviceId: 'SIM-DEVICE-04',
    route: ROUTE_R3,
    startStopIndex: 0,
    scenario: 'delayed',
  }),
];

// Start all agents
agents.forEach((agent) => agent.start());

// Scenario rotation every 5 minutes:
// CC-04 alternates delayed <-> normal
const scenarioInterval = setInterval(() => {
  const cc04 = agents[3];
  const nextScenario = cc04.getScenario() === 'delayed' ? 'normal' : 'delayed';
  console.log(`\n[Scenario Rotation] Toggling CC-04 to ${nextScenario.toUpperCase()}`);
  cc04.setScenario(nextScenario);
}, 5 * 60 * 1000);

// Signal loss simulation every 8 minutes for CC-02 (persists for 30 seconds)
const signalLossInterval = setInterval(() => {
  const cc02 = agents[1];
  console.log(`\n[Scenario Simulation] Simulating signal loss for CC-02 for 30 seconds...`);
  cc02.setScenario('signal_loss');

  setTimeout(() => {
    console.log(`\n[Scenario Simulation] Restoring normal signal for CC-02...`);
    cc02.setScenario('normal');
  }, 30 * 1000);
}, 8 * 60 * 1000);

// Print startup banner
const updateInterval = process.env.SIMULATOR_UPDATE_INTERVAL_MS || 5000;
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000/api/v1';

console.log(`
===========================================================
  Captain Campus GPS Simulator
  Running ${agents.length} bus agents
  Update interval: ${updateInterval}ms
  Backend: ${backendUrl}
===========================================================
  CC-01  Route R1 (Main Gate -> Hostel) [NORMAL]
  CC-02  Route R1 (Main Gate -> Hostel) [NORMAL] offset
  CC-03  Route R2 (Campus Circular)     [NORMAL]
  CC-04  Route R3 (Express)             [DELAYED]
===========================================================
  Press Ctrl+C to stop all bus agents
`);

// Graceful shutdown
const shutdown = () => {
  console.log('\nStopping all bus agents...');
  clearInterval(scenarioInterval);
  clearInterval(signalLossInterval);
  agents.forEach((a) => a.stop());
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
