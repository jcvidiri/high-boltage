import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import * as dotenv from 'dotenv'
const ec = new ecdsa.ec('secp256k1')

dotenv.config()
import {Contract, ContractInput, $addToContractPool} from '../../contract'
import {Flow} from '../../flow'
import {$addToFlowPool} from '../../flow'
import {$startMinting, $stopMinting, $setLogs} from '../../blockchain'
import {getCurrentTimestamp, toHexString} from '../../utils'
import {$getPublicCAMMESA, $getPrivateCAMMESA} from '../../wallet'
import {$broadcastNewClaim, $broadcastNewFlow} from '../../p2p'

var resolvers = {
  Mutation: {
    startMinting,
    stopMinting,
    createFlow,
    addFlow,
    createContract,
    setLogs,
    createFlowWithPrivateKey
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

async function setLogs(__, {log}) {
  return $setLogs(log)
}

async function addFlow(__, {flow}: {flow: Flow}) {
  const fl = await $addToFlowPool(flow)
  await $broadcastNewFlow(flow)
  return fl
}

async function createFlow(__, {flow}: {flow: Flow}) {
  const pubKey = await $getPublicCAMMESA()
  const privKey = await $getPrivateCAMMESA()

  if (!flow.generator) flow.generator = pubKey
  flow.timestamp = getCurrentTimestamp()
  flow.id = CryptoJS.SHA256(flow.timestamp + flow.generator + flow.amount + flow.claimId).toString()

  const key = ec.keyFromPrivate(privKey, 'hex')
  flow.signature = await toHexString(key.sign(flow.id).toDER())

  const fl = await $addToFlowPool(flow)
  await $broadcastNewFlow(fl)
  return fl
}

async function createFlowWithPrivateKey(__, {flow, privateKey}: {flow: Flow; privateKey: string}) {
  if (!privateKey) return
  const key = await ec.keyFromPrivate(privateKey, 'hex')
  const pubKey = await key.getPublic().encode('hex')

  if (!flow.generator) flow.generator = pubKey
  flow.timestamp = getCurrentTimestamp()
  flow.id = CryptoJS.SHA256(flow.timestamp + flow.generator + flow.amount + flow.claimId).toString()
  flow.signature = await toHexString(key.sign(flow.id).toDER())

  const fl = await $addToFlowPool(flow)
  await $broadcastNewFlow(fl)
  return fl
}

async function createFlowWithTestKey(__, {flow, testKey}: {flow: Flow; testKey: string}) {
  if (!testKey) return

  let privateKey
  if (testKey === '1') privateKey = process.env.TEST_PRIV_1
  if (testKey === '2') privateKey = process.env.TEST_PRIV_2
  if (testKey === '3') privateKey = process.env.TEST_PRIV_3

  const key = await ec.keyFromPrivate(privateKey, 'hex')
  const pubKey = await key.getPublic().encode('hex')

  if (!flow.generator) flow.generator = pubKey
  flow.timestamp = getCurrentTimestamp()
  flow.id = CryptoJS.SHA256(flow.timestamp + flow.generator + flow.amount + flow.claimId).toString()
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
