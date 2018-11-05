import async from 'async'
import * as fs from 'fs'
import {ITypeDefinitions} from 'graphql-tools'
import * as path from 'path'

function loadTypes(): Promise<ITypeDefinitions> {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname, (err, files) => {
      if (err) {
        return reject(err)
      }

      const schemaFiles = files
        .map(file => path.join(__dirname, file))
        .filter(file => path.extname(file) === '.graphql' && fs.statSync(file).isFile())

      async.map(schemaFiles, _processFile, (asyncErr, results) => {
        if (asyncErr) {
          return reject(asyncErr)
        }
        return resolve(results.join(''))
      })
    })
  })
}

function _processFile(schemaFile, mCallback): void {
  fs.readFile(schemaFile, 'utf8', (err, data) => {
    if (err) {
      console.warn(`${schemaFile} fails`)
      return mCallback(null, null)
    }
    mCallback(null, data)
  })
}

export default loadTypes()
