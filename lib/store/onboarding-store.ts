import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Gender, Education, TobaccoType, TTFC, SmokeFreeRecord } from '@/types';

interface ProfileState {
  name: string;
  age: string;
  gender: Gender | '';
  race: string;
  education: Education | '';
  occupation: string;
}

interface HabitsState {
  yearsSmoked: string;
  tobaccoTypes: TobaccoType[];
  cigarettesPd: string;
  vapeSessionsPd: string;
  ttfc: TTFC | '';
  pricePerPack: string;
  cigsPerPack: string;
}

interface PlanState {
  quitDate: string;
  pastAttempts: string;
  longestSmokeFree: SmokeFreeRecord | '';
  readiness: number;
  confidence: number;
  motivations: string[];
  triggers: string[];
  supports: string[];
}

interface OnboardingStore {
  profile: ProfileState;
  habits: HabitsState;
  plan: PlanState;
  setProfile: (data: Partial<ProfileState>) => void;
  setHabits: (data: Partial<HabitsState>) => void;
  setPlan: (data: Partial<PlanState>) => void;
  reset: () => void;
}

const defaultProfile: ProfileState = { name: '', age: '', gender: '', race: '', education: '', occupation: '' };
const defaultHabits: HabitsState = { yearsSmoked: '', tobaccoTypes: [], cigarettesPd: '', vapeSessionsPd: '', ttfc: '', pricePerPack: '', cigsPerPack: '20' };
const defaultPlan: PlanState = { quitDate: '', pastAttempts: '0', longestSmokeFree: '', readiness: 5, confidence: 5, motivations: [], triggers: [], supports: [] };

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      habits: defaultHabits,
      plan: defaultPlan,
      setProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      setHabits: (data) => set((s) => ({ habits: { ...s.habits, ...data } })),
      setPlan: (data) => set((s) => ({ plan: { ...s.plan, ...data } })),
      reset: () => set({ profile: defaultProfile, habits: defaultHabits, plan: defaultPlan }),
    }),
    { name: 'onboarding-store' },
  ),
);
