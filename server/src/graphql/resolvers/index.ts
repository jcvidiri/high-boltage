import async from 'async'
import * as fs from 'fs'
import {IResolvers} from 'graphql-tools'
import * as path from 'path'

function loadResolvers(): Promise<IResolvers> {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname, (err, files) => {
      if (err) {
        return reject(err)
      }
      const resolverFiles = files.filter(file => {
        const ext = path.extname(file)
        return ext === '.js' && path.basename(file, ext) !== 'index' && fs.statSync(path.join(__dirname, file)).isFile()
      })
      async.map(
        resolverFiles,
        (resolverFile, callback) => {
          callback(null, require(`./${resolverFile}`).default)
        },
        async (err, res) => {
          if (err) {
            return reject(err)
          }
          const results = await Promise.all(res)
          let resolvers = {}
          results.forEach(resolver => {
            resolvers = {...resolvers, ...resolver}
          })
          return resolve(resolvers)
        }
      )
    })
  })
}

export default loadResolvers()
