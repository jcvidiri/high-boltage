import * as _ from 'lodash'
import {Measurement, Flow} from './measurement'

let measurementPool: Measurement[] = []

const $measurementPool = () => {
  return _.cloneDeep(measurementPool)
}

const $cleanMeasurementPool = () => {
  // this is for test purposes only
  measurementPool = []
}

const $addToMeasurementPool = (mt: Measurement) => {
  // if (!validateMeasurement(mt)) {
  //   throw Error('Trying to add invalid mt to pool')
  // }

  // if (isMtDuplicated(mt)) {
  //   throw Error('Trying to add duplicated mt to pool')
  // }

  measurementPool.push(mt)
}

const hasMtIn = (mtIn: Flow, unspentMtOuts: Measurement[]): boolean => {
  // const foundMtIn = unspentMtOuts.find((uMtO: Flow) => {
  //   return uMtO.txOutId === mtIn.txOutId && uMtO.txOutIndex === mtIn.txOutIndex
  // })
  // return foundMtIn !== undefined
  return true
}

const $updateMeasurementsPool = (unspentMtOuts: Measurement[]) => {
  const invalidMts = []
  for (const mt of measurementPool) {
    for (const mtIn of mt.mtIns) {
      if (!hasMtIn(mtIn, unspentMtOuts)) {
        invalidMts.push(mt)
        break
      }
    }
  }
  if (invalidMts.length > 0) {
    // console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidMts))
    measurementPool = _.without(measurementPool, ...invalidMts)
  }
}

// const isMtDuplicated = (mt: Measurement): boolean => {
//   // return _.find($measurementPool(), m => {
//   //   return m.id === mt.id
//   //   })
//   return false
// }

export {$measurementPool, $addToMeasurementPool, $cleanMeasurementPool, $updateMeasurementsPool}
