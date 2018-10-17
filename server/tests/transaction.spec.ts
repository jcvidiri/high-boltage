import {expect} from 'chai'
import {describe, it} from 'mocha'

import {sendTransaction, mintBlock} from '../src/blockchain'
import {getTransactionPool, cleanTransactionPool} from '../src/transaction-pool'

describe('Transaction test', function() {
  it('sendTransaction. Expect ok.', done => {
    const address =
      '042421b025191c40c3e995519d80a9af95a4275b9741e8f833a30c001cee3fbaf65388923d373cecd20debd7461c54ed324b052dcbe52901166e4ecb4b00190058'
    const amount = 50

    sendTransaction(address, amount)

    const txPool = getTransactionPool()
    expect(txPool).to.be.an('array')
    expect(txPool[0]).to.have.property('txOuts')
    expect(txPool[0].txOuts).to.deep.include({address, amount})
    done()
  })

  it('mintBlock with transactions. Expect ok.', done => {
    cleanTransactionPool()

    const address =
      '042421b025191c40c3e995519d80a9af95a4275b9741e8f833a30c001cee3fbaf65388923d373cecd20debd7461c54ed324b052dcbe52901166e4ecb4b00190057'
    const amount = 50

    sendTransaction(address, amount)

    let count = 0
    let block
    mintBlock(block, count, (err, block) => {
      expect(err).to.be.null
      expect(block).to.have.property('data')
      expect(block.data).to.have.property('transactions')
      expect(block.data.transactions[1]).to.have.property('txOuts')
      expect(block.data.transactions[1].txOuts[0]).to.deep.include({address, amount})
      done()
    })
  })
})
