var bunyan = require('bunyan');

let date = new Date().toISOString().slice(0,10);
let name = "btc-trader";

var log = bunyan.createLogger({
  name,
  streams: [{
    stream: process.stdout,
    level:"trace"
  },
    {
    type: 'rotating-file',
    period: '1d',
    count: 30,
   path: './'+date+'_'+name+'.log',
   level: "trace"
   }]
 });

 module.exports = log;
