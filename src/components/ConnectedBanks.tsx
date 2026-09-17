import React, { useState, useRef, useEffect } from 'react';
import { BankAccount } from '../types';
import { BankLogo } from './BankLogos';
import { ConfirmDangerModal } from './ConfirmDangerModal';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { usePrivacy } from '../contexts/PrivacyContext';
import { 
  MoreVertical, 
  RefreshCw, 
  ExternalLink, 
  Unlink, 
  Edit3, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

interface ConnectedBanksProps {
  banks: BankAccount[];
  selectedBankSlug?: string | null;
  onSelectBank?: (slug: string | null) => void;
  onSyncBank?: (bankId: string) => void;
  onConnectNewBank?: () => void;
  onRemoveBank?: (bankId: string) => void;
  onSaveBalance?: (bankId: string, newBalance: number) => void;
  isSyncingAll?: boolean;
}

export const ConnectedBanks: React.FC<ConnectedBanksProps> = ({
  banks,
  selectedBankSlug,
  onSelectBank,
  onSyncBank,
  onConnectNewBank,
  onRemoveBank,
  onSaveBalance,
  isSyncingAll = false,
}) => {
  const { formatValue } = usePrivacy();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bankToDisconnect, setBankToDisconnect] = useState<BankAccount | null>(null);
  const [bankToAdjust, setBankToAdjust] = useState<BankAccount | null>(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);

  const getGlowColor = (glow: BankAccount['glowColor']) => {
    switch (glow) {
      case 'red':
        return 'border-b-red-500 shadow-[0_4px_15px_rgba(239,68,68,0.25)]';
      case 'orange':
        return 'border-b-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.25)]';
      case 'blue':
        return 'border-b-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.25)]';
      case 'green':
        return 'border-b-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.25)]';
      case 'purple':
        return 'border-b-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.25)]';
      case 'cyan':
      default:
        return 'border-b-cyan-400 shadow-[0_4px_15px_rgba(var(--theme-glow-rgb),0.3)]';
    }
  };

  // Scroll carousel linearly by 1 card (or page) with smooth step
  const scrollLinear = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const firstCard = container.firstElementChild as HTMLElement | null;
    // Calculate exact scroll distance for 1 or more cards
    const cardStep = firstCard ? firstCard.getBoundingClientRect().width + 16 : container.clientWidth / 3;
    
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - cardStep 
      : container.scrollLeft + cardStep;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  };

  // Scroll to specific index
  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = container.children;
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      container.scrollTo({
        left: card.offsetLeft - container.offsetLeft,
        behavior: 'smooth'
      });
      setActiveSlideIndex(index);
    }
  };

  // Track scroll state for arrows and indicators
  const updateScrollState = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 8);
    // Can scroll right if there's any remaining scrollable width
    setCanScrollRight(scrollLeft < maxScroll - 8);

    const firstCard = container.firstElementChild as HTMLElement | null;
    const cardStep = firstCard ? firstCard.getBoundingClientRect().width + 16 : container.clientWidth / 3;
    const newIndex = Math.round(scrollLeft / cardStep);
    if (newIndex >= 0 && newIndex < banks.length && newIndex !== activeSlideIndex) {
      setActiveSlideIndex(newIndex);
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [banks.length, activeSlideIndex]);

  if (isSyncingAll) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-32 h-3 bg-slate-800 rounded"></div>
            <div className="w-20 h-4 bg-slate-800 rounded-full"></div>
          </div>
          <div className="w-32 h-6 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-slate-800/40 rounded-xl p-3.5 h-[110px] flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/80"></div>
                  <div className="w-16 h-3 bg-slate-700/80 rounded"></div>
                </div>
                <div className="w-1 h-4 bg-slate-700/80 rounded"></div>
              </div>
              <div className="mt-auto">
                <div className="w-12 h-2 bg-slate-700/50 rounded mb-1.5"></div>
                <div className="w-24 h-4 bg-slate-700/80 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative select-none" id="connected-banks-section">
      {/* Title & View Toggle Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
            <span>Contas Conectadas</span>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
              {banks.length} bancos ativos
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {selectedBankSlug && (
            <button
              onClick={() => onSelectBank?.(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800/80 rounded-lg transition-colors border border-slate-700/60"
            >
              Mostrar todos
            </button>
          )}
        </div>
      </div>

      {/* CAROUSEL / SLIDER (Netflix Style with flank side buttons) */}
      <div className="relative group/carousel -mx-2 px-2">
        {/* Left Flank Button (ao lado esquerdo) */}
          <button
            id="banks-carousel-flank-prev"
            type="button"
            onClick={() => scrollLinear('left')}
            aria-label="Rolar para esquerda"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-24 sm:h-28 bg-[#060c18]/90 hover:bg-[#0c1830] backdrop-blur-md border border-slate-700/80 hover:border-cyan-400/80 text-white rounded-r-2xl flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.8)] transition-all duration-300 ${
              canScrollLeft 
                ? 'opacity-80 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          </button>

          {/* Right Flank Button (ao lado direito, exatamente como no print da Netflix) */}
          <button
            id="banks-carousel-flank-next"
            type="button"
            onClick={() => scrollLinear('right')}
            aria-label="Rolar para direita"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-24 sm:h-28 bg-[#060c18]/90 hover:bg-[#0c1830] backdrop-blur-md border border-slate-700/80 hover:border-cyan-400/80 text-white rounded-l-2xl flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.8)] transition-all duration-300 ${
              canScrollRight 
                ? 'opacity-80 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-6 h-6 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          </button>

          {/* Slider Horizontal Track */}
          <div
            id="banks-slider-track"
            ref={carouselRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth snap-x snap-mandatory focus:outline-none custom-scrollbar"
            style={{ scrollbarWidth: 'none' }}
          >
            {banks.map((bank) => {
              const isSelected = selectedBankSlug === bank.slug;
              const isCardSyncing = isSyncingAll || bank.status === 'syncing';
              const glowBorderClass = getGlowColor(bank.glowColor);

              return (
                <div
                  key={bank.id}
                  onClick={() => onSelectBank?.(isSelected ? null : bank.slug)}
                  className={`snap-start flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-0.75rem)] h-[155px] sm:h-[160px] relative bg-gradient-to-br from-[#0c1527] via-[#09101f] to-[#050a14] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:border-cyan-500/60 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-b-2 select-none group/card ${glowBorderClass} ${
                    isSelected ? 'ring-2 ring-cyan-400 bg-[#0e1a33] scale-[1.01]' : 'hover:scale-[1.01]'
                  }`}
                >
                  {/* Top row: Logo + Bank Name + Account Info + 3-dots */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <BankLogo slug={bank.slug} size={34} className="w-8.5 h-8.5 rounded-xl shadow-md flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-slate-100 truncate uppercase tracking-tight">
                            {bank.name}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-slate-700 uppercase">
                            {bank.accountType === 'corrente' ? 'C. Corrente' : bank.accountType}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          Ag. {bank.agency} • Conta {bank.accountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === bank.id ? null : bank.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === bank.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 w-44 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-1 z-30 text-xs"
                        >
                          <button
                            onClick={() => {
                              onSyncBank?.(bank.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Sincronizar agora</span>
                          </button>
                          {onSaveBalance && (
                            <button
                              onClick={() => {
                                setBankToAdjust(bank);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2 text-cyan-300"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Ajustar saldo</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onSelectBank?.(bank.slug);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>Filtrar no extrato</span>
                          </button>

                          {onRemoveBank && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setBankToDisconnect(bank);
                              }}
                              className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 border-t border-slate-800 mt-1 pt-1.5"
                            >
                              <Unlink className="w-3.5 h-3.5 text-red-400" />
                              <span>Desconectar conta</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Balance + Status */}
                  <div className="pt-2 border-t border-slate-800/70 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Saldo disponível
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-base sm:text-lg font-black text-cyan-400 font-mono tracking-tight">
                          {formatValue(bank.availableBalance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      {isCardSyncing ? (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Sincronizando</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400/90">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          <span>Ativa</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicator Dots */}
          {banks.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {banks.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeSlideIndex 
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(var(--theme-glow-rgb),0.6)]' 
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Ir para banco ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      {/* Modal de Confirmação de Desconexão */}
      <ConfirmDangerModal
        isOpen={Boolean(bankToDisconnect)}
        onClose={() => setBankToDisconnect(null)}
        onConfirm={() => {
          if (bankToDisconnect) {
            onRemoveBank?.(bankToDisconnect.id);
            setBankToDisconnect(null);
          }
        }}
        title="Desconectar Conta Bancária"
        badgeText="Atenção: Remoção de Integração"
        description={`Você tem certeza que deseja desconectar e remover a conta do ${bankToDisconnect?.name}?`}
        itemPreview={
          bankToDisconnect
            ? {
                icon: (
                  <BankLogo
                    slug={bankToDisconnect.slug}
                    size={36}
                    className="w-9 h-9 rounded-lg flex-shrink-0"
                  />
                ),
                title: bankToDisconnect.name,
                subtitle: `Agência ${bankToDisconnect.agency} • Conta ${bankToDisconnect.accountNumber} • Saldo: ${formatValue(bankToDisconnect.availableBalance)}`,
                tag: 'Open Finance',
                tagColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30',
              }
            : undefined
        }
        impactPoints={[
          'O saldo desta conta deixará de compor o saldo total consolidado do painel.',
          'A sincronização automática diária desta instituição financeira será cancelada.',
          'O histórico de transações passadas importadas continuará arquivado.',
        ]}
        confirmButtonText="Sim, Desconectar Conta"
        cancelButtonText="Cancelar e Manter Conta"
        variant="danger"
        actionType="disconnect"
      />

      <AdjustBalanceModal
        isOpen={Boolean(bankToAdjust)}
        onClose={() => setBankToAdjust(null)}
        bank={bankToAdjust}
        onSaveBalance={(bankId, newBalance) => {
          onSaveBalance?.(bankId, newBalance);
          setBankToAdjust(null);
        }}
      />
    </div>
  );
};
