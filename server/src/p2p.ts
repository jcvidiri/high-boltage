import * as WebSocket from 'ws'
import {Server} from 'ws'
import {
  $addBlockToChain,
  Block,
  $blockchain,
  getLatestBlock,
  $replaceChain,
  $blockMinted,
  $isValidBlockStructure,
  $hasValidHash,
  $hasValidContracts
} from './blockchain'
import {JSONToObject} from './utils'
import {Flow, $flowPool, $replaceFlowPool, $addToFlowPool, $removeFlows} from './flow'
import {Contract, $contractPool, $addToContractPool, $replaceContractPool, $removeClaims} from './contract'

class Message {
  public type: MessageType
  public data: any
}

const sockets: WebSocket[] = []

enum MessageType {
  QUERY_LATEST = 'QUERY_LATEST',
  QUERY_ALL_POOLS = 'QUERY_ALL_POOLS',
  RESPONSE_ALL_POOLS = 'RESPONSE_ALL_POOLS',
  QUERY_BLOCKCHAIN = 'QUERY_BLOCKCHAIN',
  RESPONSE_BLOCKCHAIN = 'RESPONSE_BLOCKCHAIN',
  RESPONSE_BLOCK = 'RESPONSE_BLOCK',
  QUERY_CLAIM_POOL = 'QUERY_CLAIM_POOL',
  QUERY_FLOW_POOL = 'QUERY_FLOW_POOL',
  RESPONSE_CLAIM_POOL = 'RESPONSE_CLAIM_POOL',
  RESPONSE_FLOW_POOL = 'RESPONSE_FLOW_POOL',
  NEW_FLOW = 'NEW_FLOW',
  NEW_CLAIM = 'NEW_CLAIM'
}

const p2pServer = (port: number, instanceNumber: number, totalInstances: number) => {
  const server: Server = new WebSocket.Server({port: port})
  server.on('connection', (ws: WebSocket) => {
    initConnection(ws)
  })

  setTimeout(() => {
    if (instanceNumber && totalInstances > 1) {
      let i = 1
      while (i <= totalInstances) {
        if (i != instanceNumber) {
          $connectToPeer(`ws://localhost:${port - instanceNumber + i}`)
        }
        i++
      }
    }
  }, 1000)
  // console.log('listening websocket p2p port on: ' + port)
}

const $getSockets = () => sockets
const write = (ws: WebSocket, message: Message): void => ws.send(JSON.stringify(message))
const broadcast = async (message: Message) => sockets.forEach(socket => write(socket, message))

const initConnection = (ws: WebSocket) => {
  sockets.push(ws)
  initMessageHandler(ws)
  initErrorHandler(ws)
  write(ws, queryChainLengthMsg())

  setTimeout(() => {
    broadcast(queryAllPools())
  }, 500)
}

// TODO check async websocket works
const initMessageHandler = async (ws: WebSocket) => {
  ws.on('message', async (data: string) => {
    try {
      const message: Message = JSONToObject<Message>(data)
      if (message === null) return

      switch (message.type) {
        case MessageType.QUERY_LATEST:
          write(ws, latestBlock())
          break
        case MessageType.QUERY_BLOCKCHAIN:
          write(ws, blockchain())
          break
        case MessageType.RESPONSE_BLOCKCHAIN:
          const receivedBlocks: Block[] = JSONToObject<Block[]>(message.data)
          if (receivedBlocks === null) break
          await handleBlockchainResponse(receivedBlocks)
          break
        case MessageType.RESPONSE_BLOCK:
          const receivedBlock: Block = JSONToObject<Block>(message.data)
          if (receivedBlock === null) break
          await handleBlockResponse(receivedBlock)
          break
        case MessageType.QUERY_FLOW_POOL:
          write(ws, flowPool())
          break
        case MessageType.QUERY_CLAIM_POOL:
          write(ws, claimPool())
          break
        case MessageType.QUERY_ALL_POOLS:
          write(ws, allPools())
          break
        case MessageType.RESPONSE_FLOW_POOL:
          const receivedFlows: Flow[] = JSONToObject<Flow[]>(message.data)
          if (receivedFlows === null) break
          const newFlows = await handleReceivedFlows(receivedFlows)
          if (newFlows) await broadcastFlowPool()
          break
        case MessageType.RESPONSE_CLAIM_POOL:
          const receivedClaims: Contract[] = JSONToObject<Contract[]>(message.data)
          if (receivedClaims === null) break
          const newClaims = await handleReceivedClaims(receivedClaims)
          if (newClaims) await broadcastContractPool()
          break
        case MessageType.NEW_FLOW:
          const receivedFlow: Flow = JSONToObject<Flow>(message.data)
          if (receivedFlow === null) break
          const newFlow = await handleReceivedFlow(receivedFlow)
          if (newFlow) await broadcastFlowPool()
          break
        case MessageType.NEW_CLAIM:
          const receivedClaim: Contract = JSONToObject<Contract>(message.data)
          if (receivedClaim === null) break
          const newClaim = await handleReceivedClaim(receivedClaim)
          if (newClaim) await broadcastContractPool()
          break
      }
    } catch (e) {
      console.log(e)
    }
  })
}

