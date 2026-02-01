import { z } from 'zod';

/**
 * Supported networks
 */
export const NetworkId = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  ETHEREUM_SEPOLIA: 11155111,
  BASE_MAINNET: 8453,
  BASE_GOERLI: 84531,
  BASE_SEPOLIA: 84532,
} as const;

export type NetworkId = (typeof NetworkId)[keyof typeof NetworkId];

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

/**
 * Transaction data from explorer
 */
export const TransactionDataSchema = z.object({
  hash: z.string(),
  blockNumber: z.number(),
  timestamp: z.number(),
  from: z.string(),
  to: z.string().nullable(),
  value: z.string(),
  gasUsed: z.string(),
  gasPrice: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  input: z.string().optional(),
  contractAddress: z.string().nullable().optional(),
  functionName: z.string().optional(),
});

export type TransactionData = z.infer<typeof TransactionDataSchema>;

/**
 * Address info from explorer
 */
export const AddressInfoSchema = z.object({
  address: z.string(),
  balance: z.string(),
  transactionCount: z.number(),
  isContract: z.boolean(),
  contractName: z.string().optional(),
  contractVerified: z.boolean().optional(),
  tokens: z.array(z.object({
    name: z.string(),
    symbol: z.string(),
    balance: z.string(),
    decimals: z.number(),
  })).optional(),
});

export type AddressInfo = z.infer<typeof AddressInfoSchema>;

/**
 * Contract info
 */
export const ContractInfoSchema = z.object({
  address: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  verified: z.boolean(),
  sourceCode: z.string().optional(),
  abi: z.array(z.unknown()).optional(),
  creationTxHash: z.string().optional(),
  creationTimestamp: z.number().optional(),
});

export type ContractInfo = z.infer<typeof ContractInfoSchema>;
