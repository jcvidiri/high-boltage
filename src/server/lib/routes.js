'use strict'
import express from 'express'
import * as blockchainController from './controllers/blocks'
// import * as minerController from './controllers/miner'

const app = express()

// ROUTES
const test      = '/',
      blocks    = '/blocks',
      mineBlock = '/mineBlock',
      peers     = '/peers',
      addPeer   = '/addPeer'

//GETS
app.get(test, (req, res, next) => {
  blockchainController.blockchain((err, result) => {
    if (err) return next(err)

    res.send(result)
  })
})

app.get(blocks, (req, res, next) => {

  res.send(JSON.stringify(blockchain))
})

app.post(mineBlock, (req, res, next) => {
    var newBlock = generateNextBlock(req.body.data)
    addBlock(newBlock)
    broadcast(responseLatestMsg())
    console.log('block added: ' + JSON.stringify(newBlock))
    res.send()
})
app.get(peers, (req, res) => {
    res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort))
})
app.post(addPeer, (req, res) => {
    connectToPeers([req.body.peer])
    res.send()
})
app.listen(http_port, () => console.log('Listening http on port: ' + http_port))


export default app
