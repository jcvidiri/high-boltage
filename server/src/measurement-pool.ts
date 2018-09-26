import * as _ from 'lodash'
import {Measurement} from './measurement'

let measurementPool: Measurement[] = []

const getMeasurementPool = () => {
  return _.cloneDeep(measurementPool)
}

const addToMeasurementPool = (mt: Measurement) => {
  // if (!validateMeasurement(mt)) {
  //   throw Error('Trying to add invalid mt to pool')
  // }

  // if (isMtDuplicated(mt)) {
  //   throw Error('Trying to add duplicated mt to pool')
  // }

  measurementPool.push(mt)
}

// const isMtDuplicated = (mt: Measurement): boolean => {
//   // return _.find(getMeasurementPool(), m => {
//   //   return m.id === mt.id
//   //   })
//   return false
// }

export {getMeasurementPool, addToMeasurementPool}
