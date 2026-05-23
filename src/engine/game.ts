import { INITIAL_WORLD, GameNode } from '../world/data.js';

export class GameSession {
  currentNodeId: string = 'relay-7';
  unlockedNodes: Set<string> = new Set(['relay-7', 'archive']);
  world: Record<string, GameNode>;
  
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
    triggerResize: () => void
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
        await print('  ls [dir]          List files in the current node directory.');
        await print('  cat <file>        Read the contents of a decrypted file.');
        await print('  scan              Scan local networks for nearby active nodes.');
        await print('  connect <node>    Establish a secure relay link to another node.');
        await print('  unlock <keyword>  Inject decryption clearance keyword.');
        await print('  clear             Purge screen output logs.');
        break;

      case 'clear':
        clear();
        break;

      case 'ls': {
        const node = this.getCurrentNode();
        const targetDir = args[0] ? args[0].replace(/\/$/, '') : '';
        
        // Find files and directories
        const filesInDir = new Set<string>();
        const dirsInDir = new Set<string>();

        for (const filePath of Object.keys(node.files)) {
          if (targetDir === '') {
            // Root directory listing
            if (filePath.includes('/')) {
              const topDir = filePath.split('/')[0];
              dirsInDir.add(topDir);
            } else {
              filesInDir.add(filePath);
            }
          } else {
            // Subdirectory listing
            const prefix = targetDir + '/';
            if (filePath.startsWith(prefix)) {
              const relativePath = filePath.substring(prefix.length);
              if (relativePath.includes('/')) {
                const subDir = relativePath.split('/')[0];
                dirsInDir.add(subDir);
              } else {
                filesInDir.add(relativePath);
              }
            }
          }
        }

        if (targetDir !== '' && dirsInDir.size === 0 && filesInDir.size === 0) {
          // Check if it's a file
          if (node.files[targetDir]) {
            await print(targetDir, { color: '\x1b[37m' });
          } else {
            await print(`ls: ${targetDir}: No such directory`, { color: '\x1b[31m' });
          }
          break;
        }

        const totalItems = dirsInDir.size + filesInDir.size;
        await print(`total ${totalItems}`);

        // Print directories first
        for (const dir of Array.from(dirsInDir).sort()) {
          await print(`drwxr-xr-x   -   \x1b[34m${dir}/\x1b[39m`);
        }
        // Print files next
        for (const file of Array.from(filesInDir).sort()) {
          await print(`-rw-r--r--   -   \x1b[37m${file}\x1b[39m`);
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          await print('cat: missing file operand', { color: '\x1b[31m' });
          break;
        }

        const node = this.getCurrentNode();
        const filePath = args[0];

        // Check if path is a directory
        const isDir = Object.keys(node.files).some(p => p.startsWith(filePath + '/'));
        if (isDir) {
          await print(`cat: ${filePath}: Is a directory`, { color: '\x1b[31m' });
          break;
        }

        const content = node.files[filePath];
        if (content === undefined) {
          await print(`cat: ${filePath}: No such file or directory`, { color: '\x1b[31m' });
          break;
        }

        // Print contents with a slightly fast typing delay for immersion
        const lines = content.split('\n');
        for (const line of lines) {
          await print(line, { delay: 10 });
        }
        break;
      }

      case 'scan': {
        await print('Initiating ping sequence across local relay network...', { delay: 20 });
        await print('Transmitting handshake packets...');
        await print('----------------------------------------------------');
        
        const node = this.getCurrentNode();
        await print('DETECTED NODES:', { color: '\x1b[36m' });
        await print('');

        for (const connId of node.connections) {
          const targetNode = this.world[connId];
          if (!targetNode) continue;

          if (targetNode.isLocked) {
            await print(`  \x1b[30;1munknown\x1b[39;22m        [STATUS: ENCRYPTED / SECURE LINK REQUIRED]`);
          } else {
            const statusColor = targetNode.status === 'unstable' ? '\x1b[33m' : targetNode.status === 'quarantined' ? '\x1b[31m' : '\x1b[32m';
            const isCurrent = targetNode.id === this.currentNodeId ? ' (CURRENT)' : '';
            await print(`  \x1b[32m${targetNode.name}\x1b[39m       [STATUS: ${statusColor}${targetNode.status.toUpperCase()}\x1b[39m]${isCurrent}`);
          }
        }
        
        // Also always print the current node in scan if it's not in connections list
        if (!node.connections.includes(this.currentNodeId)) {
          const statusColor = node.status === 'unstable' ? '\x1b[33m' : node.status === 'quarantined' ? '\x1b[31m' : '\x1b[32m';
          await print(`  \x1b[32m${node.name}\x1b[39m       [STATUS: ${statusColor}${node.status.toUpperCase()}\x1b[39m] (CURRENT)`);
        }

        await print('----------------------------------------------------');
        break;
      }

