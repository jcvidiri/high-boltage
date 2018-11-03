import {graphiqlExpress, graphqlExpress} from 'apollo-server-express'
import * as bodyParser from 'body-parser'
import * as express from 'express'

import graphqlSchema from './graphql'

async function graphQLServer(): Promise<express.Express> {
  const schema = await graphqlSchema()

  const app = express()
  app.use((err, req, res, next) => {
    if (err) {
      res.status(400).send(err.message)
    }
  })
  app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))
  app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}))

  return app
}

export default graphQLServer
