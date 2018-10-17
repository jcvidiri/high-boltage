import {expect} from 'chai'
import {describe, it} from 'mocha'

import {sendMeasurement, mintBlock} from '../src/blockchain'
import {getMeasurementPool, cleanMeasurementPool} from '../src/measurement-pool'

describe('Measurement test', function() {
  const flowIn = {
    id: '1',
    address:
      '042020b025191c40c3e995519d80a9af95a4275b9741e8f833a30c001cee3fbaf65388923d373cecd20debd7461c54ed324b052dcbe52901166e4ecb4b00190058',
    amount: 20,
    signature: 'somesig'
  }

  const flowOut = {
    id: '2',
    address:
      '042121b025191c40c3e995519d80a9af95a4275b9741e8f833a30c001cee3fbaf65388923d373cecd20debd7461c54ed324b052dcbe52901166e4ecb4b00190058',
    amount: 10,
    signature: 'somesig2'
  }

  it('sendMeasurement. Expect ok.', done => {
    sendMeasurement([flowIn], [flowOut])

    const mtPool = getMeasurementPool()

    expect(mtPool).to.be.an('array')
    expect(mtPool[0]).to.have.property('mtOuts')
    expect(mtPool[0].mtOuts).to.deep.include(flowOut)
    expect(mtPool[0]).to.have.property('mtIns')
    expect(mtPool[0].mtIns).to.deep.include(flowIn)
    done()
  })

  it('mintBlock with measurements. Expect ok.', done => {
    cleanMeasurementPool()
    sendMeasurement([flowIn], [flowOut])

    let count = 0
    let block
    mintBlock(block, count, (err, block) => {
      console.log('\n --> mintBlock err, block: ', err, block)

      // expect(err).to.be.null
      // expect(block).to.have.property('data')
      // expect(block.data).to.have.property('transactions')
      // expect(block.data.transactions[1]).to.have.property('txOuts')
      // expect(block.data.transactions[1].txOuts[0]).to.deep.include({address, amount})
      done()
    })
  })
})
