'use strict'
import CryptoJS from 'crypto-js'
import { broadcast, write, responseLatestMsg } from '../websocket'

class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index
        this.previousHash = previousHash.toString()
        this.timestamp = timestamp
        this.data = data // transactions
        // this.transactionCounter = getTransactionsCount()
        this.hash = hash.toString()
    }
}


// let data = { // example only 1 transaction, with 1 input/output
//         input: {
//             previous_tx: 'f5d8ee39a430901c91a5917b9f2dc19d6d1a0e9cea205b009ca73dd04470b9a6',
//             index: '0',
//             scriptSig: '304502206e21798a42fae0e854281abd38bacd1aeed3ee3738d9e1446618c4571d1090db022100e2ac980643b0b82c0e88ffdfec6b64e3e6ba35e7ba5fdd7d5d6cc8d25c6b241501'
//         },
//         output: {
//             value: '5000000000',
//             rate: '3000'
//             scriptPubKey: 'OP_DUP OP_HASH160 404371705fa9bd789a2fcd52d2c580b65d35549d OP_EQUALVERIFY OP_CHECKSIG'
//         }
//     }

let getGenesisBlock = () => {
    return new Block(0, "0", 1465154705, "GENESIS BLOCK!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7")
}

let blockchain = [getGenesisBlock()]

let getBlockchain = (callback) => {return callback(null, blockchain)}

let generateNextBlock = (blockData) => {
    let previousBlock = getLatestBlock()
    let nextIndex = previousBlock.index + 1
    let nextTimestamp = new Date().getTime() / 1000
    let nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData)
    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash)
}

let calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data)
}

let calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString()
}

let addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock)
    }
}

let getLatestBlock = () => blockchain[blockchain.length - 1]

let isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index')
        return false
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash')
        return false
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock))
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash)
        return false
    }
    return true
}

let replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
        blockchain = newBlocks
        broadcast(responseLatestMsg())
    } else {
        console.log('Received blockchain invalid')
    }
}

let mineBlock = (data, callback) => {
    var newBlock = generateNextBlock(data)
    addBlock(newBlock)
    broadcast(responseLatestMsg())
    console.log('block added: ' + JSON.stringify(newBlock))
    return callback(null, newBlock)
}

let isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false
    }
    let tempBlocks = [blockchainToValidate[0]]
    for (let i = 1 ; i < blockchainToValidate.length ; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i])
        } else {
            return false
        }
    }
    return true
}

export { getBlockchain, getLatestBlock, mineBlock }
