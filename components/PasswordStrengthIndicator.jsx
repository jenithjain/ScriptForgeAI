'use client';

import { calculatePasswordStrength } from '@/lib/validations/auth';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function PasswordStrengthIndicator({ password }) {
  const strength = calculatePasswordStrength(password);
  
  if (!password) return null;

  // Password requirements checklist
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (recommended)', met: /[^a-zA-Z0-9]/.test(password), optional: true },
  ];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-semibold ${
            strength.label === 'Weak' ? 'text-red-500' :
            strength.label === 'Fair' ? 'text-orange-500' :
            strength.label === 'Good' ? 'text-yellow-500' :
            strength.label === 'Strong' ? 'text-emerald-500' :
            'text-green-600'
          }`}>
            {strength.label}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs ${
              req.met 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : req.optional 
                ? 'text-muted-foreground/60' 
                : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 opacity-40" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>

      {/* Security tip */}
      {strength.score >= 7 && (
        <div className="flex items-start gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Great! Your password is secure.
          </p>
        </div>
      )}
    </div>
  );
}
