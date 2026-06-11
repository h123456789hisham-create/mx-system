import React, { useState } from 'react';
import { 
  Users, CreditCard, ShieldAlert, CheckCircle, Clock, Trash2, Key, 
  PhoneCall, DollarSign, Plus, Check, Play, UserPlus, AlertCircle, Edit, Save, Undo
} from 'lucide-react';
import { SystemUser, SaasSettings } from '../types';

interface SaasAdminProps {
  systemUsers: SystemUser[];
  saasSettings: SaasSettings;
  onUpdateUsers: (users: SystemUser[]) => void;
  onUpdateSaasSettings: (settings: SaasSettings) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: 'ar' | 'en';
}

export default function SaasAdmin({
  systemUsers,
  saasSettings,
  onUpdateUsers,
  onUpdateSaasSettings,
  addToast,
  lang
}: SaasAdminProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'plans'>('users');
  const [deletedUserIdConfirm, setDeletedUserIdConfirm] = useState<string | null>(null);

  // Plan Prices Update States
  const [mPrice, setMPrice] = useState(saasSettings.monthlyPrice);
  const [aPrice, setAPrice] = useState(saasSettings.annualPrice);
  const [currency, setCurrency] = useState(saasSettings.currency || 'SDG');
  const [waNumber, setWaNumber] = useState(saasSettings.whatsAppNumber || '+249997444409');
  const [features, setFeatures] = useState<string[]>(saasSettings.featuresList || []);
  const [newFeatureText, setNewFeatureText] = useState('');

  // User Provisioning Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cashier'>('admin');
  const [newUserPlan, setNewUserPlan] = useState<'monthly' | 'annual'>('monthly');
  const [newUserTempPass, setNewUserTempPass] = useState('123');
  const [isTempPassCheck, setIsTempPassCheck] = useState(true);
  const [newUserNotes, setNewUserNotes] = useState('');

  // Searching and Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [subListFilter, setSubListFilter] = useState<'subscribers' | 'all'>('subscribers');

  // Edit Subscriber Modal State
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'cashier'>('admin');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserNotes, setEditUserNotes] = useState('');
  const [editUserPlan, setEditUserPlan] = useState<'monthly' | 'annual' | 'none'>('monthly');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'inactive' | 'expired'>('active');

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserEmail(u.email || '');
    setEditUserPhone(u.phone || '');
    setEditUserRole(u.role || 'admin');
    setEditUserPassword(u.password || '');
    setEditUserNotes(u.notes || '');
    setEditUserPlan(u.subscriptionPlan || 'monthly');
    setEditUserStatus(u.subscriptionStatus || 'active');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserName.trim() || !editUserEmail.trim()) {
      addToast(lang === 'ar' ? 'الرجاء ملء الاسم والبريد الإلكتروني' : 'Name and Email are required', 'error');
      return;
    }

    const updated = systemUsers.map(u => {
      if (u.id === editingUser?.id) {
        return {
          ...u,
          name: editUserName.trim(),
          email: editUserEmail.trim().toLowerCase(),
          phone: editUserPhone.trim(),
          role: editUserRole,
          password: editUserPassword.trim(),
          subscriptionPlan: editUserPlan as any,
          subscriptionStatus: editUserStatus as any,
          notes: editUserNotes.trim()
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setEditingUser(null);
    addToast(lang === 'ar' ? 'تم حفظ تعديلات حساب المشترك بنجاح' : 'Subscriber details updated successfully', 'success');
  };

  const handleSaveSaasSettings = () => {
    onUpdateSaasSettings({
      monthlyPrice: Number(mPrice),
      annualPrice: Number(aPrice),
      currency,
      whatsAppNumber: waNumber.trim(),
      featuresList: features
    });
    addToast(lang === 'ar' ? 'تم حفظ أسعار الخطط والبيانات بنجاح وتعميمها' : 'SaaS pricing details saved successfully', 'success');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = newUserEmail.trim().toLowerCase();
    
    if (systemUsers.some(u => u.email.toLowerCase() === emailLower)) {
      addToast(lang === 'ar' ? 'هذا البريد الإلكتروني مسجل مسبقاً بالنظام!' : 'This email is already registered!', 'error');
      return;
    }

    const duration = newUserPlan === 'monthly' ? 30 : 365;
    const expiryTimestamp = Date.now() + duration * 24 * 60 * 60 * 1000;

    // Generate unique tenantId for independent database partitioning
    const uniqueTenantId = `tenant-${Date.now()}`;

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: emailLower,
      phone: newUserPhone.trim(),
      role: newUserRole,
      password: newUserTempPass || '123',
      isLocked: false,
      subscriptionPlan: newUserPlan,
      subscriptionStatus: 'active',
      subscriptionExpiry: expiryTimestamp,
      isTemporaryPassword: isTempPassCheck,
      tenantId: uniqueTenantId,
      notes: newUserNotes.trim()
    };

    const updated = [newUser, ...systemUsers];
    onUpdateUsers(updated);
    addToast(lang === 'ar' ? `تم تسجيل وتفعيل حساب ${newUser.name} بنجاح` : `User ${newUser.name} created and activated`, 'success');
    
    // Clear Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPlan('monthly');
    setNewUserTempPass('123');
    setNewUserNotes('');
    setShowAddForm(false);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleExtendSubscription = (userId: string, days: number) => {
    const updated = systemUsers.map(u => {
      if (u.id === userId) {
        const currentExpiry = u.subscriptionExpiry && u.subscriptionExpiry > Date.now() 
          ? u.subscriptionExpiry 
          : Date.now();
        const newExpiry = currentExpiry + days * 24 * 60 * 60 * 1000;
        return {
          ...u,
          subscriptionStatus: 'active' as const,
          subscriptionExpiry: newExpiry
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    addToast(lang === 'ar' ? `تم تمديد صلاحية المشترك بـ ${days} يوم نجاحاً` : `Subscription extended by ${days} days`, 'success');
  };

  const handleToggleDeactivate = (userId: string) => {
    const updated = systemUsers.map(u => {
      if (u.id === userId) {
        const isCurrentActive = u.subscriptionStatus === 'active';
        return {
          ...u,
          subscriptionStatus: isCurrentActive ? ('inactive' as const) : ('active' as const),
          subscriptionExpiry: isCurrentActive ? Date.now() : Date.now() + 30 * 24 * 60 * 60 * 1000
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    addToast(lang === 'ar' ? 'تم تعديل حالة تفعيل حساب المشترك' : 'Subscriber activation status toggled', 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const userToDel = systemUsers.find(u => u.id === userId);
    if (userToDel?.email === 'hisham.yo005@gmail.com') {
      addToast(lang === 'ar' ? 'لا يمكن حذف حساب المالك الرئيسي للمشروع!' : 'Cannot delete SuperAdmin main account!', 'error');
      return;
    }
    
    if (deletedUserIdConfirm === userId) {
      const updated = systemUsers.filter(u => u.id !== userId);
      onUpdateUsers(updated);
      addToast(lang === 'ar' ? 'تم إقصاء وحذف حساب المستخدم بنجاح' : 'User account removed successfully', 'success');
      setDeletedUserIdConfirm(null);
    } else {
      setDeletedUserIdConfirm(userId);
      addToast(
        lang === 'ar' 
          ? 'تأكيد الحذف: يرجى النقر على زر الحذف (الأحمر) مرة أخرى تأكيداً نهائياً للحذف!' 
          : 'Confirm Delete: Click the trash icon again to verify deletion!', 
        'info'
      );
      // Auto cancel after 5 seconds of inactivity
      setTimeout(() => {
        setDeletedUserIdConfirm(prev => prev === userId ? null : prev);
      }, 5000);
    }
  };

  const handleTriggerTempPass = (userId: string) => {
    const tempPass = prompt(lang === 'ar' ? 'أدخل كلمة المرور المؤقتة الجديدة المقترحة للمشترك:' : 'Enter temporary password for subscriber:', '123456');
    if (tempPass === null) return;
    if (!tempPass.trim()) {
      addToast(lang === 'ar' ? 'لا يمكن ترك حقل كلمة المرور فارغاً' : 'Password cannot be empty', 'error');
      return;
    }
    const updated = systemUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: tempPass.trim(),
          isTemporaryPassword: true
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    addToast(lang === 'ar' ? 'تم تحديث كلمة المرور مؤقتاً وسيُجبر المستخدم على تغييرها فور تسجيل دخوله' : 'Temporary password reset successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4" dir="rtl">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-blue-950 p-6 rounded-3xl text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-sm text-white">
                SaaS Owner Console
              </span>
              <span className="text-gray-450 text-[11px] font-mono">🔒 لوحة خاصة وحصرية</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">اللوحة العليا لإدارة وتخويل باقات المشتركين الماليين</h1>
            <p className="text-xs text-gray-300">
              تحكم كامل في أسعار الاشتراك، تفعيل الإيميلات الجديدة، مراجعة وتمديد الحسابات المنتهية وصدار الباسوردات المؤقتة.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" />
              <span>المشتركين والولوج ({systemUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'plans' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 inline mr-1" />
              <span>تهيئة تسعير الخطط والواتساب</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-6">
          {/* Action Header & Add Form Toggle */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0071e3]" />
                <span>قائمة وملايا الحسابات المسجلة للشركات والمستخدمين</span>
              </h2>
              <p className="text-[10px] text-gray-500">حسابات الإدارة والمبيعات المأذون لها بالولوج مع التتبع الزمني</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 border border-gray-200 bg-[#f5f5f7] hover:bg-[#e2e2e7] text-[#1d1d1f] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>{showAddForm ? 'إخفاء الفورم' : 'تفعيل إيميل مشترك جديد'}</span>
            </button>
          </div>

          {/* User provisioning expand form */}
          {showAddForm && (
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md">
              <div className="border-b pb-3 mb-4">
                <h3 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>توليد وترخيص حساب تجاري جديد للمشترك</span>
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">عند تفعيل الموظف، يتم إقران مدة صلاحية الخطة فورياً بالاشتراك الجاري للبريد الإلكتروني</p>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-gray-650 block">اسم المشترك / المؤسسة الأصلي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة الرواد التقنية"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-655 block">البريد الإلكتروني (إيميل الدخول):</label>
                  <input
                    type="email"
                    required
                    placeholder="example@mail.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">رقم الجوال (للتواصل أو التحويل):</label>
                  <input
                    type="text"
                    placeholder="مثال: +249912345678"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-blue-500 outline-none font-mono text-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">صلاحية النظام الافتراضية:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="admin">مدير تجاري عام (Full Corporate)</option>
                    <option value="cashier">كاشير محطة مبيعات (POS Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">حزمة الاشتراك المراد شرائها:</label>
                  <select
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="monthly">باقة اشتراك شهري (٣٠ يوم)</option>
                    <option value="annual">باقة اشتراك سنوي مميز (٣٦٥ يوم)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block">كلمة مرور مؤقتة للولوج لأول مرة:</label>
                  <input
                    type="text"
                    required
                    value={newUserTempPass}
                    onChange={(e) => setNewUserTempPass(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:border-blue-500 outline-none text-blue-600"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-gray-650 block">ملاحظات أو بيانات إضافية (موقع/تفاصيل):</label>
                  <input
                    type="text"
                    placeholder="موقع المحل، اسم الشخص الممثل، إلخ..."
                    value={newUserNotes}
                    onChange={(e) => setNewUserNotes(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="tempPassCheck"
                    checked={isTempPassCheck}
                    onChange={(e) => setIsTempPassCheck(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="tempPassCheck" className="text-xs text-gray-700 cursor-pointer user-select-none">
                    إجبار المستخدم على تغيير كلمة المرور هذه بمجرد دخوله للنظام لأول مرة (حماية أمنية)
                  </label>
                </div>

                <div className="lg:col-span-1 pt-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition"
                  >
                    🚀 توليد الحساب وجعله نشطاً
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search, Filter Tabs & Core Database Table */}
          <div className="space-y-4">
            {/* Real-time search & subset toggle */}
            <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSubListFilter('subscribers')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all ${
                    subListFilter === 'subscribers'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🚀 المشتركون الفعليون فقط ({systemUsers.filter(u => u.email.trim().toLowerCase() !== 'hisham.yo005@gmail.com' && (u.subscriptionPlan === 'monthly' || u.subscriptionPlan === 'annual')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubListFilter('all')}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all ${
                    subListFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  👥 جميع الحسابات ({systemUsers.length})
                </button>
              </div>

              {/* Dynamic search bar */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="ابحث بالاسم، بريد، جوال المشترك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pr-4 pl-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-[#d2d2d7] rounded-xl focus:border-blue-600 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Main Subscribed Users Grid & Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="text-xs font-extrabold text-gray-800">
                  {subListFilter === 'subscribers' ? 'سجل المشتركين الفعليين بالباقات والخطط' : 'كافة حسابات مستخدمي النظام الأساسي'}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  السجلات المطابقة: {
                    systemUsers.filter(u => {
                      const isSuper = u.email.trim().toLowerCase() === 'hisham.yo005@gmail.com';
                      if (subListFilter === 'subscribers') {
                        return !isSuper && (u.subscriptionPlan === 'monthly' || u.subscriptionPlan === 'annual');
                      }
                      return true;
                    }).filter(u => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q));
                    }).length
                  }
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-gray-100/75 border-b border-gray-200 text-gray-450 font-black">
                      <th className="p-3 text-right">المشترك / اسم الشركة</th>
                      <th className="p-3 text-right">البريد الإلكتروني للولوج</th>
                      <th className="p-3 text-right">الهاتف / الجوال</th>
                      <th className="p-3 text-center">نوع وباقة الخطة</th>
                      <th className="p-3 text-center">حالة الاشتراك</th>
                      <th className="p-3 text-right">تاريخ الانتهاء والصلاحية</th>
                      <th className="p-3 text-right">ملاحظات</th>
                      <th className="p-3 text-center">أمن الحساب</th>
                      <th className="p-3 text-center">إدارة وتعديل المشترك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {systemUsers
                      .filter(u => {
                        const isSuper = u.email.trim().toLowerCase() === 'hisham.yo005@gmail.com';
                        if (subListFilter === 'subscribers') {
                          return !isSuper && (u.subscriptionPlan === 'monthly' || u.subscriptionPlan === 'annual');
                        }
                        return true;
                      })
                      .filter(u => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || (u.notes && u.notes.toLowerCase().includes(q));
                      })
                      .map(u => {
                        const isMainOwner = u.email.trim().toLowerCase() === 'hisham.yo005@gmail.com';
                        const isSessActive = u.subscriptionStatus === 'active';
                        
                        // Expiry calculations
                        const isExpired = u.subscriptionExpiry ? u.subscriptionExpiry < Date.now() : false;
                        const formattedDate = u.subscriptionExpiry 
                          ? new Date(u.subscriptionExpiry).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'مدى الحياة (مالك)';
                        
                        // Badge Determination
                        let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                        let statusLabel = 'نشط فعال 🟢';
                        
                        if (isMainOwner) {
                          badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                          statusLabel = 'مالك رئيسي 👑';
                        } else if (u.subscriptionStatus === 'inactive') {
                          badgeColor = 'bg-gray-100 text-gray-600 border-gray-250';
                          statusLabel = 'معطل مؤقتاً 🚫';
                        } else if (isExpired) {
                          badgeColor = 'bg-red-50 text-red-600 border-red-150 animate-pulse';
                          statusLabel = 'منتهي الصلاحية ⚠️';
                        }

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3">
                              <div className="font-bold text-gray-950 flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isMainOwner ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                                <div className="flex flex-col">
                                  <span>{u.name}</span>
                                  {u.tenantId && (
                                    <span className="text-[9px] font-mono text-gray-400 font-medium">مستأجر: {u.tenantId}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-600">{u.email}</td>
                            <td className="p-3">
                              {u.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-gray-900 font-bold">{u.phone}</span>
                                  <a
                                    href={`https://wa.me/${u.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition"
                                    title="مراسلة عبر واتساب"
                                  >
                                    <span className="text-[10px]">💬واتساب</span>
                                  </a>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isMainOwner ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">مطلق الصلاحية</span>
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  u.subscriptionPlan === 'annual' ? 'bg-orange-50 text-orange-700 font-black' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {u.subscriptionPlan === 'annual' ? 'باقة سنوية ⭐️' : 'باقة شهرية 📅'}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-gray-600">
                              {isMainOwner ? (
                                <span className="text-blue-600">صلاحية مطلقة</span>
                              ) : (
                                <div className="flex flex-col text-[11px]">
                                  <span className="text-gray-950 font-black">{formattedDate}</span>
                                  {u.subscriptionExpiry && (
                                    <span className="text-[9.5px] text-gray-400">
                                      {isExpired 
                                        ? `منتهي منذ ${Math.ceil((Date.now() - u.subscriptionExpiry) / (1000 * 60 * 60 * 24))} يوم`
                                        : `متبقي له ${Math.ceil((u.subscriptionExpiry - Date.now()) / (1000 * 60 * 60 * 24))} يوم`
                                      }
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-gray-600 truncate max-w-[140px]" title={u.notes}>
                              {u.notes || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="p-3 text-center">
                              {u.isTemporaryPassword ? (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-150 rounded text-[9.5px] tracking-wide font-black">
                                  🔒 يستلزم تغييره
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9.5px]">
                                  ✔ آمن ومستقر
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isMainOwner ? (
                                <span className="text-[10px] text-gray-405 font-medium">ملك محمي</span>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Quick Extend 30 Days */}
                                  <button
                                    type="button"
                                    onClick={() => handleExtendSubscription(u.id, 30)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold transition"
                                    title="تمديد شهر كامل (30 يوم)"
                                  >
                                    + ٣٠ يوم
                                  </button>

                                  {/* Quick Extend 365 Days */}
                                  <button
                                    type="button"
                                    onClick={() => handleExtendSubscription(u.id, 365)}
                                    className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[10px] font-bold transition"
                                    title="تمديد سنة كاملة (365 يوم)"
                                  >
                                    + عام كامل
                                  </button>

                                  {/* Toggle Active status */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDeactivate(u.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                      u.subscriptionStatus === 'inactive'
                                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                    }`}
                                  >
                                    {u.subscriptionStatus === 'inactive' ? 'إعادة التنشيط' : 'تعطيل مؤقت'}
                                  </button>

                                  {/* Edit Details */}
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(u)}
                                    className="p-1 px-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[10.5px] font-bold transition flex items-center gap-1"
                                    title="تعديل كافة بيانات هذا المشترك"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>

                                  {/* Change password / set temp */}
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerTempPass(u.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="تعيين رمز ممر مؤقت"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Remove subscriber */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id)}
                                    className={`p-1.5 rounded transition font-bold flex items-center gap-1 ${
                                      deletedUserIdConfirm === u.id 
                                        ? 'bg-red-600 text-white animate-bounce text-[10px] px-2 shadow-xs' 
                                        : 'text-red-600 hover:bg-red-50'
                                    }`}
                                    title={deletedUserIdConfirm === u.id ? "انقر مجددا لتأكيد الحذف النهائي" : "حذف بالكلية من السجلات"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deletedUserIdConfirm === u.id && <span>تأكيد الحذف؟</span>}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SAAS SETTINGS FORM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prices input card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-md space-y-5">
            <div className="border-b pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>إعداد التسعير ومحددات الباقات لخطط الاشتراك</span>
              </h2>
              <p className="text-[10px] text-gray-500">هذه التفاصيل هي ما يظهر مباشرة لزوار المحاسبة عند انتهاء اشتراكاتهم</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
              <div className="space-y-1.5">
                <label className="block">قيمة تسعيرة الاشتراك الشهري الأصلي:</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={mPrice}
                    onChange={(e) => setMPrice(Number(e.target.value))}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] pr-3 pl-14 py-2.5 focus:border-blue-500 outline-none rounded-xl text-xs font-black font-mono text-gray-900"
                  />
                  <span className="absolute left-3 top-3 text-[10px] font-black text-gray-400 font-mono">{currency}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block">قيمة تسعيرة الاشتراك السنوي المميز:</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={aPrice}
                    onChange={(e) => setAPrice(Number(e.target.value))}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] pr-3 pl-14 py-2.5 focus:border-blue-500 outline-none rounded-xl text-xs font-black font-mono text-gray-900"
                  />
                  <span className="absolute left-3 top-3 text-[10px] font-black text-gray-400 font-mono">{currency}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block">رمز وصياغة العملة المعتمدة:</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="SDG"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 rounded-xl text-xs font-black focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">رقم هاتف الواتساب لتسلم المدخرات وإشعارات البنك:</label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="+249997444409"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] text-left px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:border-blue-500 outline-none"
                />
                <p className="text-[9.5px] text-gray-400 mt-1">يلزم كتابة الرقم بالرمز الدولي كاملاً دون مسافات (مثال: +249...)</p>
              </div>
            </div>

            <button
              onClick={handleSaveSaasSettings}
              className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-black tracking-wide shadow-md transition"
            >
              ✔ حفظ وتطبيق الأسعار والبيانات فورياً
            </button>
          </div>

          {/* Features list management banner */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-md space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>ميزات ومزايا باقات الاشتراك المتعددة:</span>
              </h3>
              <p className="text-[10px] text-gray-500">قم بتعديل المزايا المعروضة في بطاقات الاشتراك المميز:</p>
            </div>

            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#f5f5f7] p-2.5 rounded-xl border border-gray-150 text-xs">
                  <span className="text-gray-800 font-semibold">{feat}</span>
                  <button
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                placeholder="أضف ميزة جديدة ممتازة..."
                className="flex-1 bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-[11px] outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                onClick={handleAddFeature}
                className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" dir="rtl">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/75">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>تعديل وحوكمة حساب المشترك: {editingUser.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-gray-400 hover:bg-slate-200/85 hover:text-slate-900 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs font-bold text-gray-700 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-gray-600">اسم الموظف / المؤسسة:</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">البريد الإلكتروني للوج:</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-semibold focus:border-blue-500 outline-none font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">رقم جوال العميل (بالرمز الدولي):</label>
                  <input
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    placeholder="+249912345678"
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-semibold focus:border-blue-500 outline-none font-mono text-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">كلمة المرور الحالية/الجديدة:</label>
                  <input
                    type="text"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-medium focus:border-blue-500 outline-none font-mono text-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">صلاحية الحساب بالنظام:</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="admin">مدير تجاري عام (Full Admin)</option>
                    <option value="cashier">كاشير محطة مبيعات (Cashier)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">باقة الاشتراك المميز:</label>
                  <select
                    value={editUserPlan}
                    onChange={(e) => setEditUserPlan(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="monthly">باقة اشتراك شهري</option>
                    <option value="annual">باقة اشتراك سنوي مميز</option>
                    <option value="none">بدون باقة اشتراك (معطل)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600">حالة التفعيل والنشاط:</label>
                  <select
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value as any)}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="active">نشط وفعال ومفعل 🟢</option>
                    <option value="inactive">معطل مؤقتاً ومحجوب 🚫</option>
                    <option value="expired">منتهي الصلاحية ⚠️</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-600">ملاحظات إضافية بخصوص المشترك:</label>
                <textarea
                  rows={2}
                  value={editUserNotes}
                  onChange={(e) => setEditUserNotes(e.target.value)}
                  placeholder="سجل أي ملاحظات خاصة بالفرع أو طريقة الدفع هنا..."
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-medium focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100 flex-row-reverse">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
                >
                  ✔ حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-200 transition"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
