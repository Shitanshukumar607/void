import { INITIAL_WORLD, GameNode } from '../world/data.js';

export class GameSession {
  currentNodeId: string = 'relay';
  world: Record<string, GameNode>;
  discoveredNodes: string[] = ['relay'];
  
  constructor() {
    // Deep clone INITIAL_WORLD to have fresh state per session
    this.world = JSON.parse(JSON.stringify(INITIAL_WORLD));
  }

  getCurrentNode(): GameNode {
    return this.world[this.currentNodeId];
  }

  async executeCommand(
    rawInput: string,
    print: (text: string, options?: { delay?: number; color?: string; style?: string }) => Promise<void>,
    clear: () => void,
    triggerResize: () => void,
    terminate: () => void
  ): Promise<void> {
    const input = rawInput.trim();
    if (!input) return;

    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        await print('AVAILABLE COMMANDS:', { color: '\x1b[36m' });
        await print('  help              Display this guidance manual.');
        await print('  logs              Show the 7 days of archived logs.');
        await print('  scan              Scan and list available areas.');
        await print('  connect <area>    Connect to an available area terminal.');
        await print('  ls                List files in the current area.');
        await print('  cat <file>        Read the contents of a file.');
        await print('  clear             Purge screen output logs.');
        break;

      case 'clear':
        clear();
        break;

      case 'logs':
        await print('ARCHIVED SYSTEM LOGS', { color: '\x1b[1;36m' });
        await print('--------------------', { color: '\x1b[90m' });
        await print('day-1.log', { color: '\x1b[37m', delay: 10 });
        await print('day-2.log', { color: '\x1b[37m', delay: 10 });
        await print('day-3.log', { color: '\x1b[37m', delay: 10 });
        await print('day-4.log', { color: '\x1b[37m', delay: 10 });
        await print('day-5.log', { color: '\x1b[37m', delay: 10 });
        await print('day-6.log', { color: '\x1b[37m', delay: 10 });
        await print('day-7.log', { color: '\x1b[37m', delay: 10 });
        await print('--------------------', { color: '\x1b[90m' });
        await print("Use 'cat <file>' to read the log contents.");
        break;

      case 'ls': {
        const node = this.getCurrentNode();
        const files = Object.keys(node.files);
        
        await print(`total ${files.length}`);
        for (const file of files.sort()) {
          const fileObj = node.files[file];
          const fileLength = typeof fileObj === 'string' ? fileObj.length : fileObj.content.length;
          await print(`-rw-r--r--   1 root  root   ${fileLength} May 23 16:50 \x1b[37m${file}\x1b[39m`);
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          await print('cat: missing file operand', { color: '\x1b[31m' });
          break;
        }

        const node = this.getCurrentNode();
        const fileName = args[0].toLowerCase();

        // Allow reading logs globally from anywhere, or local files in the current node
        let fileObj: any = undefined;

        // Try exact match in current node
        const exactMatch = Object.keys(node.files).find(f => f.toLowerCase() === fileName);
        if (exactMatch) {
          fileObj = node.files[exactMatch];
        }

        // If not found and looks like a day log, fallback to relay
        if (fileObj === undefined && fileName.startsWith('day-') && fileName.endsWith('.log')) {
          const relayNode = this.world['relay'];
          const logMatch = Object.keys(relayNode.files).find(f => f.toLowerCase() === fileName);
          if (logMatch) {
            fileObj = relayNode.files[logMatch];
          }
        }

        if (fileObj === undefined) {
          await print(`cat: ${args[0]}: No such file or directory`, { color: '\x1b[31m' });
          break;
        }

        let contentStr = '';
        let reveals: string[] | undefined = undefined;

        if (typeof fileObj === 'string') {
          contentStr = fileObj;
        } else {
          contentStr = fileObj.content;
          reveals = fileObj.reveals;
        }

        // Print contents with immersive fast typewriter effect
        const lines = contentStr.split('\n');
        for (const line of lines) {
          await print(line, { delay: 15 });
        }

        // --- PROGRESSION TRIGGERS ---
        if (reveals && reveals.length > 0) {
          let newlyRevealed = false;
          for (const nodeId of reveals) {
            if (!this.discoveredNodes.includes(nodeId)) {
              this.discoveredNodes.push(nodeId);
              newlyRevealed = true;
            }
          }
          if (newlyRevealed) {
            await print('');
            await print(`>> REMOTE SYSTEM CHANNELS DETECTED: ${reveals.join(', ')}`, { color: '\x1b[32m', delay: 100 });
            await print('>> Connection paths now available in system locator.', { color: '\x1b[32m', delay: 100 });
          }
        }

        // --- SPECIAL CINEMATIC ENDING ---
        if (fileName === 'tower-feed.txt' && this.currentNodeId === 'hatchery') {
          await print('');
          await new Promise(resolve => setTimeout(resolve, 1500));
          await print('!!! WARNING: TELEMETRY SIGNAL LOST !!!', { color: '\x1b[5;31m', delay: 100 });
          await print('Connection closed by remote host.', { color: '\x1b[31m', delay: 100 });
          await print('');
          await new Promise(resolve => setTimeout(resolve, 2000));
          clear();
          
          await print('==================================================', { color: '\x1b[31m' });
          await print('               CONNECTION TERMINATED              ', { color: '\x1b[1;31m', delay: 200 });
          await print('==================================================', { color: '\x1b[31m' });
          await print('');
          await print('           CHAPTER 1 COMPLETE             ', { color: '\x1b[1;37m', delay: 200 });
          await print('');
          await print('           THE ORIGIN FILES               ', { color: '\x1b[1;32m', delay: 200 });
          await print('           Book coming soon.              ', { color: '\x1b[3;90m', delay: 200 });
          await print('');
          await print('==================================================', { color: '\x1b[31m' });
          
          await new Promise(resolve => setTimeout(resolve, 4000));
          if (terminate) {
            terminate();
          }
        }
        break;
      }

      case 'scan': {
        await print('Initiating ping sequence across local area network...', { delay: 40 });
        await print('Transmitting handshake packets to remote systems...');
        await print('----------------------------------------------------', { color: '\x1b[90m' });
        
        await print('AVAILABLE AREAS:', { color: '\x1b[1;36m' });
        await print('');

        // Always print discovered areas in strict chronological order
        const chronologicalOrder = ['relay', 'dock-1', 'med-bay', 'security', 'feeding-zone', 'hatchery'];
        for (const nodeId of chronologicalOrder) {
          if (this.discoveredNodes.includes(nodeId)) {
            const targetNode = this.world[nodeId];
            const isCurrent = targetNode.id === this.currentNodeId ? ' (CURRENT)' : '';
            let statusColor = '\x1b[32m'; // green
            if (targetNode.status === 'unstable') statusColor = '\x1b[33m'; // yellow
            if (targetNode.status === 'quarantined') statusColor = '\x1b[31m'; // red
            if (targetNode.status === 'hazardous' || targetNode.status === 'breached') statusColor = '\x1b[1;31m'; // bold red
            if (targetNode.status === 'degraded' || targetNode.status === 'offline') statusColor = '\x1b[36m'; // cyan

            await print(`  \x1b[1;32m${targetNode.name.padEnd(15)}\x1b[0m [STATUS: ${statusColor}${targetNode.status.toUpperCase()}\x1b[0m]${isCurrent}`, { delay: 20 });
          }
        }
        
        await print('----------------------------------------------------', { color: '\x1b[90m' });
        break;
      }

      case 'connect': {
        if (args.length === 0) {
          await print('connect: missing target area', { color: '\x1b[31m' });
          break;
        }

        // Clean target name: allow hyphenated or spaces (e.g. "dock-1" or "dock 1")
        const targetName = args.join('-').toLowerCase();

        let targetId = '';
        // Look up by ID or Name within discovered nodes only
        for (const nodeId of this.discoveredNodes) {
          if (nodeId === targetName || this.world[nodeId].name.toLowerCase() === targetName) {
            targetId = nodeId;
            break;
          }
        }

        if (!targetId) {
          await print(`connect: area '${targetName}' unreachable or does not exist.`, { color: '\x1b[31m' });
          break;
        }

        const targetNode = this.world[targetId];

        // Immersive loading animation
        clear();
        await print(`Establishing secure link to ${targetNode.name.toUpperCase()}...`, { color: '\x1b[36m' });
        await print('[          ]  0% Initiating handshake...', { delay: 150 });
        await print('[===       ] 30% Syncing terminal protocols...', { delay: 150 });
        await print('[======    ] 60% Bypassing area firewall...', { delay: 150 });
        await print('[========= ] 90% Mounting remote filesystem...', { delay: 150 });
        await print('[==========] 100% SECURE CONNECTION ESTABLISHED.', { color: '\x1b[32m', delay: 100 });
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Switch node!
        this.currentNodeId = targetId;
        clear();
        triggerResize(); // Redraw TUI headers and borders
        
        let statusColor = '\x1b[32m';
        if (targetNode.status === 'unstable') statusColor = '\x1b[33m';
        if (targetNode.status === 'quarantined') statusColor = '\x1b[31m';
        if (targetNode.status === 'hazardous' || targetNode.status === 'breached') statusColor = '\x1b[1;31m';
        if (targetNode.status === 'degraded' || targetNode.status === 'offline') statusColor = '\x1b[36m';

        await print(`CONNECTED TO: ${targetNode.name.toUpperCase()}`, { color: '\x1b[1;32m' });
        await print(`STATUS: ${targetNode.status.toUpperCase()}`, { color: statusColor });
        await print('----------------------------------------------------', { color: '\x1b[90m' });
        await print("Type 'ls' to explore filesystem or 'help' for instructions.");
        break;
      }

      default:
        await print(`origin: command not found: ${command}. Type 'help' for instructions.`, { color: '\x1b[31m' });
        break;
    }
  }
}
