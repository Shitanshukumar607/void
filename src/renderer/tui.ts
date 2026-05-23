import blessed from "blessed";
import { GameSession } from "../engine/game.js";

export function setupTerminalUI(stream: any, ptyInfo: any, session: any) {
  const game = new GameSession();
  const state = { isExecuting: false, screenDestroyed: false, ptyInfo };

  const screen = createScreen(stream, state.ptyInfo);
  const container = createContainer(screen);
  const header = createHeader(container);
  const logBox = createLogBox(container);
  const inputContainer = createInputContainer(container);
  createPromptLabel(inputContainer);
  const inputField = createInputField(inputContainer);

  const print = createPrintFn(logBox, screen, state);
  const clearLogs = () => {
    if (!state.screenDestroyed) {
      logBox.setContent("");
      screen.render();
    }
  };

  const updateHeader = () => {
    if (state.screenDestroyed) return;
    const node = game.getCurrentNode();
    const statusFormatted = formatStatus(node.status);
    header.setContent(
      ` ▰▰▰ {bold}ORIGIN REMOTE RELAY{/bold} ▰▰▰    {grey-fg}AREA:{/grey-fg} {green-fg}{bold}${node.name.toUpperCase()}{/bold}{/green-fg}    {grey-fg}STATUS:{/grey-fg} ${statusFormatted}    {grey-fg}ENCRYPT_SECURE:{/grey-fg} {green-fg}ACTIVE{/green-fg}`,
    );
    screen.render();
  };

  const triggerResize = () => {
    if (state.screenDestroyed) return;
    updateHeader();
    screen.render();
  };

  setupEventHandlers(
    screen,
    session,
    state,
    inputField,
    triggerResize,
    stream,
    logBox,
    game,
    print,
    clearLogs,
  );
  runIntro(print, state, updateHeader, inputField, screen);
}

function createScreen(stream: any, ptyInfo: any) {
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    input: stream,
    output: stream,
    terminal: ptyInfo ? ptyInfo.term : "xterm-256color",
    tty: false,
    warnings: false,
  });
  screen.title = "THE ORIGIN?";
  return screen;
}

function createContainer(screen: blessed.Widgets.Screen) {
  return blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    bg: "#000000",
  });
}

function createHeader(parent: blessed.Widgets.Node) {
  return blessed.box({
    parent,
    top: 0,
    left: 0,
    width: "100%",
    height: 3,
    border: { type: "line" },
    style: { border: { fg: "#222222" }, bg: "#000000" },
    tags: true,
  });
}

function createLogBox(parent: blessed.Widgets.Node) {
  return blessed.box({
    parent,
    top: 3,
    bottom: 3,
    left: 0,
    width: "100%",
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    scrollbar: { ch: "░", style: { fg: "#333333", bg: "#111111" } },
    style: { bg: "#000000" },
    tags: true,
  });
}

function createInputContainer(parent: blessed.Widgets.Node) {
  return blessed.box({
    parent,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 3,
    border: { type: "line" },
    style: { border: { fg: "#222222" }, bg: "#000000" },
  });
}

function createPromptLabel(parent: blessed.Widgets.Node) {
  return blessed.box({
    parent,
    top: 0,
    left: 1,
    width: 2,
    height: 1,
    content: ">",
    style: { fg: "#ff3333", bold: true },
  });
}

function createInputField(parent: blessed.Widgets.Node) {
  return blessed.textbox({
    parent,
    top: 0,
    left: 3,
    width: "100%-5",
    height: 1,
    inputOnFocus: true,
    style: { fg: "#ffffff", bg: "#000000" },
  });
}

function createPrintFn(
  logBox: any,
  screen: blessed.Widgets.Screen,
  state: any,
) {
  return async (
    text: string,
    options?: { delay?: number; color?: string; style?: string },
  ) => {
    if (state.screenDestroyed) return;
    const content = options?.color ? `${options.color}${text}\x1b[39m` : text;
    logBox.pushLine(content);
    logBox.setScrollPerc(100);
    screen.render();
    if (options?.delay) await new Promise((r) => setTimeout(r, options.delay));
  };
}

function formatStatus(status: string) {
  switch (status) {
    case "unstable":
      return "{yellow-fg}UNSTABLE{/yellow-fg}";
    case "quarantined":
      return "{red-fg}QUARANTINED{/red-fg}";
    case "degraded":
      return "{cyan-fg}DEGRADED{/cyan-fg}";
    case "offline":
      return "{cyan-fg}OFFLINE{/cyan-fg}";
    case "hazardous":
    case "breached":
      return `{red-fg}{bold}${status.toUpperCase()}{/bold}{/red-fg}`;
    default:
      return `{green-fg}${status.toUpperCase()}{/green-fg}`;
  }
}

