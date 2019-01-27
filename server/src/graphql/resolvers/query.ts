import {$getSockets} from '../../p2p'
import {$blockchain, $getMinterBalance, $getAllBalances, $status} from '../../blockchain'
import * as _ from 'lodash'
import {$contractPool} from '../../contract'
import {$flowPool} from '../../flow'
import {$getPublicFromWallet, $getPrivateFromWallet} from '../../wallet'

var resolvers = {
  Query: {
    peers,
    balance,
    allBalances,
    address,
    block,
    blockchain,
    flowPool,
    contractPool,
    status
  }
}

export default resolvers

async function peers() {
  return $getSockets().map((s: any) => s._socket.remoteAddress + ':' + s._socket.remotePort)
}

async function balance(__, {address}: {address: string}) {
  return $getMinterBalance(address)
}

async function allBalances() {
  return $getAllBalances()
}

async function address() {
  return {
    private: $getPrivateFromWallet(),
    public: $getPublicFromWallet()
  }
}

async function block(__, {hash}: {hash: string}) {
  return _.find($blockchain(), {hash})
}

async function blockchain() {
  return $blockchain()
}

async function flowPool() {
  return $flowPool()
}

async function contractPool() {
  return $contractPool()
}

async function status() {
  return $status()
}
