import {expect} from 'chai'
import {describe, it, beforeEach} from 'mocha'
import {Flow, $flowPool, $cleanFlowPool, $addToFlowPool} from '../src/flow'
import {Contract, $cleanContractPool, $addContractToPool, $contractPool} from '../src/contract'
import {$addFlowsToClaims} from '../src/blockchain'
import {toHexString, getCurrentTimestamp} from '../src/utils'
import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
const ec = new ecdsa.ec('secp256k1')

describe('Mint test', async () => {
  const sign = async (privateKey, id) => {
    const key = ec.keyFromPrivate(privateKey, 'hex')
    return toHexString(key.sign(id).toDER())
  }

  let flow1
  let flow2
  let contract1
  let contract2

  beforeEach(async () => {
    await $cleanFlowPool()
    await $cleanContractPool()
    const key = await ec.genKeyPair()
    const pubKey = await key.getPublic().encode('hex')
    const privKey = await key.getPrivate().toString(16)

    contract1 = new Contract({
      claimant: pubKey,
      amount: 20,
      price: 900,
      expDate: getCurrentTimestamp() + 1000
    })

    contract2 = new Contract({
      claimant: pubKey,
      amount: 10,
      price: 890,
      expDate: getCurrentTimestamp() + 1000
    })

    await $addContractToPool(contract1)
    await $addContractToPool(contract2)

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

    const flow1Hash = await CryptoJS.SHA256(flow1.timestamp + flow1.generator + flow1.amount + flow1.claimId).toString()
    const flow2Hash = await CryptoJS.SHA256(flow2.timestamp + flow2.generator + flow2.amount + flow2.claimId).toString()

    flow1.id = flow1Hash
    flow2.id = flow2Hash
    flow1.signature = await sign(privKey, flow1.id)
    flow2.signature = await sign(privKey, flow2.id)

    await $addToFlowPool(flow1)
    await $addToFlowPool(flow2)
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
    // todo test
    // const resolvedContracts = getResolvedContracts()
  })
  it('$signContracts. Expect ok.', async () => {
    // todo test
    // await signContracts({contracts: resolvedContracts})
  })
  it('$generateRawNextBlock. Expect ok.', async () => {
    // todo test
    // const rawBlock = generateRawNextBlock({contracts: resolvedContracts})
  })
  it('$findBlock. Expect ok.', async () => {
    // todo test
    // const newBlock = await findBlock(rawBlock)
  })
  it('$startMinting & $stopMinting. Expect ok.', async () => {
    // todo test
  })
})
