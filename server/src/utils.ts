const JSONToObject = <T>(data: string): T => {
  try {
    return JSON.parse(data)
  } catch (e) {
    console.log(e)
    return null
  }
}

const toHexString = (byteArray): string => {
  return Array.from(byteArray, (byte: any) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  }).join('')
}

const getCurrentTimestamp = (): number => Math.round(new Date().getTime() / 1000)

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
const isValidAddress = (address: string): boolean => {
  if (address.length !== 130 || !address.startsWith('04') || address.match('^[a-fA-F0-9]+$') === null) return false

  return true
}

export {JSONToObject, toHexString, getCurrentTimestamp, timeout, isValidAddress}
