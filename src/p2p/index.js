var WebSocket = require('ws')
const blockchainModule = require('../blockchain')

var sockets = []
var MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2
}

var write = (ws, message) => ws.send(JSON.stringify(message))
var broadcast = (message) => sockets.forEach(socket => write(socket, message))

var initP2PServer = (p2pPort, initialPeers) => {
  connectToPeers(initialPeers)
  var server = new WebSocket.Server({ port: p2pPort })
  server.on('connection', ws => initConnection(ws))
  console.log('listening websocket p2p port on: ' + p2pPort)
}

module.exports.initP2PServer = initP2PServer

module.exports.broadcastLatestMsg = (req, res, next) => {
  broadcast(responseLatestMsg())
  next()
}

module.exports.getPeers = (req, res) => {
  res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort))
}

module.exports.addPeer = (req, res) => {
  connectToPeers([req.body.peer])
  res.send()
}

var queryChainLengthMsg = () => ({ 'type': MessageType.QUERY_LATEST })
var queryAllMsg = () => ({ 'type': MessageType.QUERY_ALL })
var responseChainMsg = () => ({
  'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchainModule.blockchain)
})
var responseLatestMsg = () => ({
  'type': MessageType.RESPONSE_BLOCKCHAIN,
  'data': JSON.stringify([blockchainModule.getLatestBlock()])
})

var handleBlockchainResponse = (message) => {
  var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index))
  var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1]
  var latestBlockHeld = blockchainModule.getLatestBlock()
  if (latestBlockReceived.index > latestBlockHeld.index) {
    console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index)
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      console.log('We can append the received block to our chain')
      blockchainModule.blockchain.push(latestBlockReceived)
      broadcast(responseLatestMsg())
    } else if (receivedBlocks.length === 1) {
      console.log('We have to query the chain from our peer')
      broadcast(queryAllMsg())
    } else {
      console.log('Received blockchain is longer than current blockchain')
      replaceChain(receivedBlocks)
    }
  } else {
    console.log('received blockchain is not longer than current blockchain. Do nothing')
  }
}

var replaceChain = (newBlocks) => {
  if (isValidChain(newBlocks) && newBlocks.length > blockchainModule.blockchain.length) {
    console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
    blockchainModule.blockchain = newBlocks
    broadcast(responseLatestMsg())
  } else {
    console.log('Received blockchain invalid')
  }
}

var isValidChain = (blockchainToValidate) => {
  if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(blockchainModule.blockchain[0])) {
    return false
  }
  var tempBlocks = [blockchainToValidate[0]]
  for (var i = 1; i < blockchainToValidate.length; i++) {
    if (blockchainModule.isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
      tempBlocks.push(blockchainToValidate[i])
    } else {
      return false
    }
  }
  return true
}

var initConnection = (ws) => {
  sockets.push(ws)
  initMessageHandler(ws)
  initErrorHandler(ws)
  write(ws, queryChainLengthMsg())
}

var initMessageHandler = (ws) => {
  ws.on('message', (data) => {
    var message = JSON.parse(data)
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

var initErrorHandler = (ws) => {
  var closeConnection = (ws) => {
    console.log('connection failed to peer: ' + ws.url)
    sockets.splice(sockets.indexOf(ws), 1)
  }
  ws.on('close', () => closeConnection(ws))
  ws.on('error', () => closeConnection(ws))
}

var connectToPeers = (newPeers) => {
  newPeers.forEach((peer) => {
    var ws = new WebSocket(peer)
    ws.on('open', () => initConnection(ws))
    ws.on('error', () => {
      console.log('connection failed')
    })
  })
}
