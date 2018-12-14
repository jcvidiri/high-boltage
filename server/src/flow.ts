// import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import * as _ from 'lodash'
import {Block} from './blockchain'
// import {toHexString, getCurrentTimestamp} from './utils'

const ec = new ecdsa.ec('secp256k1')

class Flow {
  public id: string // id = hash(timestamp + generator + claimant + amount + claimId)
  public timestamp: number // date from when flow was reported
  public generator: string // address/id of the generator
  public amount: number // in MWh
  public claimId: string // claim this flow corresponds to
  public signature: string // generators signature (sign(id))

  // !Flow comes already signed from client
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

const $addToFlowPool = (fl: Flow) => {
  if (!validFlowSignature(fl) || !isValidFlowStructure(fl)) {
    throw Error('Trying to add invalid fl to pool')
  }

  // if (isflDuplicated(fl)) {
  //   throw Error('Trying to add duplicated fl to pool')
  // }

  flowPool.push(fl)
}

const validFlowSignature = (flow: Flow): boolean => {
  const key = ec.keyFromPublic(flow.generator, 'hex')
  const validSignature: boolean = key.verify(flow.id, flow.signature)
  if (!validSignature) return false

  return true
}

const isValidFlowStructure = (flow: Flow): boolean => {
  if (
    flow == null ||
    typeof flow.id !== 'string' ||
    typeof flow.timestamp !== 'number' ||
    typeof flow.generator !== 'string' ||
    typeof flow.amount !== 'number' ||
    typeof flow.claimId !== 'string' ||
    typeof flow.signature !== 'string'
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
  await _.remove(flowPool, async fl => {
    fl.id === id
  })
}

// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
// const isValidAddress = (address: string): boolean => {
//   if (address.length !== 130) {
//     return false
//   } else if (address.match('^[a-fA-F0-9]+$') === null) {
//     return false
//   } else if (!address.startsWith('04')) {
//     return false
//   }
//   return true
// }

export {Flow, $flowPool, $addToFlowPool, $cleanFlowPool, $removeFlows}
