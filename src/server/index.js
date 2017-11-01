'use strict'
// import dotenv from 'dotenv'
import express from 'express'
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

const PORT = process.env.PORT || 8000
const IP_ADDRESS = process.env.IP_ADDRESS

const app = express()

app.use(routes)

app.listen(PORT, IP_ADDRESS, function () {
  console.log('Server listening at', this.address())
})
