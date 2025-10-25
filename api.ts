
import { MOCK_POSTS, MOCK_USERS, MOCK_WALLETS, CRYPTO_CURRENCIES, MOCK_NETWORKS, MOCK_GAMES, MOCK_LIVE_STREAMS, API_PROVIDERS, THEMES } from './constants';
import type { Post, User, Wallet, CryptoCurrency, Network, Game, LiveStream, ApiProvider, ApiKeyTier, NotificationSettings, PrivacySettings, Theme } from './types';

// --- IN-MEMORY "DATABASE" ---
// A deep copy is used for nested objects to ensure the original constants are not mutated.
const db = {
  users: JSON.parse(JSON.stringify(Object.values(MOCK_USERS))) as User[],
  posts: JSON.parse(JSON.stringify(MOCK_POSTS)) as Post[],
  wallets: JSON.parse(JSON.stringify(MOCK_WALLETS)) as Wallet[],
  games: JSON.parse(JSON.stringify(MOCK_GAMES)) as Game[],
  liveStreams: JSON.parse(JSON.stringify(MOCK_LIVE_STREAMS)) as LiveStream[],
  networks: JSON.parse(JSON.stringify(MOCK_NETWORKS)) as Network[],
  currencies: JSON.parse(JSON.stringify(CRYPTO_CURRENCIES)) as CryptoCurrency[],
  apiProviders: JSON.parse(JSON.stringify(API_PROVIDERS)) as ApiProvider[],
  themes: JSON.parse(JSON.stringify(THEMES)) as Theme[],
};

const SIMULATED_DELAY = 600;

const simulateDelay = () => new Promise(res => setTimeout(res, SIMULATED_DELAY));

// --- FETCH API ---

export async function fetchInitialData() {
    await simulateDelay();
    const currentUser = db.users.find(u => u.id === 'u1');
    if (!currentUser) throw new Error("Default user not found.");
    
    return {
        users: [...db.users],
        posts: [...db.posts],
        wallets: [...db.wallets],
        games: [...db.games],
        liveStreams: [...db.liveStreams],
        networks: [...db.networks],
        currencies: [...db.currencies],
        apiProviders: db.apiProviders,
        currentUser,
    };
}

// --- MUTATION API ---

// User Mutations
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await simulateDelay();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    return { ...db.users[userIndex] };
}

export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<User> {
    await simulateDelay();
    const user = db.users.find(u => u.id === currentUserId);
    if (!user) throw new Error("Current user not found");

    const isFollowing = user.following.includes(targetUserId);
    user.following = isFollowing
        ? user.following.filter(id => id !== targetUserId)
        : [...user.following, targetUserId];
    
    return { ...user };
}

export async function blockUser(currentUserId: string, targetUserId: string): Promise<User> {
    await simulateDelay();
    const user = db.users.find(u => u.id === currentUserId);
    if (!user) throw new Error("Current user not found");
    
    const blocked = user.blockedUsers || [];
    if (!blocked.includes(targetUserId)) {
        user.blockedUsers = [...blocked, targetUserId];
    }
    return { ...user };
}

export async function unblockUser(currentUserId: string, targetUserId: string): Promise<User> {
    await simulateDelay();
    const user = db.users.find(u => u.id === currentUserId);
    if (!user) throw new Error("Current user not found");
    user.blockedUsers = (user.blockedUsers || []).filter(id => id !== targetUserId);
    return { ...user };
}

export async function reportUser(reporterId: string, reportedId: string, reason: string, details: string): Promise<void> {
    await simulateDelay();
    console.log(`API: User ${reporterId} reported user ${reportedId}. Reason: ${reason}. Details: "${details}"`);
}

// Post Mutations
export async function createPost(postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'reposts' | 'comments'>): Promise<Post> {
    await simulateDelay();
    const newPost: Post = {
        ...postData,
        id: `p${Date.now()}`,
        timestamp: 'Just now',
        likes: 0,
        reposts: 0,
        comments: [],
    };
    db.posts.unshift(newPost);
    return { ...newPost };
}

export async function updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    await simulateDelay();
    const postIndex = db.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) throw new Error("Post not found");
    db.posts[postIndex] = { ...db.posts[postIndex], ...updates };
    return { ...db.posts[postIndex] };
}

// Wallet Mutations
export async function addNxg(walletId: string, amount: number): Promise<Wallet> {
    await simulateDelay();
    const wallet = db.wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error("Wallet not found");
    wallet.balances['NXG'] = (wallet.balances['NXG'] || 0) + amount;
    return { ...wallet };
}

