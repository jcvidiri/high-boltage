import {
  $generateNextBlock,
  $sendTransaction,
  $mintTransaction,
  $sendMeasurement,
  $generateRawNextBlock
} from '../../blockchain'
import {$connectToPeer} from '../../p2p'
import {Contract, RawContract, $createContract} from '../../contract'
import {$createContractTransactions} from '../../transaction'
import {$addToTransactionPool} from '../../transaction-pool'
var resolvers = {
  Mutation: {
    addPeer,
    mintBlock,
    mintTransaction,
    sendTransaction,
    sendMeasurement,
    mintRawBlock,
    createContract
  }
}

export default resolvers

async function mintBlock() {
  return $generateNextBlock()
}

async function mintTransaction(__, {address, amount}) {
  return $mintTransaction(address, amount)
}

async function sendTransaction(__, {address, amount}) {
  return $sendTransaction(address, amount)
}

async function addPeer(__, {peer}) {
  return $connectToPeer(peer)
}

async function sendMeasurement(__, {mtIns, mtOuts}) {
  return $sendMeasurement(mtIns, mtOuts)
}

async function mintRawBlock(__, {blockData}) {
  return $generateRawNextBlock(blockData)
}

async function createContract(__, {contract}): Promise<Contract> {
  // todo check this
  const transactions = await $createContractTransactions(contract)
  await $addToTransactionPool(transactions)
  return $createContract(contract, transactions)
}
