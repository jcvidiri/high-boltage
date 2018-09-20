import * as _ from 'lodash'
import { Measurement } from './measurement'

let measurementPool: Measurement[] = []

const getMeasurementPool = () => {
  return _.cloneDeep(measurementPool)
}

export { getMeasurementPool }
