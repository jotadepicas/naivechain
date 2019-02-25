const Block = require('./block.js')
const CryptoJS = require('crypto-js')

var blockchain = [createGenesisBlock()]

function createGenesisBlock () {
  var index = 0
  var previousHash = '0'
  var timestamp = 1465154705
  var data = 'my genesis block!!'

  var hash = calculateHash(index, previousHash, timestamp, data)

  return new Block(index, previousHash, timestamp, data, hash)
}

module.exports.blockchain = blockchain

module.exports.getBlocks = (req, res) => res.send(blockchain)

function getLatestBlock () {
  return blockchain[blockchain.length - 1]
}

module.exports.getLatestBlock = getLatestBlock

function calculateHashForBlock (block) {
  return calculateHash(block.index, block.previousHash, block.timestamp, block.data)
}

function calculateHash (index, previousHash, timestamp, data) {
  return CryptoJS.SHA256(index + previousHash + timestamp + data).toString()
}

module.exports.generateNextBlock = (req, res, next) => {
  var blockData = req.body.data
  var previousBlock = getLatestBlock()
  var nextIndex = previousBlock.index + 1
  var nextTimestamp = new Date().getTime() / 1000
  var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData)
  req.nextBlock = new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash)
  next()
}

module.exports.addBlock = (req, res, next) => {
  var newBlock = req.nextBlock
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockchain.push(newBlock)
    next()
  } else {
    next(new Error('invalid block'))
  }
}

function isValidNewBlock (newBlock, previousBlock) {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log('invalid index')
    return false
  }

  if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash')
    return false
  }

  var newHash = calculateHashForBlock(newBlock)
  if (newHash !== newBlock.hash) {
    console.log(`invalid hash: ${newHash} (${typeof newHash}) !== ${newBlock.hash} (${typeof newBlock.hash})`)
    return false
  }

  return true
}

module.exports.isValidNewBlock = isValidNewBlock

module.exports.isValidChain = (blockchainToValidate) => {
  if (calculateHashForBlock(blockchainToValidate[0]) !== blockchain[0].hash) {
    return false
  }

  var tempBlocks = [blockchainToValidate[0]]

  for (var i = 1; i < blockchainToValidate.length; i++) {
    if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
      tempBlocks.push(blockchainToValidate[i])
    } else {
      return false
    }
  }

  return true
}

module.exports.Block = Block
