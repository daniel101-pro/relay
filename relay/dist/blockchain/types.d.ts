import { z } from 'zod';
/**
 * Supported networks
 */
export declare const NetworkId: {
    readonly ETHEREUM_MAINNET: 1;
    readonly ETHEREUM_GOERLI: 5;
    readonly ETHEREUM_SEPOLIA: 11155111;
    readonly BASE_MAINNET: 8453;
    readonly BASE_GOERLI: 84531;
    readonly BASE_SEPOLIA: 84532;
};
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
export declare const TransactionDataSchema: z.ZodObject<{
    hash: z.ZodString;
    blockNumber: z.ZodNumber;
    timestamp: z.ZodNumber;
    from: z.ZodString;
    to: z.ZodNullable<z.ZodString>;
    value: z.ZodString;
    gasUsed: z.ZodString;
    gasPrice: z.ZodString;
    status: z.ZodEnum<{
        success: "success";
        failed: "failed";
        pending: "pending";
    }>;
    input: z.ZodOptional<z.ZodString>;
    contractAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    functionName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TransactionData = z.infer<typeof TransactionDataSchema>;
/**
 * Address info from explorer
 */
export declare const AddressInfoSchema: z.ZodObject<{
    address: z.ZodString;
    balance: z.ZodString;
    transactionCount: z.ZodNumber;
    isContract: z.ZodBoolean;
    contractName: z.ZodOptional<z.ZodString>;
    contractVerified: z.ZodOptional<z.ZodBoolean>;
    tokens: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        symbol: z.ZodString;
        balance: z.ZodString;
        decimals: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type AddressInfo = z.infer<typeof AddressInfoSchema>;
/**
 * Contract info
 */
export declare const ContractInfoSchema: z.ZodObject<{
    address: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    symbol: z.ZodOptional<z.ZodString>;
    verified: z.ZodBoolean;
    sourceCode: z.ZodOptional<z.ZodString>;
    abi: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    creationTxHash: z.ZodOptional<z.ZodString>;
    creationTimestamp: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type ContractInfo = z.infer<typeof ContractInfoSchema>;
//# sourceMappingURL=types.d.ts.map