      case 'connect': {
        if (args.length === 0) {
          await print('connect: missing target node', { color: '\x1b[31m' });
          break;
        }

        const targetName = args[0].toLowerCase();
        const node = this.getCurrentNode();
        
        // Find if targetName matches any node in connections
        // Note: if node is locked, its name might appear as 'unknown' in scan,
        // but they can connect to its ID if unlocked.
        let targetId = '';
        for (const connId of node.connections) {
          const target = this.world[connId];
          if (target && (target.id === targetName || target.name === targetName)) {
            targetId = target.id;
            break;
          }
        }

        // If targetName is 'unknown' and they try to connect to it
        if (targetName === 'unknown') {
          await print('connect: cannot route to encrypted network target.', { color: '\x1b[31m' });
          await print('Clearance code required to reveal node signature.');
          break;
        }

        if (!targetId) {
          await print(`connect: node '${targetName}' unreachable from current relay.`, { color: '\x1b[31m' });
          break;
        }

        const targetNode = this.world[targetId];
        if (targetNode.isLocked) {
          await print(`Initiating connection to '${targetNode.name}'...`, { delay: 10 });
          await print('ERROR: SECURE LINK FAILURE', { color: '\x1b[31m' });
          await print(`Node '${targetNode.name}' is quarantined. Authentication clearance key required.`, { color: '\x1b[33m' });
          break;
        }

        // Animation!
        clear();
        await print(`\x1b[5mEstablishing secure link to ${targetNode.name}...\x1b[25m`, { color: '\x1b[36m' });
        await print('[          ]  0% Initiating handshake...', { delay: 100 });
        await print('[===       ] 30% Syncing terminal protocols...', { delay: 150 });
        await print('[======    ] 60% Bypassing relay firewall...', { delay: 150 });
        await print('[========= ] 90% Mounting remote filesystem...', { delay: 150 });
        await print('[==========] 100% SECURE CONNECTION ESTABLISHED.', { color: '\x1b[32m', delay: 100 });
        
        // Wait a small bit
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Switch node!
        this.currentNodeId = targetNode.id;
        clear();
        triggerResize(); // Redraw TUI structures for new node context
        
        await print(`Connected to node: ${targetNode.name.toUpperCase()}`, { color: '\x1b[32m' });
        await print(`Status: ${targetNode.status.toUpperCase()}`, { color: targetNode.status === 'unstable' ? '\x1b[33m' : targetNode.status === 'quarantined' ? '\x1b[31m' : '\x1b[32m' });
        await print('----------------------------------------------------');
        await print("Type 'ls' to explore node filesystem or 'help' for assistance.");
        break;
      }

      case 'unlock': {
        if (args.length === 0) {
          await print('unlock: missing clearance keyword', { color: '\x1b[31m' });
          break;
        }

        const keyword = args[0].toLowerCase();
        
        // Check which node can be unlocked with this keyword
        let unlockedAny = false;
        for (const nodeId of Object.keys(this.world)) {
          const targetNode = this.world[nodeId];
          if (targetNode.isLocked && targetNode.unlockKeyword === keyword) {
            targetNode.isLocked = false;
            unlockedAny = true;
            this.unlockedNodes.add(nodeId);
            
            // Dramatic unlock text
            await print('Attempting decryption using clearance key...', { delay: 30 });
            await print('Processing credential hash...');
            await print('..................................................', { delay: 10 });
            await print(targetNode.unlockMessage || 'ACCESS GRANTED', { color: '\x1b[32m', delay: 20 });
            break;
          }
        }

        if (!unlockedAny) {
          await print('Attempting decryption using clearance key...', { delay: 30 });
          await print('Processing credential hash...');
          await print('..................................................', { delay: 10 });
          await print('ERROR: ACCESS KEY DECRYPTION FAILED', { color: '\x1b[31m' });
          await print('Warning: Unauthorized access attempt has been logged.', { color: '\x1b[33m' });
        }
        break;
      }

      default:
        await print(`void: command not found: ${command}. Type 'help' for instructions.`, { color: '\x1b[31m' });
        break;
    }
  }
}
