const chokidar = require('chokidar');
const spawn = require('child_process').spawn;
const path = require('path');
const Utility = require('../utils/utility');
const logger = require('../lib/logger');
const { log } = require('console');

class Makenode {
    constructor() {
        this.__init__();
    }

    __init__ = () => {
        this.args = process.argv;
        this.file = this.args[2];
        this.cwd = process.cwd();
        this.watchPaths = [path.join(this.cwd, '**/*.js')];
        this.ignoredPaths = '**/node_modules/*';
        
        this.logInit();
        this.reload();
        this.startWatching();
        this.listeningEvents();
    }
    reload = () => {
        logger('debug', `starting ${this.file}`);
        if (this.nodeServer) this.nodeServer.kill('SIGTERM');

        this.nodeServer = spawn('node', [this.file], {
            stdio: [process.stdin, process.stdout, process.stderr],
        });
        this.nodeServer.on('close', () => {
            logger('error', 'App crashed. Waiting for changes to start...')
        });
    }
    startWatching = () => {
        chokidar
            .watch(this.watchPaths, {
                ignored: this.ignoredPaths,
                ignoreInitial: true,
            })
            .on('all', (event, path) => {
                if (this.debounceTimer) clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.reload();
                }, 500);
            })
    }
    listeningEvents = () => {
        // listening on CLI input
        process.stdin.on('data', (chunk) => {
            let cliInput = chunk.toString();

            switch (cliInput) {
                case 'rs\n':
                    this.reload();
                    break;
            }
        })
    }
    logInit = () => {
        logger('info', 'v1.0.0');
        logger('info', 'to restart at any time, enter `rs`');
    }
}

module.exports = new Makenode();
