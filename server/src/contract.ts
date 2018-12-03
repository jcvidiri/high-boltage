import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
// import {Flow} from './measurement'
import {getCurrentTimestamp} from './utils'
import {Transaction} from './transaction'

class RawContract {
  amount: string
  baseAmount: string
  expirationDate: string
  toAddress: string
  fromAddress: string
}
class Contract {
  public id: string
  public txId: string
  public amount: string
  public expDate: string
  public txBaseId: string
  public timestamp: number
  public toAddress: string
  public fromAddress: string

  constructor(txId: string, amount: string, expDate: string, txBaseId: string, toAddress: string, fromAddress: string) {
    this.timestamp = getCurrentTimestamp()
    this.id = CryptoJS.SHA256(txId + amount + expDate + txBaseId + this.timestamp + toAddress + fromAddress).toString()
    this.txId = txId
    this.amount = amount
    this.expDate = expDate
    this.txBaseId = txBaseId
    this.toAddress = toAddress
    this.fromAddress = fromAddress
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

const $createContract = async (contract: RawContract, transactions: {full: Transaction; base: Transaction}) => {
  const newContract = new Contract(
    transactions.full.id,
    contract.amount,
    contract.expirationDate,
    transactions.base.id,
    contract.toAddress,
    contract.fromAddress
  )

  await $addToContractPool(newContract)
  return newContract
}

const $addToContractPool = (contract: Contract) => {
  contractPool.push(contract)
}

const $resolvedContracts = (): Contract[] => {
  // todo here
  return $contractPool()
}
export {
  Contract,
  $contractPool,
  $cleanContractPool,
  $createContract,
  $addToContractPool,
  RawContract,
  $resolvedContracts
}
