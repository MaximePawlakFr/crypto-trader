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

  static toFloat(number, decimals){
    return parseFloat(number.toFixed(decimals?decimals:2));
  }

  static readTransactionFromFile() {
    const content = fs.readFileSync("last_bid.json", "utf8");
    let transaction = content;
    try {
      transaction = JSON.parse(content);
    } catch (e) {
      return {};
    } finally {
      return transaction;
    }
  }

  static saveTransactionToFile(data) {
    fs.writeFileSync("last_bid.json", JSON.stringify(data), function(err) {
      if (err) {
        return log.error("Error writing file: ", err);
      }
      log.debug("The file was saved!");
    });
  }
}

module.exports = Utils;
