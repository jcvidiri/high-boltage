import * as CryptoJS from 'crypto-js'
import * as _ from 'lodash'
import {BigNumber} from 'bignumber.js'
import {broadcastLatest} from './p2p'
import {Flow, $removeFlows} from './flow'
import {Contract, $contractPool, $resolvedContracts, $signContracts, $removeClaims} from './contract'
import {$flowPool} from './flow'
import {getCurrentTimestamp, timeout} from './utils'
import {$getPublicFromWallet} from './wallet'
import * as ecdsa from 'elliptic'
const ec = new ecdsa.ec('secp256k1')

const BLOCK_GENERATION_INTERVAL: number = parseInt(process.env.BLOCK_GENERATION_INTERVAL) || 10
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = parseInt(process.env.DIFFICULTY_ADJUSTMENT_INTERVAL) || 10
// const mintingWithoutCoinIndex = 100

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

class Balance {
  balance: number
  minterAddress: string
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
  0, // !50
  0,
  '04c4294d8d9c86ac5d95355f8ced4b3ff50007a90d197ba674448ce957a961fecef6ee03fe3d46163bd441b4361cad77236916b8f4b693fc16d17969a0a2c5a1a0'
)

let blockchain: Block[] = [genesisBlock]
let mint = false
let blockMinted = false
let logsEnabled = true

const $blockchain = (): Block[] => blockchain
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

const $findBlock = async ({
  index,
  previousHash,
  contracts,
  difficulty
}: {
  index: number
  previousHash: string
  contracts: Contract[]
  difficulty: number
}): Promise<Block> => {
  let pastTimestamp: number = 0
  blockMinted = false
  let minterBalance = (await $getMinterBalance()) + 1
  while (!blockMinted) {
    let timestamp: number = getCurrentTimestamp()
    if (pastTimestamp !== timestamp) {
      let hash: string = calculateHash({
        index,
        previousHash,
        timestamp,
        contracts,
        difficulty,
        minterBalance,
        minterAddress: await $getPublicFromWallet()
      })

      if (
        isBlockStakingValid(previousHash, await $getPublicFromWallet(), timestamp, minterBalance, difficulty, index)
      ) {
        blockMinted = true
        return new Block(
          index,
          hash,
          previousHash,
          timestamp,
          contracts,
          difficulty,
          minterBalance,
          await $getPublicFromWallet()
        )
      }
      pastTimestamp = timestamp
      await timeout(500)
    }
  }
}

const $getMinterBalance = async (address?: string): Promise<number> => {
  address = address || (await $getPublicFromWallet())

  return $blockchain().filter((b: Block) => b.minterAddress === address).length
}

const $getAllBalances = async (): Promise<Balance[]> => {
  const balances = []

  await $blockchain().map(async (block: Block) => {
    const bIndex = balances.find(b => b.minterAddress === block.minterAddress)
    if (bIndex) {
      balances[bIndex].balance = balances[bIndex].balance + 1
      return
    }

    balances.push({balance: 1, minterAddress: block.minterAddress})
  })

  return balances
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

const $isValidBlockStructure = (block: Block): boolean => {
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

const $hasValidContracts = async (block: Block): Promise<boolean> => {
  const contractPool = await $contractPool()

  const validations = block.contracts.map(async contract => {
    const ct = contractPool.find(c => c.claimId === contract.claimId)

    // check contract exists in pool
    if (!ct) return false

    // check contract claimId integrity
    if (
      contract.claimId !==
      CryptoJS.SHA256(
        contract.claimant + contract.amount + contract.expDate + contract.price + contract.timestamp
      ).toString()
    )
      return false

    // a little bit recursive but checking id integrity
    if (contract.id !== CryptoJS.SHA256(contract.claimId + contract.measurements.map(m => m.id)).toString())
      return false

    // checking contract signature (from the minter)
    const hasValidContractSignature = await validContractSignature(contract, block.minterAddress)
    if (!hasValidContractSignature) return false

    const hasValidMeasurements = await validateMeasurements(contract)
    if (!hasValidMeasurements) return false

    return true
  })

  const result = await Promise.all(validations)
  return result.reduce((t, f) => t && f)
}

const validateMeasurements = async (contract: Contract): Promise<boolean> => {
  const flowPool = await $flowPool()

  const validations = contract.measurements.map(async m => validateFlow(m, flowPool, contract.claimId))
  const result = await Promise.all(validations)

  return result.reduce((t, f) => t && f)
}

const validateFlow = async (flow: Flow, flowPool: Flow[], claimId: String): Promise<boolean> => {
  const flowFromPool = await flowPool.find(fl => fl.id === flow.id)
  if (!flowFromPool) {
    console.log('\n Flow doesent exist in pool')

    return false
  }

  if (flow.id !== CryptoJS.SHA256(flow.timestamp + flow.generator + flow.amount + flow.claimId).toString()) {
    console.log('\n Flow doesent exist in flow pool')

    return false
  }

  if (flow.claimId !== claimId) {
    console.log('\n Flow doesent correspond to contract')

    return false
  }

  if (!(await validFlowSignature(flow))) {
    console.log('\n Invalid flow signature')

    return false
  }

  if (!(await validCAMMESASignature(flow))) {
    console.log('\n Invalid flow CAMMESA signature')

    return false
  }

  return true
}

const validFlowSignature = async (flow: Flow): Promise<boolean> => {
  const key = await ec.keyFromPublic(flow.generator, 'hex')
  const validSignature: boolean = await key.verify(flow.id, flow.signature)
  return !!validSignature
}

const validCAMMESASignature = async (flow: Flow): Promise<boolean> => {
  if (!flow.cammesaSignature) return false
  const key = await ec.keyFromPublic(process.env.CAMMESA_PUB, 'hex')
  const validSignature: boolean = await key.verify(flow.id, flow.cammesaSignature)
  return !!validSignature
}

const validContractSignature = async (contract: Contract, minterAddress: string): Promise<boolean> => {
  const key = await ec.keyFromPublic(minterAddress, 'hex')
  const validSignature: boolean = await key.verify(contract.id, contract.signature)
  return !!validSignature
}

const isValidNewBlock = async (newBlock: Block, previousBlock: Block): Promise<boolean> => {
  if (previousBlock.index + 1 !== newBlock.index || previousBlock.hash !== newBlock.previousHash) return false

  const validations = await Promise.all([
    $hasValidHash(newBlock),
    $isValidBlockStructure(newBlock),
    isValidTimestamp(newBlock, previousBlock),
    $hasValidContracts(newBlock)
  ])

  return validations.reduce((t, f) => t && f)
}

const getAccumulatedDifficulty = (blockchain: Block[]): number => {
  return blockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a, b) => a + b)
}

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
  return previousBlock.timestamp - 60 < newBlock.timestamp && newBlock.timestamp - 60 < getCurrentTimestamp()
}

