import { useState, useEffect } from 'react';

interface Wallet {
  address: string;
  name: string;
  network: 'ethereum' | 'base';
  isDefault: boolean;
  balance?: {
    eth: string;
    ethUsd: string;
  };
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  type: 'send' | 'receive';
}

type View = 'onboarding' | 'dashboard';

export default function Dashboard() {
  const [view, setView] = useState<View>('onboarding');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState('$0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'activity'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'relay'; content: string }>>([
    { role: 'relay', content: "yooo what's good! 👋 i'm relay, ur crypto bestie. what we doing today?" }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [newWallet, setNewWallet] = useState<{ address: string; seedPhrase: string } | null>(null);
  const [seedPhraseSaved, setSeedPhraseSaved] = useState(false);

  const whatsappNumber = '+14155238886';
  const whatsappMessage = encodeURIComponent('Hey Relay! I just signed up');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    checkExistingWallets();
  }, []);

  const checkExistingWallets = async () => {
    setIsLoading(true);
    try {
      // Check localStorage for existing session
      const savedWallets = localStorage.getItem('relay_wallets');
      if (savedWallets) {
        const parsed = JSON.parse(savedWallets);
        if (parsed.length > 0) {
          setWallets(parsed);
          setView('dashboard');
          await loadDashboardData(parsed);
        }
      }
    } catch (error) {
      console.error('Error checking wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (existingWallets?: Wallet[]) => {
    const walletsToUse = existingWallets || wallets;

    // Mock data for demo - in production this would call the Relay API
    const mockTransactions: Transaction[] = walletsToUse.length > 0 ? [
      {
        hash: '0xabc123...',
        from: walletsToUse[0]?.address || '',
        to: '0x1234...5678',
        value: '0.5 ETH',
        timestamp: '2 hours ago',
        status: 'success',
        type: 'send'
      }
    ] : [];

    setTransactions(mockTransactions);

    // Calculate total balance
    const total = walletsToUse.reduce((sum, w) => {
      const ethUsd = parseFloat(w.balance?.ethUsd?.replace('$', '').replace(',', '') || '0');
      return sum + ethUsd;
    }, 0);
    setTotalBalance(`$${total.toFixed(2)}`);
  };

  const createWallet = async () => {
    setIsCreatingWallet(true);
    try {
      // Generate a demo wallet - in production this calls the backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate random address and seed phrase for demo
      const randomAddress = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const seedWords = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent',
        'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'
      ];
      const randomSeed = Array.from({ length: 12 }, () =>
        seedWords[Math.floor(Math.random() * seedWords.length)]
      ).join(' ');

      setNewWallet({
        address: randomAddress,
        seedPhrase: randomSeed
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const confirmWalletCreation = () => {
    if (!newWallet) return;

    const wallet: Wallet = {
      address: newWallet.address,
      name: 'My Wallet',
      network: 'ethereum',
      isDefault: true,
      balance: { eth: '0.00', ethUsd: '$0.00' }
    };

    const updatedWallets = [...wallets, wallet];
    setWallets(updatedWallets);
    localStorage.setItem('relay_wallets', JSON.stringify(updatedWallets));

    setNewWallet(null);
    setSeedPhraseSaved(false);
    setView('dashboard');
    loadDashboardData(updatedWallets);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);

    try {
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));

      let response = "bet, let me help with that 🔥";

      const lowerMsg = userMessage.toLowerCase();

      if (lowerMsg.includes('balance') || lowerMsg.includes('how much')) {
        response = `ur total bag rn: ${totalBalance} 💰\n\n${wallets.map(w => `${w.name}: ${w.balance?.ethUsd || '$0.00'}`).join('\n')}\n\nwant me to break it down more?`;
      } else if (lowerMsg.includes('create') && lowerMsg.includes('wallet')) {
        response = "say less! click the '+ Create Wallet' button above and i'll cook one up for u 🔥";
      } else if (lowerMsg.includes('send')) {
        response = "aight who we sending to and how much? 💸\n\ndrop it like: send 0.1 eth to vitalik.eth";
      } else if (lowerMsg.includes('help')) {
        response = `bet, here's what i can do fr:\n\n• "balance" - check ur funds\n• "create wallet" - make a new wallet\n• "send 0.1 eth to..." - transfer crypto\n• ask me anything about crypto!\n\nor just chat with me, i'm chill 😎`;
      } else if (lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('yo')) {
        response = "yooo what's good! 👋 how can i help u today?";
      }

      setChatMessages(prev => [...prev, { role: 'relay', content: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'relay', content: "my bad, something went wrong 😅 try again?" }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding / Signup view
  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Welcome to Relay</h1>
            <p className="text-gray-600">ur crypto bestie fr fr 🔥</p>
          </div>

          {/* Wallet Creation Card */}
          {!newWallet ? (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <h2 className="text-xl font-semibold text-black mb-2">Get Started</h2>
              <p className="text-gray-600 mb-6">Create your first wallet to start using Relay</p>

              <button
                onClick={createWallet}
                disabled={isCreatingWallet}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingWallet ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    Create My Wallet
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm mb-3">or chat with Relay on WhatsApp</p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            // Seed Phrase Confirmation
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎉</span>
                </div>
                <h2 className="text-xl font-semibold text-black">Wallet Created!</h2>
                <p className="text-gray-600 text-sm mt-1">Save your seed phrase - you'll need it to recover your wallet</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Your Wallet Address</p>
                <p className="font-mono text-sm text-blue-600 break-all">{newWallet.address}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">Save Your Seed Phrase!</p>
                    <p className="text-yellow-700 text-xs">Write this down and store it safely. Never share it with anyone.</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                  <p className="font-mono text-sm text-gray-800 leading-relaxed">{newWallet.seedPhrase}</p>
                </div>
              </div>

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedPhraseSaved}
                  onChange={(e) => setSeedPhraseSaved(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">I have saved my seed phrase securely</span>
              </label>

              <button
                onClick={confirmWalletCreation}
                disabled={!seedPhraseSaved}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="font-bold text-xl text-black">Relay</span>
            </div>

            <nav className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-600 hover:text-black'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('wallets')}
                className={`text-sm font-medium ${activeTab === 'wallets' ? 'text-blue-600' : 'text-gray-600 hover:text-black'}`}
              >
                Wallets
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`text-sm font-medium ${activeTab === 'activity' ? 'text-blue-600' : 'text-gray-600 hover:text-black'}`}
              >
                Activity
              </button>
            </nav>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Portfolio Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Balance</p>
                  <h2 className="text-4xl font-bold text-black">{totalBalance}</h2>
                  <p className="text-green-500 text-sm mt-1">ur bag is looking good 💰</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Send
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Receive
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Wallets</p>
                  <p className="text-xl font-semibold text-black">{wallets.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Network</p>
                  <p className="text-xl font-semibold text-black">ETH</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Transactions</p>
                  <p className="text-xl font-semibold text-black">{transactions.length}</p>
                </div>
              </div>
            </div>

            {/* Wallets List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-black">Your Wallets</h3>
                <button
                  onClick={() => {
                    setView('onboarding');
                    setNewWallet(null);
                  }}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
                >
                  + Create Wallet
                </button>
              </div>

              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">no wallets yet fam 📭</p>
                  <button
                    onClick={() => {
                      setView('onboarding');
                      setNewWallet(null);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          wallet.network === 'ethereum' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <span className="text-lg">{wallet.network === 'ethereum' ? '⟠' : '🔵'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-black">{wallet.name}</p>
                            {wallet.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-mono">
                            {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-black">{wallet.balance?.ethUsd || '$0.00'}</p>
                        <p className="text-sm text-gray-500">{wallet.balance?.eth || '0.00'} ETH</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {transactions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-black">Recent Activity</h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <span className="text-lg">{tx.type === 'send' ? '↑' : '↓'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-black">
                            {tx.type === 'send' ? 'Sent' : 'Received'}
                          </p>
                          <p className="text-sm text-gray-500">{tx.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === 'send' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'send' ? '-' : '+'}{tx.value}
                        </p>
                        <p className="text-sm text-gray-500">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span>💬</span> Chat with Relay
                </h3>
                <p className="text-blue-100 text-sm mt-1">ask me anything fr fr</p>
              </div>

              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-black border border-gray-200 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChat} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="ask me anything..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setChatInput('check my balance')}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('help')}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    help
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('what is ethereum')}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    learn
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors hover:scale-110 transform"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
