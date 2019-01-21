import {expect} from 'chai'
import {describe, it, beforeEach} from 'mocha'
import {Flow, $flowPool, $cleanFlowPool, $addToFlowPool} from '../src/flow'
import {Contract, $cleanContractPool, $addToContractPool, $contractPool, $resolvedContracts} from '../src/contract'
import {
  $addFlowsToClaims,
  $generateRawNextBlock,
  $findBlock,
  validFlowSignature,
  validateFlow,
  validateMeasurements,
  $hasValidContracts,
  validCAMMESASignature,
  calculateContractsMR
} from '../src/blockchain'
import {toHexString, getCurrentTimestamp} from '../src/utils'
import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import {$getPrivateFromWallet, $getPublicFromWallet, $getPrivateCAMMESA} from '../src/wallet'
const ec = new ecdsa.ec('secp256k1')

describe('Validate test', async () => {
  const sign = async (privateKey, id) => {
    const key = await ec.keyFromPrivate(privateKey, 'hex')
    return toHexString(key.sign(id).toDER())
  }

  let flow1: Flow
  let flow2: Flow
  let flow3: Flow
  let contract1: Contract
  let contract2: Contract
  let contract3: Contract
  const pubKey = await $getPublicFromWallet()
  const privKey = await $getPrivateFromWallet()
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

  it('validFlowSignature. Expect ok.', async () => {
    const isValidFlow1 = await validFlowSignature(flow1)
    expect(isValidFlow1).to.be.true
  })

  it('validFlowSignature with fake signature. Expect false.', async () => {
    const fakeFlow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    fakeFlow.id = await CryptoJS.SHA256(
      fakeFlow.timestamp + fakeFlow.generator + fakeFlow.amount + fakeFlow.claimId
    ).toString()

    fakeFlow.signature = await sign('L4BEDs6eNfdALtRhpRYwjbn5xpZyJHtkAv9um4woKuhNntC6xJp4', fakeFlow.id)

    const isValidFakeFlow = await validFlowSignature(fakeFlow)
    expect(isValidFakeFlow).to.be.false
  })

  it('validCAMMESASignature. Expect ok.', async () => {
    const isValidFlow1 = await validCAMMESASignature(flow1)
    expect(isValidFlow1).to.be.true
  })

  it('validCAMMESASignature with fake cammesa signature. Expect false.', async () => {
    const fakeFlow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    fakeFlow.id = await CryptoJS.SHA256(
      fakeFlow.timestamp + fakeFlow.generator + fakeFlow.amount + fakeFlow.claimId
    ).toString()

    fakeFlow.signature = await sign(privKey, fakeFlow.id)
    fakeFlow.cammesaSignature = await sign('L4BEDs6eNfdALtRhpRYwjbn5xpZyJHtkAv9um4woKuhNntC6xJp4', fakeFlow.id)

    const isValidFakeFlow = await validCAMMESASignature(fakeFlow)
    expect(isValidFakeFlow).to.be.false
  })

  it('validateFlow. Expect ok.', async () => {
    const flowPool = await $flowPool()
    const isValidFlow1 = await validateFlow(flow1, flowPool, flow1.claimId)
    expect(isValidFlow1).to.be.true
  })

  it('validateFlow with flow missing from pool. Expect false.', async () => {
    const flowPool = await $flowPool()
    const flowMissingFromPool = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 60,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    flowMissingFromPool.id = await CryptoJS.SHA256(
      flowMissingFromPool.timestamp +
        flowMissingFromPool.generator +
        flowMissingFromPool.amount +
        flowMissingFromPool.claimId
    ).toString()

    flowMissingFromPool.signature = await sign(privKey, flowMissingFromPool.id)
    flowMissingFromPool.cammesaSignature = await sign(privKeyCAMMESA, flowMissingFromPool.id)

    const isValidFlowMissingFromPoolSignature = await validFlowSignature(flowMissingFromPool)
    expect(isValidFlowMissingFromPoolSignature).to.be.true

    const isValidflowMissingFromPool = await validateFlow(flowMissingFromPool, flowPool, flowMissingFromPool.claimId)
    expect(isValidflowMissingFromPool).to.be.false
  })

  it('validate contracts signature. Expect ok.', async () => {
    const claims = await $contractPool()

    const key = await ec.keyFromPublic(claims[0].claimant, 'hex')

    const valid0: boolean = await key.verify(claims[0].claimId, claims[0].signature)
    const valid1: boolean = await key.verify(claims[1].claimId, claims[1].signature)
    const valid2: boolean = await key.verify(claims[2].claimId, claims[2].signature)

    expect(valid0).to.be.true
    expect(valid1).to.be.true
    expect(valid2).to.be.true
  })
  it('validateMeasurements. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    const valid0 = await validateMeasurements(newBlock.contracts[0])
    const valid1 = await validateMeasurements(newBlock.contracts[1])
    const valid2 = await validateMeasurements(newBlock.contracts[2])

    expect(valid0).to.be.true
    expect(valid1).to.be.true
    expect(valid2).to.be.true
  })

  it('validateMeasurements with a fake flow. Expect false.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    const fakeFlow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    fakeFlow.id = await CryptoJS.SHA256(
      fakeFlow.timestamp + fakeFlow.generator + fakeFlow.amount + fakeFlow.claimId
    ).toString()

    fakeFlow.signature = await sign('L4BEDs6eNfdALtRhpRYwjbn5xpZyJHtkAv9um4woKuhNntC6xJp4', fakeFlow.id)
    fakeFlow.cammesaSignature = await sign(privKeyCAMMESA, fakeFlow.id)

    newBlock.contracts[0].measurements.push(fakeFlow)

    const valid0 = await validateMeasurements(newBlock.contracts[0])
    const valid1 = await validateMeasurements(newBlock.contracts[1])
    const valid2 = await validateMeasurements(newBlock.contracts[2])

    expect(valid0).to.be.false
    expect(valid1).to.be.true
    expect(valid2).to.be.true
  })

  it('$hasValidContracts. Expect ok.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    await calculateContractsMR({contracts: resolvedContracts})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    const valid0 = await $hasValidContracts(newBlock)

    expect(valid0).to.be.true
  })

  it('$hasValidContracts with fake flow. Expect Invalid contract ID.', async () => {
    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    await calculateContractsMR({contracts: resolvedContracts})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    const fakeFlow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    fakeFlow.id = await CryptoJS.SHA256(
      fakeFlow.timestamp + fakeFlow.generator + fakeFlow.amount + fakeFlow.claimId
    ).toString()

    fakeFlow.signature = await sign('L4BEDs6eNfdALtRhpRYwjbn5xpZyJHtkAv9um4woKuhNntC6xJp4', fakeFlow.id)
    fakeFlow.cammesaSignature = await sign(privKeyCAMMESA, fakeFlow.id)

    newBlock.contracts[0].measurements.push(fakeFlow)

    const valid0 = await $hasValidContracts(newBlock)

    expect(valid0).to.be.false
  })

  it('$hasValidContracts with fake flow signature. Expect Invalid flow signature.', async () => {
    const fakeFlow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: contract1.claimId,
      signature: '',
      cammesaSignature: ''
    }

    fakeFlow.id = await CryptoJS.SHA256(
      fakeFlow.timestamp + fakeFlow.generator + fakeFlow.amount + fakeFlow.claimId
    ).toString()

    fakeFlow.signature = await sign('L4BEDs6eNfdALtRhpRYwjbn5xpZyJHtkAv9um4woKuhNntC6xJp4', fakeFlow.id)
    fakeFlow.cammesaSignature = await sign(privKeyCAMMESA, fakeFlow.id)

    const flows = await $flowPool()
    const claims = await $contractPool()
    await $addFlowsToClaims({flows, claims})
    const resolvedContracts = await $resolvedContracts({claims})
    resolvedContracts[0].measurements.push(fakeFlow)
    await calculateContractsMR({contracts: resolvedContracts})
    const rawBlock = await $generateRawNextBlock({contracts: resolvedContracts})
    const newBlock = await $findBlock(rawBlock)

    const valid0 = await $hasValidContracts(newBlock)

    expect(valid0).to.be.false
  })
})
