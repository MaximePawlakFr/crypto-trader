const BitstampTrader = require("./BitstampTrader");


test('adds 1 + 2 to equal 3', () => {
  expect(1+2).toBe(3);
});

test("BitstampTrader", () => {
  const bt = new BitstampTrader();
  expect(bt.isDebug).toBe(false);
})

test("getTicker", () => {
  const bt = new BitstampTrader();
  return bt.getTicker()
  .then( res => {
    console.log(res);
    expect(res.last).toBeDefined();
  })
})