const $hasValidHash = (block: Block): boolean => {
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
    .times(balance * 5) // *5 for test purposes
    .dividedBy(difficulty)
  const stakingHash: string = CryptoJS.SHA256(prevhash + address + timestamp).toString()
  const decimalStakingHash = new BigNumber(stakingHash, 16)
  const difference = balanceOverDifficulty.minus(decimalStakingHash).toNumber()

  return difference >= 0
}

const $addFlowsToClaims = async ({flows, claims}: {flows: Flow[]; claims: Contract[]}) => {
  await flows.map(async f => {
    const index = await claims.findIndex(c => c.claimId === f.claimId)
    if (index != -1) claims[index].measurements.push(f)
  })
}

const $addBlockToChain = async (newBlock: Block): Promise<boolean> => {
  if (!newBlock) return false
  const isNewBlockValid = await isValidNewBlock(newBlock, getLatestBlock())
  if (isNewBlockValid) {
    blockchain.push(newBlock)
    return true
  }
  if (logsEnabled) process.stdout.write('\n--> BLOCK IS NOT VALID ')
  return false
}

const $replaceChain = (newBlockchain: Block[]) => {
  if (getAccumulatedDifficulty(newBlockchain) > getAccumulatedDifficulty($blockchain())) {
    blockchain = newBlockchain
    // todo check pools with new blockchain
  }
}

const $status = (): string => {
  return mint ? 'minting' : 'stopped'
}

const $setLogs = (logs: boolean): boolean => {
  logsEnabled = logs
  return logsEnabled
}

const $startMinting = async () => {
  mint = true
  while (mint) {
    if (logsEnabled) process.stdout.write('\n--> minting ')

    const claims = await $contractPool()
    const flows = await $flowPool()
    if (logsEnabled) process.stdout.write(' ... ' + flows.length + ' flows | ' + claims.length + ' claims ')
    if (!flows.length || !claims.length) {
      await timeout(2000)
      continue
    }
    await $addFlowsToClaims({flows, claims})
    if (logsEnabled) process.stdout.write('.')
    const resolvedContracts = await $resolvedContracts({claims})
    if (logsEnabled) process.stdout.write(' ... ' + resolvedContracts.length + ' resolved contracts ')
    if (!resolvedContracts.length) {
      await timeout(2000)
      continue
    }
    await $signContracts({contracts: resolvedContracts})
    if (logsEnabled) process.stdout.write('..')
    const rawBlock = $generateRawNextBlock({contracts: resolvedContracts})

    if (logsEnabled) process.stdout.write('..')
    const newBlock = await $findBlock(rawBlock)
    if (logsEnabled) process.stdout.write('..')

    const blockAdded = await $addBlockToChain(newBlock)
    if (blockAdded) {
      if (logsEnabled) process.stdout.write(' new Block minted! ')

      broadcastLatest()
      await Promise.all([$removeClaims(newBlock), $removeFlows(newBlock)])
    }
    blockMinted = false
  }
}

const $stopMinting = async () => {
  mint = false
  if (logsEnabled) process.stdout.write('\n\n--> STOP minting <--- \n')
  return {minting: false}
}

const $blockMinted = async () => {
  blockMinted = true
}

export {
  Block,
  $blockchain,
  getLatestBlock,
  $replaceChain,
  $addBlockToChain,
  $startMinting,
  $stopMinting,
  $addFlowsToClaims,
  $generateRawNextBlock,
  $findBlock,
  $getMinterBalance,
  $getAllBalances,
  $setLogs,
  $status,
  $blockMinted,
  $isValidBlockStructure,
  $hasValidHash,
  $hasValidContracts,
  validFlowSignature,
  validateMeasurements,
  validateFlow,
  validCAMMESASignature
}
