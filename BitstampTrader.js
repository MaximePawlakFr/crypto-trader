var Bitstamp = require("./bitstamp");
const moment = require("moment");
const config = require("./config.local");
var bitstamp = new Bitstamp(
  config.key,
  config.secret,
  config.client_id,
  null,
  "https://www.bitstamp.net"
);
var fs = require("fs");
const log = require("./log");
const Utils = require("./Utils");

class BitstampTrader {
  static DEFAULT_HIGH_PERCENTAGE() {
    return 0.015;
  }

  static DEFAULT_LOW_PERCENTAGE() {
    return -0.04;
  }

  static DEFAULT_MARKET() {
    return "btceur";
  }

  constructor(options = {}) {
    log.debug("-- BitstampTrader --");
    log.debug("Options: ", options);

    this.isDebug = options.isDebug || false;
    this.high_percentage = options.high_percentage || 0.015;
    this.low_percentage = options.low_percentage || -0.04;
    this.market = options.market || "btceur";
    log.debug("this.isDebug: ", this.isDebug);
    log.debug("this.market: ", this.market);
    log.debug("this.high_percentage: ", this.high_percentage);
    log.debug("this.low_percentage: ", this.low_percentage);

    log.debug("-- /BitstampTrader --");
  }

  getBalance() {
    return bitstamp.balance(this.market);
  }

  getTicker() {
    return bitstamp.ticker(this.market);
  }

  getTickerHour() {
    return bitstamp.ticker_hour(this.market);
  }

  getOpenOrders() {
    return bitstamp.open_orders(this.market);
  }

  getUserTransactions() {
    return bitstamp.user_transactions(this.market);
  }

  cancelOrder(id) {
    return bitstamp.cancel_order(id);
  }

  cancelAllOrders() {
    return bitstamp.cancel_all_orders();
  }

  cancelAllOrders() {
    return bitstamp.cancel_all_orders();
  }

  buy(amount, price, limit_price) {
    return bitstamp.buy(this.market, amount, price, limit_price);
  }

  buyAll() {
    return this.getBalance().then(res => {
      return this.buy(res.eur_available); // FIXME with other currencies
    });
  }

  checkIfLowSell() {
    return this.getTicker().then(ticker => {
      let res = false;
      this.low_price =
        (1 + this.low_percentage) * this.lastDataOrder.buy_transaction.price;
      this.low_price = parseFloat(this.low_price.toFixed(2));
      if (ticker.last < this.low_price) {
        res = true;
      }
      let percentage =
        (ticker.last - this.lastDataOrder.buy_transaction.price) /
        this.lastDataOrder.buy_transaction.price;
      percentage = (percentage * 100).toFixed(2);
      log.info(`CheckIfLowSell: ${res}`);
      log.info(`Current %: ${percentage}%`);
      log.info(`Actual/Low_price ${ticker.last}/${this.low_price}`);
      return res;
    });
  }

  getOpenBuyOrders() {
    return this.getOpenOrders().then(orders => {
      return orders.filter(order => {
        return order.type == 0;
      });
    });
  }

  buy2(balance) {
    return new Promise((resolve, reject) => {
      this.getTicker().then(ticker => {
        this.limit_price = (1 + this.high_percentage) * ticker.last;
        this.limit_price = Utils.toFloat(this.limit_price);
        this.price = ticker.last;
        this.balance = balance;
        let fee = this.fee + 0.01;
        this.amountSpent = balance * (1 - fee / 100);
        this.amount = parseFloat((this.amountSpent / this.price).toFixed(8));
        this.amountSpent = Utils.toFloat(this.amountSpent);
        log.info("price: ", this.price);
        log.info("limit_price: ", this.limit_price);
        log.info("amount: ", this.amount);

        if (this.isDebug) {
          resolve(true);
          return;
        }
        bitstamp.buy(
          this.market,
          this.amount,
          this.price,
          this.limit_price,
          (err, data) => {
            if (err) {
              reject(err);
            }
            resolve(data);
          }
        );
      });
    });
  }

  sellMarket(amount) {
    return new Promise((resolve, reject) => {
      if (this.isDebug) {
        resolve(true);
        return;
      }
      bitstamp.sellMarket(this.market, amount, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  getAmountSpent() {
    let amount =
      this.lastDataOrder.buy_transaction.price *
      this.lastDataOrder.buy_transaction.amount;
    amount = parseFloat(amount.toFixed(2));
    return amount;
  }

  getPotentialGain() {
    let amountSpent = this.amountSpent;

    let limit_price = this.limit_price;
    let amountReceived = limit_price * this.amount * (1 - this.fee / 100);
    amountReceived = Utils.toFloat(amountReceived);
    let gain = amountReceived - amountSpent;
    gain = Utils.toFloat(gain);
    log.debug("amountSpent", amountSpent);
    log.debug("limit_price", limit_price);
    log.debug("amountReceived", amountReceived);
    log.debug("gain", gain);
    return gain;
  }

  buyMarket(balance) {
    return new Promise((resolve, reject) => {
      this.getTicker().then(ticker => {
        console.log(ticker);
        let price = ticker.last;
        let fee = this.fee + 0.01;
        let amountSpent = parseFloat((balance * (1 - fee / 100)).toFixed(2));
        let amount = parseFloat((amountSpent / price).toFixed(8));
        console.log("Balance: ", amountSpent);
        console.log("Price: ", price);
        console.log("Amount: ", amount);

        if (this.isDebug) {
          resolve(true);
        }
        bitstamp.buyMarket(this.market, amount, (err, data) => {
          if (err) {
            reject(err);
          }
          resolve(data);
        });
      });
    });
  }

  dailyBuy() {
    let btc_available = 0;
    let eur_available = 0;

    return this.getBalance()
      .then(res => {
        console.log(res);
        this.btc_available = res.btc_available;
        this.eur_available = res.eur_available;
        this.fee = res.fee;
        log.debug("btc_available: ", this.btc_available);
        log.debug("eur_available: ", this.eur_available);
        log.debug("fee: ", this.fee);
        if (
          this.checkLastOrder(this.lastDataOrder) &&
          moment
            .utc(this.lastDataOrder.buy_transaction.datetime)
            .isSame(moment(), "day")
        ) {
          log.info("Will not buy: IS SAME DAY");
          return null;
        } else {
          log.info("Not same day, let's buy !");
          return this.buy(this.eur_available);
        }
      })
      .then(data => {
        log.debug(data);
        if (!data || data.status == "error") {
          throw data;
          return;
        }

        let transaction = {
          options: {
            market: this.market,
            high_percentage: this.high_percentage,
            low_percentage: this.low_percentage,
            fee: this.fee,
            amount_spent: this.eur_available,
            limit_price: this.limit_price,
            price: this.price
          },
          buy_transaction: data
        };
        this.saveTransactionToFile(transaction);

        return transaction;
      });
  }

  checkLastOrder(order) {
    if (order && order.buy_transaction && order.buy_transaction.datetime) {
      return true;
    }
    return false;
  }

  isLowerThanLowLimit() {}

  isHigherThanHighLimit() {}

  isBuyingDone() {}

  isSellingDone() {}
}

module.exports = BitstampTrader;