export async function sendCrypto(walletId: string, symbol: string, amount: number): Promise<Wallet> {
    await simulateDelay();
    const wallet = db.wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error("Wallet not found");
    if ((wallet.balances[symbol] || 0) < amount) throw new Error("Insufficient funds");
    wallet.balances[symbol] -= amount;
    return { ...wallet };
}

export async function swapCrypto(walletId: string, fromSymbol: string, toSymbol: string, fromAmount: number, toAmount: number): Promise<Wallet> {
    await simulateDelay();
    const wallet = db.wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error("Wallet not found");
    wallet.balances[fromSymbol] = (wallet.balances[fromSymbol] || 0) - fromAmount;
    wallet.balances[toSymbol] = (wallet.balances[toSymbol] || 0) + toAmount;
    return { ...wallet };
}

export async function addWallet(userId: string, name: string): Promise<Wallet[]> {
    await simulateDelay();
    const newWallet: Wallet = {
        id: `w${Date.now()}`,
        name,
        userId,
        address: `Gf${Math.random().toString(36).substring(2, 15)}...`,
        balances: { 'NXG': 0 },
        seedPhrase: 'new wallet seed phrase mock random words apple banana cherry dog elephant',
    };
    db.wallets.push(newWallet);
    return [...db.wallets];
}

// Config Mutations
export async function addNetwork(network: Omit<Network, 'id'>): Promise<Network[]> {
    await simulateDelay();
    const newNetwork: Network = { ...network, id: `net${Date.now()}` };
    db.networks.push(newNetwork);
    return [...db.networks];
}

export async function addCustomCoin(coin: Omit<CryptoCurrency, 'id' | 'icon' | 'gradient'>): Promise<{currencies: CryptoCurrency[], newCoin: CryptoCurrency}> {
    await simulateDelay();
    const newCoin: CryptoCurrency = {
        ...coin,
        id: `cc-${Date.now()}`,
        icon: () => null, // Icon component reference cannot be stored in "DB"
        gradient: 'from-gray-500 to-gray-700',
    };
    db.currencies.push(newCoin);
    return { currencies: [...db.currencies], newCoin };
}

export async function addKnownCoinToWallet(walletId: string, coinId: string): Promise<Wallet> {
    await simulateDelay();
    const wallet = db.wallets.find(w => w.id === walletId);
    const coin = db.currencies.find(c => c.id === coinId);
    if (!wallet || !coin) throw new Error("Wallet or coin not found");
    
    if (!(coin.symbol in wallet.balances)) {
        wallet.balances[coin.symbol] = 0;
    }
    return { ...wallet };
}

export async function updateApiTier(providerId: string, tierId: string, updates: Partial<ApiKeyTier>): Promise<ApiProvider[]> {
    await simulateDelay();
    const provider = db.apiProviders.find(p => p.id === providerId);
    if (!provider) throw new Error("Provider not found");
    const tier = provider.tiers.find(t => t.id === tierId);
    if (!tier) throw new Error("Tier not found");

    Object.assign(tier, updates);
    return JSON.parse(JSON.stringify(db.apiProviders));
}

// Game Mutations
export async function playGame(gameId: string, creatorId?: string): Promise<{ games: Game[], wallets?: Wallet[] }> {
    await simulateDelay();
    const game = db.games.find(g => g.id === gameId);
    if (!game) throw new Error("Game not found");
    game.playCount += 1;
    
    let updatedWallets;
    if (creatorId) {
        const creatorWallet = db.wallets.find(w => w.userId === creatorId);
        if (creatorWallet) {
            creatorWallet.balances['NXG'] = (creatorWallet.balances['NXG'] || 0) + 0.01;
        }
        updatedWallets = [...db.wallets];
    }

    return { games: [...db.games], wallets: updatedWallets };
}

export async function publishGame(creatorId: string, newGameData: Omit<Game, 'id' | 'creatorId' | 'playCount'>): Promise<Game[]> {
    await simulateDelay();
    const newGame: Game = {
        ...newGameData,
        id: `g${Date.now()}`,
        creatorId: creatorId,
        playCount: 0,
    };
    db.games.unshift(newGame);
    return [...db.games];
}

// Live Stream Mutations
export async function goLive(creator: User, title: string, gameId?: string): Promise<LiveStream[]> {
    await simulateDelay();
    const game = gameId ? db.games.find(g => g.id === gameId) : undefined;
    const newStream: LiveStream = {
        id: `ls${Date.now()}`,
        title,
        creator,
        viewerCount: 1,
        thumbnail: `https://picsum.photos/seed/live${Date.now()}/600/400`,
        game,
    };
    db.liveStreams.unshift(newStream);
    return [...db.liveStreams];
}
