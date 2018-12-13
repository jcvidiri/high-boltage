import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import {BigNumber} from 'bignumber.js'
import {broadcastLatest} from './p2p'
// import {getCoinbaseTransaction, isValidAddress, processTransactions, Transaction, UnspentTxOut} from './transaction'
import {Flow} from './flow'
import {Contract, $contractPool, $resolvedContracts, $signContracts} from './contract'
import {$flowPool} from './flow'
// import {addToTransactionPool, $transactionPool, updateTransactionPool} from './transaction-pool'
// import {$addToMeasurementPool, $measurementPool, $updateMeasurementsPool} from './flow-pool'
import {getCurrentTimestamp} from './utils'
import {
  // createTransaction,
  // findUnspentTxOuts,
  // $getBalance,
  $getPrivateFromWallet,
  $getPublicFromWallet
  // createMeasurement
} from './wallet'

const BLOCK_GENERATION_INTERVAL: number = parseInt(process.env.BLOCK_GENERATION_INTERVAL) || 10
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = parseInt(process.env.DIFFICULTY_ADJUSTMENT_INTERVAL) || 10
const mintingWithoutCoinIndex = 100

class Block {
  public index: number
  public hash?: string // merkleRoot
  public previousHash: string
  public timestamp: number
  public contracts: Contract[]
  public difficulty: number
  public minterBalance: number
  public minterAddress: string
  // public version: string

  constructor(
    index: number,
    hash: string,
    previousHash: string,
    timestamp: number,
    contracts: Contract[],
    difficulty: number,
    minterBalance: number,
    minterAddress: string
  ) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.contracts = contracts
    this.hash = hash
    this.difficulty = difficulty
    this.minterBalance = minterBalance
    this.minterAddress = minterAddress
  }
}

const genesisContract: Contract = {
  id: '60f5eb794e7e7133c2a64d741fd1ab76b877bd3158e3ca5d6942cfecedf2e41f',
  claimId: '60f5eb794e7e7133c2a64d741fd1ab76b877bd3158e3ca5d6942cfecedf2e41f',
  claimant: '0',
  amount: 0,
  price: 0,
  expDate: 1537145550,
  timestamp: 1537145550,
  measurements: [],
  signature:
    '04c4294d8d9c86ac5d95355f8ced4b3ff50007a90d197ba674448ce957a961fecef6ee03fe3d46163bd441b4361cad77236916b8f4b693fc16d17969a0a2c5a1a0'
}

const genesisBlock: Block = new Block(
  0,
  '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
  '',
  1537145550,
  [genesisContract],
  0,
  500,
  '04c4294d8d9c86ac5d95355f8ced4b3ff50007a90d197ba674448ce957a961fecef6ee03fe3d46163bd441b4361cad77236916b8f4b693fc16d17969a0a2c5a1a0'
)

let blockchain: Block[] = [genesisBlock]

const $blockchain = (): Block[] => blockchain
let mint = false
let blockMinted = false
const getLatestBlock = (): Block => blockchain[blockchain.length - 1]

const getDifficulty = (blockchain: Block[]): number => {
  const lastBlock: Block = blockchain[blockchain.length - 1]
  if (lastBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && lastBlock.index !== 0) {
    return adjustDifficulty(lastBlock, blockchain)
  } else {
    return lastBlock.difficulty
  }
}

const adjustDifficulty = (lastBlock: Block, blockchain: Block[]) => {
  const prevAdjustmentBlock: Block = blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL]
  const expTime: number = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL
  const lastTime: number = lastBlock.timestamp - prevAdjustmentBlock.timestamp
  if (lastTime < expTime / 2) {
    return prevAdjustmentBlock.difficulty + 1
  } else if (lastTime > expTime * 2) {
    return prevAdjustmentBlock.difficulty - 1
  } else {
    return prevAdjustmentBlock.difficulty
  }
}

const $generateRawNextBlock = ({contracts}: {contracts: Contract[]}) => {
  const previousBlock: Block = getLatestBlock()
  const difficulty: number = getDifficulty($blockchain())
  const nextIndex: number = previousBlock.index + 1

  return {
    difficulty,
    index: nextIndex,
    previousHash: previousBlock.hash,
    contracts
  }
}

const $findBlock = ({
  index,
  previousHash,
  contracts,
  difficulty
}: {
  index: number
  previousHash: string
  contracts: Contract[]
  difficulty: number
}): Block => {
  let pastTimestamp: number = 0
  blockMinted = false
  let minterBalance = 50 // todo check this
  while (!blockMinted) {
    let timestamp: number = getCurrentTimestamp()
    if (pastTimestamp !== timestamp) {
      let hash: string = calculateHash({
        index,
        previousHash,
        timestamp,
        contracts,
        difficulty,
        // minterBalance: $getBalance(), // todo check this
        minterBalance,
        minterAddress: $getPublicFromWallet()
      })

      if (isBlockStakingValid(previousHash, $getPublicFromWallet(), timestamp, minterBalance, difficulty, index)) {
        blockMinted = true
        return new Block(
          index,
          hash,
          previousHash,
          timestamp,
          contracts,
          difficulty,
          minterBalance, // todo check this
          $getPublicFromWallet()
        )
      }
      pastTimestamp = timestamp
    }
  }
}

const calculateHash = (block: Block) =>
  CryptoJS.SHA256(
    block.index +
      block.previousHash +
      block.timestamp +
      block.contracts +
      block.difficulty +
      block.minterBalance +
      block.minterAddress
  ).toString()

