import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OnboardingStep1 } from '../components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../components/onboarding/OnboardingStep3';
import { useAuthStore } from '../stores/authStore';
import { useOKRStore } from '../stores/okrStore';
import { createTeamsBulk } from '../services/okrService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RadarLoader from '../components/RadarLoader';

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState<{ name: string; description: string }[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isReady, setIsReady] = useState(false);

  const { userId, organizationId, fetchUserData } = useAuthStore();
  const { generateFullOKRStructure, setIsGenerating } = useOKRStore();
  const navigate = useNavigate();

  useEffect(() => {
    const validateSessionAndLoadUser = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session || error) {
        console.warn('[🔒] Sem sessão ativa - redirecionando para login');
        navigate('/login', { replace: true });
        return;
      }

      await fetchUserData();

      let retries = 0;
      while (
        (!useAuthStore.getState().userId || !useAuthStore.getState().organizationId) &&
        retries < 10
      ) {
        await new Promise((res) => setTimeout(res, 100));
        retries++;
      }

      if (!useAuthStore.getState().userId || !useAuthStore.getState().organizationId) {
        toast.error('Erro ao carregar dados do usuário');
        navigate('/login');
        return;
      }

      setIsReady(true);
    };

    validateSessionAndLoadUser();
  }, []);

  async function handleFinish() {
    try {
      setIsGenerating(true);

      await createTeamsBulk(
        teams.map((t) => ({
          name: t.name,
          description: t.description,
          organization_id: organizationId,
        }))
      );

      const cycleId = await generateFullOKRStructure(prompt);

      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('user_id', userId);

      toast.success('OKRs gerados com sucesso!');
      window.dispatchEvent(new CustomEvent('kai:tokens:updated'));
      navigate(`/cycle/${cycleId}`);
    } catch (err) {
      toast.error('Erro ao finalizar onboarding');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RadarLoader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-white via-[#f5f8ff] to-[#e7effc] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl flex flex-col items-center space-y-10">
        {step === 1 && <OnboardingStep1 onNext={() => setStep(2)} />}
        {step === 2 && (
          <OnboardingStep2
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            teams={teams}
            setTeams={setTeams}
          />
        )}
        {step === 3 && (
          <OnboardingStep3
            onBack={() => setStep(2)}
            prompt={prompt}
            setPrompt={setPrompt}
            onFinish={handleFinish}
          />
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={clsx(
                'w-3 h-3 rounded-full transition',
                step === i ? 'bg-blue-600' : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
