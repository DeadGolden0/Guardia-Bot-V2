const mongoose = require('mongoose');
const { MONGODB_URI } = require('@Config/Config');
const logger = require('@Helpers/Logger');

/**
 * Initializes the connection to MongoDB
 * @returns {Promise<mongoose.Connection>} The mongoose connection
 * @memberof Mongoose
 */
module.exports = {
  async initializeMongoose() {
    logger.log('Connecting to MongoDB...');

    try {
      const connection = await mongoose.connect(MONGODB_URI);

      if (connection.connection.readyState === 1) {
        logger.success('Mongoose: Database connection established successfully');
      } else {
        logger.error('Mongoose: Connection established but with issues');
      }

      return mongoose.connection;

    } catch (error) {
      logger.error('Mongoose: Failed to connect to database', error.message);
      process.exit(1);
    }
  },

  schemas: {
    Project: require("./schemas/Project"),
    RoleRequest: require("./schemas/RoleRequest"),
    ServerConfig: require("./schemas/ServerConfig"),
  },
};