const Block = require('./block.js')
const CryptoJS = require('crypto-js')

var blockchain = [
  new Block(0, '0', 1465154705, 'my genesis block!!',
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7')
]

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
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log('invalid previoushash')
    return false
  } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock))
    console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash)
    return false
  }
  return true
}

module.exports.isValidNewBlock = isValidNewBlock

module.exports.Block = Block
