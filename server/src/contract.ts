import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import * as ecdsa from 'elliptic'
import {Flow} from './flow'
import {getCurrentTimestamp} from './utils'
import {toHexString} from './utils'
import {$getPrivateFromWallet} from './wallet'
const ec = new ecdsa.ec('secp256k1')

class ContractInput {
  claimant: string
  amount: number
  price: number
  expDate: number
}
// class RawContract {
//   claimant: string
//   amount: number
//   price: number
//   expDate: number
//   timestamp: number
//   claimId: string
//   measurements: Flow[]
// }

class Contract {
  public id: string // hash(claimId + measurements)
  public claimId: string // hash (claimant + amount + expDate + price + timestamp)
  public claimant: string //id of the claimant
  public timestamp: number
  public expDate: number // time when contract expires, if max amount wasnt reached
  public amount: number //max amount in MW/h
  public price: number // by MW/h
  public measurements: Flow[] // energy injection by generators for this specific claimant
  public signature: string // sign(id)

  constructor({claimant, amount, price, expDate}: ContractInput) {
    this.timestamp = getCurrentTimestamp()
    this.claimant = claimant
    this.amount = amount
    this.price = price
    this.expDate = expDate
    this.claimId = CryptoJS.SHA256(claimant + amount + expDate + price + this.timestamp).toString()
    this.measurements = []
  }
}

const signContract = (contract: Contract): Contract => {
  const privateKey = $getPrivateFromWallet()
  contract.id = CryptoJS.SHA256(contract.claimId + contract.measurements.map(m => m.id)).toString()
  const key = ec.keyFromPrivate(privateKey, 'hex')
  contract.signature = toHexString(key.sign(contract.id).toDER())
  return contract
}

let contractPool: Contract[] = []

const $contractPool = () => {
  return _.cloneDeep(contractPool)
}

const $cleanContractPool = () => {
  // this is for test purposes only
  contractPool = []
}

const $addToContractPool = (contract: Contract) => {
  contractPool.push(contract)
}

const $resolvedContracts = (): Contract[] => {
  // todo here
  return $contractPool()
}

export {Contract, $contractPool, $cleanContractPool, $addToContractPool, ContractInput, $resolvedContracts}
