import React from 'react';
import { Target } from 'lucide-react';
import { CompanyForm } from './CompanyForm';
import { PersonalForm } from './PersonalForm';
import { useSearchParams } from 'react-router-dom';

export function AuthTabs() {
  const [params] = useSearchParams();
  const inviteMode = params.get('invite') === '1';
  const fromLogin = params.get('from') === 'login';

  const renderLogo = () => (
    <div className="flex items-center justify-center mb-6">
      <Target className="h-8 w-8 text-blue-600 -ml-6" />
      <h1 className="text-2xl font-bold text-gray-900 ml-2">
        SingleKey <sup className="text-xs text-gray-400 ml-1">(Beta)</sup>
      </h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-[#f5f8ff] to-[#e7effc]">
      <div className="mx-auto max-w-md">
        {renderLogo()}
        <div className="bg-white px-6 py-6 shadow-xl rounded-lg">
          {inviteMode ? <PersonalForm /> : <CompanyForm />}
        </div>
      </div>
    </div>
  );
}
