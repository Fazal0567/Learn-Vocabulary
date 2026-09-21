import React, { useState } from 'react';
import { KeyRound, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ChangeAdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onUpdatePin: (newPin: string) => void;
}

export const ChangeAdminPasscodeModal: React.FC<ChangeAdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  onUpdatePin,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPins, setShowPins] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (oldPin.trim() !== currentPin.trim()) {
      setError('Current admin passcode is incorrect.');
      return;
    }

    if (!newPin.trim() || newPin.trim().length < 4) {
      setError('New passcode must be at least 4 characters long.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('New passcode and confirmation do not match.');
      return;
    }

    onUpdatePin(newPin.trim());
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Change Admin Passcode
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Set a secure passcode for admin actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Admin passcode updated successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Current Passcode
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Enter current passcode..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                New Passcode (min. 4 chars)
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new passcode..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Confirm New Passcode
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter new passcode..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
              >
                {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPins ? 'Hide characters' : 'Show characters'}</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all"
              >
                Update Passcode
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
