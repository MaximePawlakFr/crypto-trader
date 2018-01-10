const axios = require('axios')
const moxios = require('moxios')

const BitstampTrader = require("./BitstampTrader");

describe('mocking axios requests', function () {

  describe('across entire suite', function () {

    beforeEach(function () {
      // import and pass your custom axios instance to this method
      moxios.install()
      moxios.stubRequest('https://www.bitstamp.net/api/v2/balance/btceur/', {
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
      })
    })

    afterEach(function () {
      // import and pass your custom axios instance to this method
      moxios.uninstall()
    })


    test('stub response for any matching request URL', function (done) {
      // Match against an exact URL value
      const bt = new BitstampTrader();

      return bt.getBalance().then(res => {
        console.log(res);
        expect(res).toBeDefined();
        expect(res.fee).toBeDefined();
        expect(res.last).toBe("12380.00");
        expect(res.timestamp).toBeDefined();
        return;
      });
    })

  })

  // it('just for a single spec', function (done) {
  //   moxios.withMock(function () {
  //     let onFulfilled = sinon.spy()
  //     axios.get('/users/12345').then(onFulfilled)
  //
  //     moxios.wait(function () {
  //       let request = moxios.requests.mostRecent()
  //       request.respondWith({
  //         status: 200,
  //         response: {
  //           id: 12345, firstName: 'Fred', lastName: 'Flintstone'
  //         }
  //       }).then(function () {
  //         equal(onFulfilled.called, true)
  //         done()
  //       })
  //     })
  //   })
  // })

})
