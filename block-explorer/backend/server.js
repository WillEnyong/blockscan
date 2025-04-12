const express = require('express');
const { Web3 } = require('web3');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

const app = express();

// Konfigurasi CORS untuk mengizinkan frontend
app.use(cors({
  origin: 'https://redesigned-space-chainsaw-gw94v96rq9qhwwg4-3000.app.github.dev',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Rute default untuk memastikan server berjalan
app.get('/', (req, res) => {
  console.log('Received request for /');
  res.send('Block Explorer API is running. Visit /api-docs for API documentation.');
});

// Inisialisasi Web3
let web3;
try {
  console.log('Initializing Web3 with RPC URL:', process.env.RPC_URL);
  web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

  // Uji koneksi ke RPC saat server mulai
  web3.eth.net.isListening()
    .then(() => {
      console.log('Successfully connected to RPC.');
      web3.eth.getBlockNumber()
        .then(blockNumber => {
          console.log('Latest block number on startup:', blockNumber);
        })
        .catch(error => {
          console.error('Failed to fetch block number on startup:', error.message);
        });
    })
    .catch(error => {
      console.error('Failed to connect to RPC:', error.message);
    });
} catch (error) {
  console.error('Failed to initialize Web3:', error.message);
  process.exit(1);
}

// Endpoint untuk mendapatkan blok terbaru
app.get('/api/latest-blocks', async (req, res) => {
  console.log('Received request for /api/latest-blocks with query:', req.query);
  try {
    if (!web3) {
      throw new Error('Web3 is not initialized. Please check RPC connection.');
    }

    console.log('Checking RPC connection before fetching blocks...');
    await web3.eth.net.isListening();
    console.log('RPC connection is active.');

    console.log('Fetching latest block number...');
    const latestBlockNumber = await web3.eth.getBlockNumber();
    console.log('Latest block number:', latestBlockNumber);

    const blocks = [];
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    console.log(`Fetching ${limit} blocks...`);

    for (let i = 0; i < limit; i++) {
      const blockNumber = Number(latestBlockNumber) - i;
      console.log(`Fetching block ${blockNumber}...`);
      const block = await web3.eth.getBlock(blockNumber, true);
      if (!block) {
        console.warn(`Block ${blockNumber} not found.`);
        continue;
      }
      console.log(`Fetched block ${block.number}`);
      blocks.push({
        number: Number(block.number),
        hash: block.hash,
        timestamp: Number(block.timestamp),
        transactions: block.transactions ? block.transactions.length : 0,
      });
    }

    console.log('Sending response with blocks:', blocks);
    res.json(blocks);
  } catch (error) {
    console.error('Error in /api/latest-blocks:', error.message);
    res.status(500).json({ error: `Failed to fetch latest blocks: ${error.message}` });
  }
});

// Endpoint untuk mendapatkan detail transaksi berdasarkan hash
app.get('/api/transaction/:hash', async (req, res) => {
  console.log(`Received request for /api/transaction/${req.params.hash}`);
  try {
    if (!web3) {
      throw new Error('Web3 is not initialized. Please check RPC connection.');
    }

    console.log('Checking RPC connection before fetching transaction...');
    await web3.eth.net.isListening();
    console.log('RPC connection is active.');

    console.log(`Fetching transaction ${req.params.hash}...`);
    const tx = await web3.eth.getTransaction(req.params.hash);
    if (!tx) {
      console.log(`Transaction ${req.params.hash} not found`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log(`Fetched transaction ${tx.hash}`);
    res.json({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: web3.utils.fromWei(tx.value, 'ether'),
      gas: Number(tx.gas),
      gasPrice: web3.utils.fromWei(tx.gasPrice, 'gwei'),
      blockNumber: Number(tx.blockNumber),
    });
  } catch (error) {
    console.error(`Error in /api/transaction/${req.params.hash}:`, error.message);
    res.status(500).json({ error: `Failed to fetch transaction: ${error.message}` });
  }
});

// Endpoint untuk mendapatkan informasi alamat
app.get('/api/address/:address', async (req, res) => {
  console.log(`Received request for /api/address/${req.params.address}`);
  try {
    if (!web3) {
      throw new Error('Web3 is not initialized. Please check RPC connection.');
    }

    const address = req.params.address;
    if (!web3.utils.isAddress(address)) {
      console.log(`Invalid address: ${address}`);
      return res.status(400).json({ error: 'Invalid address format' });
    }

    console.log('Checking RPC connection before fetching address info...');
    await web3.eth.net.isListening();
    console.log('RPC connection is active.');

    console.log(`Fetching balance for ${address}...`);
    const balance = await web3.eth.getBalance(address);
    console.log(`Fetching transaction count for ${address}...`);
    const transactionCount = await web3.eth.getTransactionCount(address);
    console.log(`Fetched address info for ${address}`);

    res.json({
      address: address,
      balance: web3.utils.fromWei(balance, 'ether'),
      transactionCount: Number(transactionCount),
    });
  } catch (error) {
    console.error(`Error in /api/address/${req.params.address}:`, error.message);
    res.status(500).json({ error: `Failed to fetch address info: ${error.message}` });
  }
});

// Setup Swagger UI untuk dokumentasi API
try {
  const swaggerDocument = YAML.load('./swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger UI setup completed.');
} catch (error) {
  console.error('Failed to setup Swagger UI:', error.message);
}

// Jalankan server di port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});