"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
  canFreeAnalysis: () => boolean;
  canFocusAnalysis: () => boolean;
  useFreeAnalysis: () => void;
  useFocusAnalysis: () => void;
  useStreakShield: () => boolean;
  resetIfNewMonth: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function loadState(): PremiumState {
  if (typeof window === "undefined") {
    return {
      isPremium: false,
      monthKey: getCurrentMonthKey(),
      freeAnalysisCount: 0,
      focusAnalysisCount: 0,
      streakShields: 3,
    };
  }

  try {
    const stored = localStorage.getItem("bangPremium");
    const state = stored ? JSON.parse(stored) : null;

    if (!state) {
      return {
        isPremium: false,
        monthKey: getCurrentMonthKey(),
        freeAnalysisCount: 0,
        focusAnalysisCount: 0,
        streakShields: 3,
      };
    }

    const currentMonth = getCurrentMonthKey();
    if (state.monthKey !== currentMonth) {
      state.monthKey = currentMonth;
      state.freeAnalysisCount = 0;
      state.focusAnalysisCount = 0;
      state.streakShields = 3;
    }

    return state;
  } catch {
    return {
      isPremium: false,
      monthKey: getCurrentMonthKey(),
      freeAnalysisCount: 0,
      focusAnalysisCount: 0,
      streakShields: 3,
    };
  }
}

function saveState(state: PremiumState) {
  if (typeof window !== "undefined") {
    localStorage.setItem("bangPremium", JSON.stringify(state));
  }
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PremiumState>(loadState());

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  const upgrade = () => {
    const updated = { ...state, isPremium: true };
    setState(updated);
    saveState(updated);
  };

  const downgrade = () => {
    const updated = { ...state, isPremium: false };
    setState(updated);
    saveState(updated);
  };

  const canFreeAnalysis = (): boolean => {
    return state.freeAnalysisCount < 5;
  };

  const canFocusAnalysis = (): boolean => {
    return state.isPremium && state.focusAnalysisCount < 20;
  };

  const useFreeAnalysis = () => {
    const updated = { ...state, freeAnalysisCount: state.freeAnalysisCount + 1 };
    setState(updated);
    saveState(updated);
  };

  const useFocusAnalysis = () => {
    const updated = { ...state, focusAnalysisCount: state.focusAnalysisCount + 1 };
    setState(updated);
    saveState(updated);
  };

  const useStreakShield = (): boolean => {
    if (state.streakShields > 0) {
      const updated = { ...state, streakShields: state.streakShields - 1 };
      setState(updated);
      saveState(updated);
      return true;
    }
    return false;
  };

  const resetIfNewMonth = () => {
    const currentMonth = getCurrentMonthKey();
    if (state.monthKey !== currentMonth) {
      const updated: PremiumState = {
        ...state,
        monthKey: currentMonth,
        freeAnalysisCount: 0,
        focusAnalysisCount: 0,
        streakShields: 3,
      };
      setState(updated);
      saveState(updated);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        state,
        upgrade,
        downgrade,
        canFreeAnalysis,
        canFocusAnalysis,
        useFreeAnalysis,
        useFocusAnalysis,
        useStreakShield,
        resetIfNewMonth,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium must be used within PremiumProvider");
  }
  return context;
}
