import blessed from 'blessed';
import { GameSession } from '../engine/game.js';

export function setupTerminalUI(stream: any, ptyInfo: any, session: any) {
  const game = new GameSession();
  let isExecuting = false;
  let screenDestroyed = false;

  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    input: stream,
    output: stream,
    terminal: ptyInfo ? ptyInfo.term : 'xterm-256color',
    tty: false,
    warnings: false,
  });

  screen.title = 'ORIGIN — Remote Relay';

  // main container
  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    bg: '#000000',
  });

  // header
  const header = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: '#222222',
      },
      bg: '#000000',
    },
    tags: true,
  });

  // Log/Output Body Component
  const logBox = blessed.box({
    parent: container,
    top: 3,
    bottom: 3,
    left: 0,
    width: '100%',
    scrollable: true,
    alwaysScroll: true,
    mouse: true, // Enable mouse wheel scrolling
    scrollbar: {
      ch: '░',
      style: {
        fg: '#333333',
        bg: '#111111',
      },
    },
    style: {
      bg: '#000000',
    },
    tags: true,
  });

  // Input Prompt Box
  const inputContainer = blessed.box({
    parent: container,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: '#222222',
      },
      bg: '#000000',
    },
  });

  // Custom static prompt label inside input container
  const promptLabel = blessed.box({
    parent: inputContainer,
    top: 0,
    left: 1,
    width: 2,
    height: 1,
    content: '>',
    style: {
      fg: '#ff3333', // vibrant red for threat level
      bold: true,
    },
  });

  // Textbox for user command inputs
  const inputField = blessed.textbox({
    parent: inputContainer,
    top: 0,
    left: 3,
    width: '100%-5',
    height: 1,
    inputOnFocus: true,
    style: {
      fg: '#ffffff',
      bg: '#000000',
    },
  });

  // Function to update the Header details based on current node
  function updateHeader() {
    if (screenDestroyed) return;
    const node = game.getCurrentNode();
    let statusFormatted = '';
    
    switch (node.status) {
      case 'unstable':
        statusFormatted = '{yellow-fg}UNSTABLE{/yellow-fg}';
        break;
      case 'quarantined':
        statusFormatted = '{red-fg}QUARANTINED{/red-fg}';
        break;
      case 'degraded':
        statusFormatted = '{cyan-fg}DEGRADED{/cyan-fg}';
        break;
      case 'offline':
        statusFormatted = '{cyan-fg}OFFLINE{/cyan-fg}';
        break;
      case 'hazardous':
      case 'breached':
        statusFormatted = '{red-fg}{bold}' + node.status.toUpperCase() + '{/bold}{/red-fg}';
        break;
      default:
        statusFormatted = `{green-fg}${node.status.toUpperCase()}{/green-fg}`;
    }

    const headerText = ` ▰▰▰ {bold}ORIGIN REMOTE RELAY{/bold} ▰▰▰    {grey-fg}AREA:{/grey-fg} {green-fg}{bold}${node.name.toUpperCase()}{/bold}{/green-fg}    {grey-fg}STATUS:{/grey-fg} ${statusFormatted}    {grey-fg}ENCRYPT_SECURE:{/grey-fg} {green-fg}ACTIVE{/green-fg}`;
    header.setContent(headerText);
    screen.render();
  }

  // Print function passed to command parser
  async function print(text: string, options?: { delay?: number; color?: string; style?: string }) {
    if (screenDestroyed) return;
    let content = text;
    if (options?.color) {
      content = `${options.color}${text}\x1b[39m`;
    }
    
    logBox.pushLine(content);
    logBox.setScrollPerc(100);
    screen.render();

    if (options?.delay && options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }

  // Clear output screen
  function clearLogs() {
    if (screenDestroyed) return;
    logBox.setContent('');
    screen.render();
  }

  // Resize handler
  function triggerResize() {
    if (screenDestroyed) return;
    updateHeader();
    screen.render();
  }

  // Listen to SSH window-change event
  session.on('window-change', (accept: any, reject: any, info: any) => {
    ptyInfo = info;
    if (screen && !screenDestroyed) {
      screen.terminal = ptyInfo.term || 'xterm-256color';
      
      // Update screen dimension
      screen.program.cols = info.cols;
      screen.program.rows = info.rows;
      screen.cols = info.cols;
      screen.rows = info.rows;
      
      screen.alloc();
      triggerResize();
    }
    if (accept) accept();
  });

  // Textbox submit callback
  inputField.on('submit', async (value: string) => {
    if (isExecuting || screenDestroyed) return;
    
    const commandText = value.trim();
    inputField.clearValue();
    screen.render();

    if (!commandText) {
      inputField.focus();
      return;
    }

    isExecuting = true;
    
    // Echo the command typed by the user to the log box
    await print(`> ${commandText}`, { color: '\x1b[37m' }); // light grey

    try {
      await game.executeCommand(
        commandText,
        print,
        clearLogs,
        triggerResize,
        () => {
          screenDestroyed = true;
          screen.destroy();
          stream.end();
        }
      );
    } catch (err: any) {
      await print(`System Error: ${err.message}`, { color: '\x1b[31m' });
    } finally {
      if (screen && !screenDestroyed) {
        isExecuting = false;
        await print(''); // spacing
        inputField.focus();
        screen.render();
      }
    }
  });

  // Auto-focus textbox if user clicks anywhere on log area
  screen.on('click', () => {
    if (!isExecuting && !screenDestroyed) {
      inputField.focus();
    }
  });

  // Keypress event handler with exclusion for scroll keys
  screen.on('keypress', (ch, key) => {
    if (key && ['pageup', 'pagedown', 'up', 'down', 'prior', 'next'].includes(key.name)) {
      return; // let these scroll keys work without stealing focus
    }
    if (!isExecuting && !screenDestroyed && (screen as any).focused !== inputField) {
      inputField.focus();
    }
  });

  // Global key bindings for scrolling the logBox
  screen.key(['pageup', 'prior'], () => {
    if (!screenDestroyed) {
      logBox.scroll(-2);
      screen.render();
    }
  });

  screen.key(['pagedown', 'next'], () => {
    if (!screenDestroyed) {
      logBox.scroll(2);
      screen.render();
    }
  });

  screen.key(['S-up'], () => {
    if (!screenDestroyed) {
      logBox.scroll(-2);
      screen.render();
    }
  });

  screen.key(['S-down'], () => {
    if (!screenDestroyed) {
      logBox.scroll(2);
      screen.render();
    }
  });

  // Handle Ctrl+C to terminate terminal session cleanly
  screen.key(['C-c'], () => {
    screenDestroyed = true;
    screen.destroy();
    stream.end();
  });

  // Handle stream end/close cleanup
  stream.on('close', () => {
    screenDestroyed = true;
    screen.destroy();
  });

  // --- Start Game and Intro Animation ---
  async function runIntro() {
    isExecuting = true;
    updateHeader();

    await print('Establishing relay...', { color: '\x1b[36m', delay: 300 });
    await print('Connection accepted.', { color: '\x1b[32m', delay: 200 });
    await print('');
    
    // Cinematic ascii title
    await print(' ██████╗ ██████╗ ██╗ ██████╗ ██╗███╗   ██╗', { color: '\x1b[1;31m', delay: 40 });
    await print('██╔═══██╗██╔══██╗██║██╔════╝ ██║████╗  ██║', { color: '\x1b[1;31m', delay: 40 });
    await print('██║   ██║██████╔╝██║██║  ███╗██║██╔██╗ ██║', { color: '\x1b[1;31m', delay: 40 });
    await print('██║   ██║██╔══██╗██║██║   ██║██║██║╚██╗██║', { color: '\x1b[1;31m', delay: 40 });
    await print('╚██████╔╝██║  ██║██║╚██████╔╝██║██║ ╚████║', { color: '\x1b[1;31m', delay: 40 });
    await print(' ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝', { color: '\x1b[1;31m', delay: 100 });
    await print('');
    await print('ORIGIN REMOTE RELAY', { color: '\x1b[1;37m', delay: 150 });
    await print('');
    await print('Island response unavailable.', { color: '\x1b[33m', delay: 150 });
    await print('Last contact: 7 days ago.', { color: '\x1b[33m', delay: 150 });
    await print('');
    await print('One specimen missing.', { color: '\x1b[1;31m', delay: 200 });
    await print('');
    await print("Type 'help'", { color: '\x1b[36m', delay: 100 });
    await print('');

    isExecuting = false;
    if (!screenDestroyed) {
      inputField.focus();
      screen.render();
    }
  }

  runIntro();
}
