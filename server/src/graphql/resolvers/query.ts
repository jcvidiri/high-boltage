import {$getSockets} from '../../p2p'
import {$getAccountBalance, $blockchain, $unspentTxOuts, $myUnspentTransactionOutputs} from '../../blockchain'
import {$getPublicFromWallet} from '../../wallet'
import * as _ from 'lodash'
import {$transactionPool} from '../../transaction-pool'
import {$measurementPool} from '../../measurement-pool'

var resolvers = {
  Query: {
    peers,
    balance,
    address,
    block,
    blockchain,
    transaction,
    unspentTransactionOutputs,
    myUnspentTransactionOutputs,
    transactionPool,
    measurementPool
  }
}

export default resolvers

async function peers() {
  return $getSockets().map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort)
}

async function balance() {
  return $getAccountBalance()
}

async function address() {
  return $getPublicFromWallet()
}

async function block(__, {hash}) {
  return _.find($blockchain(), {hash})
}

async function blockchain() {
  return $blockchain()
}

async function unspentTransactionOutputs(__, {address}) {
  if (!address) return $unspentTxOuts()

  return _.filter($unspentTxOuts(), uTxO => uTxO.address === address)
}

async function myUnspentTransactionOutputs() {
  return $myUnspentTransactionOutputs()
}

async function transaction(__, {id}) {
  return _($blockchain())
    .map(blocks => blocks.data.transactions)
    .flatten()
    .find({id})
}

async function transactionPool() {
  return $transactionPool()
}

async function measurementPool() {
  return $measurementPool()
}
