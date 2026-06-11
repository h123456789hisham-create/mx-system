import React, { useState } from 'react';
import { Key, ShieldAlert, Check, RefreshCw, Lock } from 'lucide-react';
import { SystemUser } from '../types';

interface SaasPasswordResetModalProps {
  currentUser: SystemUser;
  onUpdateUsers: (users: SystemUser[]) => void;
  systemUsers: SystemUser[];
  onPasswordChanged: (updatedUser: SystemUser) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: 'ar' | 'en';
}

export default function SaasPasswordResetModal({
  currentUser,
  onUpdateUsers,
  systemUsers,
  onPasswordChanged,
  addToast,
  lang
}: SaasPasswordResetModalProps) {
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassInput || !newPass || !confirmPass) {
      setErrorMsg(lang === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (currentPassInput !== currentUser.password) {
      setErrorMsg(lang === 'ar' ? 'كلمة المرور المؤقتة الحالية التي أدخلتها غير صحيحة!' : 'Incorrect current temporary password');
      return;
    }

    if (newPass.length < 4) {
      setErrorMsg(lang === 'ar' ? 'كلمة المرور الجديدة يجب أن لا تقل عن ٤ رموز لحماية حسابك' : 'New password must be at least 4 characters');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg(lang === 'ar' ? 'كلمتا المرور الجديدتان المتطابقتان لا تتماثلان، أعد الكتابة!' : 'New passwords do not match');
      return;
    }

    if (newPass === currentUser.password) {
      setErrorMsg(lang === 'ar' ? 'لا يمكنك استخدام نفس كلمة المرور المؤقتة السابقة، اختر كلمة مرور جديدة قوية!' : 'New password cannot be the same as the temporary password');
      return;
    }

    // Success - update the user object
    const updatedUser: SystemUser = {
      ...currentUser,
      password: newPass,
      isTemporaryPassword: false
    };

    const updatedUsersList = systemUsers.map(u => u.id === currentUser.id ? updatedUser : u);
    
    // Propagate changes
    onUpdateUsers(updatedUsersList);
    onPasswordChanged(updatedUser);
    
    addToast(lang === 'ar' ? 'تم تحديث كلمة المرور وحفظ حسابك بنشاط وأمان بنجاح!' : 'Password updated securely!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-[#121212]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-250 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute left-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">حماية الحساب: تحديث كلمة المرور</h2>
          <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm mx-auto">
            أهلاً بك <strong>{currentUser.name}</strong>. يرجى استبدال كلمة المرور المؤقتة المعينة من قِبل الإدارة بكلمة مرور جديدة دائمة تضمن بها أمان حسابك وتفرّد بياناتك قبل الدخول للنظم.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-650 border border-red-150 rounded-xl flex items-center gap-2 text-xs font-bold leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-gray-650">كلمة المرور المؤقتة الحالية (التي دخلت بها):</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassInput}
              onChange={(e) => setCurrentPassInput(e.target.value)}
              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3.5 py-3 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-gray-655">كلمة المرور الجديدة الدائمة:</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3.5 py-3 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-blue-600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-gray-650">تأكيد كلمة المرور الجديدة مرة أخرى:</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3.5 py-3 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-500 text-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>تحديث كلمة المرور والولوج المباشر للنظام الآمن</span>
          </button>
        </form>
      </div>
    </div>
  );
}
