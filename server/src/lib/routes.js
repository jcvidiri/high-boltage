'use strict'
import express from 'express'
import * as blockchainController from './blockchain'
import * as webSocket from './p2p'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())

// ROUTES
const blocks = '/blocks'
const mintBlock = '/mintBlock'
const peers = '/peers'
// const addPeer = '/addPeer'

// GETS
app.get(blocks, (req, res, next) => {
  blockchainController.getBlockchain((err, result) => {
    if (err) return next(err)
    res.set('Access-Control-Expose-Headers', 'ETag')
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Credentials', true) // If needed

    // // TODO fake results
    // result = [
    //   {
    //     height: '0',
    //     transactions: '0',
    //     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'genesis block'],
    //     buttonVariant: 'contained'
    //   },
    //   {
    //     height: '1',
    //     // subheader: 'some subheader',
    //     transactions: '15',
    //     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'Priority'],
    //     buttonVariant: 'outlined'
    //   },
    //   {
    //     height: '2',
    //     transactions: '30',
    //     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'sigscript'],
    //     buttonVariant: 'outlined',
    //     lastBlock: true
    //   }
    // ]

    res.send(result)
  })
})

// POSTS
app.post(mintBlock, (req, res, next) => {
  blockchainController.mintBlock(req.body.data, (err, result) => {
    if (err) return next(err)

    res.send(result)
  })
})

app.get(peers, (req, res) => {
  res.send(webSocket.sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort))
})

// app.post(addPeer, (req, res) => {
//   connectToPeers([req.body.peer])
//   res.send()
// })

export default app
