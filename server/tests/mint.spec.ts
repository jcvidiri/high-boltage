import {expect} from 'chai'
import {describe, it, beforeEach} from 'mocha'
import {Flow, $flowPool, $cleanFlowPool, $addToFlowPool} from '../src/flow'
import {
  Contract,
  $cleanContractPool,
  $addContractToPool,
  $contractPool,
  $resolvedContracts,
  $signContracts
} from '../src/contract'
import {
  $addFlowsToClaims,
  $generateRawNextBlock,
  $findBlock,
  $startMinting,
  $stopMinting,
  $blockchain
} from '../src/blockchain'
import {toHexString, getCurrentTimestamp, timeout} from '../src/utils'
import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import {$getPrivateFromWallet, $getPublicFromWallet} from '../src/wallet'
const ec = new ecdsa.ec('secp256k1')

describe('Mint test', async () => {
  const sign = async (privateKey, id) => {
    const key = ec.keyFromPrivate(privateKey, 'hex')
    return toHexString(key.sign(id).toDER())
  }

  let flow1
  let flow2
  let flow3
  let contract1
  let contract2
  let contract3
  const pubKey = $getPublicFromWallet()
  const privKey = $getPrivateFromWallet()

  beforeEach(async () => {
    await $cleanFlowPool()
    await $cleanContractPool()

    contract1 = new Contract({
      claimant: pubKey,
      amount: 20,
      price: 900,
      expDate: getCurrentTimestamp()
    })

    contract2 = new Contract({
      claimant: pubKey,
      amount: 10,
      price: 890,
      expDate: getCurrentTimestamp()
    })

    contract3 = new Contract({
      claimant: pubKey,
      amount: 5,
      price: 800,
      expDate: getCurrentTimestamp() + 10000
    })

    await $addContractToPool(contract1)
    await $addContractToPool(contract2)
    await $addContractToPool(contract3)

    flow1 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: ''
    }

    flow2 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract2.claimId,
      signature: ''
    }

    flow3 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 5.001,
      claimId: contract3.claimId,
      signature: ''
    }

    const flow1Hash = await CryptoJS.SHA256(flow1.timestamp + flow1.generator + flow1.amount + flow1.claimId).toString()
    const flow2Hash = await CryptoJS.SHA256(flow2.timestamp + flow2.generator + flow2.amount + flow2.claimId).toString()
    const flow3Hash = await CryptoJS.SHA256(flow3.timestamp + flow3.generator + flow3.amount + flow3.claimId).toString()

    flow1.id = flow1Hash
    flow2.id = flow2Hash
    flow3.id = flow3Hash
    flow1.signature = await sign(privKey, flow1.id)
    flow2.signature = await sign(privKey, flow2.id)
    flow3.signature = await sign(privKey, flow3.id)

    await $addToFlowPool(flow1)
    await $addToFlowPool(flow2)
    await $addToFlowPool(flow3)
  })

  it('$addFlowsToClaims. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})

    expect(claims).to.be.an('array')
    expect(flows).to.be.an('array')
    expect(claims[0].measurements).to.deep.include(flows[0])
    expect(claims[1].measurements).to.deep.include(flows[1])
  })

  it('$getResolvedContracts. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const timestamp = await getCurrentTimestamp()

    expect(resolvedContracts).to.be.an('array')
    expect(resolvedContracts[0].measurements).to.deep.include(flows[0])
    expect(resolvedContracts[1].measurements).to.deep.include(flows[1])
    expect(resolvedContracts[2].measurements).to.deep.include(flows[2])
    expect(resolvedContracts[0].expDate).to.be.equal(timestamp)
    expect(resolvedContracts[1].expDate).to.be.equal(timestamp)
    expect(timestamp).to.be.below(resolvedContracts[2].expDate)
    expect(resolvedContracts[2].amount).to.be.below(
      resolvedContracts[2].measurements.reduce((acc, flow) => {
        return acc + flow.amount
      }, 0)
    )
  })

  it('$signContracts. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})

    const contracts = await $signContracts({contracts: resolvedContracts})

    const key = ec.keyFromPublic(pubKey, 'hex')
    const validSignature0: boolean = await key.verify(contracts[0].id, contracts[0].signature)
    const validSignature1: boolean = await key.verify(contracts[1].id, contracts[1].signature)
    const validSignature2: boolean = await key.verify(contracts[2].id, contracts[2].signature)

    expect(validSignature0).to.be.true
    expect(validSignature1).to.be.true
    expect(validSignature2).to.be.true
  })

  it('$generateRawNextBlock. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const contracts = await $signContracts({contracts: resolvedContracts})

    const rawBlock = await $generateRawNextBlock({contracts})

    expect(rawBlock).to.have.property('difficulty', 0)
    expect(rawBlock).to.have.property('index', 1)
    expect(rawBlock).to.have.property(
      'previousHash',
      '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627'
    )
    expect(rawBlock)
      .to.have.property('contracts')
      .to.be.an('array')
    expect(rawBlock.contracts.length).to.be.equal(3)
  })

  it('$findBlock. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const contracts = await $signContracts({contracts: resolvedContracts})
    const rawBlock = await $generateRawNextBlock({contracts})
    const newBlock = await $findBlock(rawBlock)

    expect(newBlock).to.have.property('index', 1)
    expect(newBlock).to.have.property('minterBalance', 50)
    expect(newBlock).to.have.property('minterAddress', pubKey)
    expect(newBlock).to.have.property(
      'previousHash',
      '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627'
    )
    expect(newBlock)
      .to.have.property('contracts')
      .to.be.an('array')
    expect(newBlock.contracts.length).to.be.equal(3)
  })
  it('$startMinting & $stopMinting. Expect ok.', async () => {
    $startMinting()
    await timeout(300)
    await $stopMinting()

    const blockchain = $blockchain()
    expect(blockchain.length).to.be.greaterThan(1)

    const flows = await $flowPool()
    const claims = await $contractPool()

    expect(flows.length).to.be.equal(0)
    expect(claims.length).to.be.equal(0)
  })
})
