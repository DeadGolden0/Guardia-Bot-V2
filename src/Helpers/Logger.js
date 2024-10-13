// Configuration
const { LOG_LEVEL } = require('@Root/Config');

// Utilitaires
const pc = require('picocolors');

// Date/Temps avec Day.js et extensions
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const utc = require('dayjs/plugin/utc');

// Configurer Day.js avec localisation française et extensions
require('dayjs/locale/fr');
dayjs.extend(utc);
dayjs.extend(localizedFormat);

const logTypes = {
    log: pc.blue,
    warn: pc.yellow,
    error: pc.red,
    debug: pc.gray,
    cmd: pc.gray,
    ready: pc.green,
    success: pc.green,
    load: pc.magenta,
    event: pc.cyan,
    default: pc.white,
};

class Logger {
    /**
     * Log a message to the console
     * @param {string} content The content to log
     * @param {string} type The type of log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static log(content, type = 'log') {
        const timestamp = pc.gray(`[${dayjs().locale('fr').format('LLLL')}]`);
        const typeColor = logTypes[type] || logTypes.default;
        const typeTag = `[${typeColor(type.toUpperCase())}]`;
        console.log(`${timestamp} ${typeTag} ${content}`);
    }

    /**
     * Log an error message to the console
     * @param {string} content The content to log
     * @param {Error} err The error to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static error(content, err = null) {
        if (err) {
            Logger.log(`${content} ${err.stack || err.message || err}`, 'error');
        } else {
            Logger.log(content, 'error');
        }
    }

    /**
     * Log a warning message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static warn(content) {
        Logger.log(content, 'warn');
    }

    /**
     * Log a debug message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static debug(content) {
        if (LOG_LEVEL === 'DEBUG') {
            Logger.log(content, 'debug');
        }
    }

    /**
     * Log a command message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static cmd(content) {
        Logger.log(content, 'cmd');
    }

    /**
     * Log a ready message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static ready(content) {
        Logger.log(content, 'ready');
    }

    /**
     * Log a success message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static success(content) {
        Logger.log(content, 'success');
    }

    /**
     * Log a load message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static load(content) {
        Logger.log(content, 'load');
    }

    /**
     * Log an event message to the console
     * @param {string} content The content to log
     * @returns {void}
     * @static
     * @memberof Logger
     */
    static event(content) {
        Logger.log(content, 'event');
    }
    
} module.exports = Logger;