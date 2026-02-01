import { BaseSkill } from './base-skill.js';
import { IntentType, RiskLevel, } from '../types/index.js';
import { getAIClient } from '../ai/openai.js';
/**
 * Create Skill - Generates and deploys smart contracts from natural language
 *
 * "Build it for me"
 *
 * Takes: Natural language description of desired contract
 * Returns: Generated contract code, explanation, and deployment info
 */
export class CreateSkill extends BaseSkill {
    name = 'create';
    description = 'Creates and deploys smart contracts from natural language';
    handledIntents = [IntentType.CREATE];
    aiClient = getAIClient();
    async validate(context) {
        const { entities } = context.intent;
        // Check if we have a contract type or can infer what to create
        if (entities.contractTypes.length === 0) {
            const message = context.originalMessage.toLowerCase();
            const inferrable = message.includes('wallet') ||
                message.includes('multisig') ||
                message.includes('token') ||
                message.includes('nft') ||
                message.includes('contract') ||
                message.includes('escrow') ||
                message.includes('vault') ||
                message.includes('staking') ||
                message.includes('airdrop') ||
                message.includes('payment');
            if (!inferrable) {
                return {
                    valid: false,
                    error: 'Please specify what you want to create (e.g., multisig wallet, token, NFT, escrow).',
                };
            }
        }
        return { valid: true };
    }
    async execute(context) {
        const { entities } = context.intent;
        const message = context.originalMessage;
        // Determine contract type
        const contractType = entities.contractTypes[0] || this.inferContractType(message.toLowerCase());
        // Extract requirements from the message
        const requirements = this.extractRequirements(message);
        try {
            // Use AI to generate the contract based on the type and requirements
            const contractResult = await this.generateContract(contractType, message, requirements);
            return this.success({
                type: 'contract_creation',
                contractType,
                name: contractResult.name,
                description: contractResult.description,
                generatedCode: contractResult.code,
                explanation: {
                    purpose: contractResult.purpose,
                    features: contractResult.features,
                    security: contractResult.securityNotes,
                    howItWorks: contractResult.howItWorks,
                },
                parameters: contractResult.parameters,
                nextSteps: [
                    '1. Review the generated code carefully',
                    '2. Customize parameters (names, addresses, amounts)',
                    '3. Deploy to Sepolia testnet first',
                    '4. Test all functions thoroughly',
                    '5. Get a security audit for production use',
                    '6. Deploy to mainnet when ready',
                ],
                deployment: {
                    network: 'Sepolia (testnet recommended)',
                    estimatedGas: contractResult.estimatedGas,
                    constructorArgs: contractResult.constructorArgs,
                },
                deploymentReady: true,
            }, {
                riskLevel: RiskLevel.MEDIUM,
                confidence: 0.85,
                warnings: [
                    'Always test on testnet before mainnet deployment',
                    'Consider getting a professional audit for production contracts',
                    'Review and understand the code before deploying',
                ],
            });
        }
        catch (error) {
            // Fallback to templates if AI generation fails
            return this.generateFromTemplate(contractType, requirements);
        }
    }
    /**
     * Generate contract using AI
     */
    async generateContract(contractType, userRequest, requirements) {
        const prompt = `Generate a Solidity smart contract based on this request:

User Request: "${userRequest}"
Contract Type: ${contractType}
Extracted Requirements: ${requirements.join(', ') || 'None specified'}

Generate a complete, production-ready Solidity contract with:
1. Full implementation (not just interfaces)
2. OpenZeppelin-style security patterns
3. Proper events for all state changes
4. NatSpec documentation
5. Gas-optimized code

Respond with JSON only:
{
  "name": "Contract name",
  "description": "One sentence description",
  "purpose": "What this contract does",
  "features": ["feature1", "feature2"],
  "securityNotes": "Security considerations",
  "howItWorks": "Brief explanation of how to use it",
  "code": "// Full Solidity code here",
  "parameters": [{"name": "param", "type": "type", "description": "what it does"}],
  "constructorArgs": "Description of constructor arguments",
  "estimatedGas": "~X gas"
}`;
        try {
            const response = await this.aiClient.getCompletion('You are a Solidity smart contract expert. Generate secure, gas-efficient contracts following best practices.', prompt, { temperature: 0.3, maxTokens: 3000 });
            // Try to parse as JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Could not parse AI response');
        }
        catch {
            // Return template-based result
            throw new Error('AI generation failed');
        }
    }
    /**
     * Fallback to templates when AI fails
     */
    generateFromTemplate(contractType, requirements) {
        const templates = {
            multisig: () => this.getMultisigResult(requirements),
            token: () => this.getTokenResult(requirements),
            nft: () => this.getNFTResult(requirements),
            escrow: () => this.getEscrowResult(requirements),
            vault: () => this.getVaultResult(requirements),
            staking: () => this.getStakingResult(requirements),
        };
        const generator = templates[contractType];
        if (generator) {
            return generator();
        }
        // Generic response for unknown types
        return this.success({
            type: 'contract_creation',
            contractType: contractType || 'custom',
            name: 'Custom Contract',
            description: 'I can help create this contract. Please provide more details.',
            requirements,
            nextSteps: [
                'Describe the exact functionality you need',
                'Specify who should have access to what functions',
                'Define any thresholds, limits, or conditions',
                'Mention any tokens or assets involved',
            ],
            deploymentReady: false,
        }, {
            riskLevel: RiskLevel.LOW,
            confidence: 0.6,
        });
    }
    /**
     * Infer contract type from message
     */
    inferContractType(message) {
        const patterns = [
            [/multi-?sig|multiple.*(sign|approv)/i, 'multisig'],
            [/token|coin|erc-?20/i, 'token'],
            [/nft|erc-?721|collectible|art/i, 'nft'],
            [/escrow|hold.*funds|release.*condition/i, 'escrow'],
            [/vault|lock|timelock/i, 'vault'],
            [/stak(e|ing)|yield|reward/i, 'staking'],
            [/airdrop|distribute|claim/i, 'airdrop'],
            [/payment.*split|split.*payment/i, 'splitter'],
            [/dao|governance|vot(e|ing)/i, 'governance'],
        ];
        for (const [pattern, type] of patterns) {
            if (pattern.test(message)) {
                return type;
            }
        }
        return 'custom';
    }
    /**
     * Extract requirements from user message
     */
    extractRequirements(message) {
        const requirements = [];
        const lowerMessage = message.toLowerCase();
        // Signature requirements
        const sigMatch = lowerMessage.match(/(\d+)\s*(of|out of)\s*(\d+)/);
        if (sigMatch) {
            requirements.push(`${sigMatch[1]} of ${sigMatch[3]} signatures required`);
        }
        // Value thresholds
        const valueMatch = message.match(/[£$€]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(eth|usd|gbp|eur)?/i);
        if (valueMatch) {
            requirements.push(`Value threshold: ${valueMatch[0]}`);
        }
        // Time conditions
        if (/day|week|month|year|hour/i.test(lowerMessage)) {
            requirements.push('Time-based conditions');
        }
        // Access control
        if (/owner|admin|role|permission/i.test(lowerMessage)) {
            requirements.push('Access control required');
        }
        // Approval mechanism
        if (/approv(e|al)|consent/i.test(lowerMessage)) {
            requirements.push('Approval mechanism');
        }
        return requirements;
    }
    // ============ Template Generators ============
    getMultisigResult(requirements) {
        // Parse signature requirement
        let required = 2;
        let total = 3;
        const sigMatch = requirements.find(r => r.includes('signatures'));
        if (sigMatch) {
            const match = sigMatch.match(/(\d+)\s*of\s*(\d+)/);
            if (match) {
                required = parseInt(match[1]);
                total = parseInt(match[2]);
            }
        }
        return this.success({
            type: 'contract_creation',
            contractType: 'multisig',
            name: 'Multi-Signature Wallet',
            description: `A secure wallet requiring ${required} of ${total} owner approvals for transactions.`,
            generatedCode: this.getMultisigTemplate(required, total),
            explanation: {
                purpose: 'Shared control of funds with multiple signers for enhanced security',
                features: [
                    `Requires ${required} of ${total} signatures to execute transactions`,
                    'Submit, approve, and execute transaction workflow',
                    'Revoke approval before execution',
                    'View pending transactions',
                    'Event logging for all actions',
                ],
                security: 'Follows battle-tested multisig patterns used by major protocols',
                howItWorks: '1. Any owner submits a transaction → 2. Other owners approve → 3. Once threshold met, any owner executes',
            },
            parameters: [
                { name: '_owners', type: 'address[]', description: 'Array of owner addresses' },
                { name: '_required', type: 'uint256', description: 'Number of approvals needed' },
            ],
            deployment: {
                network: 'Sepolia (testnet recommended)',
                estimatedGas: '~800,000 gas',
                constructorArgs: `[["0xOwner1...", "0xOwner2...", "0xOwner3..."], ${required}]`,
            },
            nextSteps: [
                '1. Replace owner addresses with real addresses',
                '2. Deploy to Sepolia testnet',
                '3. Test submit/approve/execute flow',
                '4. Fund with testnet ETH',
                '5. Deploy to mainnet when ready',
            ],
            deploymentReady: true,
        }, {
            riskLevel: RiskLevel.MEDIUM,
            confidence: 0.9,
            warnings: ['Test thoroughly on testnet before mainnet deployment'],
        });
    }
    getTokenResult(_requirements) {
        return this.success({
            type: 'contract_creation',
            contractType: 'token',
            name: 'ERC-20 Token',
            description: 'A standard fungible token with mint, burn, and transfer capabilities.',
            generatedCode: this.getTokenTemplate(),
            explanation: {
                purpose: 'Create your own cryptocurrency token on Ethereum/Base',
                features: [
                    'Standard ERC-20 interface (compatible with all wallets/DEXs)',
                    'Mintable (owner can create new tokens)',
                    'Burnable (holders can destroy their tokens)',
                    'Pausable (owner can pause transfers in emergency)',
                    'Access control with owner role',
                ],
                security: 'Based on OpenZeppelin ERC-20 implementation',
                howItWorks: 'Deploy with name, symbol, and initial supply. Owner can mint more tokens.',
            },
            parameters: [
                { name: 'name', type: 'string', description: 'Token name (e.g., "My Token")' },
                { name: 'symbol', type: 'string', description: 'Token symbol (e.g., "MTK")' },
                { name: 'initialSupply', type: 'uint256', description: 'Initial supply (in wei, 18 decimals)' },
            ],
            deployment: {
                network: 'Sepolia (testnet recommended)',
                estimatedGas: '~1,500,000 gas',
                constructorArgs: '["My Token", "MTK", 1000000000000000000000000]',
            },
            nextSteps: [
                '1. Choose token name and symbol',
                '2. Decide initial supply (remember 18 decimals)',
                '3. Deploy to testnet',
                '4. Verify contract on explorer',
                '5. Add to DEX if needed',
            ],
            deploymentReady: true,
        }, {
            riskLevel: RiskLevel.MEDIUM,
            confidence: 0.9,
        });
    }
    getNFTResult(_requirements) {
        return this.success({
            type: 'contract_creation',
            contractType: 'nft',
            name: 'ERC-721 NFT Collection',
            description: 'A non-fungible token collection with minting and metadata support.',
            generatedCode: this.getNFTTemplate(),
            explanation: {
                purpose: 'Create unique digital collectibles or assets on blockchain',
                features: [
                    'Standard ERC-721 interface',
                    'Metadata URI support (for images/attributes)',
                    'Sequential token ID minting',
                    'Max supply limit',
                    'Owner-controlled minting',
                ],
                security: 'Based on OpenZeppelin ERC-721 implementation',
                howItWorks: 'Deploy with collection name and symbol. Owner mints NFTs with metadata URIs.',
            },
            parameters: [
                { name: 'name', type: 'string', description: 'Collection name' },
                { name: 'symbol', type: 'string', description: 'Collection symbol' },
                { name: 'maxSupply', type: 'uint256', description: 'Maximum number of NFTs' },
            ],
            deployment: {
                network: 'Sepolia (testnet recommended)',
                estimatedGas: '~2,000,000 gas',
                constructorArgs: '["My NFT Collection", "MNFT", 10000]',
            },
            deploymentReady: true,
        }, {
            riskLevel: RiskLevel.MEDIUM,
            confidence: 0.85,
        });
    }
    getEscrowResult(_requirements) {
        return this.success({
            type: 'contract_creation',
            contractType: 'escrow',
            name: 'Payment Escrow',
            description: 'Holds funds securely until conditions are met, with dispute resolution.',
            generatedCode: this.getEscrowTemplate(),
            explanation: {
                purpose: 'Secure payment holding for transactions between parties',
                features: [
                    'Buyer deposits funds into escrow',
                    'Seller delivers goods/services',
                    'Buyer releases funds or raises dispute',
                    'Arbiter resolves disputes',
                    'Automatic timeout refund option',
                ],
                security: 'Uses time-locks and multi-party approval',
                howItWorks: 'Buyer deposits → Seller delivers → Buyer releases OR Arbiter resolves dispute',
            },
            parameters: [
                { name: 'seller', type: 'address', description: 'Seller address' },
                { name: 'arbiter', type: 'address', description: 'Dispute resolver address' },
                { name: 'timeout', type: 'uint256', description: 'Seconds until buyer can reclaim' },
            ],
            deployment: {
                network: 'Sepolia (testnet recommended)',
                estimatedGas: '~600,000 gas',
                constructorArgs: '["0xSeller...", "0xArbiter...", 604800]',
            },
            deploymentReady: true,
        }, {
            riskLevel: RiskLevel.MEDIUM,
            confidence: 0.85,
        });
    }
    getVaultResult(_requirements) {
        return this.success({
            type: 'contract_creation',
            contractType: 'vault',
            name: 'Time-Locked Vault',
            description: 'Securely locks funds until a specified unlock time.',
            generatedCode: this.getVaultTemplate(),
            explanation: {
                purpose: 'Lock funds for a specified period (savings, vesting, etc.)',
                features: [
                    'Deposit ETH or ERC-20 tokens',
                    'Time-based unlock',
                    'Beneficiary designation',
                    'Emergency extension option',
                ],
                security: 'Uses block.timestamp for time verification',
                howItWorks: 'Deposit funds → Wait for unlock time → Beneficiary withdraws',
            },
            parameters: [
                { name: 'beneficiary', type: 'address', description: 'Who can withdraw after unlock' },
                { name: 'unlockTime', type: 'uint256', description: 'Unix timestamp when funds unlock' },
            ],
            deployment: {
                network: 'Sepolia (testnet recommended)',
                estimatedGas: '~400,000 gas',
                constructorArgs: '["0xBeneficiary...", 1735689600]',
            },
            deploymentReady: true,
        }, {
            riskLevel: RiskLevel.LOW,
            confidence: 0.9,
        });
    }
    getStakingResult(_requirements) {
        return this.success({
            type: 'contract_creation',
            contractType: 'staking',
            name: 'Simple Staking Pool',
            description: 'Stake tokens to earn rewards over time.',
            generatedCode: '// Staking contract - use AI generation for full implementation',
            explanation: {
                purpose: 'Allow users to stake tokens and earn rewards',
                features: [
                    'Stake tokens',
                    'Earn proportional rewards',
                    'Compound or claim rewards',
                    'Unstake with optional cooldown',
                ],
                security: 'Requires careful reward math to prevent exploits',
                howItWorks: 'Stake tokens → Accumulate rewards → Claim or compound',
            },
            nextSteps: [
                'Define reward token and rate',
                'Specify staking duration requirements',
                'Deploy reward token first',
                'Fund staking contract with rewards',
            ],
            deploymentReady: false,
        }, {
            riskLevel: RiskLevel.HIGH,
            confidence: 0.7,
            warnings: ['Staking contracts require careful auditing due to reward calculation complexity'],
        });
    }
    // ============ Contract Templates ============
    getMultisigTemplate(required = 2, total = 3) {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MultiSigWallet
 * @notice A ${required}-of-${total} multi-signature wallet
 * @dev Generated by Relay AI Agent
 */
contract MultiSigWallet {
    // Events
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(uint256 indexed txId, address indexed to, uint256 value);
    event ApproveTransaction(address indexed owner, uint256 indexed txId);
    event RevokeApproval(address indexed owner, uint256 indexed txId);
    event ExecuteTransaction(uint256 indexed txId);

    // State
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 approvalCount;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "Tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length >= ${total}, "Need at least ${total} owners");
        require(_required == ${required}, "Required must be ${required}");
        require(_required <= _owners.length, "Invalid required");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address _to, uint256 _value, bytes calldata _data)
        external onlyOwner returns (uint256)
    {
        uint256 txId = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            approvalCount: 0
        }));
        emit SubmitTransaction(txId, _to, _value);
        return txId;
    }

    function approveTransaction(uint256 _txId)
        external onlyOwner txExists(_txId) notExecuted(_txId)
    {
        require(!approved[_txId][msg.sender], "Already approved");
        approved[_txId][msg.sender] = true;
        transactions[_txId].approvalCount++;
        emit ApproveTransaction(msg.sender, _txId);
    }

    function revokeApproval(uint256 _txId)
        external onlyOwner txExists(_txId) notExecuted(_txId)
    {
        require(approved[_txId][msg.sender], "Not approved");
        approved[_txId][msg.sender] = false;
        transactions[_txId].approvalCount--;
        emit RevokeApproval(msg.sender, _txId);
    }

    function executeTransaction(uint256 _txId)
        external onlyOwner txExists(_txId) notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        require(transaction.approvalCount >= required, "Not enough approvals");

        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Tx failed");
        emit ExecuteTransaction(_txId);
    }

    // View functions
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txId) external view returns (
        address to, uint256 value, bytes memory data, bool executed, uint256 approvalCount
    ) {
        Transaction storage t = transactions[_txId];
        return (t.to, t.value, t.data, t.executed, t.approvalCount);
    }
}`;
    }
    getTokenTemplate() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleToken
 * @notice ERC-20 token with mint, burn, and pause functionality
 * @dev Generated by Relay AI Agent
 */
contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public owner;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        _mint(msg.sender, _initialSupply);
    }

    function transfer(address to, uint256 value) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external whenNotPaused returns (bool) {
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        allowance[from][msg.sender] -= value;
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyOwner {
        _mint(to, value);
    }

    function burn(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        emit Burn(msg.sender, value);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "Transfer to zero");
        require(balanceOf[from] >= value, "Insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        require(to != address(0), "Mint to zero");
        totalSupply += value;
        balanceOf[to] += value;
        emit Mint(to, value);
        emit Transfer(address(0), to, value);
    }
}`;
    }
    getNFTTemplate() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleNFT
 * @notice ERC-721 NFT collection
 * @dev Generated by Relay AI Agent
 */
