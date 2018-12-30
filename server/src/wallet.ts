import {ec} from 'elliptic'
import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs'
import * as _ from 'lodash'

const EC = new ec('secp256k1')
const privateKey = process.env.PRIVATE_KEY || 'wallet/private-key'
const KEY_FILE_ENABLED = process.env.KEY_FILE_ENABLED === 'true' ? true : false
const wallet = {priv: '', pub: ''}

// const getPublicKeyFromPrivate = (privateKey: string): string => {
//   return ec
//     .keyFromPrivate(privateKey, 'hex')
//     .getPublic()
//     .encode('hex')
// }

const $getPrivateFromWallet = async (): Promise<string> => {
  if (!KEY_FILE_ENABLED && wallet.priv) return wallet.priv

  const buffer = readFileSync(privateKey, 'utf8')
  return buffer.toString()
}

const $getPublicFromWallet = async (): Promise<string> => {
  const privateKey = await $getPrivateFromWallet()
  const key = EC.keyFromPrivate(privateKey, 'hex')
  return key.getPublic().encode('hex')
}

const generatePrivateKey = async (): Promise<string> => {
  const keyPair = EC.genKeyPair()
  const privateKey = keyPair.getPrivate()
  return privateKey.toString(16)
}

const initWallet = async () => {
  if (!KEY_FILE_ENABLED) {
    wallet.priv = await generatePrivateKey()
    wallet.pub = EC.keyFromPrivate(wallet.priv, 'hex')
      .getPublic()
      .encode('hex')

    return
  }

  if (existsSync(privateKey)) return

  writeFileSync(privateKey, generatePrivateKey())
}

const deleteWallet = () => {
  if (existsSync(privateKey)) unlinkSync(privateKey)
}

export {$getPublicFromWallet, $getPrivateFromWallet, generatePrivateKey, initWallet, deleteWallet}
