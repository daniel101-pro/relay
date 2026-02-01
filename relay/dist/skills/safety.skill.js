import { BaseSkill } from './base-skill.js';
import { IntentType, RiskLevel, } from '../types/index.js';
/**
 * Safety Skill - Proactive security monitoring and scam detection
 *
 * "Protect me"
 *
 * Takes: Suspicious activity, potential scam, security question
 * Returns: Risk assessment, warnings, recommended actions
 */
export class SafetySkill extends BaseSkill {
    name = 'safety';
    description = 'Provides security monitoring and scam detection';
    handledIntents = [IntentType.SAFETY];
    async validate(_context) {
        // Safety skill can handle almost any input - it's about detecting threats
        return { valid: true };
    }
    async execute(context) {
        const { entities } = context.intent;
        const message = context.originalMessage.toLowerCase();
        // Analyze the message for different types of safety concerns
        const analysis = this.analyzeSecurityConcern(message, entities);
        // Check for known scam patterns
        const scamCheck = this.checkScamPatterns(message, entities);
        // Check addresses against known bad actors
        const addressCheck = entities.addresses.length > 0
            ? this.checkAddresses(entities.addresses)
            : null;
        // Determine overall risk
        const overallRisk = this.calculateOverallRisk(analysis, scamCheck, addressCheck);
        return this.success({
            type: 'safety_analysis',
            overallRisk: overallRisk.level,
            riskScore: overallRisk.score,
            analysis: {
                concernType: analysis.type,
                indicators: analysis.indicators,
                severity: analysis.severity,
            },
            scamCheck: scamCheck
                ? {
                    isLikelyScam: scamCheck.isLikelyScam,
                    patterns: scamCheck.patterns,
                    confidence: scamCheck.confidence,
                }
                : null,
            addressCheck: addressCheck
                ? {
                    flagged: addressCheck.flagged,
                    reason: addressCheck.reason,
                    source: addressCheck.source,
                }
                : null,
            recommendations: this.getRecommendations(overallRisk, analysis, scamCheck),
            educationalInfo: this.getEducationalInfo(analysis.type),
            reportOption: {
                canReport: true,
                reportMessage: 'Would you like me to flag this for the community?',
            },
        }, {
            riskLevel: overallRisk.level,
            confidence: overallRisk.confidence,
            warnings: overallRisk.warnings,
        });
    }
    analyzeSecurityConcern(message, entities) {
        const indicators = [];
        let type = 'general_inquiry';
        let severity = 'low';
        // Check for phishing indicators
        if (message.includes('urgent') ||
            message.includes('immediately') ||
            message.includes('act now')) {
            indicators.push('Urgency language detected');
            type = 'potential_phishing';
            severity = 'high';
        }
        // Check for suspicious promises
        if (message.includes('guaranteed') ||
            message.includes('double') ||
            message.includes('free')) {
            indicators.push('Too-good-to-be-true promises');
            type = 'potential_scam';
            severity = 'high';
        }
        // Check for seed phrase requests
        if (message.includes('seed') ||
            message.includes('private key') ||
            message.includes('recovery phrase')) {
            indicators.push('Seed phrase/private key mentioned');
            type = 'credential_theft_attempt';
            severity = 'critical';
        }
        // Check for unknown addresses
        if (entities.addresses.length > 0) {
            indicators.push('Contains blockchain addresses to verify');
            type = 'address_verification';
        }
        return { type, indicators, severity };
    }
    checkScamPatterns(message, _entities) {
        const patterns = [];
        let confidence = 0;
        // Common scam patterns
        const scamPatterns = [
            { pattern: /send.*to receive/i, name: 'Send-to-receive scam' },
            { pattern: /verify.*wallet/i, name: 'Fake wallet verification' },
            { pattern: /airdrop.*claim/i, name: 'Fake airdrop' },
            { pattern: /support.*team/i, name: 'Fake support' },
            { pattern: /double.*return/i, name: 'Doubling scam' },
            { pattern: /limited.*time/i, name: 'Artificial scarcity' },
            { pattern: /validate.*token/i, name: 'Fake token validation' },
        ];
        for (const { pattern, name } of scamPatterns) {
            if (pattern.test(message)) {
                patterns.push(name);
                confidence += 0.2;
            }
        }
        if (patterns.length === 0) {
            return null;
        }
        return {
            isLikelyScam: confidence >= 0.4,
            patterns,
            confidence: Math.min(confidence, 0.95),
        };
    }
    checkAddresses(addresses) {
        // TODO: Implement actual blocklist checking
        // Would check against: Etherscan labels, community reports, known scam addresses
        // For MVP, return mock result
        for (const address of addresses) {
            // Simulate a flagged address (in reality, would check database)
            if (address.toLowerCase().includes('dead')) {
                return {
                    flagged: true,
                    reason: 'Address associated with known scam',
                    source: 'Community reports',
                };
            }
        }
        return {
            flagged: false,
            reason: 'No known issues found',
            source: 'Relay safety database',
        };
    }
    calculateOverallRisk(analysis, scamCheck, addressCheck) {
        let score = 0;
        const warnings = [];
        // Add points based on analysis
        if (analysis.severity === 'critical') {
            score += 4;
            warnings.push('Critical security concern detected');
        }
        else if (analysis.severity === 'high') {
            score += 3;
            warnings.push('High-risk indicators found');
        }
        else if (analysis.severity === 'medium') {
            score += 2;
        }
        // Add points for scam patterns
        if (scamCheck?.isLikelyScam) {
            score += 3;
            warnings.push('Matches known scam patterns');
        }
        // Add points for flagged addresses
        if (addressCheck?.flagged) {
            score += 4;
            warnings.push('Address is flagged in our database');
        }
        let level;
        if (score >= 6) {
            level = RiskLevel.CRITICAL;
        }
        else if (score >= 4) {
            level = RiskLevel.HIGH;
        }
        else if (score >= 2) {
            level = RiskLevel.MEDIUM;
        }
        else {
            level = RiskLevel.LOW;
        }
        return {
            level,
            score,
            confidence: 0.75 + Math.min(score * 0.03, 0.2),
            warnings,
        };
    }
    getRecommendations(risk, analysis, scamCheck) {
        const recommendations = [];
        if (risk.level === RiskLevel.CRITICAL) {
            recommendations.push('🚨 DO NOT proceed with this transaction');
            recommendations.push('Never share your seed phrase or private keys');
            recommendations.push('Report this to the platform where you received it');
        }
        else if (risk.level === RiskLevel.HIGH) {
            recommendations.push('⚠️ Exercise extreme caution');
            recommendations.push('Verify through official channels only');
            recommendations.push('Do not click any links in suspicious messages');
        }
        else if (risk.level === RiskLevel.MEDIUM) {
            recommendations.push('Double-check all details before proceeding');
            recommendations.push('Verify the sender/source independently');
        }
        if (analysis.type === 'potential_phishing') {
            recommendations.push('Legitimate projects never ask for private keys');
            recommendations.push('Check official social media for announcements');
        }
        if (scamCheck?.isLikelyScam) {
            recommendations.push('This matches patterns used in known scams');
            recommendations.push('If it sounds too good to be true, it probably is');
        }
        if (recommendations.length === 0) {
            recommendations.push('No immediate concerns detected');
            recommendations.push('Always stay vigilant with crypto transactions');
        }
        return recommendations;
    }
    getEducationalInfo(concernType) {
        const educational = {
            credential_theft_attempt: {
                title: 'Protecting Your Wallet',
                content: 'Your seed phrase and private keys should NEVER be shared with anyone. No legitimate service will ever ask for them. These give complete control of your funds.',
            },
            potential_phishing: {
                title: 'Recognizing Phishing',
                content: 'Phishing attacks create urgency and impersonate trusted sources. Always verify by going directly to official websites, never through links in messages.',
            },
            potential_scam: {
                title: 'Common Crypto Scams',
                content: 'Doubling scams, fake airdrops, and "guaranteed returns" are common. In crypto, if something promises unrealistic returns, it\'s almost certainly a scam.',
            },
            default: {
                title: 'Stay Safe in Crypto',
                content: 'Always verify transactions before signing. Use hardware wallets for large amounts. Never rush into decisions under pressure.',
            },
        };
        return educational[concernType] || educational.default;
    }
}
//# sourceMappingURL=safety.skill.js.map