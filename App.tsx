
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { View, Theme, Post, NotificationSettings, PrivacySettings, User, ApiProvider, ApiKeyTier, Wallet, Network, CryptoCurrency, Game, LiveStream, CreatePostData } from './types';
import { THEMES } from './constants';
import * as api from './api';
import Layout from './components/layout/Layout';
import FeedView from './components/feed/FeedView';
import GamingView from './components/gaming/GamingView';
import { GameCreatorStudioView } from './components/studio/GameCreatorStudioView';
import WalletView from './components/wallet/WalletView';
import ApiKeyManagerView from './components/api_keys/ApiKeyManagerView';
import { ProfileView } from './components/profile/ProfileView';
import MiningView from './components/mining/MiningView';
import GameDetailView from './components/gaming/GameDetailView';
import LiveView from './components/live/LiveView';
import StreamDetailView from './components/live/StreamDetailView';
import CreatePostModal from './components/feed/CreatePostModal';
import CustomThemeModal from './components/theme/CustomThemeModal';
import { AppContext } from './components/context/AppContext';
import Spinner from './components/ui/Spinner';
import { KeyIcon } from './components/icons/Icons';

const App: React.FC = () => {
    // GLOBAL APP STATE
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setThemeState] = useState<Theme>(THEMES[0]);
    const [view, setViewState] = useState<View>('feed');
    const [currentUser, setCurrentUserState] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [activeWalletId, setActiveWalletId] = useState<string>('');
    const [knownCurrencies, setKnownCurrencies] = useState<CryptoCurrency[]>([]);
    const [networks, setNetworks] = useState<Network[]>([]);
    const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

    // Modal States
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
    const [isCustomThemeEditorOpen, setCustomThemeEditorOpen] = useState(false);
    
    // Settings States (local until saved via API)
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({ likes: true, comments: true, newFollowers: true });
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({ privateAccount: false, allowDms: 'everyone' });

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.fetchInitialData();
                setAllUsers(data.users);
                setCurrentUserState(data.currentUser);
                setPosts(data.posts);
                setGames(data.games);
                setLiveStreams(data.liveStreams);
                setWallets(data.wallets);
                setKnownCurrencies(data.currencies);
                setNetworks(data.networks);
                setApiProviders(data.apiProviders);
                setActiveWalletId(data.wallets[0]?.id || '');
            } catch (error) {
                console.error("Failed to load initial data", error);
                // Here you could set an error state to show a message to the user
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // THEME EFFECT
    useEffect(() => {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });
    }, [theme]);

    // DERIVED STATE
    const activeWallet = useMemo(() => wallets.find(w => w.id === activeWalletId), [wallets, activeWalletId]);
    const nxgBalance = useMemo(() => activeWallet?.balances['NXG'] || 0, [activeWallet]);

    // --- ASYNC CALLBACKS (API INTERACTIONS) ---

    const setCurrentUser = useCallback(async (updates: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = await api.updateUser(currentUser.id, updates);
        setCurrentUserState(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, [currentUser]);

    const createPost = useCallback(async (postData: CreatePostData) => {
        if (!currentUser) return;
        const newPost = await api.createPost({ ...postData, author: currentUser });
        setPosts(prev => [newPost, ...prev]);
        setCreatePostModalOpen(false);
    }, [currentUser]);
    
    const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
        const updatedPost = await api.updatePost(postId, updates);
        if (updatedPost) {
            setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        }
    }, []);

    const toggleFollow = useCallback(async (userId: string) => {
        if (!currentUser) return;
        const updatedUser = await api.toggleFollow(currentUser.id, userId);
        setCurrentUserState(updatedUser);
    }, [currentUser]);
    
    const blockUser = useCallback(async (userId: string) => {
        if (!currentUser) return;
        const updatedUser = await api.blockUser(currentUser.id, userId);
        setCurrentUserState(updatedUser);
    }, [currentUser]);

    const unblockUser = useCallback(async (userId: string) => {
        if (!currentUser) return;
        const updatedUser = await api.unblockUser(currentUser.id, userId);
        setCurrentUserState(updatedUser);
    }, [currentUser]);

    const reportUser = useCallback(async (userId: string, reason: string, details: string) => {
        if (!currentUser) return;
        await api.reportUser(currentUser.id, userId, reason, details);
        alert('User reported. Our moderation team will review this shortly.');
    }, [currentUser]);

    const addNxg = useCallback(async (amount: number) => {
        if (!activeWallet) return;
        const updatedWallet = await api.addNxg(activeWallet.id, amount);
        setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
    }, [activeWallet]);

    const sendCrypto = useCallback(async (symbol: string, amount: number) => {
        if (!activeWallet) return;
        const updatedWallet = await api.sendCrypto(activeWallet.id, symbol, amount);
        setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
    }, [activeWallet]);
    
    const swapCrypto = useCallback(async (fromSymbol: string, toSymbol: string, fromAmount: number, toAmount: number) => {
        if (!activeWallet) return;
        const updatedWallet = await api.swapCrypto(activeWallet.id, fromSymbol, toSymbol, fromAmount, toAmount);
        setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
    }, [activeWallet]);
    
    const addWallet = useCallback(async (name: string) => {
        if (!currentUser) return;
        const updatedWallets = await api.addWallet(currentUser.id, name);
        setWallets(updatedWallets);
        setActiveWalletId(updatedWallets[updatedWallets.length - 1].id);
    }, [currentUser]);
    
    const addNetwork = useCallback(async (network: Omit<Network, 'id'>) => {
        const updatedNetworks = await api.addNetwork(network);
        setNetworks(updatedNetworks);
    }, []);

    const addCustomCoin = useCallback(async (coinData: Omit<CryptoCurrency, 'id' | 'icon' | 'gradient'>) => {
        if (!activeWallet) return;
        const { currencies, newCoin } = await api.addCustomCoin(coinData);
        setKnownCurrencies(currencies);
        const updatedWallet = await api.addKnownCoinToWallet(activeWallet.id, newCoin.id);
        setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
    }, [activeWallet]);
    
    const addKnownCoinToWallet = useCallback(async (coinId: string) => {
        if (!activeWallet) return;
        const updatedWallet = await api.addKnownCoinToWallet(activeWallet.id, coinId);
        setWallets(prev => prev.map(w => w.id === updatedWallet.id ? updatedWallet : w));
    }, [activeWallet]);
    
    const updateApiTier = useCallback(async (providerId: string, tierId: string, updates: Partial<ApiKeyTier>) => {
        const updatedProviders = await api.updateApiTier(providerId, tierId, updates);
        setApiProviders(updatedProviders);
    }, []);

    const playGame = useCallback(async (gameToPlay: Game) => {
        const { games: updatedGames, wallets: updatedWallets } = await api.playGame(gameToPlay.id, gameToPlay.creatorId);
        setGames(updatedGames);
        if (updatedWallets) {
            setWallets(updatedWallets);
        }
    }, []);

    const publishGame = useCallback(async (newGameData: Omit<Game, 'id' | 'creatorId' | 'playCount'>) => {
        if (!currentUser) return;
        const updatedGames = await api.publishGame(currentUser.id, newGameData);
        setGames(updatedGames);
        viewGame(updatedGames[0]);
    }, [currentUser]);

    const goLive = useCallback(async (title: string, gameId?: string) => {
        if (!currentUser) return;
        const updatedLiveStreams = await api.goLive(currentUser, title, gameId);
        setLiveStreams(updatedLiveStreams);
        viewStream(updatedLiveStreams[0]);
    }, [currentUser]);


    // --- UI & NAVIGATION CALLBACKS ---
    const openCustomThemeEditor = useCallback(() => setCustomThemeEditorOpen(true), []);
    const closeCustomThemeEditor = useCallback(() => setCustomThemeEditorOpen(false), []);
    
    const setView = useCallback((newView: View) => {
        setViewState(newView);
        setSelectedProfile(null);
        setSelectedGame(null);
        setSelectedStream(null);
        window.scrollTo(0, 0);
    }, []);

    const viewProfile = useCallback((user: User) => {
        setSelectedProfile(user);
        setViewState('profile');
        window.scrollTo(0, 0);
    }, []);
    
    const viewGame = useCallback((game: Game) => {
        setSelectedGame(game);
        setViewState('game_detail');
        window.scrollTo(0, 0);
    }, []);

    const viewStream = useCallback((stream: LiveStream) => {
        setSelectedStream(stream);
        setViewState('stream_detail');
        window.scrollTo(0, 0);
    }, []);

    // --- RENDER LOGIC ---

    const contextValue = useMemo(() => ({
        theme, setTheme: setThemeState,
        isCustomThemeEditorOpen, openCustomThemeEditor, closeCustomThemeEditor,
        view, setView,
        currentUser: currentUser!, allUsers, setCurrentUser, toggleFollow, selectedProfile, viewProfile, blockUser, unblockUser, reportUser,
        posts, setPosts, createPost, updatePost,
        isCreatePostModalOpen, setCreatePostModalOpen,
        nxgBalance, addNxg,
        wallets, activeWallet, activeWalletId, setActiveWalletId, addWallet, sendCrypto, swapCrypto,
        networks, addNetwork, knownCurrencies, addCustomCoin, addKnownCoinToWallet,
        notificationSettings, setNotificationSettings,
        privacySettings, setPrivacySettings,
        apiProviders, updateApiTier,
        games, selectedGame, viewGame, playGame, publishGame,
        liveStreams, selectedStream, viewStream, goLive
    }), [
        theme, view, currentUser, allUsers, posts, nxgBalance, wallets, activeWallet, activeWalletId, 
        notificationSettings, privacySettings, apiProviders, isCreatePostModalOpen, isCustomThemeEditorOpen,
        networks, knownCurrencies, selectedProfile, games, selectedGame, liveStreams, selectedStream,
        openCustomThemeEditor, closeCustomThemeEditor, setView, setCurrentUser, 
        toggleFollow, viewProfile, blockUser, unblockUser, reportUser, createPost, updatePost, addNxg,
        setActiveWalletId, addWallet, sendCrypto, swapCrypto, addNetwork, addCustomCoin,
        addKnownCoinToWallet, setNotificationSettings, setPrivacySettings, updateApiTier,
        viewGame, playGame, publishGame, setPosts, setCreatePostModalOpen, viewStream, goLive
    ]);

    if (isLoading) {
        return <Spinner text="Booting NEXUS Core..." fullScreen />;
    }

    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen bg-red-900 text-white text-xl">Error: Could not load user data. Please refresh.</div>
    }

    const renderView = () => {
        switch (view) {
            case 'feed': return <FeedView />;
            case 'live': return <LiveView />;
            case 'stream_detail': return <StreamDetailView />;
            case 'gaming': return <GamingView />;
            case 'studio': return <GameCreatorStudioView />;
            case 'wallet': return <WalletView />;
            case 'apikeys': return <ApiKeyManagerView />;
            case 'mining': return <MiningView />;
            case 'profile': return <ProfileView user={selectedProfile || currentUser} />;
            case 'game_detail': return <GameDetailView />;
            default: return <FeedView />;
        }
    };

    return (
        <AppContext.Provider value={contextValue}>
            <Layout view={view} setView={setView} setCreatePostModalOpen={setCreatePostModalOpen}>
                {renderView()}
            </Layout>
            <CreatePostModal isOpen={isCreatePostModalOpen} onClose={() => setCreatePostModalOpen(false)} />
            <CustomThemeModal isOpen={isCustomThemeEditorOpen} onClose={closeCustomThemeEditor} />
        </AppContext.Provider>
    );
};

export default App;
