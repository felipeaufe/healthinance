'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  PiggyBank,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { BudgetWithConsumption } from '@healthinance/types';

interface BudgetsSectionProps {
  initialBudgets: BudgetWithConsumption[];
  totalBudgeted: number;
  totalSpent: number;
}

const COMMON_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Compras',
  'Serviços',
  'Outros',
];

export function BudgetsSection({
  initialBudgets,
  totalBudgeted,
  totalSpent,
}: BudgetsSectionProps) {
  const router = useRouter();
  const [budgetsList, setBudgetsList] = useState<BudgetWithConsumption[]>(initialBudgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('Alimentação');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [alertPercent, setAlertPercent] = useState('80');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const handleOpenModal = () => {
    setErrorMsg(null);
    setCategory('Alimentação');
    setCustomCategory('');
    setAmount('');
    setAlertPercent('80');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetCategory = category === 'Outros' && customCategory.trim() ? customCategory.trim() : category;
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!targetCategory) {
      setErrorMsg('Informe a categoria do orçamento.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: targetCategory,
          amount: numAmount,
          periodMonth: currentMonth,
          periodYear: currentYear,
          alertPercent: parseInt(alertPercent, 10) || 80,
        }),
      });

      if (!res.success) {
        throw new Error(res.error || 'Falha ao salvar orçamento');
      }

      handleCloseModal();
      router.refresh();
      // Atualização otimista ou recarga
      const updatedRes = await apiFetch<{ budgets: BudgetWithConsumption[]; totalBudgeted: number; totalSpent: number }>('/api/budgets');
      if (updatedRes.success && updatedRes.data) {
        setBudgetsList(updatedRes.data.budgets);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar orçamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este teto de gastos?')) return;

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });

      if (!res.success) {
        throw new Error(res.error || 'Falha ao remover orçamento');
      }

      setBudgetsList((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao remover orçamento');
    } finally {
      setDeletingId(null);
    }
  };

  // Cores do termômetro
  const getProgressColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = (percentage: number, status: string) => {
    if (status === 'exceeded' || percentage > 90) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3 h-3" />
          {percentage >= 100 ? 'Teto Estourado' : 'Alerta de Risco'}
        </span>
      );
    }
    if (status === 'warning' || percentage > 70) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          Atenção
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        No Controle
      </span>
    );
  };

  return (
    <section className="space-y-4" data-testid="budgets-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold tracking-tight">Orçamentos & Limites de Gastos</h2>
        </div>

        <button
          onClick={handleOpenModal}
          data-testid="add-budget-button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-sm shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          Definir Teto
        </button>
      </div>

      {budgetsList.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="budgets-grid">
            {budgetsList.map((b) => {
              const progressWidth = Math.min(100, Math.max(0, b.percentage));
              const progressColor = getProgressColor(b.percentage);

              return (
                <div
                  key={b.id}
                  data-testid={`budget-card-${b.category}`}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {b.category}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Teto: {formatCurrency(b.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(b.percentage, b.status)}
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
                          title="Remover orçamento"
                          aria-label={`Remover orçamento de ${b.category}`}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          {deletingId === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Valores de Consumo */}
                    <div className="flex items-baseline justify-between text-sm mt-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(b.spent)} gastos
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {b.percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Termômetro Visual de Consumo */}
                    <div
                      className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5"
                      data-testid={`budget-thermometer-${b.category}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Indicador Safe to Spend */}
                  <div
                    className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60"
                    data-testid={`budget-safetospend-${b.category}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        Safe to Spend
                      </span>

                      {b.safeToSpendDaily > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(b.safeToSpendDaily)} / dia
                        </span>
                      ) : (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          R$ 0,00 / dia
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {b.safeToSpendDaily > 0
                        ? `Ritmo diário seguro pelos próximos ${b.daysRemaining} dias`
                        : 'Limite mensal atingido ou ultrapassado'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Estado Vazio */
        <div
          className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3"
          data-testid="budgets-empty-state"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold">Nenhum teto orçamentário configurado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Defina limites de gastos por categoria para acompanhar seu termômetro de consumo e o ritmo diário seguro de gastos (Safe to Spend).
          </p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Orçamento
          </button>
        </div>
      )}

      {/* Modal / Diálogo de Novo Orçamento */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          data-testid="budget-modal"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Definir Teto de Gastos
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                  {errorMsg}
                </div>
              )}

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {category === 'Outros' && (
                  <input
                    type="text"
                    placeholder="Nome da categoria personalizada"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Valor do Teto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Limite Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Ex: 1500.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Percentual de Alerta */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alerta de Proximidade (% do teto)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  placeholder="80"
                  value={alertPercent}
                  onChange={(e) => setAlertPercent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Você será alertado quando o consumo desta categoria atingir {alertPercent || 80}%.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Orçamento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
