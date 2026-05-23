export interface GameFile {
  name: string;
  content: string;
}

export interface GameNode {
  id: string;
  name: string;
  status: string;
  files: Record<string, string>; // path -> content
  connections: string[]; // array of node IDs
  isLocked?: boolean;
  unlockKeyword?: string;
  unlockMessage?: string;
}

export const INITIAL_WORLD: Record<string, GameNode> = {
  'relay-7': {
    id: 'relay-7',
    name: 'relay-7',
    status: 'unstable',
    connections: ['archive', 'lab'],
    files: {
      'notes.txt': `If this relay is active,
the blackout failed.

-- [SIGNATURE REDACTED]`,
      'logs/boot.log': `Relay recovery attempt #14 failed.

External connections unstable.
[WARNING] Heartbeat timeout on primary channel.`
    }
  },
  'archive': {
    id: 'archive',
    name: 'archive',
    status: 'degraded',
    connections: ['relay-7'],
    files: {
      'incident.log': `03:14 AM

Containment lock disabled.
Backup power offline.
Sector 4 sealing failed.`,
      'staff.msg': `We should never have opened Lab 6.

Only ATLAS remembers the old access keys.
I hope they purged the mainframe.`
    }
  },
  'lab': {
    id: 'lab',
    name: 'lab',
    status: 'quarantined',
    connections: ['relay-7'],
    isLocked: true,
    unlockKeyword: 'atlas',
    unlockMessage: `ACCESS GRANTED

Warning:
Biological signatures detected.
[STATUS: CONTAINMENT BREACH ACTIVE]`,
    files: {
      'experiment.log': `Subject Zero - Cognitive purge initiated.
Biological activity spikes: 400%
Neural map overlaying active terminal processes.

If containment fails, trigger the terminal blackout immediately. Do not let it reach the relay.`,
      'warning.msg': `Do not trust the relay.
It is not transmitting to the outside.
It is echoing.
It wants us to connect.`,
      'specimen-0.dat': `[CORRUPTED BIOLOGICAL TELEMETRY]
██████████████████████████████
Pulse: 0 bpm (constant)
Brainwaves: Delta-Theta sync pattern
Note: Terminal display is flickering in sync with the bio-sensor.`
    }
  }
};
