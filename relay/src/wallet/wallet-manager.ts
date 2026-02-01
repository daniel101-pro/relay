import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Wallet data structure
 */
export interface WalletData {
  address: string;
  name: string;
  createdAt: Date;
  network: 'ethereum' | 'base';
  isDefault: boolean;
}

export interface WalletBalance {
  address: string;
  eth: string;
  ethUsd: string;
  tokens: TokenBalance[];
  totalUsd: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  contractAddress: string;
}

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive' | 'contract';
}

/**
 * Encrypted wallet storage
 */
interface EncryptedWallet {
  address: string;
  encryptedKey: string;
  iv: string;
  name: string;
  createdAt: string;
  network: string;
  isDefault: boolean;
}

interface WalletStore {
  wallets: EncryptedWallet[];
  version: number;
}

/**
 * Wallet Manager - Handles wallet creation, storage, and operations
 */
export class WalletManager {
  private storePath: string;
  private encryptionKey: string;
  private providers: Map<string, ethers.JsonRpcProvider>;
  private ethPrice: number = 2500; // Default, will be fetched

  constructor(storePath?: string) {
    this.storePath = storePath || path.join(process.cwd(), '.relay', 'wallets.enc');
    this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || this.generateDefaultKey();

    // Initialize providers with public RPCs (no auth required)
    this.providers = new Map();

    // Use public Ethereum RPCs - these don't require API keys
    const ethRpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
    const baseRpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

    this.providers.set('ethereum', new ethers.JsonRpcProvider(ethRpcUrl, 'mainnet', {
      staticNetwork: true
    }));
    this.providers.set('base', new ethers.JsonRpcProvider(baseRpcUrl, 8453, {
      staticNetwork: true
    }));

    // Ensure storage directory exists
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Generate a default encryption key (should use env var in production)
   */
  private generateDefaultKey(): string {
    const machineId = process.env.USER || 'relay';
    return crypto.createHash('sha256').update(`relay-wallet-${machineId}`).digest('hex').slice(0, 32);
  }

  /**
   * Encrypt data
   */
  private encrypt(data: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
  }

  /**
   * Decrypt data
   */
  private decrypt(encrypted: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Load wallet store
   */
  private loadStore(): WalletStore {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading wallet store:', error);
    }
    return { wallets: [], version: 1 };
  }

  /**
   * Save wallet store
   */
  private saveStore(store: WalletStore): void {
    fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2));
  }

  /**
   * Create a new wallet
   */
  async createWallet(name?: string, network: 'ethereum' | 'base' = 'ethereum'): Promise<{
    wallet: WalletData;
    mnemonic: string;
    privateKey: string;
  }> {
    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();
    const walletName = name || `Wallet ${Date.now().toString(36).toUpperCase()}`;

    // Encrypt private key
    const { encrypted, iv } = this.encrypt(wallet.privateKey);

    // Load and update store
    const store = this.loadStore();

    // If first wallet, make it default
    const isDefault = store.wallets.length === 0;

    const encryptedWallet: EncryptedWallet = {
      address: wallet.address,
      encryptedKey: encrypted,
      iv,
      name: walletName,
      createdAt: new Date().toISOString(),
      network,
      isDefault,
    };

    store.wallets.push(encryptedWallet);
    this.saveStore(store);

    return {
      wallet: {
        address: wallet.address,
        name: walletName,
        createdAt: new Date(),
        network,
        isDefault,
      },
      mnemonic: wallet.mnemonic?.phrase || '',
      privateKey: wallet.privateKey,
    };
  }

  /**
   * Import wallet from private key
   */
  async importWallet(
    privateKey: string,
    name?: string,
    network: 'ethereum' | 'base' = 'ethereum'
  ): Promise<WalletData> {
    // Validate and create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    const walletName = name || `Imported ${wallet.address.slice(0, 8)}`;

    // Check if already exists
    const store = this.loadStore();
    const exists = store.wallets.find(w => w.address.toLowerCase() === wallet.address.toLowerCase());
    if (exists) {
      throw new Error('Wallet already exists');
    }

    // Encrypt private key
    const { encrypted, iv } = this.encrypt(privateKey);

    const isDefault = store.wallets.length === 0;

    const encryptedWallet: EncryptedWallet = {
      address: wallet.address,
      encryptedKey: encrypted,
      iv,
      name: walletName,
      createdAt: new Date().toISOString(),
      network,
      isDefault,
    };

    store.wallets.push(encryptedWallet);
    this.saveStore(store);

    return {
      address: wallet.address,
      name: walletName,
      createdAt: new Date(),
      network,
      isDefault,
    };
  }

  /**
   * Import wallet from mnemonic
   */
  async importFromMnemonic(
    mnemonic: string,
    name?: string,
    network: 'ethereum' | 'base' = 'ethereum'
  ): Promise<WalletData> {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return this.importWallet(wallet.privateKey, name, network);
  }

  /**
   * Get all wallets
   */
  getWallets(): WalletData[] {
    const store = this.loadStore();
    return store.wallets.map(w => ({
      address: w.address,
      name: w.name,
      createdAt: new Date(w.createdAt),
      network: w.network as 'ethereum' | 'base',
      isDefault: w.isDefault,
    }));
  }

  /**
   * Get default wallet
   */
  getDefaultWallet(): WalletData | null {
    const wallets = this.getWallets();
    return wallets.find(w => w.isDefault) || wallets[0] || null;
  }

  /**
   * Set default wallet
   */
  setDefaultWallet(address: string): boolean {
    const store = this.loadStore();
    let found = false;

    store.wallets = store.wallets.map(w => {
      if (w.address.toLowerCase() === address.toLowerCase()) {
        found = true;
        return { ...w, isDefault: true };
      }
      return { ...w, isDefault: false };
    });

    if (found) {
      this.saveStore(store);
    }
    return found;
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string, network: 'ethereum' | 'base' = 'ethereum'): Promise<WalletBalance> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for ${network}`);

    try {
      // Get ETH balance
      const balance = await provider.getBalance(address);
      const ethBalance = ethers.formatEther(balance);

      // Fetch ETH price (simplified - in production use proper API)
      await this.fetchEthPrice();
      const ethUsd = (parseFloat(ethBalance) * this.ethPrice).toFixed(2);

      // Get token balances (simplified - just ETH for now)
      const tokens: TokenBalance[] = [];

      return {
        address,
        eth: ethBalance,
        ethUsd: `$${ethUsd}`,
        tokens,
        totalUsd: `$${ethUsd}`,
      };
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      // Return zero balance on error rather than crashing
      return {
        address,
        eth: '0.00',
        ethUsd: '$0.00',
        tokens: [],
        totalUsd: '$0.00',
      };
    }
  }

  /**
   * Get all balances for all wallets
   */
  async getAllBalances(): Promise<Map<string, WalletBalance>> {
    const wallets = this.getWallets();
    const balances = new Map<string, WalletBalance>();

    for (const wallet of wallets) {
      try {
        const balance = await this.getBalance(wallet.address, wallet.network);
        balances.set(wallet.address, balance);
      } catch (error) {
        console.error(`Error getting balance for ${wallet.address}:`, error);
      }
    }

    return balances;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    address: string,
    network: 'ethereum' | 'base' = 'ethereum',
    limit: number = 10
  ): Promise<TransactionHistory[]> {
    // In production, use Etherscan/Basescan API
    const apiKey = network === 'ethereum'
      ? process.env.ETHERSCAN_API_KEY
      : process.env.BASESCAN_API_KEY;

    const baseUrl = network === 'ethereum'
      ? 'https://api.etherscan.io/api'
      : 'https://api.basescan.org/api';

    try {
      const response = await fetch(
        `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`
      );
      const data = await response.json() as { status: string; result: any[] };

      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          status: tx.isError === '0' ? 'success' : 'failed',
          type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        }));
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }

    return [];
  }

  /**
   * Get signer for transactions
   */
  getSigner(address: string, network: 'ethereum' | 'base' = 'ethereum'): ethers.Wallet | null {
    const store = this.loadStore();
    const wallet = store.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());

    if (!wallet) return null;

    const privateKey = this.decrypt(wallet.encryptedKey, wallet.iv);
    const provider = this.providers.get(network);

    if (!provider) return null;

    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    amount: string,
    network: 'ethereum' | 'base' = 'ethereum'
  ): Promise<{ hash: string; status: string }> {
    const signer = this.getSigner(fromAddress, network);
    if (!signer) throw new Error('Wallet not found or cannot sign');

    const tx = await signer.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount),
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      status: receipt?.status === 1 ? 'success' : 'failed',
    };
  }

  /**
   * Fetch ETH price
   */
  private async fetchEthPrice(): Promise<void> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json() as { ethereum?: { usd?: number } };
      if (data.ethereum?.usd) {
        this.ethPrice = data.ethereum.usd;
      }
    } catch {
      // Use default price if API fails
    }
  }

  /**
   * Rename wallet
   */
  renameWallet(address: string, newName: string): boolean {
    const store = this.loadStore();
    const wallet = store.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());

    if (wallet) {
      wallet.name = newName;
      this.saveStore(store);
      return true;
    }
    return false;
  }

  /**
   * Delete wallet
   */
  deleteWallet(address: string): boolean {
    const store = this.loadStore();
    const initialLength = store.wallets.length;
    store.wallets = store.wallets.filter(w => w.address.toLowerCase() !== address.toLowerCase());

    if (store.wallets.length < initialLength) {
      // If deleted wallet was default, set new default
      if (store.wallets.length > 0 && !store.wallets.some(w => w.isDefault)) {
        store.wallets[0].isDefault = true;
      }
      this.saveStore(store);
      return true;
    }
    return false;
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(): Promise<{
    totalValueUsd: string;
    walletCount: number;
    wallets: Array<WalletData & { balance: WalletBalance }>;
  }> {
    const wallets = this.getWallets();
    const walletsWithBalances: Array<WalletData & { balance: WalletBalance }> = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      try {
        const balance = await this.getBalance(wallet.address, wallet.network);
        walletsWithBalances.push({ ...wallet, balance });
        totalValue += parseFloat(balance.totalUsd.replace('$', ''));
      } catch (error) {
        console.error(`Error getting balance for ${wallet.address}:`, error);
      }
    }

    return {
      totalValueUsd: `$${totalValue.toFixed(2)}`,
      walletCount: wallets.length,
      wallets: walletsWithBalances,
    };
  }
}

// Singleton instance
let walletManager: WalletManager | null = null;

export function getWalletManager(): WalletManager {
  if (!walletManager) {
    walletManager = new WalletManager();
  }
  return walletManager;
}