// !MESSAGES
const queryChainLengthMsg = (): Message => ({
  type: MessageType.QUERY_LATEST,
  data: null
})

const queryAllPools = (): Message => ({
  type: MessageType.QUERY_ALL_POOLS,
  data: null
})

const queryBlockchain = (): Message => ({
  type: MessageType.QUERY_BLOCKCHAIN,
  data: null
})

const blockchain = (): Message => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify($blockchain())
})

const latestBlock = (): Message => ({
  // broadcast minted block
  type: MessageType.RESPONSE_BLOCK,
  data: JSON.stringify(getLatestBlock())
})

const queryFlowPool = (): Message => ({
  type: MessageType.QUERY_FLOW_POOL,
  data: null
})

const queryClaimPool = (): Message => ({
  type: MessageType.QUERY_CLAIM_POOL,
  data: null
})

const flowPool = (): Message => ({
  type: MessageType.RESPONSE_FLOW_POOL,
  data: JSON.stringify($flowPool())
})

const claimPool = (): Message => ({
  type: MessageType.RESPONSE_CLAIM_POOL,
  data: JSON.stringify($contractPool())
})

const allPools = (): Message => ({
  type: MessageType.RESPONSE_ALL_POOLS,
  data: JSON.stringify({claim: $contractPool(), flows: $flowPool()})
})

const newFlow = (flow: Flow): Message => ({
  type: MessageType.NEW_FLOW,
  data: JSON.stringify(flow)
})

const newClaim = (claim: Contract): Message => ({
  type: MessageType.NEW_CLAIM,
  data: JSON.stringify(claim)
})

// const responseTransactionPoolMsg = (): Message => ({
//   type: MessageType.RESPONSE_TRANSACTION_POOL,
//   data: JSON.stringify($transactionPool())
// })

// const responseMeasurementPoolMsg = (): Message => ({
//   type: MessageType.RESPONSE_MEASUREMENT_POOL,
//   data: JSON.stringify($transactionPool())
// })

const initErrorHandler = (ws: WebSocket) => {
  const closeConnection = (myWs: WebSocket) => {
    // console.log('connection failed to peer: ' + myWs.url)
    sockets.splice(sockets.indexOf(myWs), 1)
  }
  ws.on('close', () => closeConnection(ws))
  ws.on('error', () => closeConnection(ws))
}

const handleReceivedFlows = async (flows: Flow[]): Promise<boolean> => {
  const flowPool = await $flowPool()
  const flPoolIds = flowPool.map(fl => fl.id)
  const flPool = new Set([...flPoolIds])
  const flowsIds = flows.map(fl => fl.id)
  const newFlowsIds = new Set([...flowsIds].filter(x => !flPool.has(x))) // should check flows added to blockchain too

  if (![...newFlowsIds].length) return false

  const union = []
  const unionIds = [...new Set([...flowsIds, ...flPoolIds])]
  await unionIds.map(async flId => {
    const nFlow = flows.find(f => f.id === flId)
    const flow = flowPool.find(f => f.id === flId)

    union.push(nFlow || flow)
  })

  await $replaceFlowPool(union)
  return true
}

const handleReceivedFlow = async (flow: Flow): Promise<boolean> => {
  const flPoolIds = (await $flowPool()).map(fl => fl.id)
  const flPool = new Set([...flPoolIds])
  const newFlow = new Set([flow.id].filter(x => !flPool.has(x))) // should check flows added to blockchain too

  if (![...newFlow].length) return false

  $addToFlowPool(flow)
  return true
}

