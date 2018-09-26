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

export {JSONToObject, toHexString}
