var Bitstamp = require('bitstamp');
const moment = require('moment');
const config = require("./config.local");
const Trader = require("./Trader");
var bitstamp = new Bitstamp(config.key, config.secret, config.client_id);
var fs = require('fs');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: 'btc-trader',
  streams: [{
    stream: process.stdout
  },
    {
    type: 'rotating-file',
    period: '1d',
    count: 30,
   path: './log.log',
   }]
 });
log.info('hi');
log.warn({lang: 'fr', t:[1, 2, 3]}, 'au revoir');

var argv = require('minimist')(process.argv.slice(2));
// bitstamp.balance(null, console.log);
log.info(argv)

const isDebug = argv.debug || false;
log.info("isDebug: ",   isDebug)
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
      break;
    default:
      log.info("## No action ##");
  }
}

return;
