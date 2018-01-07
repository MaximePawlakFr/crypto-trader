const moment = require('moment');
const config = require("./config.local");
var fs = require('fs');
const log = require("./log");
const BitstampTrader = require("./BitstampTrader");
const Utils = require("./Utils");

class Trader {
  constructor( options={} ){
    log.debug("-- Trader --");
    this.marketTrader = new BitstampTrader(options);
    log.debug("-- /Trader --")
  }


  getOpenOrders(){
    return this.marketTrader.getOpenBuyOrders();
  }

  cancelOrder(id){
    return new Promise((resolve, reject) => {
      bitstamp.cancel_order(id, (err, data) => {
        resolve(data);
      });
    });
  }

  getOpenBuyOrders(){
    return this.marketTrader.getOpenOrders();
  }

  buy(balance) {
    return new Promise((resolve, reject)=> {
      this.getTicker()
      .then( ticker => {
        this.limit_price = (1 + this.high_percentage) * ticker.last;
        this.limit_price = parseFloat(this.limit_price.toFixed(2));
        this.price = ticker.last;
        let fee = this.fee + 0.01;
        this.balance = balance * ( 1 - fee/100);
        this.amount = parseFloat((this.balance / this.price).toFixed(8));
        log.info("price: ", this.price);
        log.info("limit_price: ", this.limit_price);
        log.info("amount: ", this.amount);

        if(this.isDebug){
          resolve(true);
          return;
        }
        bitstamp.buy(this.market, this.amount, this.price, this.limit_price, (err, data)=>{
          if(err){
            reject(err);
          }
          let transaction = {
            data
          }
          this.saveTransactionToFile(transaction);
          resolve(data);
        });
      })
    });
  }

  sellMarket() {
    return new Promise((resolve, reject)=> {
        if(this.isDebug){
          resolve(true);
          return;
        }
        let amount = this.lastDataOrder.buy_transaction.amount;
        bitstamp.sellMarket(this.market, amount, (err, data)=>{
          if(err){
            reject(err);
          }
          resolve(data);
        });
      });
  }

  buyMarket(balance) {
    return new Promise((resolve, reject)=> {
      this.getTicker()
      .then( ticker => {
        console.log(ticker);
        let price = ticker.last;
        let fee = this.fee + 0.01
        balance = parseFloat( (balance * (1 - fee/100)).toFixed(2));
        let amount = parseFloat((balance / price).toFixed(8));
        console.log("Balance: ", balance);
        console.log("Price: ", price);
        console.log("Amount: ", amount);

        if(this.isDebug){
          resolve(true);
        }
        bitstamp.buyMarket(this.market, amount, (err, data)=>{
          if(err){
            reject(err);
          }
          resolve(data);
        });
      })
    });
  }

  dailyBuy(){
    return this.marketTrader.dailyBuy()
    .then( data => {
      return Utils.sendSms("Buying", data);
    })
    .then(res => {
      log.debug("Sms sent successfully.");
    })
    .catch( err => {
      log.error(err);
    })
  }

  placeNewBuyOrder(){
    return this.cancelOpenBuyOrders()
    .then( res => {
      this.saveTransactionToFile({});
      return this.dailyBuy();
    });
  }

  cancelOpenBuyOrders(){
    return this.marketTrader.getOpenBuyOrders()
    .then( orders => {
      log.debug("Buy orders: ", orders);
      if(orders.length > 0){
        let promises = orders.map( order => {
          let promise = this.marketTrader.cancelOrder(order.id);
          return promise;
        });
        return Promise.all(promises);
      }else{
        log.info("No buy order.");
      }
    })
    .then( res => {
      if(res){
        log.debug("After cancelling buy orders: ", res);
      }
      return res;
    });
  }

  sellIfLowPrice(){
    return this.marketTrader.checkIfLowSell()
    .then( res => {
      if(res){
        log.info("Selling !");
        return this.marketTrader.cancelAllOrders();
      }
    })
    .then(res => {
      if(res){
        log.info("All orders cancelled: ");
        log.info(res);
        return this.marketTrader.sellMarket();
      }
    })
    .then( res => {
      if(res){
        log.info("Sold Market: ");
        log.info(res);
        return Utils.sendSms("Selling", res);
      }
      return null;
    })
    .then(res => {
      if(res){
        log.debug("Sms sent successfully.");
      }
      return res;
    })
    .catch( err => {
      log.error(err);
    })
  }

  run(){
    let btc_available = 0;
    let isPositive = null;
    let openOrders = [];
    let transactions = [];


    this.getBalance()
    .then( res => {
      console.log(res);
      this.btc_available = res.btc_available;
      this.eur_available = res.eur_available;
      this.fee = res.fee;
    return this.checkIfPositive()
    })
    .then( res => {
      console.log(res);
      isPositive = res;
      return this.getOpenOrders();
    })
    .then( res => {
      console.log(res);
      openOrders = res;
      // return this.getUserTransactions();
    // })
    // .then( res => {
    //   console.log(res);
    //   transactions = res;

      // If not positive
      // are sell orders High or Low ?
      openOrders.filter( order => {
        return order.type == 1
      }).map( sellOrder => {
        console.log("SellOrder", sellOrder);
        if(sellOrder.price > this.lastDataOrder.price){
          console.log("is HIGH order");
          // if(!isPositive){
          //   this.cancelOrder(sellOrder.id)
          //   .then( res => {
          //     console.log("Cancel: ",res);
          //   })
          // }
        }else{
          console.log("is LOW order");
        }
      })

      return this.checkIfLowSell();
    })
    .then( res => {
      console.log(res);
      if(res){
        // Cancel all openOrders and sell ALL
        return this.sellMarket(this.btc_available);
      }
    })
    .then( data => {
      console.log(data);
    })
    .catch(err => {
      console.log(err);
    })
    //   // return this.cancelAllOrders();
    // })
    // .then( res => {
    //   console.log(res);
    //   // return this.cancelAllOrders();
    // })


    // this.buy(0,0,0)
    // .then( data => {
    //   console.log(data);
    // })
    // .catch(err => {
    //   console.log(err);
    // })

    // bitstamp.user_transactions(this.market, (function(err, data) {
    //   console.log(data);
    // }).bind(this));
  }


  checkLastOrder(order){
    if(order && order.buy_transaction && order.buy_transaction.datetime){
      return true;
    }
    return false
  }
  readTransactionFromFile(){
    const content = fs.readFileSync('last_bid.json','utf8');
    let transaction = content;
    try{
      transaction = JSON.parse(content);
    }catch(e){
      return {};
    }finally{
      return transaction;
    }
  }

  saveTransactionToFile(data){
    fs.writeFileSync("last_bid.json", JSON.stringify(data), function(err) {
      if(err) {
        return log.error("Error writing file: ", err);
      }
      log.debug("The file was saved!");
    });
  }
}


module.exports = Trader
