// import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import * as _ from 'lodash'
import {Block, validCAMMESASignature} from './blockchain'
// import {toHexString, getCurrentTimestamp} from './utils'

const ec = new ecdsa.ec('secp256k1')

class Flow {
  public id: string // id = hash(timestamp + generator + claimant + amount + claimId)
  public timestamp: number // date from when flow was reported
  public generator: string // address/id of the generator
  public amount: number // in MWh
  public claimId: string // claim this flow corresponds to
  public signature: string // generators signature (sign(id))
  public cammesaSignature: string // generators signature (sign(id))

  // !Flow comes already signed from generator
  // constructor(generator: string, amount: number, claimId: string) {
  //   this.timestamp = getCurrentTimestamp()
  //   this.generator = generator
  //   this.amount = amount
  //   this.claimId = claimId
  //   this.id = CryptoJS.SHA256(generator + amount + claimId + this.timestamp).toString()
  // }

  // sign(privateKey) {
  //   const key = ec.keyFromPrivate(privateKey, 'hex')
  //   this.signature = toHexString(key.sign(this.id).toDER())
  // }
}

let flowPool: Flow[] = []

const $flowPool = () => {
  return _.cloneDeep(flowPool)
}

const $cleanFlowPool = () => {
  // this is for test purposes only
  flowPool = []
}

const $replaceFlowPool = (flows: Flow[]) => {
  // todo empty flow
  // todo then push each flow validating them
  flowPool = flows
}

const $addToFlowPool = async (fl: Flow) => {
  const validations = [validFlowSignature(fl), validCAMMESASignature(fl), isValidFlowStructure(fl)]

  // todo validate hash is ok

  // if (!validFlowSignature(fl)) {
  //   throw Error('Trying to add invalid fl to pool: Invalid Flow signature')
  // }

  // if (!validCAMMESASignature(fl)) {
  //   throw Error('Trying to add invalid fl to pool: Invalid Flow CAMMESA signature')
  // }

  // if (!isValidFlowStructure(fl)) {
  //   throw Error('Trying to add invalid fl to pool: Invalid Flow structure')
  // }

  // todo valdiate duplicate
  // if (isflDuplicated(fl)) {
  //   throw Error('Trying to add duplicated fl to pool')
  // }

  const result = await Promise.all(validations)
  const valid = result.reduce((t, f) => t && f)
  if (!valid) throw Error('Invalid Flow')

  flowPool.push(fl)
  return fl
}

const validFlowSignature = async (flow: Flow): Promise<boolean> => {
  let key
  try {
    key = ec.keyFromPublic(flow.generator, 'hex')
  } catch (error) {
    throw Error('Invalid generator address')
  }
  const validSignature: boolean = key.verify(flow.id, flow.signature)
  if (!validSignature) return false

  return true
}

const isValidFlowStructure = async (flow: Flow): Promise<boolean> => {
  if (
    flow == null ||
    typeof flow.id !== 'string' ||
    // typeof flow.timestamp !== 'string' ||
    typeof flow.generator !== 'string' ||
    typeof flow.amount !== 'number' ||
    typeof flow.claimId !== 'string' ||
    typeof flow.signature !== 'string' ||
    typeof flow.cammesaSignature !== 'string'
  )
    return false
  return true
}

const $removeFlows = async (newBlock: Block) => {
  await newBlock.contracts.map(async ct => {
    await ct.measurements.map(async mt => {
      await removeFlowById(mt.id)
    })
  })
}

const removeFlowById = async (id: String) => {
  await _.remove(flowPool, fl => fl.id === id)
}

export {Flow, $flowPool, $addToFlowPool, $cleanFlowPool, $removeFlows, $replaceFlowPool}
