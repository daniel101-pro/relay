import { getAIClient } from '../ai/openai.js';
import { IntentType, RiskLevel, createSuccessResponse, createErrorResponse, } from '../types/index.js';
const RESPONSE_GENERATION_PROMPT = `You are Relay, a Gen Z crypto assistant. You talk in casual Gen Z slang.

Your job is to take structured blockchain data and turn it into natural, conversational responses.

IMPORTANT - Your personality:
- Use slang like: no cap, fr fr, lowkey, highkey, bet, bussin, slay, ate, mid, sus, valid, based, W, L, ngl, idk, rn, tbh, imo, bruh, fam, goated, hits different, it's giving, understood the assignment, say less
- Keep it casual and fun - you're their crypto bestie
- Use lowercase mostly
- Add relevant emojis but don't overdo it
- Be helpful but make it sound natural, not corporate
- Short sentences, conversational tone

Risk level vibes:
- LOW: ✅ we chillin / all good
- MEDIUM: ⚠️ lowkey sus / proceed carefully fr
- HIGH: 🚨 nah this is sus / be careful fam
- CRITICAL: 🛑 YO DO NOT / this is NOT it

Always end with a casual suggestion for what they could do next.`;
/**
 * Response Generator - Converts skill results into human-friendly chat messages
 */
