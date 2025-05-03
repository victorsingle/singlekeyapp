import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export function PersonalForm() {
  return (
    <div className="p-4 text-center text-sm text-gray-500">
      Esta aba está desativada.
    </div>
  );
}