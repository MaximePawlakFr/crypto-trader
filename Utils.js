"use strict"
const config = require("./config.local.js");
const freemobile = require("freemobile-sms");

class Utils {

  static sendSms(){
    let args = Array.prototype.slice.call(arguments);
    args = args.map( arg => {
      if(typeof arg != "string"){
        arg = JSON.stringify(arg);
      }
      return arg;
    })
    let msg = args.join('\n');
    return freemobile.send(msg, config.freeMobileCredentials);
  }
}

module.exports = Utils;
