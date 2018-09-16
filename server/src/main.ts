import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as _ from 'lodash'
import { initP2PServer } from './p2p'
import { initWallet } from './wallet'
import routes from './routes'

const httpPort: number = parseInt(process.env.HTTP_PORT) || 3001
const p2pPort: number = parseInt(process.env.P2P_PORT) || 6001

const initHttpServer = (myHttpPort: number) => {
  const app = express()
  app.use(bodyParser.json())

  app.use((err, req, res, next) => {
    if (err) {
      res.status(400).send(err.message)
    }
  })

  app.use(routes)

  app.listen(myHttpPort, () => {
    console.log('Listening http on port: ' + myHttpPort)
  })
}

initHttpServer(httpPort)
initP2PServer(p2pPort)
initWallet()
