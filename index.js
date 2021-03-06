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
      trader.dailyBuy();
      break;
    case "getOpenOrders":
      trader.getOpenOrders()
      .then( orders => {
        log.debug(orders);
      });
      break;
    case "getOpenBuyOrders":
      trader.getOpenBuyOrders()
      .then( orders => {
        log.debug(orders);
      });
      break;
    case "cancelAllOrders":
      trader.cancelAllOrders();
    case "cancelOpenBuyOrders":
      trader.cancelOpenBuyOrders();
      break;
    case "placeNewBuyOrder":
      trader.placeNewBuyOrder();
      break;
    case "sellIfLowPrice":
      trader.sellIfLowPrice();
      break;
    case "getBalance":
      trader.getBalance()
      .then(res => {
        log.info(res);
      })
      .catch(err => {
        log.error(err);
      });
      break;
    case "sellMarket":
      trader.sellMarket();
      break;
    case "sendSms":
      Utils.sendSms("Salu", {t: [1,2]})
      .then(res => {
        log.debug("Sms sent successfully.");
      })
      .catch( err => {
        log.error("Failed to send sms", err);
      })
      break;
    case "reset":
        trader.reset();
      break;
    default:
      log.info("## No action ##");
  }
}

return;