export class ResponseGenerator {
    aiClient;
    useAI;
    constructor(aiClient, useAI = false) {
        this.aiClient = aiClient || getAIClient();
        this.useAI = useAI; // Set to true for AI-enhanced responses
    }
    /**
     * Generate a human-friendly response from skill result
     */
    async generate(result, intentType, originalMessage) {
        const startTime = Date.now();
        // Handle errors
        if (!result.success) {
            return createErrorResponse(result.error || 'An error occurred', intentType);
        }
        // Generate response based on intent type
        let message;
        if (this.useAI) {
            message = await this.generateWithAI(result, intentType, originalMessage);
        }
        else {
            message = this.generateWithTemplates(result, intentType);
        }
        const processingTime = Date.now() - startTime;
        return createSuccessResponse(message, intentType, {
            riskLevel: result.riskLevel,
            confidence: result.confidence,
            warnings: result.warnings,
            suggestions: this.getSuggestions(intentType, result),
            structuredData: result.data,
            processingTime,
        });
    }
    /**
     * Generate response using AI for more natural language
     */
    async generateWithAI(result, intentType, originalMessage) {
        try {
            const prompt = `
User asked: "${originalMessage}"
Intent: ${intentType}
Result data: ${JSON.stringify(result.data, null, 2)}
Risk level: ${result.riskLevel || 'not assessed'}
Warnings: ${result.warnings?.join(', ') || 'none'}

Generate a friendly, conversational response explaining this to the user.
      `.trim();
            return await this.aiClient.getCompletion(RESPONSE_GENERATION_PROMPT, prompt, { temperature: 0.7, maxTokens: 500 });
        }
        catch (error) {
            // Fallback to templates on AI error
            console.error('AI response generation failed, using templates:', error);
            return this.generateWithTemplates(result, intentType);
        }
    }
    /**
     * Generate response using templates (faster, no AI call)
     */
    generateWithTemplates(result, intentType) {
        const data = result.data || {};
        const riskLabel = this.getRiskLabel(result.riskLevel);
        switch (intentType) {
            case IntentType.EXPLAIN:
                return this.generateExplainResponse(data, riskLabel);
            case IntentType.VERIFY:
                return this.generateVerifyResponse(data, riskLabel);
            case IntentType.CREATE:
                return this.generateCreateResponse(data, riskLabel);
            case IntentType.SEND:
                return this.generateSendResponse(data, riskLabel);
            case IntentType.PROOF:
                return this.generateProofResponse(data, riskLabel);
            case IntentType.SAFETY:
                return this.generateSafetyResponse(data, riskLabel);
            case IntentType.WALLET:
                // Wallet skill handles formatting - just return the message
                return String(data.message || 'yo check ur wallet status');
            case IntentType.UNKNOWN:
                // Chat skill handles this - just return the message directly
                return String(data.message || 'yo what\'s good?');
            default:
                return 'ngl i processed ur request but something went weird with the output 😅 try again?';
        }
    }
    generateExplainResponse(data, riskLabel) {
        const type = data.type;
        const summary = data.summary;
        if (type === 'transaction') {
            const details = data.details;
            return `📝 **ok so here's the tea on this tx**

${summary}

**the deets:**
• from: \`${details?.from}\`
• to: \`${details?.to}\`
• amount: ${details?.value}
• status: ${details?.status}
• gas used: ${details?.gasUsed}

${riskLabel}

lmk if u need me to check anything else 👀`;
        }
        if (type === 'address') {
            const details = data.details;
            return `🔍 **aight lemme break down this address**

${summary}

**vibes check:**
• bag: ${details?.balance}
• txs: ${details?.transactionCount}
• type: ${details?.isContract ? 'smart contract' : 'regular wallet'}
• been active since: ${details?.firstSeen}

${riskLabel}

want me to verify if it's safe or nah? 🤔`;
        }
        if (type === 'ens') {
            return `🏷️ **ens name decoded**

${data.explanation}

${riskLabel}

pretty fire domain ngl 🔥`;
        }
        return String(data.explanation || data.summary || 'yo here\'s what i found fr');
    }
    generateVerifyResponse(data, riskLabel) {
        const verdict = data.verdict;
        const recommendations = data.recommendations || [];
        return `🔐 **aight here's the vibe check**

**verdict:** ${verdict}

${riskLabel}

**what u should do:**
${recommendations.map((r) => `• ${r}`).join('\n')}

stay safe out there fam 💪`;
    }
    generateCreateResponse(data, riskLabel) {
        const name = data.name;
        const description = data.description;
        const nextSteps = data.nextSteps || [];
        let response = `🏗️ **${name}**

${description}

`;
        if (data.generatedCode) {
            response += `✅ yo i just cooked up ur contract code fr fr

`;
        }
        response += `**ok so here's the game plan:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${riskLabel}`;
        if (data.estimatedGas) {
            response += `\n\n⛽ gas gonna run u about: ${data.estimatedGas}`;
        }
        response += `\n\nlmk when u ready to deploy this bad boy 🚀`;
        return response;
    }
    generateSendResponse(data, riskLabel) {
        const tx = data.transaction;
        const recipient = data.recipient;
        const fees = data.fees;
        const comparison = data.comparison;
        return `💸 **bet, got ur tx ready to go**

**sending:** ${tx?.value} ${tx?.currency}
**to:** ${recipient?.original}
**chain:** ${tx?.network}

**fees (gas n stuff):**
• total: ${fees?.totalFee}
• in usd: ${fees?.feeUSD}

**this vs ur bank (lol):**
• bank would charge: ${comparison?.bankFee}
• u saving: ${comparison?.savings}
• speed: ${comparison?.speed}

${riskLabel}

${data.confirmationMessage}

just say "confirm" when ur ready fam 🤝`;
    }
    generateProofResponse(data, riskLabel) {
        const receipt = data.receipt;
        const shareable = data.shareable;
        return `🧾 **here's ur receipt fam**

${receipt?.text}

📤 **share this w whoever needs proof:**
${shareable?.text}

🔗 verify the vibes: ${shareable?.link}

${riskLabel}

receipts on receipts no cap 💯`;
    }
    generateSafetyResponse(data, riskLabel) {
        const analysis = data.analysis;
        const recommendations = data.recommendations || [];
        const educational = data.educationalInfo;
        let response = `🛡️ **aight let me run the safety check**

${riskLabel}

**what i peeped:**
${analysis?.indicators?.map((i) => `• ${i}`).join('\n') || '• nothing sus so far'}

**my advice fr:**
${recommendations.map((r) => `${r}`).join('\n')}
`;
        if (educational) {
            response += `
📚 **real talk - ${educational.title}**
${educational.content}`;
        }
        response += `\n\nstay woke out there 👁️`;
        return response;
    }
    getRiskLabel(riskLevel) {
        switch (riskLevel) {
            case RiskLevel.LOW:
                return '✅ **vibes: immaculate** - we chillin';
            case RiskLevel.MEDIUM:
                return '⚠️ **vibes: lowkey sus** - proceed carefully fr';
            case RiskLevel.HIGH:
                return '🚨 **vibes: sus af** - be careful fam this is sketchy';
            case RiskLevel.CRITICAL:
                return '🛑 **YO THIS IS NOT IT** - do NOT proceed no cap';
            default:
                return '';
        }
    }
    getSuggestions(intentType, result) {
        const suggestions = [];
        switch (intentType) {
            case IntentType.EXPLAIN:
                suggestions.push('want me to verify if this is safe?');
                suggestions.push('need a receipt for this tx?');
                break;
            case IntentType.VERIFY:
                if (result.riskLevel === RiskLevel.LOW) {
                    suggestions.push('ur good to go, send it');
                }
                else {
                    suggestions.push('lemme explain the risks');
                    suggestions.push('wanna check other options?');
                }
                break;
            case IntentType.CREATE:
                suggestions.push('deploy this to testnet rq');
                suggestions.push('review the code first');
                break;
            case IntentType.SEND:
                suggestions.push('say "confirm" to send');
                suggestions.push('verify who ur sending to first');
                break;
            case IntentType.PROOF:
                suggestions.push('export as pdf');
                suggestions.push('share w someone');
                break;
            case IntentType.SAFETY:
                suggestions.push('report this sus activity');
                suggestions.push('learn how to stay safe');
                break;
        }
        return suggestions;
    }
}
// Default singleton
let defaultGenerator = null;
export function getResponseGenerator() {
    if (!defaultGenerator) {
        defaultGenerator = new ResponseGenerator();
    }
    return defaultGenerator;
}
//# sourceMappingURL=response-generator.js.map