export interface GameFile {
  content: string;
  reveals?: string[];
}

export interface GameNode {
  id: string;
  name: string;
  status: string;
  files: Record<string, string | GameFile>;
  connections: string[];
}

export const INITIAL_WORLD: Record<string, GameNode> = {
  relay: {
    id: "relay",
    name: "relay",
    status: "degraded",
    connections: ["dock-1", "med-bay", "security", "feeding-zone", "hatchery"],
    files: {
      "day-1.log": `— Transport complete
• Storm hit on arrival
• Subject woke at 8:14 PM
• Dr. Hale named him Echo`,
      "day-2.log": `— Echo reacts to sound
• He turns before people speak
• One guard said, "He knows us"`,
      "day-3.log": `— South fence alarm at 1:13 AM
• No damage found
• Echo was missing for 11 minutes
• He came back on his own`,
      "day-4.log": `— Mason got scratched during feeding
• Nobody saw Echo move
• Mason kept asking if someone else was in the room`,
      "day-5.log": `— Dock lights failed again
• Echo stood still during the siren
• He kept looking at Dock 1`,
      "day-6.log": `— Security moved spare cages near Dock 1
• No one allowed there after midnight
• Something keeps hitting the wall outside`,
      "day-7.log": {
        content: `— If you found this, listen
• Lockdown failed
• Manual controls still work
• Med-bay is where it started
• Check the reports now`,
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
      "transport.log": `— Echo arrived in heavy rain
• Sedation wore off halfway through the ride
• Crew said he stayed calm
• That made them nervous`,
      "camera-feed.txt": `02:14 AM  — Echo near the loading gate
02:16 AM  — Another shape behind the floodlights
02:16 AM  — Feed lost`,
      "cage-report.txt": `— Cage door bent from the inside
• Marks are too deep for Echo`,
    },
  },

  "med-bay": {
    id: "med-bay",
    name: "med-bay",
    status: "quarantined",
    connections: ["relay", "dock-1", "security", "feeding-zone", "hatchery"],
    files: {
      "blood-report.txt": `— Healing is too fast
• Body heat keeps rising
• Staff told not to stare at Echo for long`,
      "injury.log": `— Mason refused treatment
• He kept saying:
  "She was already here before we came."`,
    },
  },

  security: {
    id: "security",
    name: "security",
    status: "offline",
    connections: ["relay", "dock-1", "med-bay", "feeding-zone", "hatchery"],
    files: {
      "night-watch.log": `— 02:11 AM
• Motion outside the fence
• Echo confirmed inside the enclosure
• The motion outside stayed for six more minutes`,
      "emergency.log": `— Do NOT open the north gate
• Do NOT answer voices near the vents
• If you hear knocking, stay quiet`,
      "gate-bypass.txt": {
        content: `— Feeding zone relay stopped responding
• Gate can still be opened by hand
• Connect to feeding-zone`,
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
      "feeding.log": `— Day 3
• Echo refused the food again
• The storm started at midnight
• He only calmed down after the thunder`,
      "staff-chat.txt": `— Someone keeps opening storage doors
• Security says it is a power issue
• I do not think power leaves footprints`,
      "hatchery-bypass.txt": {
        content: `— Hatchery lock still active
• Server logs may explain what happened there
• Connect to hatchery`,
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
      "final.log": `— We got it wrong
• Echo was never trying to escape
• He was opening the right doors
• Every alarm pulled us away
• Every broken camera helped
• He was leading us off the hatchery
• Something else was already inside`,
      "tower-feed.txt": `03:14 AM  — Echo near the outer fence
03:15 AM  — Looking into the trees
03:16 AM  — A taller shape behind him
03:16 AM  — Feed lost`,
    },
  },
};
