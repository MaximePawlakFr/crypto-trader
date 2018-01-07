"use strict"
const config = require("./config.local.js");
const freemobile = require("freemobile-sms");

class Utils {

  static sendSms(msg){
    if(typeof msg != "string"){
      msg = JSON.stringify(msg);
    }
    return freemobile.send(msg, config.freeMobileCredentials);
  }
}

module.exports = Utils;
