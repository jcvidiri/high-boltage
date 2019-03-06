import {expect} from 'chai'
import {describe, it, beforeEach} from 'mocha'
import {Flow, $flowPool, $cleanFlowPool, $addToFlowPool} from '../src/flow'
import {Contract, $cleanContractPool, $addToContractPool, $contractPool, $resolvedContracts} from '../src/contract'
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
import {$getPublicFromWallet, $getPrivateCAMMESA, $getPrivateFromWallet} from '../src/wallet'
const ec = new ecdsa.ec('secp256k1')

const sign = async (privateKey, id) => {
  const key = await ec.keyFromPrivate(privateKey, 'hex')
  return toHexString(key.sign(id).toDER())
}

describe('Mint test', async () => {
  let flow1: Flow
  let flow2: Flow
  let flow3: Flow
  let contract1: Contract
  let contract2: Contract
  let contract3: Contract
  const pubKey = $getPublicFromWallet()
  const privKey = $getPrivateFromWallet()
  const privKeyCAMMESA = await $getPrivateCAMMESA()

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

    await $addToContractPool(contract1)
    await $addToContractPool(contract2)
    await $addToContractPool(contract3)

    flow1 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    flow2 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract2.claimId,
      signature: '',
      cammesaSignature: ''
    }

    flow3 = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 5.001,
      claimId: contract3.claimId,
      signature: '',
      cammesaSignature: ''
    }

    const flow1Hash = await CryptoJS.SHA256(flow1.timestamp + flow1.generator + flow1.amount + flow1.claimId).toString()
    const flow2Hash = await CryptoJS.SHA256(flow2.timestamp + flow2.generator + flow2.amount + flow2.claimId).toString()
    const flow3Hash = await CryptoJS.SHA256(flow3.timestamp + flow3.generator + flow3.amount + flow3.claimId).toString()

    flow1.id = flow1Hash
    flow2.id = flow2Hash
    flow3.id = flow3Hash
    flow1.signature = await sign(privKey, flow1.id)
    flow1.cammesaSignature = await sign(privKeyCAMMESA, flow1.id)
    flow2.signature = await sign(privKey, flow2.id)
    flow2.cammesaSignature = await sign(privKeyCAMMESA, flow2.id)
    flow3.signature = await sign(privKey, flow3.id)
    flow3.cammesaSignature = await sign(privKeyCAMMESA, flow3.id)

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

  it('$generateRawNextBlock. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})

    expect(rawBlock).to.have.property('difficulty', 50)
    expect(rawBlock).to.have.property('index', 1)
    expect(rawBlock).to.have.property(
      'previousHash',
      '812189210e86dc40b7caa167a73983943ca8d315bdc60d09dcc5a38756a12211'
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
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    expect(newBlock).to.have.property('index', 1)
    expect(newBlock).to.have.property('minterBalance', 2)
    expect(newBlock).to.have.property('minterAddress', $getPublicFromWallet())
    expect(newBlock).to.have.property(
      'previousHash',
      '812189210e86dc40b7caa167a73983943ca8d315bdc60d09dcc5a38756a12211'
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
