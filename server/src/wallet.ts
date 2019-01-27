import {ec} from 'elliptic'
import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs'
import * as _ from 'lodash'
import * as dotenv from 'dotenv'

dotenv.config()

const EC = new ec('secp256k1')
const privateKeyFile = process.env.PRIVATE_KEY_FILE || 'wallet/private-key'
const KEY_FILE_ENABLED = process.env.KEY_FILE_ENABLED === 'true' ? true : false
const UNIQUE_ADDRESS_ENABLED = process.env.UNIQUE_ADDRESS_ENABLED === 'true' ? true : false
const wallet = {priv: '', pub: ''}

// const getPublicKeyFromPrivate = (privateKey: string): string => {
//   return ec
//     .keyFromPrivate(privateKey, 'hex')
//     .getPublic()
//     .encode('hex')
// }

const $getPrivateFromWallet = (): string => {
  if (!KEY_FILE_ENABLED && wallet.priv) return wallet.priv

  const buffer = readFileSync(privateKeyFile, 'utf8')
  return buffer.toString()
}

const $getPublicFromWallet = (): string => {
  const privateKey = $getPrivateFromWallet()
  const key = EC.keyFromPrivate(privateKey, 'hex')
  return key.getPublic().encode('hex')
}

const generatePrivateKey = async (): Promise<string> => {
  const keyPair = EC.genKeyPair()
  const privateKey = keyPair.getPrivate()
  return privateKey.toString(16)
}

const initWallet = async () => {
  if (UNIQUE_ADDRESS_ENABLED && KEY_FILE_ENABLED) {
    throw Error('Coult not initWallet: You must disable UNIQUE_ADDRESS_ENABLED or KEY_FILE_ENABLED')
  }
  if (UNIQUE_ADDRESS_ENABLED) {
    const key = await EC.genKeyPair()
    const pubKey = await key.getPublic().encode('hex')
    const privKey = await key.getPrivate().toString(16)

    wallet.priv = privKey
    wallet.pub = pubKey
    return
  }
  if (!KEY_FILE_ENABLED) {
    wallet.priv = await generatePrivateKey()
    wallet.pub = EC.keyFromPrivate(wallet.priv, 'hex')
      .getPublic()
      .encode('hex')

    return
  }

  if (existsSync(privateKeyFile)) return

  writeFileSync(privateKeyFile, generatePrivateKey())
}

const deleteWallet = () => {
  if (existsSync(privateKeyFile)) unlinkSync(privateKeyFile)
}

// ! this is for test pursposes only, real keys would never be stored &
// ! fetched this way
const $getPrivateCAMMESA = async (): Promise<string> => {
  return process.env.CAMMESA_PRIV
}

// ! this is for test pursposes only, real keys would never be stored &
// ! fetched this way
const $getPublicCAMMESA = async (): Promise<string> => {
  const key = EC.keyFromPrivate(process.env.CAMMESA_PRIV, 'hex')
  return key.getPublic().encode('hex')
}

export {
  $getPublicFromWallet,
  $getPrivateFromWallet,
  generatePrivateKey,
  initWallet,
  deleteWallet,
  $getPrivateCAMMESA,
  $getPublicCAMMESA
}
