import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [blocks, setBlocks] = useState([]);
  const [address, setAddress] = useState('');
  const [addressInfo, setAddressInfo] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [txInfo, setTxInfo] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'https://redesigned-space-chainsaw-gw94v96rq9qhwwg4-5000.app.github.dev';

  useEffect(() => {
    console.log('Fetching latest blocks from:', `${API_BASE_URL}/api/latest-blocks?limit=10`);
    axios.get(`${API_BASE_URL}/api/latest-blocks?limit=10`)
      .then(response => {
        console.log('Successfully fetched blocks:', response.data);
        setBlocks(response.data);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching blocks:', error);
        const errorMessage = error.response?.data?.error || error.message;
        setError(`Failed to fetch latest blocks: ${errorMessage}`);
      });
  }, []);

  const handleAddressSearch = () => {
    console.log('Fetching address info for:', address);
    axios.get(`${API_BASE_URL}/api/address/${address}`)
      .then(response => {
        console.log('Successfully fetched address info:', response.data);
        setAddressInfo(response.data);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        const errorMessage = error.response?.data?.error || error.message;
        setError(`Failed to fetch address info: ${errorMessage}`);
      });
  };

  const handleTxSearch = () => {
    console.log('Fetching transaction info for:', txHash);
    axios.get(`${API_BASE_URL}/api/transaction/${txHash}`)
      .then(response => {
        console.log('Successfully fetched transaction info:', response.data);
        setTxInfo(response.data);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching transaction:', error);
        const errorMessage = error.response?.data?.error || error.message;
        setError(`Failed to fetch transaction info: ${errorMessage}`);
      });
  };

  return (
    <div className="App">
      <h1>Block Explorer</h1>

      {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}

      <section>
        <h2>Latest Blocks</h2>
        <table>
          <thead>
            <tr>
              <th>Block Number</th>
              <th>Hash</th>
              <th>Timestamp</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(block => (
              <tr key={block.number}>
                <td>{block.number}</td>
                <td>{block.hash.slice(0, 10)}...</td>
                <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
                <td>{block.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Search Address</h2>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter address (e.g., 0x123...)"
        />
        <button onClick={handleAddressSearch}>Search</button>
        {addressInfo && (
          <div>
            <p>Address: {addressInfo.address}</p>
            <p>Balance: {addressInfo.balance} A0G</p>
            <p>Transaction Count: {addressInfo.transactionCount}</p>
          </div>
        )}
      </section>

      <section>
        <h2>Search Transaction</h2>
        <input
          type="text"
          value={txHash}
          onChange={e => setTxHash(e.target.value)}
          placeholder="Enter transaction hash (e.g., 0x123...)"
        />
        <button onClick={handleTxSearch}>Search</button>
        {txInfo && (
          <div>
            <p>Hash: {txInfo.hash}</p>
            <p>From: {txInfo.from}</p>
            <p>To: {txInfo.to}</p>
            <p>Value: {txInfo.value} A0G</p>
            <p>Gas: {txInfo.gas}</p>
            <p>Gas Price: {txInfo.gasPrice} Gwei</p>
            <p>Block Number: {txInfo.blockNumber}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;