const pc = require('picocolors');

// Define log types with their respective colors
const logTypes = {
  log: pc.blue,
  warn: pc.yellow,
  error: pc.red,
  debug: pc.gray,
  ready: pc.green,
  success: pc.green,
  load: pc.magenta,
  default: pc.white,
};

class Logger {
  /**
   * Formats the current timestamp for logging
   * @returns {string} Formatted timestamp
   */
  static formatTimestamp() {
    const date = new Date();

    return pc.gray(`[${new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date)}]`);
}

  /**
   * Logs a message to the console with the given type
   * @param {string} content - The message to log
   * @param {string} [type='log'] - The log type (log, warn, error, etc.)
   * @returns {void}
   */
  static writeLog(content, type = 'log') {
    const timestamp = this.formatTimestamp();
    const typeColor = logTypes[type] || logTypes.default;
    const typeTag = `[${typeColor(type.toUpperCase())}]`;
    console.log(`${timestamp} ${typeTag} ${content}`);
  }

  /**
   * Logs a general message to the console
   * @param {string} content - The message to log
   * @returns {void}
   */
  static log(content) {
    this.writeLog(content, 'log');
  }

  /**
   * Logs an error message to the console
   * @param {string} content - The error message
   * @param {Error} [err=null] - The error object (optional)
   * @returns {void}
   */
  static error(content, err = null) {
    const errorMessage = err ? `${content}: ${err.stack || err.message}` : content;
    this.writeLog(errorMessage, 'error');
  }

  /**
   * Logs a warning message to the console
   * @param {string} content - The warning message
   * @returns {void}
   */
  static warn(content) {
    this.writeLog(content, 'warn');
  }

  /**
   * Logs a debug message to the console
   * @param {string} content - The debug message
   * @returns {void}
   */
  static debug(content) {
    this.writeLog(content, 'debug');
  }

  /**
   * Logs a ready message to the console (used when the bot is ready)
   * @param {string} content - The ready message
   * @returns {void}
   */
  static ready(content) {
    this.writeLog(content, 'ready');
  }

  /**
   * Logs a success message to the console
   * @param {string} content - The success message
   * @returns {void}
   */
  static success(content) {
    this.writeLog(content, 'success');
  }

  /**
   * Logs a load message to the console (used for loading components)
   * @param {string} content - The load message
   * @returns {void}
   */
  static load(content) {
    this.writeLog(content, 'load');
  }
}

module.exports = Logger;