# High Boltage

![High Boltage](miscellaneous/highboltage.png)

## SERVER

### Install dependencies
```bash
npm i && npm i -g forever
```
### Run developement mode:

```bash
npm run dev
```

### Run tests:

```bash
npm run test
```

### Start a single node:

```bash
npm start $h $p
```

> i.e. `npm start 3000 6000`

### Start multiple nodes:

```bash
npm run start-multiple $h $p $i
```

> Http and p2p ports will be the following `n` port numbers where `n` is the initial port + (instance number - 1). For example, `npm run start-multiple h=3000 p=6000 i=4` will generate the following instances: 

| uid          | http | p2p  | instance | total instances |
| ------------ | ---- | ---- | -------- | --------------- |
| hb-3000-6000 | 3000 | 6000 | 1        | 4               |
| hb-3001-6001 | 3001 | 6001 | 2        | 4               |
| hb-3002-6002 | 3002 | 6002 | 3        | 4               |
| hb-3003-6003 | 3003 | 6003 | 4        | 4               |

### Stop multiple nodes:

```bash
npm run stop-multiple
```

### Start single node inside multiple hive
```bash
npm run start-single $h $p $instance $instances
```
> i.e `npm run start-single h=3005 p=6005 instance=6 instances=6`

### Watch logs
```bash
npm run log $h $p
```
> i.e npm run log h=3000 p=6000



### FOR DEMO
```
mutation {
  createFlowWithTestKey(flow:{
    amount: 4,
    claimId: "6952c20960f56ea781f0b3aa7ad820c3108d60ff9dd67de9546047b63bbd1d2d"
  }, testKey: "1") {
    id
    claimId
    timestamp
    amount
    generator
    signature
    cammesaSignature
  }
}
```

```
mutation {
  createContract(contract:{
    amount: 30,
 		price: 900
  }) {
    price
    claimId
    claimId
    amount
    expDate
  }
}
```