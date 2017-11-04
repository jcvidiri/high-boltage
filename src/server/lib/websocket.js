import webSocket from 'ws'

let sockets = []
let MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
}

let write = (ws, message) => ws.send(JSON.stringify(message))
let broadcast = (message) => sockets.forEach(socket => write(socket, message))


let initP2PServer = (port) => {
    let server = new webSocket.Server({port})
    server.on('connection', (ws) => {
      sockets.push(ws)
      initMessageHandler(ws)
      initErrorHandler(ws)
      write(ws, queryChainLengthMsg())
    })

    console.log('listening websocket p2p port on: ' + port)
}

function initMessageHandler (ws) {
    ws.on('message', (data) => {
        let message = JSON.parse(data)
        console.log('Received message' + JSON.stringify(message))
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg())
                break
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg())
                break
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message)
                break
        }
    })
}

function closeConnection (ws) {
  console.log('connection failed to peer: ' + ws.url)
  sockets.splice(sockets.indexOf(ws), 1)
}

function initErrorHandler (ws) {
    ws.on('close', () => closeConnection(ws))
    ws.on('error', () => closeConnection(ws))
}

let connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        let ws = new WebSocket(peer)
        ws.on('open', () => initConnection(ws))
        ws.on('error', () => {
            console.log('connection failed')
        })
    })
}

let getLatestBlock = () => blockchain[blockchain.length - 1]
let queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST})
let queryAllMsg = () => ({'type': MessageType.QUERY_ALL})
let responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
})
let responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
})

let handleBlockchainResponse = (message) => {
    let receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index))
    let latestBlockReceived = receivedBlocks[receivedBlocks.length - 1]
    let latestBlockHeld = getLatestBlock()
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index)
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain")
            blockchain.push(latestBlockReceived)
            broadcast(responseLatestMsg())
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer")
            broadcast(queryAllMsg())
        } else {
            console.log("Received blockchain is longer than current blockchain")
            replaceChain(receivedBlocks)
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing')
    }
}

export { initP2PServer, connectToPeers }
