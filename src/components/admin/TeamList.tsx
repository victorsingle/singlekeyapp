import React from 'react';
import { Users, Plus, ChevronRight } from 'lucide-react';
import { mockTeams } from './mockData';
import { Link } from 'react-router-dom';

export function TeamList() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-800">Times</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            Novo Time
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {mockTeams.map((team) => (
          <div key={team.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                <div className="mt-1 flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {team.memberCount} membros
                  </span>
                  <span className="text-sm text-gray-500">
                    Líder: {team.leader}
                  </span>
                </div>
              </div>
              <Link
                to={`/admin/teams/${team.id}`}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <span className="text-sm font-medium">Gerenciar</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}