import * as CryptoJS from 'crypto-js'
import * as ecdsa from 'elliptic'
import {toHexString} from './utils'

const ec = new ecdsa.ec('secp256k1')

class Flow {
  public id: string
  public address: string
  public amount: number
  public signature: string
}

class Measurement {
  public id: string
  public mtIns: Flow[] // provided by generators
  public mtOuts: Flow[] // consumed by users
}

const validateMeasurement = (measurement: Measurement): boolean => {
  if (!isValidMeasurementStructure(measurement)) return false
  if (getMeasurementId(measurement) !== measurement.id) return false

  const totalMtInValues: number = measurement.mtIns.map(mtIn => mtIn.amount).reduce((a, b) => a + b, 0)
  const totalMtOutValues: number = measurement.mtOuts.map(mtOut => mtOut.amount).reduce((a, b) => a + b, 0)

  if (totalMtOutValues !== totalMtInValues) return false

  return true
}

const validateBlockMeasurements = (measurements: Measurement[]): boolean => {
  // todo check for duplicate measurements

  return measurements.map(mt => validateMeasurement(mt)).reduce((a, b) => a && b, true)
}

const validateFlow = (flow: Flow): boolean => {
  const key = ec.keyFromPublic(flow.address, 'hex')
  const validSignature: boolean = key.verify(flow.id, flow.signature)
  if (!validSignature) return false

  return true
}

const processMeasurements = (measurements: Measurement[], blockIndex: number) => {
  if (!validateBlockMeasurements(measurements)) return null
}

const isValidMtInStructure = (mtIn: Flow): boolean => {
  if (
    mtIn == null ||
    typeof mtIn.id !== 'string' ||
    typeof mtIn.amount !== 'number' ||
    typeof mtIn.address !== 'string' ||
    typeof mtIn.signature !== 'string'
  )
    return false

  return true
}

const isValidMtOutStructure = (mtOut: Flow): boolean => {
  if (
    mtOut == null ||
    typeof mtOut.address !== 'string' ||
    !isValidAddress(mtOut.address) ||
    typeof mtOut.amount !== 'number'
  )
    return false

  return true
}

const isValidMeasurementStructure = (measurement: Measurement) => {
  if (
    typeof measurement.id !== 'string' ||
    !(measurement.mtIns instanceof Array) ||
    !measurement.mtIns.map(isValidMtInStructure).reduce((a, b) => a && b, true) ||
    !(measurement.mtOuts instanceof Array) ||
    !measurement.mtOuts.map(isValidMtOutStructure).reduce((a, b) => a && b, true)
  )
    return false

  return true
}

// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
const isValidAddress = (address: string): boolean => {
  if (address.length !== 130) {
    console.log(address)
    console.log('invalid measurement public key length')
    return false
  } else if (address.match('^[a-fA-F0-9]+$') === null) {
    console.log('measurement public key must contain only hex characters')
    return false
  } else if (!address.startsWith('04')) {
    console.log('measurement public key must start with 04')
    return false
  }
  return true
}

const signMt = (flow: Flow, privateKey: string): string => {
  const key = ec.keyFromPrivate(privateKey, 'hex')
  const signature: string = toHexString(key.sign(flow.id).toDER())

  return signature
}

const getMeasurementId = (measurement: Measurement): string => {
  const mtInContent: string = measurement.mtIns
    .map((mtIn: Flow) => mtIn.address + mtIn.amount) // + mtIn.id + mtIn.signature
    .reduce((a, b) => a + b, '')

  const mtOutContent: string = measurement.mtOuts
    .map((mtOut: Flow) => mtOut.address + mtOut.amount) // + mtOut.id + mtOut.signature
    .reduce((a, b) => a + b, '')

  return CryptoJS.SHA256(mtInContent + mtOutContent).toString()
}

export {Measurement, Flow, signMt, getMeasurementId}
