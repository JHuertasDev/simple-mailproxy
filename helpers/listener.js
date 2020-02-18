const {SMTPServer} = require('smtp-server');
const simpleParser = require('mailparser').simpleParser;
const config = require("../config.json");
const accounts = require("../accounts.json");
const commonFunctions = require("./functions.js");
let isDefined = commonFunctions.isDefined;


const ERR_WHILE_PARSING_MAIL = "ERROR_WHILE_PARSING_MAIL";
const INVALID_CREDENTIALS = "Usuario o contraseña incorrectos";

class mailManager{
    constructor(sender, logger){
        this.sender = sender;
        this.logger = logger;
    }
    handleMailStream(stream, callback, ip){    
        simpleParser(stream)
            .then(mail => {
                this.sender.sendMail(mail, callback, ip);
            })
            .catch(err => {
                this.handleErrorParsingMail(err, callback);
                callback(new Error("Parsing mail error"));
            });   
    }
    handleErrorParsingMail(err,callback){
        this.logger.error("Error parsing mail: "+err);
        callback(new Error(ERR_WHILE_PARSING_MAIL));
    }
}

class userManager{
    userExists(userName){
        if(isDefined(accounts.users[userName])){
            return true;
        }
        return false;
    }
    getPasswordByUsername(userName){
        return accounts.users[userName];
    }
}

class authManager{
    constructor(logger){
        this.logger = logger;
        this.userManager = new userManager();
    }
    handleAuth = function(auth, session, callback){
        this.logger.info("Trying to login User: "+auth.username+" Password: "+auth.password+" Auth method: "+auth.method+ " IP: "+session.remoteAddress);
        if(!this.validateLogin(auth.method, auth.username, auth.password, auth)){
            this.logger.info("Incorrect login User: "+auth.username+" Password: "+auth.password+" Auth method: "+auth.method);
            return callback(new Error(INVALID_CREDENTIALS));
        }
        this.logger.info("User loged: "+auth.username);
        callback(null, { user: 1 }); 
    }
    validateLogin(authMethod, username, password,auth){
        if(this.userManager.userExists(username)){
            let storedUserPassowrd = this.userManager.getPasswordByUsername(username);
            switch(authMethod){
                case "CRAM-MD5":
                    return auth.validatePassword(storedUserPassowrd);
                break;
                case "XOAUTH2":
                    return false;    
                break;
                case "PLAIN":
                    if(storedUserPassowrd == password){
                        return true;
                    }
                case "LOGIN":
                    if(storedUserPassowrd == password){
                        return true;
                    }
                break;
            }
            return false;
        }else{
            return false;
        }   
    }
}

class listener {
    constructor(sender, logger) {
        this.sender = sender;
        this.logger = logger;
        this.authManager = new authManager(logger);
        this.mailManager = new mailManager(sender, logger);
        this.createSimpleServer();
        this.serverListen();
    }

    createSimpleServer() {
        /*  Disable STARTTLS to allow authentication in clear text mode
        *   See full documentation in https://nodemailer.com/extras/smtp-server/
        */

        //Make reference to current listener obj
        let currentListener = this;
        
        this.server = new SMTPServer({
            disabledCommands: ['STARTTLS'],
            onData(stream, session, callback) {
                currentListener.mailManager.handleMailStream(stream,callback,session.remoteAddress);
            },
            onAuth(auth, session, callback) {
                currentListener.authManager.handleAuth(auth, session, callback);
                //currentListener.handleAuth(auth, session, callback);
            },
            name: config.local.name
        });

        
    }

    serverListen(){
        this.server.listen(config.local.port);
        this.server.on('error',err=>{
            this.logger.error("Error on listener: "+err);
        })
    }
    handleMailStream(stream, callback, ip){
        this.handleMail(stream, callback, ip);
    }
    handleMail(stream,callback, ip){
        
        simpleParser(stream)
            .then(mail => {
                this.sender.sendMail(mail, callback, ip);
            })
            .catch(err => {
                this.handleErrorParsingMail(err, callback);
                callback(new Error("Parsing mail error"));
            });   
    }

    handleErrorParsingMail(err,callback){
        this.logger.error("Error parsing mail: "+err);
        //callback(new Error("Error parsing mail"));
    }   
}

module.exports = listener;