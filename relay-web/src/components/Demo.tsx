import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
}

const demoConversations: Record<string, Message[]> = {
  explain: [
    { id: 1, type: 'user', text: 'What is 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D?' },
    { id: 2, type: 'bot', text: 'This is the Uniswap V2 Router contract on Ethereum. It\'s a verified, widely-used DeFi protocol for token swaps. Over 50M transactions processed. ✅ Safe to interact with.' },
  ],
  verify: [
    { id: 1, type: 'user', text: 'Is 0x1234...abcd safe to send money to?' },
    { id: 2, type: 'bot', text: '⚠️ Warning: This address shows several red flags:\n\n• Created 2 days ago\n• Has received funds from flagged addresses\n• No transaction history before this week\n\nRecommendation: Do NOT send funds. High scam probability.' },
  ],
  create: [
    { id: 1, type: 'user', text: 'Create a token called RELAY with 1 million supply' },
    { id: 2, type: 'bot', text: 'I\'ll create an ERC-20 token for you:\n\n📝 Name: RELAY\n🔤 Symbol: RLY\n💰 Supply: 1,000,000\n🔗 Network: Base\n\nReady to deploy? This will cost ~0.002 ETH in gas.' },
  ],
};

const tabs = [
  { id: 'explain', label: 'Explain' },
  { id: 'verify', label: 'Verify' },
  { id: 'create', label: 'Create' },
];

export function Demo() {
  const [activeTab, setActiveTab] = useState('explain');
  const [inputValue, setInputValue] = useState('');

  const messages = demoConversations[activeTab];

  return (
    <section id="demo" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
            See it <span className="text-blue-600">in action</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Experience how natural it feels to interact with blockchain through chat.
          </p>
        </motion.div>

        {/* Demo container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.id ? 'text-black' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="p-6 min-h-[300px] bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className={`flex items-start gap-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user'
                          ? 'bg-blue-600'
                          : 'bg-black'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl max-w-md ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-700 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Try asking something..."
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
              />
              <button className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-slate-800 transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              This is a demo preview. Full functionality available after signup.
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mt-16"
        >
          {[
            { value: '50K+', label: 'Transactions Explained' },
            { value: '10K+', label: 'Addresses Verified' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
