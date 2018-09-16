import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import {broadcastLatest, broadCastTransactionPool} from './p2p'
import {getCoinbaseTransaction, isValidAddress, processTransactions, Transaction, UnspentTxOut} from './transaction'
import {addToTransactionPool, getTransactionPool, updateTransactionPool} from './transaction-pool'
import {createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet} from './wallet'
import {BigNumber} from 'bignumber.js'

class Block {
  public index: number
  public hash: string
  public previousHash: string
  public timestamp: number
  public data: Transaction[]
  public difficulty: number
  public minterBalance: number // hack to avoid recaculating the balance of the minter at a precise height
  public minterAddress: string

  constructor(
    index: number,
    hash: string,
    previousHash: string,
    timestamp: number,
    data: Transaction[],
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

const genesisTransaction = {
  txIns: [{signature: '', txOutId: '', txOutIndex: 0}],
  txOuts: [
    {
      address:
        '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
      amount: 50
    }
  ],
  id: 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
}

const genesisBlock: Block = new Block(
  0,
  '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
  '',
  1465154705,
  [genesisTransaction],
  0,
  0,
  '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a'
)

// Number of blocks that can be minted with accounts without any coins
const mintingWithoutCoinIndex = 100

let blockchain: Block[] = [genesisBlock]

// the unspent txOut of genesis block is set to unspentTxOuts on startup
let unspentTxOuts: UnspentTxOut[] = processTransactions(blockchain[0].data, [], 0)

const getBlockchain = (): Block[] => blockchain

const getUnspentTxOuts = (): UnspentTxOut[] => _.cloneDeep(unspentTxOuts)

// and txPool should be only updated at the same time
const setUnspentTxOuts = (newUnspentTxOut: UnspentTxOut[]) => {
  unspentTxOuts = newUnspentTxOut
}

const getLatestBlock = (): Block => blockchain[blockchain.length - 1]

// in seconds
const BLOCK_GENERATION_INTERVAL: number = 10

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10

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

const generateRawNextBlock = (blockData: Transaction[]) => {
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

// gets the unspent transaction outputs owned by the wallet
const getMyUnspentTransactionOutputs = () => {
  return findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts())
}

const generateNextBlock = () => {
  const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1)
  const blockData: Transaction[] = [coinbaseTx].concat(getTransactionPool())
  return generateRawNextBlock(blockData)
}

const generatenextBlockWithTransaction = (receiverAddress: string, amount: number) => {
  if (!isValidAddress(receiverAddress)) {
    throw Error('invalid address')
  }
  if (typeof amount !== 'number') {
    throw Error('invalid amount')
  }
  const coinbaseTx: Transaction = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1)
  const tx: Transaction = createTransaction(
    receiverAddress,
    amount,
    getPrivateFromWallet(),
    getUnspentTxOuts(),
    getTransactionPool()
  )
  const blockData: Transaction[] = [coinbaseTx, tx]
  return generateRawNextBlock(blockData)
}

const findBlock = (index: number, previousHash: string, data: Transaction[], difficulty: number): Block => {
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
  const tx: Transaction = createTransaction(
    address,
    amount,
    getPrivateFromWallet(),
    getUnspentTxOuts(),
    getTransactionPool()
  )
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
  data: Transaction[],
  difficulty: number,
  minterBalance: number,
  minterAddress: string
): string =>
  CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + minterBalance + minterAddress).toString()
// The hash for Proof of Stake does not include a nonce to avoid more than one trial per second
const isValidBlockStructure = (block: Block): boolean => {
  return (
    typeof block.index === 'number' &&
    typeof block.hash === 'string' &&
    typeof block.previousHash === 'string' &&
    typeof block.timestamp === 'number' &&
    typeof block.data === 'object' &&
    typeof block.difficulty === 'number' &&
    typeof block.minterBalance === 'number' &&
    typeof block.minterAddress === 'string'
  )
}

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
  if (!isValidBlockStructure(newBlock)) {
    console.log('invalid block structure: %s', JSON.stringify(newBlock))
    return false
  }
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index')
    return false
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash')
    return false
  } else if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log('invalid timestamp')
    return false
  } else if (!hasValidHash(newBlock)) {
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
  if (!hashMatchesBlockContent(block)) {
    console.log('invalid hash, got:' + block.hash)
    return false
  }

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

// This function is used for proof of stake
// Based on `SHA256(prevhash + address + timestamp) <= 2^256 * balance / diff`
// Cf https://blog.ethereum.org/2014/07/05/stake/
const isBlockStakingValid = (
  prevhash: string,
  address: string,
  timestamp: number,
  balance: number,
  difficulty: number,
  index: number
): boolean => {
  difficulty = difficulty + 1

  // Allow minting without coins for a few blocks
  if (index <= mintingWithoutCoinIndex) {
    balance = balance + 1
  }

  const balanceOverDifficulty = new BigNumber(2)
    .exponentiatedBy(256)
    .times(balance)
    .dividedBy(difficulty)
  const stakingHash: string = CryptoJS.SHA256(prevhash + address + timestamp).toString()
  const decimalStakingHash = new BigNumber(stakingHash, 16)
  const difference = balanceOverDifficulty.minus(decimalStakingHash).toNumber()

  return difference >= 0
}

/*
    Checks if the given blockchain is valid. Return the unspent txOuts if the chain is valid
 */
const isValidChain = (blockchainToValidate: Block[]): UnspentTxOut[] => {
  console.log('isValidChain:')
  console.log(JSON.stringify(blockchainToValidate))
  const isValidGenesis = (block: Block): boolean => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock)
  }

  if (!isValidGenesis(blockchainToValidate[0])) {
    return null
  }
  /*
    Validate each block in the chain. The block is valid if the block structure is valid
      and the transaction are valid
     */
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
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
    blockchain = newBlocks
    setUnspentTxOuts(aUnspentTxOuts)
    updateTransactionPool(unspentTxOuts)
    broadcastLatest()
  } else {
    console.log('Received blockchain invalid')
  }
}

const handleReceivedTransaction = (transaction: Transaction) => {
  addToTransactionPool(transaction, getUnspentTxOuts())
}

export {
  Block,
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
