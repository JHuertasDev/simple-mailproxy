const nodemailer = require("nodemailer");
config = require("../config.json");
const commonFunctions = require("./functions.js");
let isDefined = commonFunctions.isDefined;

class sender{
    
    constructor(logger){
        this.logger = logger;
        this.transport = nodemailer.createTransport(this.loadConfigTransport());
    }

    loadConfigTransport(){
        let configTransport = {
            host: config.remote.host,
            port: config.remote.port,
            secure: false,
            auth: {
              user: config.remote.username,
              pass: config.remote.password
            },
            tls: {
                rejectUnauthorized: false
            }
        }
        return configTransport;
    }
    sendMail(mail,callback, ip){ //Esto va a recibir un MAIL parseado
        let message = this.processMailFromMailParser(mail);
        this.logger.info("Trying to send mail From: "+message.from+" to: "+message.to+" IP: "+ip);
        this.transport.sendMail(message,(err,info) => {
            if (isDefined(err)){
                this.logger.error("Error while sending mail From: "+message.from+" to: "+message.to+" Error: "+err+" IP: "+ip);
                callback(new Error("Error al tratar de enviar el mail. "+err));
            }else{
                this.logger.info("Message delivered succesfully from: "+message.from+" to: "+message.to)+" IP: "+ip;
                callback();
            }
        });
    }

    processMailFromMailParser(mail){
        var message = {
            from: mail.from.text,
            subject: mail.subject,
            html: mail.textAsHtml,
            attachments: mail.attachments,
            references: mail.references,
            text: mail.text,
        }
        if(isDefined(mail.to)){
            message.to = mail.to.text;
        }
        if(isDefined(mail.cc)){
            message.cc = mail.cc.text;
        }
        if(isDefined(mail.bcc)){
            message.bcc = mail.bcc.text;
        }
        if(isDefined(mail.replyTo)){
            message.replyTo = mail.replyTo.text;
        }else{
            message.replyTo = mail.from.value[0].address;
        }
        if(isDefined(mail.inReplyTo)){
            message.inReplyTo = mail.inReplyTo.text;
        }

        return message;
    }
}

module.exports = sender;