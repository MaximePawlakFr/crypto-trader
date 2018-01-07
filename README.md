
# Roadmap
* trader to buy X BTC in BTC/EUR at Xh
* if rate > x_max $, sell
* if rate < x_min $, sell
* check that buy is ok
** if some buy / some sell, handle that

```
node index.js --action buy --high 0.015 --low 0.05
```

```
node index.js --action buy --debug
```

```
node index.js --action buy
```

```
node index.js --action sellIfLowPrice --low 0.01
```

```
node index.js --action sellIfLowPrice
```

```
rsync -avz --exclude-from=.gitignore ./ btc:btc-trader
```
