export interface GameFile {
  content: string;
  reveals?: string[];
}

export interface GameNode {
  id: string;
  name: string;
  status: string;
  files: Record<string, string | GameFile>;
  connections: string[]; // array of node IDs
}

export const INITIAL_WORLD: Record<string, GameNode> = {
  relay: {
    id: "relay",
    name: "relay",
    status: "degraded",
    connections: ["dock-1", "med-bay", "security", "feeding-zone", "hatchery"],
    files: {
      "day-1.log": `Transport successful.

DNA extraction stable.

Subject awake at 8:14 PM.

Dr. Hale named him Echo.`,
      "day-2.log": `Echo responds to sound.

Follows movement.

Security says he watches people too much.`,
      "day-3.log": `South fence damaged.

No breach.

Echo missing for 11 minutes.

Found near water tanks.

Nobody saw him leave.`,
      "day-4.log": `Handler Mason scratched.

He made no sound before attack.

Night patrol increased.`,
      "day-5.log": `West dock lights failed again.

Echo reacted when the siren started.

He kept staring toward Dock 1.`,
      "day-6.log": `Security moved transport cages near Dock 1.

Nobody allowed there after midnight.`,
      "day-7.log": {
        content: `If anyone gets this...

Lockdown failed.

Manual override systems are responsive.

Connect to med-bay to check the anomaly.`,
        reveals: ["dock-1", "med-bay", "security"],
      },
    },
  },

  "dock-1": {
    id: "dock-1",
    name: "dock-1",
    status: "unstable",
    connections: ["relay", "med-bay", "security", "feeding-zone", "hatchery"],
    files: {
      "transport.log": `Echo transported successfully.

Sedation unstable during storm.`,
      "camera-feed.txt": `02:14 AM

Echo near loading gate.

Not aggressive.

Just waiting.

02:16 AM

Second movement detected outside floodlights.`,
      "cage-report.txt": `Damage too high from ground level.`,
    },
  },
  "med-bay": {
    id: "med-bay",
    name: "med-bay",
    status: "quarantined",
    connections: ["relay", "dock-1", "security", "feeding-zone", "hatchery"],
    files: {
      "blood-report.txt": `Healing speed increasing.

Temperature abnormal.

Avoid direct eye contact during feeding.`,
      "injury.log": `Mason refused treatment.

Kept repeating:
“She was watching the fence.”`,
    },
  },
  security: {
    id: "security",
    name: "security",
    status: "offline",
    connections: ["relay", "dock-1", "med-bay", "feeding-zone", "hatchery"],
    files: {
      "night-watch.log": `02:11 AM

Motion detected outside perimeter.

Echo still inside enclosure.`,
      "emergency.log": `Do NOT open north gate.

Do NOT respond to sounds outside the vents.`,
      "gate-bypass.txt": {
        content: `Feeding zone relay systems offline.

Connect to feeding-zone to check containment gates.`,
        reveals: ["feeding-zone"],
      },
    },
  },
  "feeding-zone": {
    id: "feeding-zone",
    name: "feeding-zone",
    status: "hazardous",
    connections: ["relay", "dock-1", "med-bay", "security", "hatchery"],
    files: {
      "feeding.log": `Day 3

He refused packaged meat again.

Calmed down only after the storm started.`,
      "hatchery-bypass.txt": {
        content: `Hatchery containment lock active.

Connect to hatchery to check the server logs.`,
        reveals: ["hatchery"],
      },
    },
  },
  hatchery: {
    id: "hatchery",
    name: "hatchery",
    status: "breached",
    connections: ["relay", "dock-1", "med-bay", "security", "feeding-zone"],
    files: {
      "final.log": `We were wrong.

The infant was never escaping.

He was learning routes.

Opening paths.

Keeping us distracted.

She was already here before transport day.`,
      "tower-feed.txt": `03:14 AM

Echo standing near outer fence.

Looking toward the trees.

Waiting.

Movement detected behind him.

Feed lost.`,
    },
  },
};