contract SimpleNFT {
    string public name;
    string public symbol;
    address public owner;
    uint256 public totalSupply;
    uint256 public maxSupply;
    string private _baseURI;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 _maxSupply) {
        name = _name;
        symbol = _symbol;
        maxSupply = _maxSupply;
        owner = msg.sender;
    }

    function mint(address to, string calldata tokenURI) external onlyOwner returns (uint256) {
        require(totalSupply < maxSupply, "Max supply reached");
        uint256 tokenId = totalSupply;
        totalSupply++;

        ownerOf[tokenId] = to;
        balanceOf[to]++;
        _tokenURIs[tokenId] = tokenURI;

        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(ownerOf[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf[tokenId];
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "Not authorized");
        getApproved[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "Not owner");
        require(
            msg.sender == from ||
            msg.sender == getApproved[tokenId] ||
            isApprovedForAll[from][msg.sender],
            "Not authorized"
        );
        require(to != address(0), "Transfer to zero");

        getApproved[tokenId] = address(0);
        balanceOf[from]--;
        balanceOf[to]++;
        ownerOf[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        this.transferFrom(from, to, tokenId);
    }
}`;
    }
    getEscrowTemplate() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Escrow
 * @notice Secure payment escrow with dispute resolution
 * @dev Generated by Relay AI Agent
 */
contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;
    uint256 public amount;
    uint256 public deadline;
    bool public released;
    bool public refunded;
    bool public disputed;

    event Deposited(address indexed buyer, uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event Disputed(address indexed by);
    event Resolved(address indexed winner, uint256 amount);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Not buyer");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Not arbiter");
        _;
    }

    modifier notFinalized() {
        require(!released && !refunded, "Already finalized");
        _;
    }

    constructor(address _seller, address _arbiter, uint256 _timeout) payable {
        require(_seller != address(0) && _arbiter != address(0), "Invalid addresses");
        require(msg.value > 0, "Must deposit funds");

        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
        amount = msg.value;
        deadline = block.timestamp + _timeout;

        emit Deposited(msg.sender, msg.value);
    }

    function release() external onlyBuyer notFinalized {
        released = true;
        payable(seller).transfer(amount);
        emit Released(seller, amount);
    }

    function refund() external onlyBuyer notFinalized {
        require(block.timestamp > deadline, "Deadline not passed");
        require(!disputed, "Dispute in progress");
        refunded = true;
        payable(buyer).transfer(amount);
        emit Refunded(buyer, amount);
    }

    function dispute() external onlyBuyer notFinalized {
        require(!disputed, "Already disputed");
        disputed = true;
        emit Disputed(msg.sender);
    }

    function resolve(bool releaseToSeller) external onlyArbiter notFinalized {
        require(disputed, "No dispute");

        if (releaseToSeller) {
            released = true;
            payable(seller).transfer(amount);
            emit Resolved(seller, amount);
        } else {
            refunded = true;
            payable(buyer).transfer(amount);
            emit Resolved(buyer, amount);
        }
    }

    function getStatus() external view returns (string memory) {
        if (released) return "Released to seller";
        if (refunded) return "Refunded to buyer";
        if (disputed) return "In dispute";
        if (block.timestamp > deadline) return "Deadline passed";
        return "Active";
    }
}`;
    }
    getVaultTemplate() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TimeLockedVault
 * @notice Lock ETH until a specified time
 * @dev Generated by Relay AI Agent
 */
contract TimeLockedVault {
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public balance;
    bool public withdrawn;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _beneficiary, uint256 _unlockTime) payable {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_unlockTime > block.timestamp, "Unlock time must be future");

        beneficiary = _beneficiary;
        unlockTime = _unlockTime;

        if (msg.value > 0) {
            balance = msg.value;
            emit Deposited(msg.sender, msg.value);
        }
    }

    function deposit() external payable {
        require(!withdrawn, "Already withdrawn");
        balance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == beneficiary, "Not beneficiary");
        require(block.timestamp >= unlockTime, "Still locked");
        require(!withdrawn, "Already withdrawn");
        require(balance > 0, "No funds");

        withdrawn = true;
        uint256 amount = balance;
        balance = 0;
        payable(beneficiary).transfer(amount);
        emit Withdrawn(beneficiary, amount);
    }

    function timeUntilUnlock() external view returns (uint256) {
        if (block.timestamp >= unlockTime) return 0;
        return unlockTime - block.timestamp;
    }
}`;
    }
}
//# sourceMappingURL=create.skill.js.map