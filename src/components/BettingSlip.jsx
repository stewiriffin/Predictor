import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Trophy, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useBetting } from '../context/BettingContext';
import { formatOdds, calculatePayout } from '../utils/OddsUtils';
import { format } from 'date-fns';

/**
 * BettingSlip - Side drawer showing active bets and betting history
 */
const BettingSlip = ({ isOpen, onClose }) => {
  const { balance, activeBets, settledBets, stats, settleBet, cancelBet, resetWallet } = useBetting();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history' | 'stats'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 bg-gradient-to-br from-cyber-dark via-cyber-slate to-cyber-dark border-l-2 border-neon-teal/50 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-cyber-dark/80 border-b border-neon-teal/30 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  PAPER WALLET
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>

              {/* Balance Display */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
                <div className="text-xs text-gray-400 font-mono mb-1">CURRENT BALANCE</div>
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                  ${balance.toFixed(2)}
                </div>
                <div className={`text-xs font-mono mt-1 flex items-center gap-1 ${
                  stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {stats.netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)} ({stats.roi.toFixed(1)}% ROI)
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                    activeTab === 'active'
                      ? 'bg-neon-teal/20 text-neon-teal border border-neon-teal/50'
                      : 'bg-cyber-slate/30 text-gray-400 hover:bg-cyber-slate/50'
                  }`}
                >
                  ACTIVE ({activeBets.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                    activeTab === 'history'
                      ? 'bg-neon-teal/20 text-neon-teal border border-neon-teal/50'
                      : 'bg-cyber-slate/30 text-gray-400 hover:bg-cyber-slate/50'
                  }`}
                >
                  HISTORY ({settledBets.length})
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                    activeTab === 'stats'
                      ? 'bg-neon-teal/20 text-neon-teal border border-neon-teal/50'
                      : 'bg-cyber-slate/30 text-gray-400 hover:bg-cyber-slate/50'
                  }`}
                >
                  STATS
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'active' && (
                <ActiveBets bets={activeBets} onSettle={settleBet} onCancel={cancelBet} />
              )}
              {activeTab === 'history' && (
                <BettingHistory bets={settledBets} />
              )}
              {activeTab === 'stats' && (
                <Statistics stats={stats} onReset={resetWallet} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Active Bets Tab
 */
const ActiveBets = ({ bets, onSettle, onCancel }) => {
  if (bets.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 font-mono text-sm">No active bets</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map(bet => (
        <motion.div
          key={bet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyber-dark/50 rounded-xl p-4 border border-neon-teal/20"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-white font-mono">{bet.matchName}</div>
              <div className="text-xs text-neon-teal font-mono">{bet.selection}</div>
            </div>
            {bet.isValue && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded font-mono border border-yellow-500/30">
                VALUE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <div className="text-xs text-gray-500 font-mono">STAKE</div>
              <div className="text-sm font-bold text-white font-mono">${bet.stake.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-mono">ODDS</div>
              <div className="text-sm font-bold text-white font-mono">{formatOdds(bet.odds)}</div>
            </div>
          </div>

          <div className="mb-3 p-2 bg-neon-teal/10 rounded border border-neon-teal/20">
            <div className="text-xs text-gray-400 font-mono">POTENTIAL PAYOUT</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              ${calculatePayout(bet.stake, bet.odds).toFixed(2)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSettle(bet.id, true)}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2 rounded-lg text-xs font-mono border border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              WON
            </button>
            <button
              onClick={() => onSettle(bet.id, false)}
              className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-2 rounded-lg text-xs font-mono border border-rose-500/30 transition-colors flex items-center justify-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              LOST
            </button>
            <button
              onClick={() => onCancel(bet.id)}
              className="px-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg text-xs font-mono border border-gray-500/30 transition-colors"
            >
              CANCEL
            </button>
          </div>

          <div className="text-xs text-gray-600 font-mono mt-2">
            {format(new Date(bet.placedAt), 'MMM d, HH:mm')}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Betting History Tab
 */
const BettingHistory = ({ bets }) => {
  if (bets.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 font-mono text-sm">No settled bets yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map(bet => (
        <div
          key={bet.id}
          className={`bg-cyber-dark/50 rounded-xl p-4 border ${
            bet.status === 'won' ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-white font-mono">{bet.matchName}</div>
              <div className="text-xs text-gray-400 font-mono">{bet.selection}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-mono ${
              bet.status === 'won'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {bet.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <div className="text-xs text-gray-500 font-mono">STAKE</div>
              <div className="text-sm font-bold text-white font-mono">${bet.stake.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-mono">ODDS</div>
              <div className="text-sm font-bold text-white font-mono">{formatOdds(bet.odds)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-mono">PROFIT</div>
              <div className={`text-sm font-bold font-mono ${
                bet.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-600 font-mono">
            {format(new Date(bet.settledAt), 'MMM d, HH:mm')}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Statistics Tab
 */
const Statistics = ({ stats, onReset }) => {
  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-cyber-dark/50 rounded-xl p-4 border border-neon-teal/20">
        <h3 className="text-sm font-bold text-neon-teal mb-3 font-mono">OVERVIEW</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Total Bets" value={stats.totalBets} />
          <StatItem label="Win Rate" value={`${stats.winRate}%`} />
          <StatItem label="Won" value={stats.wonBets} color="emerald" />
          <StatItem label="Lost" value={stats.lostBets} color="rose" />
        </div>
      </div>

      {/* Financial */}
      <div className="bg-cyber-dark/50 rounded-xl p-4 border border-neon-teal/20">
        <h3 className="text-sm font-bold text-neon-teal mb-3 font-mono">FINANCIAL</h3>
        <div className="space-y-3">
          <StatItem label="Initial Balance" value={`$${stats.initialBalance.toFixed(2)}`} />
          <StatItem label="Current Balance" value={`$${stats.currentBalance.toFixed(2)}`} />
          <StatItem
            label="Net Profit/Loss"
            value={`${stats.netProfit >= 0 ? '+' : ''}$${stats.netProfit.toFixed(2)}`}
            color={stats.netProfit >= 0 ? 'emerald' : 'rose'}
          />
          <StatItem
            label="ROI"
            value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(2)}%`}
            color={stats.roi >= 0 ? 'emerald' : 'rose'}
          />
          <StatItem label="Total Staked" value={`$${stats.totalStaked.toFixed(2)}`} />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          if (window.confirm('Reset wallet to $1,000? This will clear all betting history.')) {
            onReset();
          }
        }}
        className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-3 rounded-xl text-sm font-mono border border-rose-500/30 transition-colors"
      >
        RESET WALLET
      </button>
    </div>
  );
};

/**
 * Stat Item Component
 */
const StatItem = ({ label, value, color = 'white' }) => {
  const colorClass = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    white: 'text-white'
  }[color];

  return (
    <div>
      <div className="text-xs text-gray-500 font-mono">{label}</div>
      <div className={`text-lg font-bold font-mono ${colorClass}`}>{value}</div>
    </div>
  );
};

export default BettingSlip;
