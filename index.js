const argv = require('minimist')(process.argv.slice(2));
const log = require("./log");
const Trader = require("./Trader");
const Utils = require("./Utils");

const config = require("./config.local");
log.debug("----- ----- ----- ----- ----- -----");
log.info("Command arguments: ", argv);

const isDebug = argv.debug || false;
if(argv.action){
  let action = null;
  let options = {
    isDebug,
    market: 'btceur',
    high_percentage: argv.high || null,
    low_percentage: -argv.low || null
  };
  const trader  = new Trader(options);

  switch(argv.action){
    case "buy":
      log.info("#########");
      log.info("## Buy ##");
      log.info("#########");
      trader.dailyBuy()
      .then( data => {
        return Utils.sendSms(data);
      })
      .then(res => {
        log.debug("Sms sent successfully.");
      })
      .catch( err => {
        log.error(err);
      })
      break;
    case "sellIfLowPrice":
      trader.checkIfLowSell()
      .then( res => {
        if(res){
          log.info("Selling !");
          return trader.cancelAllOrders();
        }
      })
      .then(res => {
        if(res){
          log.info("All orders cancelled: ");
          log.info(res);
          return trader.sellMarket();
        }
      })
      .then( res => {
        if(res){
          log.info("Sold Market: ");
          log.info(res);
          return Utils.sendSms(res);
        }
        return null;
      })
      .then(res => {
        if(res){
          log.debug("Sms sent successfully.");
        }
      })
      .catch( err => {
        log.error(err);
      })
      break;
    case "sendSms":
      Utils.sendSms("Test")
      .then(res => {
        log.debug("Sms sent successfully.");
        let t = new Trader()
        Utils.sendSms(t.lastDataOrder);
      })
      .catch( err => {
        log.error("Failed to send sms", err);
      })
      break;
    default:
      log.info("## No action ##");
  }
}

return;
