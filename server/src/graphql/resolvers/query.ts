// import {$getSockets} from '../../p2p'
import {$blockchain, $getMinterBalance, $getAllBalances} from '../../blockchain'
// import {$getPublicFromWallet} from '../../wallet'
import * as _ from 'lodash'
import {$contractPool} from '../../contract'
import {$flowPool} from '../../flow'
import {$getPublicFromWallet} from '../../wallet'

var resolvers = {
  Query: {
    // peers,
    balance,
    allBalances,
    address,
    // block,
    blockchain,
    // transaction,
    // unspentTransactionOutputs,
    // myUnspentTransactionOutputs,
    // transactionPool,
    flowPool,
    contractPool
  }
}

export default resolvers

// async function peers() {
//   return $getSockets().map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort)
// }

async function balance(__, {address}: {address: string}) {
  return $getMinterBalance(address)
}

async function allBalances() {
  return $getAllBalances()
}

async function address() {
  return $getPublicFromWallet()
}

// async function block(__, {hash}) {
//   return _.find($blockchain(), {hash})
// }

async function blockchain() {
  return $blockchain()
}

async function flowPool() {
  return $flowPool()
}

async function contractPool() {
  return $contractPool()
}

// async function unspentTransactionOutputs(__, {address}) {
//   if (!address) return $unspentTxOuts()

//   return _.filter($unspentTxOuts(), uTxO => uTxO.address === address)
// }

// async function myUnspentTransactionOutputs() {
//   return $myUnspentTransactionOutputs()
// }

// async function transaction(__, {id}) {
//   return _($blockchain())
//     .map(blocks => blocks.data.transactions)
//     .flatten()
//     .find({id})
// }

// async function transactionPool() {
//   return $transactionPool()
// }

// async function measurementPool() {
//   return $measurementPool()
// }
