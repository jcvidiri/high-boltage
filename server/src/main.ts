// import {p2pServer} from './p2p'
// import {initWallet} from './wallet'
import graphQLServer from './service'

const httpPort: number = (process.argv && parseInt(process.argv[2])) || parseInt(process.env.HTTP_PORT) || 3001
// const p2pPort: number = (process.argv && parseInt(process.argv[3])) || parseInt(process.env.P2P_PORT) || 6001
// const instanceNumber: number = (process.argv && parseInt(process.argv[4])) || 1
// const totalInstances: number = (process.argv && parseInt(process.argv[5])) || 1

// p2pServer(p2pPort, instanceNumber, totalInstances)
// initWallet()
graphQLServer()
  .then(app => {
    if (!app) return process.exit(-1)

    const server = app.listen(httpPort, () =>
      console.info(`GraphiQL is now running on http://localhost:${httpPort}/graphiql`)
    )

    if (!server) return process.exit(-1)

    process.on('exit', code => {
      console.info('About to exit with code:', code)
      server.close()
    })

    process.on('SIGINT', () => {
      process.exit()
    })

    process.on('SIGTERM', () => {
      process.exit()
    })
  })
  .catch(e => console.error(e))
