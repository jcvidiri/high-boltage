import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
const ec = new ecdsa.ec('secp256k1')

import {Contract, ContractInput, $addToContractPool} from '../../contract'
import {Flow} from '../../flow'
import {$addToFlowPool} from '../../flow'
import {$startMinting, $stopMinting} from '../../blockchain'
import {getCurrentTimestamp, toHexString} from '../../utils'
import {$getPublicFromWallet, $getPrivateFromWallet} from '../../wallet'
import {$broadcastNewClaim, $broadcastNewFlow} from '../../p2p'

var resolvers = {
  Mutation: {
    // addPeer,
    startMinting,
    stopMinting,
    // mintTransaction,
    // sendTransaction,
    // sendMeasurement,
    createFlow,
    addFlow,
    createContract
  }
}

export default resolvers

async function startMinting() {
  $startMinting()
  return {minting: true}
}

async function stopMinting() {
  return $stopMinting()
}

// async function mintTransaction(__, {address, amount}) {
//   return $mintTransaction(address, amount)
// }

// async function sendTransaction(__, {address, amount}) {
//   return $sendTransaction(address, amount)
// }

// async function addPeer(__, {peer}) {
//   return $connectToPeer(peer)
// }

// async function sendMeasurement(__, {mtIns, mtOuts}) {
//   return $sendMeasurement(mtIns, mtOuts)
// }

// async function mintRawBlock(__, {blockData}) {
//   return $generateRawNextBlock(blockData)
// }
async function addFlow(__, {flow}: {flow: Flow}) {
  const fl = await $addToFlowPool(flow)
  await $broadcastNewFlow(flow)
  return fl
}

async function createFlow(__, {flow}: {flow: Flow}) {
  const pubKey = await $getPublicFromWallet()
  const privKey = await $getPrivateFromWallet()

  if (!flow.generator) flow.generator = pubKey
  flow.timestamp = getCurrentTimestamp()
  flow.id = CryptoJS.SHA256(flow.timestamp + flow.generator + flow.amount + flow.claimId).toString()

  const key = ec.keyFromPrivate(privKey, 'hex')
  flow.signature = await toHexString(key.sign(flow.id).toDER())

  const fl = await $addToFlowPool(flow)
  await $broadcastNewFlow(fl)
  return fl
}

async function createContract(__, {contract}: {contract: ContractInput}): Promise<Contract> {
  const rawContract = new Contract(contract)
  await $addToContractPool(rawContract)
  await $broadcastNewClaim(rawContract)
  return rawContract
}
