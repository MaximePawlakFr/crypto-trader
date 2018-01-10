const BitstampTrader = require("./BitstampTrader");
const moxios = require('moxios')

beforeEach( () => {
  moxios.install();
  const host = "https://www.bitstamp.net/api/v2";
  moxios.stubRequest(host + "/ticker/btceur/", {
    status:200,
    response: {
      high: "13615.00",
      last: "12380.00",
      timestamp: "1515431570",
      bid: "12379.99",
      vwap: "12647.26",
      volume: "4712.32892484",
      low: "11427.63",
      ask: "12380.00",
      open: "13404.75"
    }
  })

  moxios.stubRequest(host + "/ticker_hour/btceur/", {
    status:200,
    response: {
      high: "14615.00",
      last: "14380.00",
      timestamp: "1515431570",
      bid: "12379.99",
      vwap: "12647.26",
      volume: "4712.32892484",
      low: "11427.63",
      ask: "12380.00",
      open: "13404.75"
    }
  })

  moxios.stubRequest(host + "/balance/btceur/", {
    status: 200,
    response: {
      btc_available: "0.00000000",
      btc_balance: "0.00000000",
      btc_reserved: "0.00000000",
      eur_available: "65.00",
      eur_balance: "65.00",
      eur_reserved: "0.00",
      fee: 0.24
    }
  });

  moxios.stubRequest(host + "/open_orders/btceur/", {
    status:200,
    response:[]
  });
});

afterEach(function () {
  moxios.uninstall()
});

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

const bt = new BitstampTrader();
test("BitstampTrader", () => {
  expect(bt.isDebug).toBe(false);
});

test("getTicker", () => {
  return bt.getTicker().then(res => {
    expect(res).toBeDefined();
    expect(res.last).toBeDefined();
    expect(res.last).toBe("12380.00");
    expect(res.timestamp).toBeDefined();
    return;
  });
});

test("getTickerHour", () => {
  return bt.getTickerHour().then(res => {
    expect(res).toBeDefined();
    expect(res.last).toBeDefined();
    expect(res.last).toBe("14380.00");
    expect(res.timestamp).toBeDefined();
    return;
  });
});

test("getBalance", (done) => {
  const bt = new BitstampTrader();
  return bt.getBalance().then(res => {
    expect(res).toBeDefined();
    expect(res.eur_available).toBeDefined();
    expect(res.eur_available).toBe("65.00");
    expect(res.fee).toBe(0.24);
    done();
  })
});

test("getOpenOrders", () => {
  return bt.getOpenOrders().then(res => {
    expect(res).toBeDefined();
    expect(res).toEqual([]);
    return;
  });
});
