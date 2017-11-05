'use strict'
import express from 'express'
import * as blockchainController from './controllers/blocks'
import * as webSocket from './websocket'
import bodyParser from 'body-parser'

// import * as minerController from './controllers/miner'

const app = express()
app.use(bodyParser.json())


// ROUTES
const blocks    = '/blocks',
      mineBlock = '/mineBlock',
      peers     = '/peers',
      addPeer   = '/addPeer'

//GETS
app.get(blocks, (req, res, next) => {
  blockchainController.getBlockchain((err, result) => {
    if (err) return next(err)

    res.send(result)
  })
})

//POSTS
app.post(mineBlock, (req, res, next) => {
  blockchainController.mineBlock(req.body.data, (err, result) => {
      if (err) return next(err)

      res.send(result)
    })
})
app.get(peers, (req, res) => {
    res.send(webSocket.sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort))
})
app.post(addPeer, (req, res) => {
    connectToPeers([req.body.peer])
    res.send()
})

export default app
