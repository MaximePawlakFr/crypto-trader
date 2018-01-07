var Bitstamp = require('bitstamp');
const moment = require('moment');
const config = require("./config.local");
var bitstamp = new Bitstamp(config.key, config.secret, config.client_id);
var fs = require('fs');
const log = require("./log");

class Trader {
  constructor( options={} ){
    log.debug("-- Trader --");
    log.debug("Options: ", options);

    this.isDebug = options.isDebug || false;
    this.high_percentage = options.high_percentage || 0.015;
    this.low_percentage = options.low_percentage || -0.04;
    this.market = options.market || "btceur";
    log.debug("this.isDebug: ", this.isDebug);
    log.debug("this.market: ", this.market);
    log.debug("this.high_percentage: ", this.high_percentage);
    log.debug("this.low_percentage: ", this.low_percentage);

    this.lastDataOrder = this.readTransactionFromFile();
    log.debug("this.lastDataOrder: ", this.lastDataOrder);

    log.debug("-- /Trader --")
  }

  getBalance(){
    return new Promise((resolve, reject) => {
      bitstamp.balance(this.market, (err, data) => {
        resolve(data);
      });
    });
  }

  getTicker(){
    return new Promise((resolve, reject) => {
      bitstamp.ticker(this.market, (err, ticker) => {
        resolve(ticker);
      });
    });
  }

  getOpenOrders(){
    return new Promise((resolve, reject) => {
      bitstamp.open_orders(this.market, (err, data) => {
        resolve(data);
      });
    });
  }

  getUserTransactions(){
    return new Promise((resolve, reject) => {
      bitstamp.user_transactions(this.market, (err, data) => {
        resolve(data);
      });
    });
  }

  cancelOrder(id){
    return new Promise((resolve, reject) => {
      bitstamp.cancel_order(id, (err, data) => {
        resolve(data);
      });
    });
  }

  cancelAllOrders(){
    return new Promise((resolve, reject) => {
      if(this.isDebug){
        resolve(true);
        return;
      }
      bitstamp.cancel_all_orders((err, data) => {
        resolve(data);
      });
    });
  }

  checkIfLowSell(){
    return this.getTicker()
    .then( ticker => {
      let res = false;
      this.low_price = (1 + this.low_percentage) * this.lastDataOrder.buy_transaction.price;
      this.low_price = parseFloat(this.low_price.toFixed(2));
      if(ticker.last < this.low_price){
        res = true;
      }
      let percentage = (ticker.last - this.lastDataOrder.buy_transaction.price)/this.lastDataOrder.buy_transaction.price;
      percentage = (percentage * 100).toFixed(2);
      log.info(`CheckIfLowSell: ${res}`);
      log.info(`Current %: ${percentage}%`);
      log.info(`Actual/Low_price ${ticker.last}/${this.low_price}`);
      return res
    })
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
    let btc_available = 0;
    let eur_available = 0;

    return this.getBalance()
    .then( res => {
      console.log(res);
      this.btc_available = res.btc_available;
      this.eur_available = res.eur_available;
      this.fee = res.fee;
      log.debug("btc_available: ",this.btc_available);
      log.debug("eur_available: ",this.eur_available);
      log.debug("fee: ",this.fee);
      if(this.checkLastOrder(this.lastDataOrder)
        && moment.utc(this.lastDataOrder.buy_transaction.datetime).isSame(moment(), "day")){
        log.info("Will not buy: IS SAME DAY");
        return null;
      }else{
        log.info("Not same day, let's buy !");
        return this.buy(this.eur_available);
      }
    })
    .then( data => {
      log.debug(data);
      if(!data || data.status == "error"){
        return;
      }

      let transaction = {
        options:{
          market: this.market,
          high_percentage: this.high_percentage,
          low_percentage: this.low_percentage,
        },
        buy_transaction: data
      }
      this.saveTransactionToFile(transaction);

      return transaction;
    });
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
    fs.writeFile("last_bid.json", JSON.stringify(data), function(err) {
      if(err) {
        return log.error("Error writing file: ", err);
      }
      log.debug("The file was saved!");
    });
  }
}


module.exports = Trader
