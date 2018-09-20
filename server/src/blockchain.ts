import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import { broadcastLatest, broadCastTransactionPool } from './p2p'
import { getCoinbaseTransaction, isValidAddress, processTransactions, Transaction, UnspentTxOut } from './transaction'
import { Measurement } from './measurement'
import { addToTransactionPool, getTransactionPool, updateTransactionPool } from './transaction-pool'
import { createTransaction, findUnspentTxOuts, getBalance, getPrivateKey, getPublicFromWallet } from './wallet'
import { BigNumber } from 'bignumber.js'

const BLOCK_GENERATION_INTERVAL: number = parseInt(process.env.BLOCK_GENERATION_INTERVAL) || 10
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = parseInt(process.env.DIFFICULTY_ADJUSTMENT_INTERVAL) || 10
const mintingWithoutCoinIndex = 100

class Block {
  public index: number
  public hash: string
  public previousHash: string
  public timestamp: number
  public data: Payload
  public difficulty: number
  public minterBalance: number
  public minterAddress: string

  constructor(
    index: number,
    hash: string,
    previousHash: string,
    timestamp: number,
    data: Payload,
    difficulty: number,
    minterBalance: number,
    minterAddress: string
  ) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.data = data
    this.hash = hash
    this.difficulty = difficulty
    this.minterBalance = minterBalance
    this.minterAddress = minterAddress
  }
}

class Payload {
  public transactions: Transaction[]
  public measurements: Measurement[]

  constructor(transactions: Transaction[], measurements: Measurement[]) {
    ; (this.transactions = transactions), (this.measurements = measurements)
  }
}

// todo change this
const genesisTransaction: Transaction = {
  txIns: [{ signature: '', txOutId: '', txOutIndex: 0 }],
  txOuts: [
    {
      address: 'someAddress1',
      amount: 50
    }
  ],
  id: 'someId1'
}

const genesisMeasurement: Measurement = {
  msIns: [{ signature: '', msOutId: '', msOutIndex: 0 }],
  msOuts: [
    {
      address: 'someAddress1',
      amount: 50
    }
  ],
  id: 'someId1'
}

const genesisBlock: Block = new Block(
  0,
  '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
  '',
  1537145550257,
  { transactions: [genesisTransaction], measurements: [genesisMeasurement] },
  0,
  0,
  'someAddress1'
)

let blockchain: Block[] = [genesisBlock]
let unspentTxOuts: UnspentTxOut[] = processTransactions(blockchain[0].data, [], 0)

const getBlockchain = (): Block[] => blockchain

const getUnspentTxOuts = (): UnspentTxOut[] => _.cloneDeep(unspentTxOuts)

const setUnspentTxOuts = (newUnspentTxOut: UnspentTxOut[]) => {
  unspentTxOuts = newUnspentTxOut
}
const getLatestBlock = (): Block => blockchain[blockchain.length - 1]

const getDifficulty = (aBlockchain: Block[]): number => {
  const latestBlock: Block = aBlockchain[blockchain.length - 1]
  if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
    return getAdjustedDifficulty(latestBlock, aBlockchain)
  } else {
    return latestBlock.difficulty
  }
}

const getAdjustedDifficulty = (latestBlock: Block, aBlockchain: Block[]) => {
  const prevAdjustmentBlock: Block = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL]
  const timeExpected: number = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL
  const timeTaken: number = latestBlock.timestamp - prevAdjustmentBlock.timestamp
  if (timeTaken < timeExpected / 2) {
    return prevAdjustmentBlock.difficulty + 1
  } else if (timeTaken > timeExpected * 2) {
    return prevAdjustmentBlock.difficulty - 1
  } else {
    return prevAdjustmentBlock.difficulty
  }
}

const getCurrentTimestamp = (): number => Math.round(new Date().getTime() / 1000)

const generateRawNextBlock = (blockData: Payload) => {
  const previousBlock: Block = getLatestBlock()
  const difficulty: number = getDifficulty(getBlockchain())
  const nextIndex: number = previousBlock.index + 1
  const newBlock: Block = findBlock(nextIndex, previousBlock.hash, blockData, difficulty)
  if (addBlockToChain(newBlock)) {
    broadcastLatest()
    return newBlock
  } else {
    return null
  }
}

const getMyUnspentTransactionOutputs = () => {
  return findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts())
}

const generateNextBlock = () => {
  const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1)
  const blockData: Payload = { transactions: [coinbaseTx].concat(getTransactionPool()), measurements: [] }
  return generateRawNextBlock(blockData)
}

const generatenextBlockWithTransaction = (receiverAddress: string, amount: number) => {
  if (!isValidAddress(receiverAddress)) throw Error('invalid address')

  if (typeof amount !== 'number') throw Error('invalid amount')

  const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1)
  const tx: Transaction = createTransaction(
    receiverAddress,
    amount,
    getPrivateKey(),
    getUnspentTxOuts(),
    getTransactionPool()
  )
  const blockData: Payload = { transactions: [coinbaseTx, tx], measurements: [] }
  return generateRawNextBlock(blockData)
}

