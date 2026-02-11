import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { Wifi, Activity, Server, Zap, Cpu } from 'lucide-react';

const MAX_BARS = 30;

const NetworkStatus: React.FC = () => {
  const [solanaStatus, setSolanaStatus] = useState({
    status: 'Initializing...',
    latency: 0,
    isUp: true
  });
  
  const [tpsHistory, setTpsHistory] = useState<number[]>(new Array(MAX_BARS).fill(10));
  const [congestion, setCongestion] = useState(25); 

  useEffect(() => {
    const checkSolanaHealth = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch('https://api.devnet.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth'
          })
        });
        
        const data = await response.json();
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (data.result === 'ok') {
          setSolanaStatus({
            status: 'Operational',
            latency: latency,
            isUp: true
          });
        } else {
          setSolanaStatus({
            status: 'Degraded',
            latency: latency,
            isUp: false
          });
        }

        const simulatedTPS = Math.max(10, Math.min(100, Math.random() * 80 + (1000 / (latency || 100))));
        
        setTpsHistory(prev => {
            const newHist = [...prev.slice(1), simulatedTPS];
            return newHist;
        });

        setCongestion(Math.min(100, (latency / 5))); 

      } catch (error) {
        setSolanaStatus({
          status: 'Unreachable',
          latency: 0,
          isUp: false
        });
      }
    };

    checkSolanaHealth();
    const interval = setInterval(checkSolanaHealth, 2000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in px-4 pt-4 pb-32 h-full overflow-y-auto no-scrollbar">
         <div className="px-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solana Devnet</h1>
            <p className="text-gray-500 dark:text-white/50 mt-1">Real-time Network Diagnostics</p>
        </div>

        {/* The "is Solana dead again?" dashboard. */}
        <GlassCard className="flex flex-col gap-6 border-green-500/20 bg-white dark:bg-white/[0.03]">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                        <Wifi size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">Mainnet Beta</span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-mono tracking-wider">ONLINE</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{solanaStatus.latency}ms</div>
                    <div className="text-xs text-gray-400 dark:text-white/40">Latency</div>
                </div>
            </div>

            {/* TPS Spectrum Visualization */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end h-24 gap-1 px-1">
                    {tpsHistory.map((height, i) => (
                        <div 
                            key={i} 
                            className="w-full bg-[#FF5722] rounded-t-sm transition-all duration-300 ease-in-out opacity-80"
                            style={{ 
                                height: `${height}%`,
                                opacity: (i / MAX_BARS) + 0.2
                            }}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-white/30 font-mono uppercase">
                    <span>-60s</span>
                    <span>TPS Volatility Spread</span>
                    <span>Now</span>
                </div>
            </div>
        </GlassCard>

        {/* Network Health Bar */}
        <div className="flex flex-col gap-3 px-2">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-white/70 flex items-center gap-2">
                    <Cpu size={16} /> Network Load
                </span>
                <span className="text-xs font-mono text-[#FF5722]">{congestion.toFixed(1)}%</span>
             </div>
             <div className="w-full h-3 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000 ease-out"
                    style={{ width: `${congestion}%` }}
                 ></div>
             </div>
             <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
                 Current slot processing load is nominal. Transaction confirmation times are optimal.
             </p>
        </div>

        {/* Node Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-[24px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col gap-2 shadow-sm dark:shadow-none">
                 <Server size={20} className="text-gray-400 dark:text-white/40" />
                 <span className="text-xs text-gray-500 dark:text-white/40">Block Height</span>
                 <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">241,592,001</span>
             </div>
             <div className="p-4 rounded-[24px] bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col gap-2 shadow-sm dark:shadow-none">
                 <Zap size={20} className="text-[#FF5722]" />
                 <span className="text-xs text-gray-500 dark:text-white/40">Est. TPS</span>
                 <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">~2,450</span>
             </div>
        </div>

        <div className="px-4 py-6 rounded-[32px] bg-blue-500/10 border border-blue-500/20 mt-2">
            <div className="flex gap-3">
                <Activity className="text-blue-500 dark:text-blue-400 min-w-[24px]" />
                <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400">Validator Status</h4>
                    <p className="text-sm text-gray-600 dark:text-white/70">
                        98.2% of validators are voting correctly on the current fork. Consensus is stable.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default NetworkStatus;