'use strict'
import express from 'express'
import * as blockchainController from './controllers/blocks'
// import * as minerController from './controllers/miner'

const app = express()

// ROUTES
const test      = '/'

//GETS
app.get(test, (req, res, next) => {
  blockchainController.blockchain((err, result) => {
    if (err) return next(err)

    res.send(result)
  })
})

export default app
