"use strict"
const config = require("./config.local.js");
const freemobile = require("freemobile-sms");

class Utils {

  static sendSms(msg){
    return freemobile.send(msg, config.freeMobileCredentials);
  }
}

module.exports = Utils;
