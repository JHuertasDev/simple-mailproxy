listener = require('./helpers/listener');
sender = require('./helpers/sender');
initializeLogger = require('./helpers/logger.js');

let logger = initializeLogger();
sender = new sender(logger);
SimpleServer = new listener(sender, logger);;
