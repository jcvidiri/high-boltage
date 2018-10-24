import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as _ from 'lodash'
import routes from './routes'
import {p2pServer} from './p2p'
import {initWallet} from './wallet'

const httpPort: number = (process.argv && parseInt(process.argv[2])) || parseInt(process.env.HTTP_PORT) || 3001
const p2pPort: number = (process.argv && parseInt(process.argv[3])) || parseInt(process.env.P2P_PORT) || 6001
const instanceNumber: number = (process.argv && parseInt(process.argv[4])) || 1
const totalInstances: number = (process.argv && parseInt(process.argv[5])) || 1

const httpServer = (port: number) => {
  const app = express()
  app.use(bodyParser.json())

  app.use((err, req, res, next) => {
    if (err) {
      res.status(400).send(err.message)
    }
  })

  app.use(routes)

  app.listen(port, () => {
    console.log('Listening http on port: ' + port)
  })
}

httpServer(httpPort)
p2pServer(p2pPort, instanceNumber, totalInstances)
initWallet()