function setupEventHandlers(
  screen: blessed.Widgets.Screen,
  session: any,
  state: any,
  inputField: any,
  triggerResize: () => void,
  stream: any,
  logBox: any,
  game: GameSession,
  print: any,
  clearLogs: () => void,
) {
  // Window change
  session.on("window-change", (accept: any, reject: any, info: any) => {
    state.ptyInfo = info;
    if (screen && !state.screenDestroyed) {
      screen.terminal = info.term || "xterm-256color";
      screen.program.cols = info.cols;
      screen.program.rows = info.rows;
      screen.cols = info.cols;
      screen.rows = info.rows;
      screen.alloc();
      triggerResize();
    }
    if (accept) accept();
  });

  // Submit callback
  inputField.on("submit", async (value: string) => {
    if (state.isExecuting || state.screenDestroyed) return;
    const commandText = value.trim();
    inputField.clearValue();
    screen.render();
    if (!commandText) {
      inputField.focus();
      return;
    }

    state.isExecuting = true;
    await print(`> ${commandText}`, { color: "\x1b[37m" });

    try {
      await game.executeCommand(
        commandText,
        print,
        clearLogs,
        triggerResize,
        () => {
          state.screenDestroyed = true;
          screen.destroy();
          stream.end();
        },
      );
    } catch (err: any) {
      await print(`System Error: ${err.message}`, { color: "\x1b[31m" });
    } finally {
      if (screen && !state.screenDestroyed) {
        state.isExecuting = false;
        await print("");
        inputField.focus();
        screen.render();
      }
    }
  });

  // Auto-focus textbox
  screen.on("click", () => {
    if (!state.isExecuting && !state.screenDestroyed) inputField.focus();
  });

  // Keypress handler
  screen.on("keypress", (ch, key) => {
    if (
      key &&
      ["pageup", "pagedown", "up", "down", "prior", "next"].includes(key.name)
    )
      return;
    if (
      !state.isExecuting &&
      !state.screenDestroyed &&
      (screen as any).focused !== inputField
    )
      inputField.focus();
  });

  // Scroll keys
  const scrollKeys = [
    { keys: ["pageup", "prior", "S-up"], diff: -2 },
    { keys: ["pagedown", "next", "S-down"], diff: 2 },
  ];
  for (const { keys, diff } of scrollKeys) {
    screen.key(keys, () => {
      if (!state.screenDestroyed) {
        logBox.scroll(diff);
        screen.render();
      }
    });
  }

  // Terminate session
  screen.key(["C-c"], () => {
    state.screenDestroyed = true;
    screen.destroy();
    stream.end();
  });

  // Stream cleanup
  stream.on("close", () => {
    state.screenDestroyed = true;
    screen.destroy();
  });
}

async function runIntro(
  print: any,
  state: any,
  updateHeader: () => void,
  inputField: any,
  screen: blessed.Widgets.Screen,
) {
  state.isExecuting = true;
  updateHeader();

  await print("Establishing relay...", { color: "\x1b[36m", delay: 300 });
  await print("Connection accepted.", { color: "\x1b[32m", delay: 200 });
  await print("");

  await print(" ██████╗ ██████╗ ██╗ ██████╗ ██╗███╗   ██╗", {
    color: "\x1b[1;31m",
    delay: 40,
  });
  await print("██╔═══██╗██╔══██╗██║██╔════╝ ██║████╗  ██║", {
    color: "\x1b[1;31m",
    delay: 40,
  });
  await print("██║   ██║██████╔╝██║██║  ███╗██║██╔██╗ ██║", {
    color: "\x1b[1;31m",
    delay: 40,
  });
  await print("██║   ██║██╔══██╗██║██║   ██║██║██║╚██╗██║", {
    color: "\x1b[1;31m",
    delay: 40,
  });
  await print("╚██████╔╝██║  ██║██║╚██████╔╝██║██║ ╚████║", {
    color: "\x1b[1;31m",
    delay: 40,
  });
  await print(" ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝", {
    color: "\x1b[1;31m",
    delay: 100,
  });
  await print("");
  await print("ORIGIN REMOTE RELAY", { color: "\x1b[1;37m", delay: 150 });
  await print("");
  await print("Island response unavailable.", {
    color: "\x1b[33m",
    delay: 150,
  });
  await print("Last contact: 7 days ago.", { color: "\x1b[33m", delay: 150 });
  await print("");
  await print("One specimen missing.", { color: "\x1b[1;31m", delay: 200 });
  await print("");
  await print("Type 'help'", { color: "\x1b[36m", delay: 100 });
  await print("");

  state.isExecuting = false;
  if (!state.screenDestroyed) {
    inputField.focus();
    screen.render();
  }
}
