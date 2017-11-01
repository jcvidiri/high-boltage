'ise strict'
/**
 * @module
 */
// import { validateBlock } from './filters/validate'
/**

 * Get blockchain.
 * @param {Object} where
 * @param {Object} where.blockchain
 * @param {String} where.blockchain.id
 * @return {{blockchain}}
 */
export function blockchain (callback) {
  return callback(null, {blockchain: 'blockchain info'})
}
