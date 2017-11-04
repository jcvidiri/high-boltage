'use strict'
import express from 'express'
import bodyParser from 'body-parser'
import routes from './lib/routes'
import * as webSocket from './lib/websocket'

const PORT = process.env.PORT || 3001
const IP_ADDRESS = process.env.IP_ADDRESS
const P2P_PORT = process.env.P2P_PORT || 6001
const INITIAL_PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

//EXPRESS
const app = express()

app.use(routes)

app.use(bodyParser.json())

app.listen(PORT, IP_ADDRESS, function () {
  console.log('Server listening at', this.address())
})

//WEBSOCKET
webSocket.initP2PServer(P2P_PORT, INITIAL_PEERS)
webSocket.connectToPeers(INITIAL_PEERS)
