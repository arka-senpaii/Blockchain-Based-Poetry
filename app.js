// Replace with your deployed contract address

const contractAddress = "0xCA879360AD8c8D3E90bD8a5De40155Ba3C6B72Aa";

const contractABI =[
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "PoemWritten",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "content",
				"type": "string"
			}
		],
		"name": "writePoem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorPoemCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getPoem",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalPoems",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "poems",
		"outputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "content",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
let provider;
let signer;
let contract;

class WalletConnection {
    constructor() {
        this.isConnected = false;
        this.initialize();
    }

    async initialize() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.handleDisconnect();
                } else {
                    this.handleConnect(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.handleConnect(accounts[0]);
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                await this.handleConnect(accounts[0]);
                
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                
                if (await this.verifyContract()) {
                    contract = new ethers.Contract(contractAddress, contractABI, signer);
                    const network = await provider.getNetwork();
                    this.updateNetworkInfo(network);
                    loadPoems();
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error connecting wallet:', error);
                this.handleError(error);
                return false;
            }
        } else {
            this.showMetaMaskError();
            return false;
        }
    }

    async verifyContract() {
        try {
            const code = await provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error('Contract not deployed at this address');
            }
            return true;
        } catch (error) {
            console.error('Contract verification failed:', error);
            alert('Error: Contract not found at the specified address');
            return false;
        }
    }

    async handleConnect(account) {
        this.isConnected = true;
        this.updateUI(account);
    }

    handleDisconnect() {
        this.isConnected = false;
        this.updateUIDisconnected();
    }

    updateUI(account) {
        const connectButton = document.getElementById('connect-wallet');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.getElementById('wallet-address');
        
        connectButton.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        walletAddress.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
    }

    updateUIDisconnected() {
        const connectButton = document.getElementById('connect-wallet');
        const walletInfo = document.getElementById('wallet-info');
        
        connectButton.classList.remove('hidden');
        walletInfo.classList.add('hidden');
    }

    async updateNetworkInfo(network) {
        const networkName = document.getElementById('network-name');
        const networkMap = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet'
        };
        networkName.textContent = networkMap[network.chainId] || `Chain ID: ${network.chainId}`;
    }

    handleError(error) {
        if (error.code === 4001) {
            alert('Please connect your wallet to continue.');
        } else if (error.code === -32002) {
            alert('Please check MetaMask. A connection request is pending.');
        } else {
            alert('An error occurred. Please try again.');
        }
    }

    showMetaMaskError() {
        alert('Please install MetaMask to use this application.\nVisit: https://metamask.io/');
    }
}

const walletConnection = new WalletConnection();

async function submitPoem(event) {
    event.preventDefault();
    
    if (!walletConnection.isConnected) {
        alert('Please connect your wallet first');
        return;
    }

    const titleInput = document.getElementById('poem-title');
    const contentInput = document.getElementById('poem-content');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    const loading = document.getElementById('loading');
    try {
        loading.classList.remove('hidden');
        
        if (!contract) {
            throw new Error('Contract not initialized');
        }

        const network = await provider.getNetwork();
        console.log('Current network:', network);

        const gasEstimate = await contract.estimateGas.writePoem(title, content);
        console.log('Gas estimate:', gasEstimate.toString());

        const tx = await contract.writePoem(title, content, {
            gasLimit: gasEstimate.mul(120).div(100)
        });

        console.log('Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        document.getElementById('poem-form').reset();
        await loadPoems();

        alert('Poem submitted successfully!');
    } catch (error) {
        console.error('Detailed error:', error);
        
        if (error.code === 'ACTION_REJECTED') {
            alert('Transaction was rejected by user');
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            alert('Insufficient funds to complete transaction');
        } else if (error.message.includes('user rejected')) {
            alert('Transaction was rejected in wallet');
        } else {
            alert(`Error: ${error.message || 'Unknown error occurred'}`);
        }
    } finally {
        loading.classList.add('hidden');
    }
}

async function loadPoems() {
    if (!walletConnection.isConnected) return;

    try {
        const totalPoems = await contract.getTotalPoems();
        const poemsContainer = document.getElementById('poems-container');
        poemsContainer.innerHTML = '';
        
        for (let i = totalPoems - 1; i >= 0; i--) {
            const [title, content, author, timestamp] = await contract.getPoem(i);
            const date = new Date(timestamp * 1000);
            
            const poemElement = document.createElement('div');
            poemElement.className = 'poem-card';
            poemElement.innerHTML = `
                <h3 class="poem-title">${title}</h3>
                <p class="poem-content">${content}</p>
                <div class="poem-meta">
                    <span>By: ${author.substring(0, 6)}...${author.substring(38)}</span>
                    <span>Posted: ${date.toLocaleDateString()}</span>
                </div>
            `;
            poemsContainer.appendChild(poemElement);
        }
    } catch (error) {
        console.error('Error loading poems:', error);
    }
}

document.getElementById('connect-wallet').addEventListener('click', () => {
    walletConnection.connectWallet();
});

document.getElementById('poem-form').addEventListener('submit', submitPoem);

window.addEventListener('load', () => {
    if (!window.ethereum) {
        walletConnection.showMetaMaskError();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const profileAddress = document.querySelector('.profile-address');
    const profileUsername = document.querySelector('.profile-username');
    const profileName = document.querySelector('.profile-name');
    
    // Function to update profile information
    async function updateProfileInfo() {
        if (window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const userAddress = accounts[0];
                
                // Update profile information
                profileAddress.textContent = `Address: ${userAddress}`;
                profileUsername.textContent = `Username: ${shortenAddress(userAddress)}`;
                profileName.textContent = shortenAddress(userAddress);
                
            } catch (error) {
                console.error('Error accessing wallet:', error);
            }
        }
    }
    
    // Helper function to shorten address
    function shortenAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    // Update profile when wallet is connected
    document.getElementById('connect-wallet').addEventListener('click', async () => {
        await updateProfileInfo();
    });
    
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
            await updateProfileInfo();
        });
    }
});
