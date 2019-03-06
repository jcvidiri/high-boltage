import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import * as ecdsa from 'elliptic'
import {Flow} from './flow'
import {getCurrentTimestamp, getTomorrowTimestamp} from './utils'
import {toHexString} from './utils'
import {Block} from './blockchain'
import * as dotenv from 'dotenv'
import {$getPublicFromWallet, $getPrivateFromWallet} from './wallet'

dotenv.config()
const ec = new ecdsa.ec('secp256k1')
const PRIVATE_KEY = $getPrivateFromWallet()
const PUBLIC_KEY = $getPublicFromWallet()
class ContractInput {
  claimant: string
  amount: number
  price: number
  expDate: number
}

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
    this.claimant = PUBLIC_KEY
    this.amount = amount
    this.price = price
    this.expDate = expDate || getTomorrowTimestamp()
    this.claimId = CryptoJS.SHA256(this.claimant + amount + this.expDate + price + this.timestamp).toString()
    this.measurements = []

    const key = ec.keyFromPrivate(PRIVATE_KEY, 'hex')
    this.signature = toHexString(key.sign(this.claimId).toDER())
  }
}

let contractPool: Contract[] = []

const $contractPool = () => {
  return _.cloneDeep(contractPool)
}

const $cleanContractPool = () => {
  // this is for test purposes only
  contractPool = []
}

const $replaceContractPool = (ctPool: Contract[]) => {
  contractPool = ctPool
}

const $addToContractPool = async (contract: Contract) => {
  return contractPool.push(contract)
}

const $resolvedContracts = async ({claims}: {claims: Contract[]}): Promise<Contract[]> => {
  let resolvedContracts: Contract[] = []
  const timestamp = await getCurrentTimestamp()

  await claims.map(async cl => {
    if (
      cl.expDate < timestamp ||
      cl.amount <=
        (await cl.measurements.reduce((acc, flow) => {
          return acc + flow.amount
        }, 0))
    )
      resolvedContracts.push(cl)
  })

  return resolvedContracts
}

const $removeClaims = async (newBlock: Block) => {
  await newBlock.contracts.map(async ct => await removeClaimById(ct.claimId))
}

const removeClaimById = async (id: String) => {
  await _.remove(contractPool, ct => ct.claimId === id)
}

export {
  Contract,
  $contractPool,
  $cleanContractPool,
  $addToContractPool,
  ContractInput,
  $resolvedContracts,
  $removeClaims,
  $replaceContractPool
}
