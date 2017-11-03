'use strict'
// import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import websocket from './lib/websocket'
import routes from './lib/routes'

// dotenv.config({path: '../.env'})
//
// if (!process.env.PORT       ||
//     !process.env.IP_ADDRESS
//    ) {
//     console.log(`You must set:
//           PORT
//           IP_ADDRESS
//           `)
//
//     process.exit(-1)
// }
//EXPRESS
const PORT = process.env.PORT || 3001
const IP_ADDRESS = process.env.IP_ADDRESS
const P2P_PORT = process.env.P2P_PORT || 6001
const INITIAL_PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

const app = express()

app.use(routes)

app.use(bodyParser.json())

app.listen(PORT, IP_ADDRESS, function () {
  console.log('Server listening at', this.address())
})

//WEBSOCKET
websocket.connectToPeers(INITIAL_PEERS)
websocket.initP2PServer(P2P_PORT, INITIAL_PEERS)
