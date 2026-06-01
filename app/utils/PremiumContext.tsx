"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface PremiumState {
  isPremium: boolean;
  monthKey: string;
  freeAnalysisCount: number;
  focusAnalysisCount: number;
  streakShields: number;
}

interface PremiumContextType {
  state: PremiumState;
  upgrade: () => void;
  downgrade: () => void;
  canAnalyze: () => boolean;        // 분석 가능 여부 (무료 10회 or 프리미엄)
  shouldShowModal: () => boolean;   // 7회 이상이면 모달 유도
  useAnalysis: () => void;          // 분석 횟수 차감
  canFocusAnalysis: () => boolean;  // 프리미엄 고정밀 분석 가능 여부 (월 20회)
  useFocusAnalysis: () => void;     // 고정밀 횟수 차감
  useStreakShield: () => boolean;   // 보호권 사용
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const FREE_LIMIT = 10;
const MODAL_THRESHOLD = 7;
const FOCUS_LIMIT = 20;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT_STATE: PremiumState = {
  isPremium: false,
  monthKey: getCurrentMonthKey(),
  freeAnalysisCount: 0,
  focusAnalysisCount: 0,
  streakShields: 3,
};

function loadState(): PremiumState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem("bangPremium");
    if (!raw) return DEFAULT_STATE;
    const stored: PremiumState = JSON.parse(raw);
    const currentMonth = getCurrentMonthKey();
    if (stored.monthKey !== currentMonth) {
      return { ...stored, monthKey: currentMonth, freeAnalysisCount: 0, focusAnalysisCount: 0, streakShields: 3 };
    }
    return stored;
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state: PremiumState) {
  try { localStorage.setItem("bangPremium", JSON.stringify(state)); } catch {}
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PremiumState>(DEFAULT_STATE);

  useEffect(() => {
    setState(loadState());
  }, []);

  const update = useCallback((patch: Partial<PremiumState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const upgrade = useCallback(() => update({ isPremium: true }), [update]);
  const downgrade = useCallback(() => update({ isPremium: false }), [update]);

  const canAnalyze = useCallback(() => {
    if (state.isPremium) return true;
    return state.freeAnalysisCount < FREE_LIMIT;
  }, [state.isPremium, state.freeAnalysisCount]);

  const shouldShowModal = useCallback(() => {
    if (state.isPremium) return false;
    return state.freeAnalysisCount >= MODAL_THRESHOLD;
  }, [state.isPremium, state.freeAnalysisCount]);

  const useAnalysis = useCallback(() => {
    if (!state.isPremium) {
      update({ freeAnalysisCount: state.freeAnalysisCount + 1 });
    }
  }, [state.isPremium, state.freeAnalysisCount, update]);

  const canFocusAnalysis = useCallback(() => {
    return state.isPremium && state.focusAnalysisCount < FOCUS_LIMIT;
  }, [state.isPremium, state.focusAnalysisCount]);

  const useFocusAnalysis = useCallback(() => {
    update({ focusAnalysisCount: state.focusAnalysisCount + 1 });
  }, [state.focusAnalysisCount, update]);

  const useStreakShield = useCallback((): boolean => {
    if (state.streakShields <= 0) return false;
    update({ streakShields: state.streakShields - 1 });
    return true;
  }, [state.streakShields, update]);

  return (
    <PremiumContext.Provider value={{
      state,
      upgrade,
      downgrade,
      canAnalyze,
      shouldShowModal,
      useAnalysis,
      canFocusAnalysis,
      useFocusAnalysis,
      useStreakShield,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be inside PremiumProvider");
  return ctx;
}
