import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  BrainCircuit, 
  ChevronDown, 
  Info,
  ShieldCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { fetchAIInsights, AIInsight } from './services/geminiService';

const InsightCard = ({ insight, index }: { insight: AIInsight; index: number }) => {
  const isMerit = insight.type === 'merit';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.1, 0.5) }}
      className={`relative overflow-hidden rounded-3xl border p-6 mb-6 shadow-sm transition-all hover:shadow-md ${
        isMerit 
          ? 'border-emerald-100 bg-white/80' 
          : 'border-rose-100 bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          isMerit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {isMerit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {insight.type}
        </div>
        <span className="text-xs font-mono text-zinc-400">#{insight.category}</span>
      </div>

      <h3 className="text-xl font-bold text-zinc-800 mb-3 leading-tight">
        {insight.title}
      </h3>

      <div className="markdown-body text-zinc-600 text-sm mb-4">
        <Markdown>{insight.content}</Markdown>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            insight.impact_level === 'High' ? 'bg-orange-500' : 
            insight.impact_level === 'Medium' ? 'bg-blue-500' : 'bg-zinc-300'
          }`} />
          <span className="text-xs font-medium text-zinc-500">{insight.impact_level} Impact</span>
        </div>
        
        {isMerit ? (
          <Zap size={18} className="text-emerald-400" />
        ) : (
          <AlertTriangle size={18} className="text-rose-400" />
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const existingIds = insights.map(i => i.id);
      const newInsights = await fetchAIInsights(5, existingIds);
      
      if (newInsights.length === 0) {
        setHasMore(false);
      } else {
        setInsights(prev => [...prev, ...newInsights]);
      }
    } catch (err) {
      setError("Failed to fetch more insights. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, insights]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      loadMore();
      initialFetchDone.current = true;
    }
  }, [loadMore]);

  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore();
    }
  }, [inView, loading, hasMore, loadMore]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 p-1.5 rounded-lg">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">AI Insights</h1>
        </div>
        <button 
          onClick={() => {
            setInsights([]);
            setHasMore(true);
            initialFetchDone.current = false;
            loadMore();
          }}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={`text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md px-6 pt-8 pb-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">The AI Paradox</h2>
          <p className="text-zinc-500 text-sm">Exploring the double-edged sword of artificial intelligence through continuous discovery.</p>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {insights.map((insight, index) => (
              <InsightCard key={`${insight.id}-${index}`} insight={insight} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {/* Loading / End State */}
        <div ref={ref} className="py-12 flex flex-col items-center justify-center gap-4">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-xs font-medium text-zinc-400 animate-pulse">Synthesizing more insights...</p>
            </div>
          )}
          
          {!hasMore && (
            <div className="text-center py-8">
              <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2 opacity-50" />
              <p className="text-sm font-medium text-zinc-400">You've reached the frontier of current knowledge.</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center w-full">
              <p className="text-rose-600 text-sm mb-3">{error}</p>
              <button 
                onClick={loadMore}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Info Button */}
      <div className="fixed bottom-6 right-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-zinc-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-2"
        >
          <Info size={20} />
          <span className="text-sm font-bold">About</span>
        </motion.button>
      </div>

      {/* Scroll Indicator */}
      {hasMore && !loading && insights.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Scroll</span>
          <ChevronDown size={16} className="animate-bounce text-zinc-400" />
        </motion.div>
      )}
    </div>
  );
}
