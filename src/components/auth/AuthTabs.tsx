import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { CompanyForm } from './CompanyForm';
import { PersonalForm } from './PersonalForm';
import { useSearchParams } from 'react-router-dom';

export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');
  const [params] = useSearchParams();
  const inviteMode = params.get('invite') === '1';
  const fromLogin = params.get('from') === 'login';

  if (inviteMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Target className="h-8 w-8 text-blue-600 -ml-6" />
            <h1 className="text-2xl font-bold text-gray-900 ml-2">SingleKey</h1>
          </div>
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <PersonalForm />
          </div>
        </div>
      </div>
    );
  }

  if (fromLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Target className="h-8 w-8 text-blue-600 -ml-6" />
            <h1 className="text-2xl font-bold text-gray-900 ml-2">SingleKey</h1>
          </div>
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <CompanyForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Target className="h-8 w-8 text-blue-600 -ml-6" />
          <h1 className="text-2xl font-bold text-gray-900 ml-2">SingleKey</h1>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-1/2 py-4 px-1 text-center text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pessoal
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`w-1/2 py-4 px-1 text-center text-sm font-medium ${
                  activeTab === 'company'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Empresa
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'personal' ? <PersonalForm /> : <CompanyForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
