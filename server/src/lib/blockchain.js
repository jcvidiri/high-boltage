'use strict'
import CryptoJS from 'crypto-js'
// import { broadcast, write, responseLatestMsg } from './websocket'
import { broadcast, responseLatestMsg } from './p2p'

class Block {
  constructor (index, previousHash, timestamp, data, difficulty, minterBalance, minterAddress, hash) {
    this.index = index
    this.previousHash = previousHash.toString()
    this.timestamp = timestamp
    this.data = data
    this.difficulty = difficulty
    this.minterBalance = minterBalance
    this.minterAddress = minterAddress
    this.hash = hash.toString()
  }
}

let getGenesisBlock = () => {
  return new Block(
    0,
    0,
    1465154705,
    'HIGH BOLTAGE GENESIS BLOCK',
    '272734932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7'
  )
}

// todo use const, and create function to replace blockchain when we receive a longer one
let blockchain = [getGenesisBlock()]

const getBlockchain = callback => {
  return callback(null, blockchain)
}

let createNextBlock = blockData => {
  // todo validate blockData ?
  const previousBlock = getLatestBlock()
  const nextIndex = previousBlock.index + 1
  const nextTimestamp = new Date().getTime() / 1000
  const nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData)
  return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash)
}

let calculateHashForBlock = block => {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data)
}

let calculateHash = (index, previousHash, timestamp, data) => {
  return CryptoJS.SHA256(index + previousHash + timestamp + data).toString()
}

let addBlock = newBlock => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock)
  }
}

let getLatestBlock = () => blockchain[blockchain.length - 1]

const isValidNewBlock = (newBlock, previousBlock) => {
  if (!isValidBlockStructure(newBlock)) {
    console.log('invalid block structure: %s', JSON.stringify(newBlock))
    return false
  }
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('INVALID BLOCK: invalid index')
    return false
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('INVALID BLOCK: invalid previoushash')
    return false
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log('INVALID BLOCK: invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash)
    return false
  }
  return true
}

const isValidBlockStructure = block => {
  return (
    typeof block.index === 'number' &&
    typeof block.hash === 'string' &&
    typeof block.previousHash === 'string' &&
    typeof block.timestamp === 'number' &&
    typeof block.data === 'string'
  )
}

const isValidChain = blockchain => {
  if (JSON.stringify(blockchain[0]) !== JSON.stringify(getGenesisBlock())) return false

  for (let i = 1; i < blockchain.length; i++) {
    if (!isValidNewBlock(blockchain[i], blockchain[i - 1])) {
      return false
    }
  }

  return true
}

const replaceChain = newBlockchain => {
  if (isValidChain(newBlockchain) && newBlockchain.length > getBlockchain().length) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
    blockchain = newBlockchain
    broadcast(responseLatestMsg())
  } else {
    console.log('Received blockchain invalid')
  }
}

let mintBlock = (data, callback) => {
  // todo validate data?
  var newBlock = createNextBlock(data)
  addBlock(newBlock)
  broadcast(responseLatestMsg())
  console.log('block added: ' + JSON.stringify(newBlock))
  return callback(null, newBlock)
}

export { blockchain, getBlockchain, getLatestBlock, mintBlock, replaceChain }
