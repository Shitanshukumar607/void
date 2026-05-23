import 'dotenv/config';
import { startSSHServer } from './ssh/server.js';

const PORT = parseInt(process.env.PORT || '2222', 10);

console.log('Initiating VOID Terminal Mystery World Server bootstrap...');
startSSHServer(PORT);
