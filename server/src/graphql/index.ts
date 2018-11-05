import {GraphQLSchema} from 'graphql'
import {makeExecutableSchema} from 'graphql-tools'
import resolvers from './resolvers'
import typeDefs from './types'

async function makeExecutable(): Promise<GraphQLSchema> {
  try {
    return makeExecutableSchema({typeDefs: await typeDefs, resolvers: await resolvers})
  } catch (e) {
    console.error(e)
  }
}

export default makeExecutable
