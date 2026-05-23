import blessed from 'blessed';
import { GameSession } from '../engine/game.js';

export function setupTerminalUI(stream: any, ptyInfo: any, session: any) {
  const game = new GameSession();
  let isExecuting = false;

  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    input: stream,
    output: stream,
    terminal: ptyInfo ? ptyInfo.term : 'xterm-256color',
    tty: false,
    warnings: false,
  });

  screen.title = 'VOID — Terminal Mystery World';

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

  // 3. Log/Output Body Component
  const logBox = blessed.box({
    parent: container,
    top: 3,
    bottom: 3,
    left: 0,
    width: '100%',
    scrollable: true,
    alwaysScroll: true,
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

  // 4. Input Prompt Box
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
      fg: '#00ff00',
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
      default:
        statusFormatted = `{green-fg}${node.status.toUpperCase()}{/green-fg}`;
    }

    const headerText = ` ▰▰▰ {bold}VOID MAINFLOW{/bold} ▰▰▰    {grey-fg}NODE:{/grey-fg} {green-fg}{bold}${node.name.toUpperCase()}{/bold}{/green-fg}    {grey-fg}STATUS:{/grey-fg} ${statusFormatted}    {grey-fg}SYS_SECURE:{/grey-fg} {green-fg}OK{/green-fg}`;
    header.setContent(headerText);
    screen.render();
  }

  // Print function passed to command parser
  async function print(text: string, options?: { delay?: number; color?: string; style?: string }) {
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
    logBox.setContent('');
    screen.render();
  }

  // Resize handler
  function triggerResize() {
    updateHeader();
    screen.render();
  }

  // Listen to SSH window-change event
  session.on('window-change', (accept: any, reject: any, info: any) => {
    ptyInfo = info;
    if (screen) {
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
    if (isExecuting) return;
    
    const commandText = value.trim();
    inputField.clearValue();
    screen.render();

    if (!commandText) {
      inputField.focus();
      return;
    }

    isExecuting = true;
    
    // Echo the command typed by the user to the log box
    await print(`> ${commandText}`, { color: '\x1b[90m' }); // dim grey

    try {
      await game.executeCommand(commandText, print, clearLogs, triggerResize);
    } catch (err: any) {
      await print(`System Error: ${err.message}`, { color: '\x1b[31m' });
    } finally {
      isExecuting = false;
      await print(''); // spacing
      inputField.focus();
      screen.render();
    }
  });

  // Auto-focus textbox if user clicks anywhere on log area or when keys pressed
  screen.on('click', () => {
    if (!isExecuting) {
      inputField.focus();
    }
  });

  screen.on('keypress', () => {
    if (!isExecuting && (screen as any).focused !== inputField) {
      inputField.focus();
    }
  });

  // Handle Ctrl+C to terminate terminal session cleanly
  screen.key(['C-c'], () => {
    screen.destroy();
    stream.end();
  });

  // Handle stream end/close cleanup
  stream.on('close', () => {
    screen.destroy();
  });

  // --- Start Game and Intro Animation ---
  async function runIntro() {
    isExecuting = true;
    updateHeader();

    await print('Establishing secure relay connection...', { color: '\x1b[36m', delay: 400 });
    await print('Handshake accepted by void.shitanshu.dev.', { color: '\x1b[32m', delay: 300 });
    await print('');
    await print('██╗   ██╗ ██████╗ ██╗██████╗ ', { color: '\x1b[31m', delay: 50 });
    await print('██║   ██║██╔═══██╗██║██╔══██╗', { color: '\x1b[31m', delay: 50 });
    await print('██║   ██║██║   ██║██║██║  ██║', { color: '\x1b[31m', delay: 50 });
    await print('╚██╗ ██╔╝██║   ██║██║██║  ██║', { color: '\x1b[31m', delay: 50 });
    await print(' ╚████╔╝ ╚██████╔╝██║██████╔╝', { color: '\x1b[31m', delay: 50 });
    await print('  ╚═══╝   ╚═════╝ ╚═╝╚══════╝ ', { color: '\x1b[31m', delay: 200 });
    await print('');
    await print('VOID RELAY NETWORK v0.3', { color: '\x1b[1m', delay: 200 });
    await print('');
    await print('WARNING:', { color: '\x1b[33m', delay: 100 });
    await print('3 relay nodes unreachable.', { color: '\x1b[33m', delay: 150 });
    await print('');
    
    // Generate an authentic random session hex ID
    const randomSessionId = Math.floor(0x10000 + Math.random() * 0xF0000).toString(16).toUpperCase();
    await print(`Session ID: #${randomSessionId}`, { color: '\x1b[90m', delay: 200 });
    await print('');
    await print("Type 'help' to review basic commands.", { color: '\x1b[36m', delay: 100 });
    await print('');

    isExecuting = false;
    inputField.focus();
    screen.render();
  }

  runIntro();
}
