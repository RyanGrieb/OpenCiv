import { spawn } from 'child_process';
import * as path from 'path';
import kill from 'kill-port';


// Parse args
const args = process.argv.slice(2);
const scenarioArg = args.find(a => a.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] : null;


// Determine platform-specific commands
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');
const CLIENT_DIR = path.join(ROOT, 'client');

// Self-executing async function to allow await
(async () => {

    console.log("Cleaning up old processes...");
    try {
        await kill(2000, 'tcp');
        await kill(1234, 'tcp');
    } catch (e) {
        console.log("Cleanup warning:", e.message);
    }

    console.log("Starting Server in Test Mode...");
    const server = spawn(npmCmd, ['run', 'start:test'], { cwd: SERVER_DIR, stdio: 'inherit', shell: true });

    console.log("Starting Client...");
    const client = spawn(npmCmd, ['run', 'dev'], { cwd: CLIENT_DIR, stdio: 'inherit', shell: true });

    const cleanup = () => {
        console.log("Cleaning up...");
        // Attempt to kill process groups or specific pids
        // On Windows, tree-kill might be needed for full cleanup, but basic kill is a start
        if (!server.killed) server.kill();
        if (!client.killed) client.kill();

        // Force exit
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    // Also catch uncaught exceptions to ensure cleanup
    process.on('uncaughtException', (err) => {
        console.error(err);
        cleanup();
    });

    // Wait a bit then print instructions/open browser
    setTimeout(() => {
        const url = `http://localhost:1234?test=true${scenario ? `&scenario=${scenario}` : ''}`;
        console.log(`\n------------------------------------------------------------`);
        console.log(`Tests are running!`);
        console.log(`Open your browser to: ${url}`);
        console.log(`------------------------------------------------------------\n`);

        // Attempt to open browser
        // try {
        //     const startCmd = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
        //     spawn(startCmd, [url], { shell: true });
        // } catch (e) {
        //     console.log("Could not auto-open browser.");
        // }

    }, 5000);

})();
