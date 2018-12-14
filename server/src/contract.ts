import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import * as ecdsa from 'elliptic'
import {Flow} from './flow'
import {getCurrentTimestamp} from './utils'
import {toHexString} from './utils'
import {$getPrivateFromWallet} from './wallet'
import {Block} from './blockchain'
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

const $signContracts = async ({contracts}: {contracts: Contract[]}): Promise<Contract[]> => {
  const privateKey = await $getPrivateFromWallet()
  const key = await ec.keyFromPrivate(privateKey, 'hex')

  await contracts.map(async ct => {
    ct.id = await CryptoJS.SHA256(ct.claimId + ct.measurements.map(m => m.id)).toString()
    ct.signature = await toHexString(await key.sign(ct.id).toDER())
  })
  return contracts
}

let contractPool: Contract[] = []

const $contractPool = () => {
  return _.cloneDeep(contractPool)
}

const $cleanContractPool = () => {
  // this is for test purposes only
  contractPool = []
}

const $addContractToPool = (contract: Contract) => {
  contractPool.push(contract)
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
  await newBlock.contracts.map(async ct => await removeClaimById(ct.id))
}

const removeClaimById = async (id: String) => {
  await _.remove(contractPool, async ct => {
    ct.id === id
  })
}

export {
  Contract,
  $contractPool,
  $cleanContractPool,
  $addContractToPool,
  ContractInput,
  $resolvedContracts,
  $signContracts,
  $removeClaims
}