const handleReceivedClaims = async (claims: Contract[]): Promise<boolean> => {
  const contractPool = await $contractPool()
  const ctPoolIds = contractPool.map(ct => ct.claimId)
  const claimsIds = claims.map(cl => cl.claimId)
  const clPool = new Set([...ctPoolIds])
  const newClaimsIds = new Set([...claimsIds].filter(x => !clPool.has(x))) // should check claims added to blockchain too

  if (![...newClaimsIds].length) return false

  const union = []
  const unionIds = [...new Set([...claimsIds, ...ctPoolIds])]
  await unionIds.map(async clId => {
    const nClaim = claims.find(c => c.claimId === clId)
    const claim = contractPool.find(c => c.claimId === clId)

    union.push(nClaim || claim)
  })

  await $replaceContractPool(union)
  return true
}

const handleReceivedClaim = async (claim: Contract): Promise<boolean> => {
  const ctPoolIds = (await $contractPool()).map(ct => ct.claimId)
  const clPool = new Set([...ctPoolIds])
  const newClaimId = new Set([claim.claimId].filter(x => !clPool.has(x))) // should check flows added to blockchain too
  if (![...newClaimId].length) return false

  await $addToContractPool(claim)
  return true
}

const handleBlockchainResponse = async (receivedBlocks: Block[]) => {
  console.log('\n --> receivedBlocks.length: ', receivedBlocks.length)
  if (receivedBlocks.length === 0) return
  const latestBlockReceived: Block = receivedBlocks[receivedBlocks.length - 1]
  // if (!isValidBlockStructure(latestBlockReceived)) {
  //   // console.log('block structuture not valid')
  //   return
  // }
  const latestBlockHeld: Block = getLatestBlock()
  if (latestBlockReceived.index > latestBlockHeld.index) {
    // console.log(
    //   'blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index
    // )
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      if ($addBlockToChain(latestBlockReceived)) {
        await $removeClaims(latestBlockReceived)
        await $removeFlows(latestBlockReceived)

        broadcast(latestBlock())
      }
    } else if (receivedBlocks.length === 1) {
      // console.log('We have to query the chain from our peer')
      broadcast(queryBlockchain())
    } else {
      console.log('Received blockchain is longer than current blockchain')
      $replaceChain(receivedBlocks)
    }
  } else {
    // console.log('received blockchain is not longer than received blockchain. Do nothing')
  }
}

const handleBlockResponse = async (receivedBlock: Block) => {
  if (!receivedBlock) return
  if (!$isValidBlockStructure(receivedBlock)) {
    console.log('\n block received not valid')
    return
  }
  if (!$hasValidHash(receivedBlock)) {
    console.log('\n block hash not valid')
    return
  }
  if (!$hasValidContracts(receivedBlock)) {
    console.log('\n block has invalid contrac(s)')
    return
  }
  const latestBlockHeld: Block = getLatestBlock()
  if (receivedBlock.index > latestBlockHeld.index) {
    if (latestBlockHeld.hash === receivedBlock.previousHash) {
      if ($addBlockToChain(receivedBlock)) {
        await $blockMinted()
        await $removeClaims(receivedBlock)
        await $removeFlows(receivedBlock)

        broadcast(latestBlock())
      }
    } else {
      broadcast(queryBlockchain())
    }
  }
}

const broadcastLatest = (): void => {
  broadcast(latestBlock())
}

const $connectToPeer = (newPeer: string): void => {
  const ws: WebSocket = new WebSocket(newPeer)
  ws.on('open', () => {
    initConnection(ws)
    return true
  })
  ws.on('error', () => {
    return false
  })
}

const broadcastFlowPool = () => {
  broadcast(flowPool())
}

const $broadcastNewFlow = async (flow: Flow) => {
  return broadcast(newFlow(flow))
}
const $broadcastNewClaim = async (claim: Contract) => {
  return broadcast(newClaim(claim))
}

const broadcastContractPool = () => {
  broadcast(claimPool())
}

export {$connectToPeer, broadcastLatest, p2pServer, $getSockets, $broadcastNewClaim, $broadcastNewFlow}
