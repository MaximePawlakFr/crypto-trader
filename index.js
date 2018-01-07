const Trader = require("./Trader");
const argv = require('minimist')(process.argv.slice(2));
const log = require("./log");
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
      log.info("## buy ##");
      trader.dailyBuy();
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
        }
      })
      .catch( err => {
        log.error(err);
      })
      break;
    case "sendSms":
      Utils.sendSms("Test").
      then(res => {
        log.debug("Sms sent successfully.");
      })
      break;
    default:
      log.info("## No action ##");
  }
}

return;
