import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculatePayout, calculateROI } from '../utils/OddsUtils';

const BettingContext = createContext();

const INITIAL_BALANCE = 1000;
const STORAGE_KEY = 'promatch_betting_data';

/**
 * BettingContext - Manages virtual bankroll and paper trading
 */
export const BettingProvider = ({ children }) => {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [activeBets, setActiveBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setBalance(data.balance || INITIAL_BALANCE);
        setActiveBets(data.activeBets || []);
        setSettledBets(data.settledBets || []);
      } catch (error) {
        console.error('Failed to load betting data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const data = {
      balance,
      activeBets,
      settledBets,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [balance, activeBets, settledBets]);

  /**
   * Place a new bet
   */
  const placeBet = useCallback((bet) => {
    if (bet.stake > balance) {
      throw new Error('Insufficient balance');
    }

    const newBet = {
      id: Date.now().toString(),
      ...bet,
      placedAt: new Date().toISOString(),
      status: 'pending'
    };

    setActiveBets(prev => [...prev, newBet]);
    setBalance(prev => prev - bet.stake);

    return newBet;
  }, [balance]);

  /**
   * Settle a bet (mark as won or lost)
   */
  const settleBet = useCallback((betId, won) => {
    const bet = activeBets.find(b => b.id === betId);
    if (!bet) return;

    const payout = won ? calculatePayout(bet.stake, bet.odds) : 0;
    const profit = payout - bet.stake;

    const settledBet = {
      ...bet,
      status: won ? 'won' : 'lost',
      settledAt: new Date().toISOString(),
      payout,
      profit
    };

    setActiveBets(prev => prev.filter(b => b.id !== betId));
    setSettledBets(prev => [settledBet, ...prev]);
    setBalance(prev => prev + payout);
  }, [activeBets]);

  /**
   * Cancel an active bet (refund)
   */
  const cancelBet = useCallback((betId) => {
    const bet = activeBets.find(b => b.id === betId);
    if (!bet) return;

    setActiveBets(prev => prev.filter(b => b.id !== betId));
    setBalance(prev => prev + bet.stake);
  }, [activeBets]);

  /**
   * Reset wallet to initial state
   */
  const resetWallet = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setActiveBets([]);
    setSettledBets([]);
  }, []);

  /**
   * Calculate statistics
   */
  const stats = {
    totalBets: activeBets.length + settledBets.length,
    activeBetsCount: activeBets.length,
    settledBetsCount: settledBets.length,
    wonBets: settledBets.filter(b => b.status === 'won').length,
    lostBets: settledBets.filter(b => b.status === 'lost').length,
    totalStaked: [...activeBets, ...settledBets].reduce((sum, b) => sum + b.stake, 0),
    totalProfit: settledBets.reduce((sum, b) => sum + (b.profit || 0), 0),
    currentBalance: balance,
    initialBalance: INITIAL_BALANCE,
    netProfit: balance - INITIAL_BALANCE,
    roi: calculateROI(balance - INITIAL_BALANCE, settledBets.reduce((sum, b) => sum + b.stake, 0)),
    winRate: settledBets.length > 0
      ? ((settledBets.filter(b => b.status === 'won').length / settledBets.length) * 100).toFixed(1)
      : 0
  };

  const value = {
    balance,
    activeBets,
    settledBets,
    stats,
    placeBet,
    settleBet,
    cancelBet,
    resetWallet
  };

  return (
    <BettingContext.Provider value={value}>
      {children}
    </BettingContext.Provider>
  );
};

/**
 * Hook to use betting context
 */
export const useBetting = () => {
  const context = useContext(BettingContext);
  if (!context) {
    throw new Error('useBetting must be used within BettingProvider');
  }
  return context;
};
