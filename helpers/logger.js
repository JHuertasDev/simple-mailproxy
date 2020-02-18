 
const { createLogger, format, transports }  = require('winston');




function initializeLogger(){
    let logger = createLogger({
        level: 'info',
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          format.errors({ stack: true }),
          format.splat(),
          format.json()
        ),
        defaultMeta: { service: 'mailproxy' },
        transports: [
          new transports.File({ filename: './logs/errors.log', level: 'error' }),
          new transports.File({ filename: './logs/info.log' }),
        ]
    });

    return logger;
}

module.exports = initializeLogger;

