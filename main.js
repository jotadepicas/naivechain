'use strict'
const httpPort = process.env.httpPort || 3001
const p2pPort = process.env.p2pPort || 6001
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : []

const blockchain = require('./src/blockchain')
const p2p = require('./src/p2p')

const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

app.get('/blocks', blockchain.getBlocks)

app.post('/mineBlock',
  blockchain.generateNextBlock,
  blockchain.addBlock,
  p2p.broadcastLatestMsg,
  (req, res) => {
    console.log('block added: ' + JSON.stringify(req.nextBlock))
    res.send()
  }
)

app.get('/peers', p2p.getPeers)

app.post('/addPeer', p2p.addPeer)

app.listen(httpPort,
  () => {
    console.log(`Initial peers: ${initialPeers}`)
    p2p.initP2PServer(p2pPort, initialPeers)
    console.log('Listening http on port: ' + httpPort)
  }
)