const findBlock = (index: number, previousHash: string, data: Payload, difficulty: number): Block => {
  let pastTimestamp: number = 0
  while (true) {
    let timestamp: number = getCurrentTimestamp()
    if (pastTimestamp !== timestamp) {
      let hash: string = calculateHash(
        index,
        previousHash,
        timestamp,
        data,
        difficulty,
        getAccountBalance(),
        getPublicFromWallet()
      )
      if (isBlockStakingValid(previousHash, getPublicFromWallet(), timestamp, getAccountBalance(), difficulty, index)) {
        return new Block(
          index,
          hash,
          previousHash,
          timestamp,
          data,
          difficulty,
          getAccountBalance(),
          getPublicFromWallet()
        )
      }
      pastTimestamp = timestamp
    }
  }
}

const getAccountBalance = (): number => {
  return getBalance(getPublicFromWallet(), getUnspentTxOuts())
}

const sendTransaction = (address: string, amount: number): Transaction => {
  const tx: Transaction = createTransaction(address, amount, getPrivateKey(), getUnspentTxOuts(), getTransactionPool())
  addToTransactionPool(tx, getUnspentTxOuts())
  broadCastTransactionPool()
  return tx
}

const calculateHashForBlock = (block: Block): string =>
  calculateHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.minterBalance,
    block.minterAddress
  )

const calculateHash = (
  index: number,
  previousHash: string,
  timestamp: number,
  data: Payload,
  difficulty: number,
  minterBalance: number,
  minterAddress: string
): string =>
  CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + minterBalance + minterAddress).toString()

const isValidBlockStructure = (block: Block): boolean => {
  return (
    typeof block.index === 'number' &&
    typeof block.hash === 'string' &&
    typeof block.data === 'object' &&
    typeof block.data.transactions === 'object' && // check for array?
    typeof block.data.measurements === 'object' &&
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

const getAccumulatedDifficulty = (aBlockchain: Block[]): number => {
  return aBlockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a, b) => a + b)
}

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
  return previousBlock.timestamp - 60 < newBlock.timestamp && newBlock.timestamp - 60 < getCurrentTimestamp()
}

const hasValidHash = (block: Block): boolean => {
  if (!hashMatchesBlockContent(block)) return false

  if (
    !isBlockStakingValid(
      block.previousHash,
      block.minterAddress,
      block.minterBalance,
      block.timestamp,
      block.difficulty,
      block.index
    )
  ) {
    console.log('staking hash not lower than balance over diffculty times 2^256')
  }
  return true
}

const hashMatchesBlockContent = (block: Block): boolean => {
  const blockHash: string = calculateHashForBlock(block)
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

  if (index <= mintingWithoutCoinIndex) balance = balance + 1

  const balanceOverDifficulty = new BigNumber(2) // 2^256 * balance / diff
    .exponentiatedBy(256)
    .times(balance)
    .dividedBy(difficulty)
  const stakingHash: string = CryptoJS.SHA256(prevhash + address + timestamp).toString()
  const decimalStakingHash = new BigNumber(stakingHash, 16)
  const difference = balanceOverDifficulty.minus(decimalStakingHash).toNumber()

  return difference >= 0
}

const isValidChain = (blockchainToValidate: Block[]): UnspentTxOut[] => {
  const isValidGenesis = (block: Block): boolean => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock)
  }

  if (!isValidGenesis(blockchainToValidate[0])) {
    return null
  }

  let aUnspentTxOuts: UnspentTxOut[] = []

  for (let i = 0; i < blockchainToValidate.length; i++) {
    const currentBlock: Block = blockchainToValidate[i]
    if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
      return null
    }

    aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index)
    if (aUnspentTxOuts === null) {
      console.log('invalid transactions in blockchain')
      return null
    }
  }
  return aUnspentTxOuts
}

const addBlockToChain = (newBlock: Block): boolean => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    const retVal: UnspentTxOut[] = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index)
    if (retVal === null) {
      console.log('block is not valid in terms of transactions')
      return false
    } else {
      blockchain.push(newBlock)
      setUnspentTxOuts(retVal)
      updateTransactionPool(unspentTxOuts)
      return true
    }
  }
  return false
}

const replaceChain = (newBlocks: Block[]) => {
  const aUnspentTxOuts = isValidChain(newBlocks)
  const validChain: boolean = aUnspentTxOuts !== null
  if (validChain && getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
    blockchain = newBlocks
    setUnspentTxOuts(aUnspentTxOuts)
    updateTransactionPool(unspentTxOuts)
    broadcastLatest()
  }
}

const handleReceivedTransaction = (transaction: Transaction) => {
  addToTransactionPool(transaction, getUnspentTxOuts())
}

export {
  Block,
  Payload,
  getBlockchain,
  getUnspentTxOuts,
  getLatestBlock,
  sendTransaction,
  generateRawNextBlock,
  generateNextBlock,
  generatenextBlockWithTransaction,
  handleReceivedTransaction,
  getMyUnspentTransactionOutputs,
  getAccountBalance,
  isValidBlockStructure,
  replaceChain,
  addBlockToChain
}