const isValidBlockStructure = (block: Block): boolean => {
  return (
    typeof block.index === 'number' &&
    typeof block.hash === 'string' &&
    typeof block.contracts === 'object' &&
    typeof block.timestamp === 'number' &&
    typeof block.difficulty === 'number' &&
    typeof block.previousHash === 'string' &&
    typeof block.minterBalance === 'number' &&
    typeof block.minterAddress === 'string'
  )
}

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
  if (
    !hasValidHash(newBlock) ||
    !isValidBlockStructure(newBlock) ||
    !isValidTimestamp(newBlock, previousBlock) ||
    previousBlock.index + 1 !== newBlock.index ||
    previousBlock.hash !== newBlock.previousHash
  ) {
    return false
  }

  return true
}

// const getAccumulatedDifficulty = (aBlockchain: Block[]): number => {
//   return aBlockchain
//     .map(block => block.difficulty)
//     .map(difficulty => Math.pow(2, difficulty))
//     .reduce((a, b) => a + b)
// }

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
  return previousBlock.timestamp - 60 < newBlock.timestamp && newBlock.timestamp - 60 < getCurrentTimestamp()
}

const hasValidHash = (block: Block): boolean => {
  if (!hashMatchesBlockContent(block)) return false

  if (
    !isBlockStakingValid(
      block.previousHash,
      block.minterAddress,
      block.timestamp,
      block.minterBalance,
      block.difficulty,
      block.index
    )
  ) {
    // console.log('staking hash not lower than balance over diffculty times 2^256')
  }
  return true
}

const hashMatchesBlockContent = (block: Block): boolean => {
  const blockHash: string = calculateHash(block)
  return blockHash === block.hash
}

const isBlockStakingValid = (
  prevhash: string,
  address: string,
  timestamp: number,
  balance: number,
  difficulty: number,
  index: number
): boolean => {
  difficulty = difficulty + 1

  // if (index <= mintingWithoutCoinIndex) balance = balance + 1

  const balanceOverDifficulty = new BigNumber(2) // 2^256 * balance / diff
    .exponentiatedBy(256)
    .times(balance)
    .dividedBy(difficulty)
  const stakingHash: string = CryptoJS.SHA256(prevhash + address + timestamp).toString()
  const decimalStakingHash = new BigNumber(stakingHash, 16)
  const difference = balanceOverDifficulty.minus(decimalStakingHash).toNumber()

  return difference >= 0
}

// const isValidChain = (blockchainToValidate: Block[]): UnspentTxOut[] => {
//   const isValidGenesis = (block: Block): boolean => {
//     return JSON.stringify(block) === JSON.stringify(genesisBlock)
//   }

//   if (!isValidGenesis(blockchainToValidate[0])) {
//     return null
//   }

//   let aUnspentTxOuts: UnspentTxOut[] = []

//   for (let i = 0; i < blockchainToValidate.length; i++) {
//     const currentBlock: Block = blockchainToValidate[i]
//     if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
//       return null
//     }

//     aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index)
//     if (aUnspentTxOuts === null) {
//       // console.log('invalid transactions in blockchain')
//       return null
//     }
//   }
//   return aUnspentTxOuts
// }
const $addFlowsToClaims = async ({flows, claims}: {flows: Flow[]; claims: Contract[]}) => {
  await flows.map(async f => {
    const index = await claims.findIndex(c => c.claimId === f.claimId)
    if (index != -1) claims[index].measurements.push(f)
  })
}

const processFlows = ({contracts}) => {
  //todo here // should be in flow.ts??
}

const addBlockToChain = (newBlock: Block): boolean => {
  if (!newBlock) return false
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    processFlows({contracts: newBlock.contracts}) // remove flows in contracts from flow-pool
    blockchain.push(newBlock)
    return true
  }
  return false
}

// const replaceChain = (newBlocks: Block[]) => {
//   const aUnspentTxOuts = isValidChain(newBlocks)
//   const validChain: boolean = aUnspentTxOuts !== null
//   if (validChain && getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty($blockchain())) {
//     blockchain = newBlocks
//     setUnspentTxOuts(aUnspentTxOuts)
//     updateTransactionPool(unspentTxOuts)
//     broadcastLatest()
//   }
// }

// const handleReceivedTransaction = (transaction: Transaction) => {
//   addToTransactionPool(transaction, $unspentTxOuts())
// }

// const $sendMeasurement = (mtIns: Flow[], mtOuts: Flow[]): Measurement => {
//   const mt: Measurement = createMeasurement(mtIns, mtOuts, getPrivateKey())
//   $addToMeasurementPool(mt)
//   broadCastMeasurementPool()
//   return mt
// }

// const mintBlock = (block: Block, count: number, callback: Function) => {
//   if (block) return callback(null, block)

//   setTimeout(function() {
//     // you can only mint a block per second due to timestamp
//     count++
//     block = $generateNextBlock()
//     console.log('mintBlock no-block count: ', count)
//     return mintBlock(block, count, callback)
//   }, 1000)
// }

const $startMinting = async () => {
  // todo check this
  mint = true
  while (mint) {
    const claims = $contractPool()
    const flows = $flowPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    await $signContracts({contracts: resolvedContracts})
    const rawBlock = $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    if (addBlockToChain(newBlock)) {
      broadcastLatest()
    }
    blockMinted = false
  }
}

const $stopMinting = async () => {
  mint = false
}

const $blockMinted = async () => {
  blockMinted = true
}

export {
  Block,
  $blockchain,
  getLatestBlock,
  // replaceChain,
  addBlockToChain,
  $startMinting,
  $stopMinting,
  $addFlowsToClaims,
  $generateRawNextBlock,
  $findBlock
}
