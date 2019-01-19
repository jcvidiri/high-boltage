import {expect} from 'chai'
import {describe, it} from 'mocha'
import {Flow, $flowPool, $cleanFlowPool, $addToFlowPool} from '../src/flow'
import {toHexString, getCurrentTimestamp} from '../src/utils'
import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
const ec = new ecdsa.ec('secp256k1')

describe('Flow test', async () => {
  const sign = async (privateKey, id) => {
    const key = ec.keyFromPrivate(privateKey, 'hex')
    return toHexString(key.sign(id).toDER())
  }
  it('$addFlowToPool. Expect ok.', async () => {
    await $cleanFlowPool()
    const key = await ec.genKeyPair()
    const pubKey = await key.getPublic().encode('hex')
    const privKey = await key.getPrivate().toString(16)

    console.log('\n --> pubKey: ', pubKey)
    console.log('\n --> privKey: ', privKey)
    const flowData1: Flow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: 'someClaimId',
      signature: ''
    }

    const flowData2: Flow = {
      id: '',
      timestamp: getCurrentTimestamp(),
      generator: pubKey,
      amount: 20,
      claimId: 'someClaimId2',
      signature: ''
    }

    const flow1Hash = await CryptoJS.SHA256(
      flowData1.timestamp + flowData1.generator + flowData1.amount + flowData1.claimId
    ).toString()
    const flow2Hash = await CryptoJS.SHA256(
      flowData2.timestamp + flowData2.generator + flowData2.amount + flowData2.claimId
    ).toString()

    flowData1.id = flow1Hash
    flowData2.id = flow2Hash
    flowData1.signature = await sign(privKey, flowData1.id)
    flowData2.signature = await sign(privKey, flowData2.id)

    await $addToFlowPool(flowData1)
    await $addToFlowPool(flowData2)

    const fPool = await $flowPool()

    expect(fPool).to.be.an('array')
    expect(fPool).to.deep.include(flowData1)
    expect(fPool).to.deep.include(flowData2)
  })
})
