import {expect} from 'chai'
import {describe, it} from 'mocha'
import {Contract, $cleanContractPool, $addContractToPool, $contractPool} from '../src/contract'
import {getCurrentTimestamp} from '../src/utils'
import * as ecdsa from 'elliptic'
const ec = new ecdsa.ec('secp256k1')

describe('Contract test', async () => {
  it('$addContractToPool. Expect ok.', async () => {
    await $cleanContractPool()
    const key = await ec.genKeyPair()
    const pubKey = await key.getPublic().encode('hex')

    const contract1: Contract = new Contract({
      claimant: pubKey,
      amount: 20,
      price: 900,
      expDate: getCurrentTimestamp() + 1000
    })

    const contract2: Contract = new Contract({
      claimant: pubKey,
      amount: 10,
      price: 890,
      expDate: getCurrentTimestamp() + 1000
    })

    await $addContractToPool(contract1)
    await $addContractToPool(contract2)

    const ctPool = await $contractPool()

    expect(ctPool).to.be.an('array')
    expect(ctPool).to.deep.include(contract1)
    expect(ctPool).to.deep.include(contract2)
  })
})
