
import React, { useState } from 'react';
import { UserProfile, CategoryExpense, CategoryKey } from '../types';
import { RenderProfileAvatar } from './ProfileAvatars';
import { X, Check, ShieldCheck, Bell, DollarSign, Lock, Sparkles, Sliders, Palette, Tag, Plus, Trash2, Edit2 } from 'lucide-react';
import { useTheme, AppTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  categories: CategoryExpense[];
  setCategories: (categories: CategoryExpense[]) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  categories,
  setCategories,
}) => {
  const { theme, setTheme } = useTheme();
  const { autoHideEnabled, setAutoHideEnabled, isPrivacyMode, togglePrivacyMode } = usePrivacy();
  
  const [activeTab, setActiveTab] = useState<'geral' | 'categorias'>('geral');
  const [currency, setCurrency] = useState('BRL');
  const [autoSync, setAutoSync] = useState(true);
  
  const [pushEnabled, setPushEnabled] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações web.');
      return;
    }
    
    if (pushEnabled) {
      setPushEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        new Notification('FIN - Notificações Ativadas', {
          body: 'Você receberá avisos sobre seus próximos vencimentos de boletos e faturas.',
        });
      } else {
        alert('Permissão de notificação negada no navegador.');
      }
    }
  };
  const [finProactive, setFinProactive] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Category management state
  const [editingCategory, setEditingCategory] = useState<CategoryExpense | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#0ea5e9');

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b1325] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1830] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <RenderProfileAvatar profile={profile} size={40} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Configurações da Conta
              </h2>
              <p className="text-xs text-slate-400">Preferências para {profile.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/80 bg-[#0e1830] flex-shrink-0 px-4">
          <button
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'geral' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Geral
            {activeTab === 'geral' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`py-3 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'categorias' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Categorias de Despesas
            {activeTab === 'categorias' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'geral' ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Section: Aparência */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Aparência do Painel
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['cyan', 'emerald', 'orange'] as AppTheme[]).map((t) => {
                    const themes = {
                      cyan: { name: 'Cyan Flow', bg: 'bg-[#050a14]', activeBorder: 'border-cyan-400', activeBg: 'bg-cyan-950/30' },
                      emerald: { name: 'Eco Green', bg: 'bg-[#021008]', activeBorder: 'border-emerald-400', activeBg: 'bg-emerald-950/30' },
                      orange: { name: 'Sunset Orange', bg: 'bg-[#1a0b02]', activeBorder: 'border-orange-400', activeBg: 'bg-orange-950/30' },
                    };
                    const isSelected = theme === t;
                    const meta = themes[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                          isSelected ? `${meta.activeBorder} ${meta.activeBg} ring-1 ring-inset ring-white/10` : 'border-slate-800 bg-[#060c18] hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2 ${meta.bg} border ${isSelected ? meta.activeBorder : 'border-slate-700'} shadow-inner flex items-center justify-center`}>
                          {isSelected && <Check className={`w-4 h-4 ${meta.activeBorder.replace('border-', 'text-')}`} />}
                        </div>
                        <span className="text-[11px] font-bold">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Moeda e Exibição */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                  Moeda Principal & Exibição
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrency('BRL')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      currency === 'BRL'
                        ? 'border-cyan-400 bg-cyan-950/20 text-white ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-[#060c18] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Real Brasileiro</p>
                      <p className="text-[10px] text-slate-400">BRL (R$)</p>
                    </div>
                    {currency === 'BRL' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      currency === 'USD'
                        ? 'border-cyan-400 bg-cyan-950/20 text-white ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-[#060c18] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Dólar Americano</p>
                      <p className="text-[10px] text-slate-400">USD ($)</p>
                    </div>
                    {currency === 'USD' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
                {/* Toggle: Ocultar Saldos */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white">Modo de Foco (Ocultar Valores)</p>
                    <p className="text-[11px] text-slate-400">Ocultar montantes instantaneamente</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePrivacyMode()}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isPrivacyMode ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1">
                      <span>Modo de Foco Automático</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Ativar após 5 minutos de inatividade</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoHideEnabled(!autoHideEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      autoHideEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>

              {/* Section: Notificações & IA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  Automações & Inteligência Artificial
                </h4>
                {/* Auto Sync */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white">Sincronização Open Finance</p>
                    <p className="text-[11px] text-slate-400">Atualizar dados bancários a cada 30 minutos</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSync(!autoSync)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      autoSync ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                {/* FIN Proativo */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1">
                      <span>FIN Proativo</span>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                    </p>
                    <p className="text-[11px] text-slate-400">Recomendações automáticas de economia no painel</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFinProactive(!finProactive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      finProactive ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1">
                      <span>Notificações Push (Navegador)</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Receba lembretes sobre o vencimento de contas</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      pushEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={savedSuccess}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.4)] transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Salvo!
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Categorias Tab Content */}
              <div className="bg-[#060c18] p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Categoria</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: Assinaturas"
                      className="w-full bg-[#0b1325] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cor no Gráfico</label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-slate-700 overflow-hidden relative cursor-pointer ring-offset-2 ring-offset-[#0b1325] transition-all hover:ring-2 hover:ring-cyan-500/50"
                        style={{ backgroundColor: newCategoryColor }}
                      >
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400 uppercase">{newCategoryColor}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setNewCategoryName('');
                          setNewCategoryColor('#0ea5e9');
                        }}
                        className="flex-1 py-2.5 text-xs font-bold text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        
                        if (editingCategory) {
                          setCategories(categories.map(c => 
                            c.id === editingCategory.id 
                              ? { ...c, name: newCategoryName, color: newCategoryColor, bgRgba: newCategoryColor + '33' } 
                              : c
                          ));
                          setEditingCategory(null);
                        } else {
                          const newCat: CategoryExpense = {
                            id: 'cat-' + Date.now(),
                            key: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
                            name: newCategoryName,
                            amount: 0,
                            percentage: 0,
                            color: newCategoryColor,
                            bgRgba: newCategoryColor + '33'
                          };
                          setCategories([...categories, newCat]);
                        }
                        
                        setNewCategoryName('');
                        setNewCategoryColor('#0ea5e9');
                      }}
                      className="flex-1 py-2.5 text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {editingCategory ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingCategory ? 'Salvar Edição' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Categorias Atuais ({categories.length})
                </h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800 group hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-[#060c18] shadow-[0_0_8px_currentColor]" 
                          style={{ backgroundColor: category.color, color: category.color }} 
                        />
                        <div>
                          <span className="text-sm font-medium text-white">{category.name}</span>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{category.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setNewCategoryName(category.name);
                            setNewCategoryColor(category.color);
                            // Scroll to top to edit
                            const el = document.querySelector('.overflow-y-auto');
                            if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCategories(categories.filter(c => c.id !== category.id));
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 bg-[#060c18] rounded-xl border border-slate-800">
                      Nenhuma categoria cadastrada.
                    </p>
                  )}
                </div>
              </div>

              {/* Finalizar Button */}
              <div className="pt-4 border-t border-slate-800/80">
                 <button
                  type="button"
                  onClick={() => handleSave()}
                  className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Concluído
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
