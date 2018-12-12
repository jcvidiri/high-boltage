// import {
//   $generateNextBlock,
//   $sendTransaction,
//   $mintTransaction,
//   $sendMeasurement,
//   $generateRawNextBlock
// } from '../../blockchain'
// import {$connectToPeer} from '../../p2p'
import {Contract, ContractInput, $addToContractPool} from '../../contract'
import {Flow} from '../../flow'
import {$addToFlowPool} from '../../flow'
// import {$createContractTransactions} from '../../transaction'
// import {$addToTransactionPool} from '../../transaction-pool'
var resolvers = {
  Mutation: {
    // addPeer,
    // mintBlock,
    // mintTransaction,
    // sendTransaction,
    // sendMeasurement,
    // mintRawBlock,
    addFlow,
    createContract
  }
}

export default resolvers

// async function mintBlock() {
//   return $generateNextBlock()
// }

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
  return $addToFlowPool(flow)
}

async function createContract(__, {contract}: {contract: ContractInput}): Promise<Contract> {
  const rawContract = new Contract(contract)
  await $addToContractPool(rawContract)
  return rawContract
}
