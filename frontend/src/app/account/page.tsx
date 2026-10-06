'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  User,
  ShieldCheck,
  CreditCard,
  MapPin,
  FileText,
  Bell,
  HeartPulse,
  Lock,
  ArrowRight,
  Check,
  ChevronRight,
  CalendarCheck,
  Download,
  Printer,
  Trash2,
  Plus,
  X,
  ExternalLink,
  AlertCircle,
  QrCode,
  Calendar,
  LogOut,
  KeyRound,
  MonitorSmartphone,
  AlertTriangle,
  Loader2,
  RefreshCw,
  History,
} from 'lucide-react';
import { CustomDropdown } from '@/components/custom-dropdown';
import { useAuth } from '@/lib/auth-context';
import { accountApi, authApi, ApiError, SessionInfo, LoginHistoryItem } from '@/lib/api-client';
import { PasswordField, SubmitButton, FormAlert } from '@/components/auth/auth-ui';

const InteractivePinMap = dynamic(
  () => import('@/components/interactive-pin-map').then((mod) => mod.InteractivePinMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-lg border border-warm-border bg-tebu-100 flex items-center justify-center text-xs text-warm-muted animate-pulse">
        Memuat peta interaktif...
      </div>
    ),
  }
);

interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  city: string;
  fullAddress: string;
  notes?: string;
  isPrimary: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface InvoiceItem {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: string;
  plan: string;
  cycle: string;
  status: 'Lunas (Settled)' | 'Menunggu pembayaran';
  paymentMethod: string;
  subtotal: string;
  taxPpn: string;
  discount: string;
}

export default function AccountDashboardPage() {
  const { status, user, reload, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'HEALTH' | 'INVOICES' | 'ADDRESSES'>('PROFILE');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile states
  const [fullName, setFullName] = useState(user?.fullName || 'Pelanggan NutriDaily');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [joinedDate, setJoinedDate] = useState('01 Oktober 2026');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync when user loads
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhoneNumber(user.phone || '');
      if (user.createdAt) {
        setJoinedDate(
          new Date(user.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        );
      }
    }
  }, [user]);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loadingLoginHistory, setLoadingLoginHistory] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSessions = React.useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await accountApi.sessions();
      setSessions(res.sessions);
    } catch {
      // silent fallback
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchLoginHistory = React.useCallback(async () => {
    setLoadingLoginHistory(true);
    try {
      const res = await accountApi.loginHistory();
      setLoginHistory(res.history);
    } catch {
      // silent fallback
    } finally {
      setLoadingLoginHistory(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'SECURITY') {
      void fetchSessions();
      void fetchLoginHistory();
    }
  }, [activeTab, fetchSessions, fetchLoginHistory]);

  // Preferences states
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [waReminder, setWaReminder] = useState<boolean>(true);
  const [allergyNotification, setAllergyNotification] = useState<boolean>(true);

  // Address modal states
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState('');
  const [newRecipient, setNewRecipient] = useState('Joshua M.');
  const [newPhone, setNewPhone] = useState('+62 812-9842-1084');
  const [newCity, setNewCity] = useState('Jakarta Selatan');
  const [newStreet, setNewStreet] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [isPinMapActive, setIsPinMapActive] = useState<boolean>(false);
  const [pinnedCoordinates, setPinnedCoordinates] = useState<{ lat: number; lng: number }>({
    lat: -6.2254,
    lng: 106.8091,
  });

  // Invoice viewer modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Saved addresses list
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    {
      id: 'addr-1',
      label: 'Kantor SCBD',
      recipient: 'Joshua M. (Lobby Reception)',
      phone: '+62 812-9842-1084',
      city: 'Jakarta Selatan',
      fullAddress: 'Pacific Century Tower Lt. 18, Jl. Jend. Sudirman Kav. 52-53, Senayan',
      notes: 'Titip di resepsionis lobi utama lantai ground.',
      isPrimary: true,
      coordinates: { lat: -6.2254, lng: 106.8091 },
    },
    {
      id: 'addr-2',
      label: 'Apartemen Senopati',
      recipient: 'Joshua M.',
      phone: '+62 812-9842-1084',
      city: 'Jakarta Selatan',
      fullAddress: 'Senopati Suites Tower 1 Unit 12B, Kebayoran Baru',
      notes: 'Titip di pos sekuriti gerbang selatan jika tidak di tempat.',
      isPrimary: false,
      coordinates: { lat: -6.2285, lng: 106.8052 },
    },
  ]);

  // Invoice list
  const [invoices] = useState<InvoiceItem[]>([
    {
      invoiceNumber: 'INV/ND/20261003/001',
      date: '03 Oktober 2026',
      dueDate: '03 Oktober 2026',
      amount: 'Rp 1.530.000',
      plan: 'Weight loss (lean & sculpt)',
      cycle: '20 hari kerja (Makan siang)',
      status: 'Lunas (Settled)',
      paymentMethod: 'BCA Virtual Account (Midtrans Snap)',
      subtotal: 'Rp 1.378.378',
      taxPpn: 'Rp 151.622',
      discount: 'Rp 0',
    },
    {
      invoiceNumber: 'INV/ND/20260903/089',
      date: '03 September 2026',
      dueDate: '03 September 2026',
      amount: 'Rp 1.530.000',
      plan: 'Weight loss (lean & sculpt)',
      cycle: '20 hari kerja (Makan siang)',
      status: 'Lunas (Settled)',
      paymentMethod: 'Mandiri Bill Payment',
      subtotal: 'Rp 1.378.378',
      taxPpn: 'Rp 151.622',
      discount: 'Rp 0',
    },
    {
      invoiceNumber: 'INV/ND/20260803/042',
      date: '03 Agustus 2026',
      dueDate: '03 Agustus 2026',
      amount: 'Rp 1.700.000',
      plan: 'Vitality daily (balanced nutrition)',
      cycle: '20 hari kerja (Makan siang)',
      status: 'Lunas (Settled)',
      paymentMethod: 'GoPay QRIS',
      subtotal: 'Rp 1.531.531',
      taxPpn: 'Rp 168.469',
      discount: 'Rp 0',
    },
  ]);

  // Clinical profile data
  const healthProfile = {
    heightCm: 174,
    weightKg: 72,
    bmi: 23.8,
    bmiCategory: 'Ideal normal (Indeks Asia-Pasifik)',
    age: 29,
    gender: 'Pria',
    tdeeKcal: 2350,
    targetCalories: 1380,
    macroDistribution: {
      protein: '120g (35%)',
      carbs: '138g (40%)',
      fats: '38g (25%)',
    },
    allergies: ['Kacang tanah (Peanut allergy)'],
    medicalConditions: ['Hipertensi primer grade 1'],
    encryptedNotesDecrypted:
      'Konsultasi tele-gizi 15 September 2026: Disarankan pola makan rendah natrium di bawah 1.400mg per hari, perbanyak kalium dari bayam dan ubi, hindari penyedap sintetis dan kecap asin tinggi garam.',
    lastNutritionistReview: '20 September 2026',
    doctorInCharge: 'dr. Raymond Halim, Sp.GK, M.Gizi',
    sipNumber: 'SIP: 446/1829/DKS/2024',
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await accountApi.updateProfile({ fullName: fullName.trim(), phone: phoneNumber.trim() });
      await reload();
      showToast('success', 'Data profil dan informasi kontak berhasil diperbarui.');
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFieldErrors({});
    if (newPassword !== confirmNewPassword) {
      setPasswordFieldErrors({ confirmPassword: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    setChangingPassword(true);
    try {
      await accountApi.changePassword(currentPassword, newPassword, confirmNewPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('success', 'Kata sandi berhasil diperbarui. Seluruh sesi lain telah dibatalkan demi keamanan.');
      void fetchSessions();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          const map: Record<string, string> = {};
          for (const fe of err.fieldErrors) map[fe.field] = fe.message;
          setPasswordFieldErrors(map);
        }
        showToast('error', err.message);
      } else {
        showToast('error', 'Gagal mengubah kata sandi. Silakan coba lagi.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAllOther = async () => {
    setRevokingSessions(true);
    try {
      await authApi.logoutAll();
      showToast('success', 'Seluruh sesi login perangkat lain berhasil dibatalkan.');
      await fetchSessions();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Gagal membatalkan sesi perangkat.');
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (deleteConfirmationPhrase.trim() !== 'HAPUS AKUN SAYA') {
      setDeleteError('Ketik tepat frasa "HAPUS AKUN SAYA" untuk mengonfirmasi.');
      return;
    }
    setDeletingAccount(true);
    try {
      await accountApi.deleteAccount(deletePassword, deleteConfirmationPhrase.trim());
      await logout();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Gagal memproses penghapusan akun.');
      setDeletingAccount(false);
    }
  };

  const handleSavePreferences = () => {
    showToast('success', 'Preferensi notifikasi WhatsApp dan pembaruan otomatis berhasil disimpan.');
  };

  const handleSetPrimaryAddress = (id: string) => {
    setSavedAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isPrimary: addr.id === id,
      }))
    );
    showToast('success', 'Alamat pengantaran utama berhasil diubah.');
  };

  const handleDeleteAddress = (id: string) => {
    const target = savedAddresses.find((a) => a.id === id);
    if (target?.isPrimary) {
      showToast('error', 'Alamat utama tidak dapat dihapus. Silakan pilih alamat utama baru terlebih dahulu.');
      return;
    }
    setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
    showToast('success', `Alamat "${target?.label}" berhasil dihapus.`);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newStreet.trim()) {
      showToast('error', 'Silakan lengkapi label dan detail jalan alamat Anda.');
      return;
    }

    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: newLabel.trim(),
      recipient: newRecipient.trim(),
      phone: newPhone.trim(),
      city: newCity,
      fullAddress: `${newStreet.trim()}, ${newCity}`,
      notes: newNotes.trim() || undefined,
      isPrimary: newIsPrimary || savedAddresses.length === 0,
      coordinates: isPinMapActive ? pinnedCoordinates : undefined,
    };

    if (newAddr.isPrimary) {
      setSavedAddresses((prev) => [
        newAddr,
        ...prev.map((a) => ({ ...a, isPrimary: false })),
      ]);
    } else {
      setSavedAddresses((prev) => [...prev, newAddr]);
    }

    setIsAddAddressModalOpen(false);
    setNewLabel('');
    setNewStreet('');
    setNewNotes('');
    setNewIsPrimary(false);
    setIsPinMapActive(false);
    showToast('success', `Alamat baru "${newAddr.label}" berhasil disimpan.`);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-forest" aria-hidden="true" />
        <p className="text-xs font-medium text-warm-muted">Memuat data akun NutriDaily Anda...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-forest-subtle border border-forest-border flex items-center justify-center mx-auto text-forest">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="eyebrow text-forest">Pusat kendali akun</p>
          <h1 className="font-display text-2xl md:text-3xl text-warm-black [text-wrap:balance]">
            Masuk untuk mengakses dashboard akun Anda
          </h1>
          <p className="text-sm text-warm-muted [text-wrap:pretty] max-w-lg mx-auto">
            Sesuai regulasi UU PDP No. 27/2022, rekam gizi medis terenkripsi, status langganan, dan riwayat faktur pembayaran hanya dapat diakses setelah akun terverifikasi masuk.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/account/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-sm font-semibold transition-colors shadow-natural text-center"
          >
            Masuk ke akun sekarang
          </Link>
          <Link
            href="/account/register"
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-sm font-semibold transition-colors shadow-natural text-center"
          >
            Daftar akun baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-6">
      {/* Title & Navigation Hierarchy */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-warm-border">
        <div className="space-y-1">
          <p className="eyebrow text-forest">Pusat kendali akun</p>
          <h1 className="font-display text-2xl md:text-3xl text-warm-black text-balance">
            Dashboard akun dan data kesehatan Anda.
          </h1>
          <p className="text-xs text-warm-muted text-pretty">
            Kelola data pribadi, rekam medis terenkripsi AES-256-GCM, dan riwayat faktur pembayaran resmi NutriDaily.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-warm-surface border border-warm-border hover:bg-tebu-100 rounded-md text-xs font-semibold text-warm-black transition-colors shadow-natural shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-forest" />
            <span>Atur jadwal langganan</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = '/account/login';
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-warm-surface border border-warm-border hover:bg-tebu-100 rounded-md text-xs font-semibold text-warm-muted hover:text-terracotta transition-colors shadow-natural shrink-0 cursor-pointer"
            title="Keluar dari akun Anda"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Notification */}
      {feedbackMessage && (
        <div
          role="status"
          className={`p-3.5 border text-xs rounded-lg flex items-center justify-between gap-2 animate-toast shadow-natural ${
            feedbackMessage.type === 'success'
              ? 'bg-forest-subtle border-forest-border text-forest'
              : 'bg-terracotta-subtle border-terracotta-border text-terracotta'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-current opacity-70 hover:opacity-100"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Module Tiles: Responsive grid, eliminates horizontal scrolling */}
      <nav aria-label="Navigasi modul akun" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          {
            id: 'PROFILE',
            title: 'Profil & langganan',
            desc: 'Data diri & paket katering',
            icon: User,
          },
          {
            id: 'SECURITY',
            title: 'Keamanan & sesi',
            desc: 'Kata sandi & perangkat login',
            icon: ShieldCheck,
          },
          {
            id: 'HEALTH',
            title: 'Rekam gizi medis',
            desc: 'Metrik tubuh & UU PDP',
            icon: HeartPulse,
          },
          {
            id: 'INVOICES',
            title: 'Riwayat faktur',
            desc: 'Bukti bayar resmi & pajak',
            icon: FileText,
          },
          {
            id: 'ADDRESSES',
            title: 'Alamat pengantaran',
            desc: 'Area Jadetabek & titik pin',
            icon: MapPin,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-[14px] border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer shadow-natural-sm ${
                isActive
                  ? 'bg-forest text-tebu-50 border-forest shadow-natural ring-2 ring-forest/20'
                  : 'bg-warm-surface text-warm-black border-warm-border hover:bg-tebu-100 hover:border-warm-neutral'
              } ${tab.id === 'ADDRESSES' ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-forest-active text-tebu-50'
                      : 'bg-tebu-50 text-forest border border-warm-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-forest-active text-tebu-100">
                    Aktif
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold block leading-snug">
                  {tab.title}
                </span>
                <span
                  className={`text-[11px] block mt-0.5 leading-snug ${
                    isActive ? 'text-tebu-200' : 'text-warm-muted'
                  }`}
                >
                  {tab.desc}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Tab 1: Profile & Subscription Overview */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {/* Active Subscription Summary */}
          <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-border pb-4">
              <div>
                <span className="eyebrow text-forest">Paket katering saat ini</span>
                <h2 className="font-display font-semibold text-lg text-warm-black mt-0.5">
                  Weight loss (lean & sculpt)
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-forest-subtle text-forest border border-forest-border">
                Sedang berjalan (Sisa 14 dari 20 hari)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
                <span className="text-[11px] text-warm-muted block mb-0.5">Biaya langganan</span>
                <strong className="text-warm-black font-semibold text-sm">Rp 1.530.000 / siklus</strong>
              </div>
              <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
                <span className="text-[11px] text-warm-muted block mb-0.5">Berakhir pada</span>
                <strong className="text-warm-black font-semibold text-sm">01 November 2026</strong>
              </div>
              <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
                <span className="text-[11px] text-warm-muted block mb-0.5">Alamat pengiriman aktif</span>
                <strong className="text-warm-black font-semibold truncate block">
                  {savedAddresses.find((a) => a.isPrimary)?.label || 'Kantor SCBD'}
                </strong>
              </div>
            </div>

            {/* Auto Renewal & WhatsApp Notification Toggles */}
            <div className="pt-2 border-t border-warm-border space-y-3">
              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <h3 className="font-semibold text-warm-black">Perpanjangan otomatis setiap 20 hari</h3>
                  <p className="text-[11px] text-warm-muted">Autodebet ditagihkan 2 hari sebelum masa paket berakhir.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-border text-forest focus:ring-forest cursor-pointer"
                  aria-label="Toggle perpanjangan otomatis"
                />
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <h3 className="font-semibold text-warm-black">Pengingat WhatsApp jam 18.00 WIB</h3>
                  <p className="text-[11px] text-warm-muted">Kirimkan notifikasi menu besok sebelum batas cutoff 20.00 WIB.</p>
                </div>
                <input
                  type="checkbox"
                  checked={waReminder}
                  onChange={(e) => setWaReminder(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-border text-forest focus:ring-forest cursor-pointer"
                  aria-label="Toggle pengingat WhatsApp"
                />
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <h3 className="font-semibold text-warm-black">Peringatan silang alergen dapur sentral</h3>
                  <p className="text-[11px] text-warm-muted">Kirimkan SMS darurat jika resep menu mengandung turunan kacang tanah.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allergyNotification}
                  onChange={(e) => setAllergyNotification(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-border text-forest focus:ring-forest cursor-pointer"
                  aria-label="Toggle peringatan alergen"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural cursor-pointer"
              >
                Simpan preferensi langganan
              </button>
            </div>
          </div>

          {/* Account Profile Details Form */}
          <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="pb-3 border-b border-warm-border">
              <h2 className="font-display font-semibold text-base text-warm-black">
                Informasi data diri akun
              </h2>
              <p className="text-xs text-warm-muted mt-0.5">
                Pastikan nomor telepon WhatsApp aktif untuk koordinasi kurir motor pengantaran makan siang.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label htmlFor="account-fullname" className="block text-warm-black font-semibold mb-1">
                    Nama lengkap
                  </label>
                  <input
                    id="account-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-tebu-50 border border-warm-border rounded-md p-2.5 text-warm-black font-medium focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label htmlFor="account-email" className="block text-warm-black font-semibold mb-1">
                    Alamat email
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-tebu-50 border border-warm-border rounded-md p-2.5 text-warm-black font-medium focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label htmlFor="account-phone" className="block text-warm-black font-semibold mb-1">
                    Nomor WhatsApp (Notifikasi pengantaran)
                  </label>
                  <input
                    id="account-phone"
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-tebu-50 border border-warm-border rounded-md p-2.5 text-warm-black font-medium focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label htmlFor="account-joined" className="block text-warm-muted font-medium mb-1">
                    Tanggal bergabung
                  </label>
                  <input
                    id="account-joined"
                    type="text"
                    disabled
                    value={joinedDate}
                    className="w-full bg-tebu-200/60 border border-warm-border rounded-md p-2.5 text-warm-muted font-medium cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingProfile ? 'Menyimpan...' : 'Simpan perubahan data diri'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Security, Password & Active Sessions */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Card 1: Change Password */}
          <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="flex items-start gap-3 pb-4 border-b border-warm-border">
              <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="eyebrow text-forest">Kredensial keamanan</p>
                <h2 className="font-display font-semibold text-base text-warm-black mt-0.5">
                  Ganti kata sandi akun
                </h2>
                <p className="text-xs text-warm-muted mt-0.5">
                  Demi perlindungan data gizi medis Anda, mengubah kata sandi akan otomatis membatalkan seluruh sesi login di perangkat lain.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordField
                label="Kata sandi saat ini"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                disabled={changingPassword}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField
                  label="Kata sandi baru"
                  autoComplete="new-password"
                  required
                  showRules
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter berkombinasi"
                  error={passwordFieldErrors.newPassword}
                  disabled={changingPassword}
                />

                <PasswordField
                  label="Konfirmasi kata sandi baru"
                  autoComplete="new-password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  error={passwordFieldErrors.confirmPassword}
                  disabled={changingPassword}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{changingPassword ? 'Memperbarui sandi...' : 'Perbarui kata sandi'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Active Sessions */}
          <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-warm-border">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
                  <MonitorSmartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="eyebrow text-forest">Rotasi token berkala</p>
                  <h2 className="font-display font-semibold text-base text-warm-black mt-0.5">
                    Sesi login aktif pada perangkat
                  </h2>
                  <p className="text-xs text-warm-muted mt-0.5">
                    Daftar perangkat yang memiliki akses ke akun Anda menggunakan cookie HTTP-only terenkripsi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void fetchSessions()}
                  disabled={loadingSessions}
                  className="p-2 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-neutral text-xs font-medium transition-colors cursor-pointer"
                  title="Segarkan daftar sesi"
                  aria-label="Segarkan daftar sesi"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
                </button>

                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleLogoutAllOther}
                    disabled={revokingSessions}
                    className="px-3.5 py-1.5 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-xs font-semibold text-warm-black hover:text-terracotta transition-colors shadow-natural cursor-pointer disabled:opacity-60"
                  >
                    {revokingSessions ? 'Membatalkan...' : 'Keluar dari semua sesi lain'}
                  </button>
                )}
              </div>
            </div>

            {loadingSessions && sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-warm-muted">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-forest mb-2" />
                <span>Memuat riwayat sesi aktif...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 bg-tebu-50 rounded-lg border border-warm-border text-xs text-warm-muted text-center">
                Tidak ada data sesi eksternal yang ditemukan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-tebu-50 rounded-lg border border-warm-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-natural-sm text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-warm-black font-semibold">{s.device}</strong>
                        {s.current ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest text-tebu-50">
                            Sesi saat ini
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-tebu-200 text-warm-neutral">
                            Perangkat lain
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-warm-muted flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>IP: {s.ipAddress || 'Jaringan privat'}</span>
                        <span>
                          Dibuat:{' '}
                          {new Date(s.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {s.lastUsedAt && (
                          <span>
                            Terakhir aktif:{' '}
                            {new Date(s.lastUsedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Login Activity Audit Log */}
          <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-warm-border">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="eyebrow text-forest">Audit log akses akun</p>
                  <h2 className="font-display font-semibold text-base text-warm-black mt-0.5">
                    Riwayat aktivitas masuk akun
                  </h2>
                  <p className="text-xs text-warm-muted mt-0.5">
                    Catatan seluruh riwayat percobaan login untuk memantau keamanan akun dan akses tidak sah.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchLoginHistory()}
                disabled={loadingLoginHistory}
                className="p-2 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-neutral text-xs font-medium transition-colors cursor-pointer"
                title="Segarkan riwayat masuk"
                aria-label="Segarkan riwayat masuk"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLoginHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingLoginHistory && loginHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-warm-muted">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-forest mb-2" />
                <span>Memuat catatan riwayat login...</span>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="p-4 bg-tebu-50 rounded-lg border border-warm-border text-xs text-warm-muted text-center">
                Belum ada catatan aktivitas masuk akun yang terekam.
              </div>
            ) : (
              <div className="space-y-2.5">
                {loginHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-tebu-50 rounded-lg border border-warm-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-natural-sm text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-warm-black font-semibold">{item.device}</strong>
                        {item.status === 'SUCCESS' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest-subtle text-forest border border-forest-border inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Masuk berhasil</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-terracotta-subtle text-terracotta border border-terracotta-border inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Percobaan gagal</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-warm-muted flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>IP: {item.ipAddress || 'Jaringan privat'}</span>
                        <span>
                          Waktu:{' '}
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </span>
                        {item.reason && item.status === 'FAILED' && (
                          <span className="text-terracotta">
                            Keterangan: {item.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Danger Zone - Soft Delete */}
          <div className="bg-warm-surface border border-terracotta-border/70 rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
            <div className="flex items-start gap-3 pb-3 border-b border-warm-border">
              <div className="p-2.5 bg-terracotta-subtle border border-terracotta-border rounded-md text-terracotta shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="eyebrow text-terracotta">Tindakan berisiko</p>
                <h2 className="font-display font-semibold text-base text-warm-black mt-0.5">
                  Penghapusan akun NutriDaily
                </h2>
                <p className="text-xs text-warm-muted mt-0.5">
                  Menonaktifkan akun Anda secara permanen. Seluruh langganan aktif akan dihentikan dan data login dicabut.
                </p>
              </div>
            </div>

            {!isDeleteModalOpen ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-warm-muted max-w-lg">
                  Sesuai ketentuan UU PDP No. 27/2022, riwayat transaksi keuangan tetap disimpan untuk keperluan pembukuan perpajakan resmi.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural cursor-pointer shrink-0"
                >
                  Hapus akun saya
                </button>
              </div>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-3 pt-1 animate-toast">
                {deleteError && <FormAlert tone="error">{deleteError}</FormAlert>}

                <div className="p-3 bg-terracotta-subtle border border-terracotta-border rounded-lg text-xs text-terracotta-active leading-relaxed">
                  Konfirmasi ini bersifat permanen. Masukkan kata sandi akun dan ketik teks{' '}
                  <strong className="font-mono font-bold text-warm-black">&ldquo;HAPUS AKUN SAYA&rdquo;</strong> untuk melanjutkan.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PasswordField
                    label="Kata sandi akun"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Masukkan kata sandi untuk verifikasi"
                    disabled={deletingAccount}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-warm-black mb-1">
                      Ketik frasa: HAPUS AKUN SAYA
                    </label>
                    <input
                      type="text"
                      required
                      value={deleteConfirmationPhrase}
                      onChange={(e) => setDeleteConfirmationPhrase(e.target.value)}
                      placeholder="HAPUS AKUN SAYA"
                      disabled={deletingAccount}
                      className="w-full bg-tebu-50 border border-warm-border rounded-md px-3 py-2.5 text-sm font-mono text-warm-black placeholder:text-warm-stone focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletePassword('');
                      setDeleteConfirmationPhrase('');
                      setDeleteError(null);
                    }}
                    className="px-4 py-2 bg-warm-surface border border-warm-border hover:bg-tebu-100 text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount || deleteConfirmationPhrase.trim() !== 'HAPUS AKUN SAYA'}
                    className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {deletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{deletingAccount ? 'Menonaktifkan akun...' : 'Konfirmasi hapus akun permanen'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Encrypted Health & Medical Record (UU PDP No. 27/2022) */}
      {activeTab === 'HEALTH' && (
        <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-5 shadow-natural">
          <div className="flex items-start gap-3 pb-4 border-b border-warm-border">
            <div className="p-2.5 bg-forest-subtle border border-forest-border rounded-md text-forest shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-semibold text-base text-warm-black">
                  Rekam medis gizi terenkripsi AES-256-GCM
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest text-tebu-50">
                  UU PDP No. 27/2022
                </span>
              </div>
              <p className="text-xs text-warm-muted mt-0.5">
                Data kesehatan, indeks massa tubuh, dan pantangan alergi Anda dienkripsi pada tingkat kolom database. Hanya ahli gizi berlisensi yang dapat mengaksesnya.
              </p>
            </div>
          </div>

          {/* Physical Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
            <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
              <span className="text-[11px] text-warm-muted block mb-0.5">Tinggi badan</span>
              <strong className="text-warm-black font-semibold text-base">{healthProfile.heightCm} cm</strong>
            </div>
            <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
              <span className="text-[11px] text-warm-muted block mb-0.5">Berat badan</span>
              <strong className="text-warm-black font-semibold text-base">{healthProfile.weightKg} kg</strong>
            </div>
            <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
              <span className="text-[11px] text-warm-muted block mb-0.5">Indeks massa (BMI)</span>
              <strong className="text-forest font-semibold text-base">{healthProfile.bmi}</strong>
              <span className="text-[9px] text-warm-stone block mt-0.5 font-medium">{healthProfile.bmiCategory}</span>
            </div>
            <div className="p-3 bg-tebu-50 rounded-md border border-warm-border">
              <span className="text-[11px] text-warm-muted block mb-0.5">Target defisit kalori</span>
              <strong className="text-terracotta font-semibold text-base">{healthProfile.targetCalories} kkal</strong>
              <span className="text-[9px] text-warm-stone block mt-0.5 font-medium">TDEE: {healthProfile.tdeeKcal} kkal</span>
            </div>
          </div>

          {/* Macronutrient Distribution Card */}
          <div className="p-4 bg-tebu-50 rounded-md border border-warm-border space-y-2">
            <span className="text-xs font-semibold text-warm-black block">
              Distribusi makronutrisi harian yang disesuaikan
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-warm-surface rounded border border-warm-border">
                <span className="text-[10px] text-warm-muted block">Protein murni</span>
                <strong className="text-warm-black font-semibold">{healthProfile.macroDistribution.protein}</strong>
              </div>
              <div className="p-2 bg-warm-surface rounded border border-warm-border">
                <span className="text-[10px] text-warm-muted block">Karbohidrat kompleks</span>
                <strong className="text-warm-black font-semibold">{healthProfile.macroDistribution.carbs}</strong>
              </div>
              <div className="p-2 bg-warm-surface rounded border border-warm-border">
                <span className="text-[10px] text-warm-muted block">Lemak tak jenuh</span>
                <strong className="text-warm-black font-semibold">{healthProfile.macroDistribution.fats}</strong>
              </div>
            </div>
          </div>

          {/* Allergy & Clinical Notes */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-tebu-50 rounded-md border border-warm-border space-y-1">
              <span className="font-semibold text-warm-black block">Pantangan alergen terdaftar:</span>
              <p className="text-warm-muted">{healthProfile.allergies.join(', ')}.</p>
            </div>

            <div className="p-3.5 bg-tebu-50 rounded-md border border-warm-border space-y-1.5">
              <div className="flex flex-wrap justify-between items-center gap-1">
                <span className="font-semibold text-warm-black">Catatan klinis ahli gizi (Hasil dekripsi aman):</span>
                <span className="font-mono text-[11px] text-warm-stone">Tinjau: {healthProfile.lastNutritionistReview}</span>
              </div>
              <p className="text-warm-black/90 leading-relaxed font-mono text-[11px] bg-warm-surface p-3 rounded border border-warm-border">
                {healthProfile.encryptedNotesDecrypted}
              </p>
              <div className="flex items-center justify-between text-[11px] text-warm-muted pt-1">
                <span>Penanggung jawab: <strong className="text-warm-black">{healthProfile.doctorInCharge}</strong></span>
                <span className="font-mono">{healthProfile.sipNumber}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Link
              href="/#calculator"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-warm-black hover:bg-forest text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural"
            >
              <span>Perbarui metrik tubuh di kalkulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <span className="text-[11px] text-warm-muted">
              Terverifikasi aman oleh Kementerian Kesehatan RI
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Official Invoices & History */}
      {activeTab === 'INVOICES' && (
        <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
          <div className="flex justify-between items-center pb-3 border-b border-warm-border">
            <div>
              <h2 className="font-display font-semibold text-base text-warm-black">
                Riwayat faktur pembayaran resmi
              </h2>
              <p className="text-xs text-warm-muted">
                Faktur resmi dengan rincian PPN 11%, nomor transaksi Midtrans, dan nomor seri faktur pajak.
              </p>
            </div>
          </div>

          <div className="divide-y divide-warm-border text-xs">
            {invoices.map((inv) => (
              <div key={inv.invoiceNumber} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-warm-black">{inv.invoiceNumber}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest-subtle text-forest">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-warm-muted text-[11px]">
                    {inv.plan} ({inv.cycle}) • Terbit: {inv.date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-warm-black text-sm">{inv.amount}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3 py-1.5 rounded bg-tebu-50 border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-medium transition-colors flex items-center gap-1.5 shadow-natural-sm cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-forest" />
                    <span>Lihat faktur</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Delivery Addresses */}
      {activeTab === 'ADDRESSES' && (
        <div className="bg-warm-surface border border-warm-border rounded-[18px] p-6 grain-overlay-light space-y-4 shadow-natural">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-warm-border">
            <div>
              <h2 className="font-display font-semibold text-base text-warm-black">
                Daftar alamat pengantaran katering
              </h2>
              <p className="text-xs text-warm-muted">
                Kurir motor mengantar pada slot makan siang (11.00 - 12.00 WIB) dalam radius Jadetabek.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddAddressModalOpen(true)}
              className="px-3.5 py-1.5 bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold rounded-md transition-colors shadow-natural flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah alamat baru</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 bg-tebu-50 rounded-lg border border-warm-border flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-natural-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-warm-black font-semibold text-xs">{addr.label}</strong>
                    {addr.isPrimary && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-forest text-tebu-50">
                        Alamat utama
                      </span>
                    )}
                    <span className="text-[10px] text-warm-muted bg-warm-surface px-1.5 py-0.5 rounded border border-warm-border">
                      {addr.city}
                    </span>
                  </div>
                  <p className="text-warm-black font-medium text-xs">
                    Penerima: {addr.recipient} ({addr.phone})
                  </p>
                  <p className="text-warm-muted text-[11px] leading-relaxed">
                    {addr.fullAddress}
                  </p>
                  {addr.notes && (
                    <p className="text-[10px] text-warm-stone italic pt-0.5">
                      Catatan kurir: {addr.notes}
                    </p>
                  )}
                  {addr.coordinates && (
                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${addr.coordinates.lat},${addr.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-warm-surface border border-warm-border text-[10px] font-mono text-forest hover:bg-tebu-100 transition-colors shadow-natural-sm"
                        title="Buka titik koordinat di Google Maps"
                      >
                        <MapPin className="w-3 h-3 text-forest shrink-0" />
                        <span>Titik pin: {addr.coordinates.lat}, {addr.coordinates.lng}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-forest/70 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  {!addr.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryAddress(addr.id)}
                      className="px-2.5 py-1.5 rounded bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-medium transition-colors cursor-pointer"
                    >
                      Jadikan utama
                    </button>
                  )}
                  {!addr.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 rounded text-warm-stone hover:text-terracotta transition-colors"
                      title="Hapus alamat"
                      aria-label={`Hapus alamat ${addr.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Tambah Alamat Baru */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-surface border border-warm-border rounded-[18px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-natural-lg overflow-hidden">
            <div className="p-6 pb-3 border-b border-warm-border flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-display font-semibold text-base text-warm-black">
                  Tambah alamat pengantaran baru
                </h3>
                <p className="text-xs text-warm-muted mt-0.5">
                  Simpan lokasi baru untuk memudahkan penggantian alamat makan siang di dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAddressModalOpen(false)}
                className="text-warm-stone hover:text-warm-black p-1 -mr-1 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 py-4 overflow-y-auto custom-pill-scrollbar flex-1 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-address-label" className="block text-xs font-semibold text-warm-black mb-1.5">
                    Nama label alamat
                  </label>
                  <input
                    id="new-address-label"
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Contoh: Rumah, Kantor Cabang, Kos"
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                  />
                </div>

                <div>
                  <CustomDropdown<string>
                    id="new-address-city"
                    label="Area jangkauan Jadetabek"
                    value={newCity}
                    onChange={(val) => setNewCity(val)}
                    size="sm"
                    variant="default"
                    options={[
                      { value: 'Jakarta Selatan', label: 'Jakarta Selatan', badge: 'Slot 11.00' },
                      { value: 'Jakarta Pusat', label: 'Jakarta Pusat', badge: 'Slot 11.00' },
                      { value: 'Jakarta Barat', label: 'Jakarta Barat', badge: 'Slot 11.30' },
                      { value: 'Jakarta Timur', label: 'Jakarta Timur', badge: 'Slot 11.30' },
                      { value: 'Jakarta Utara', label: 'Jakarta Utara', badge: 'Slot 12.00' },
                      { value: 'Tangerang Selatan', label: 'Tangerang Selatan', badge: 'Slot 11.30' },
                      { value: 'Tangerang Kota', label: 'Tangerang Kota', badge: 'Slot 12.00' },
                      { value: 'Bekasi', label: 'Bekasi', badge: 'Slot 12.00' },
                      { value: 'Depok', label: 'Depok', badge: 'Slot 12.00' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-address-recipient" className="block text-xs font-semibold text-warm-black mb-1.5">
                    Nama penerima di lokasi
                  </label>
                  <input
                    id="new-address-recipient"
                    type="text"
                    required
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                  />
                </div>

                <div>
                  <label htmlFor="new-address-phone" className="block text-xs font-semibold text-warm-black mb-1.5">
                    Nomor telepon penerima
                  </label>
                  <input
                    id="new-address-phone"
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-address-street" className="block text-xs font-semibold text-warm-black mb-1.5">
                  Alamat lengkap jalan dan nomor
                </label>
                <textarea
                  id="new-address-street"
                  required
                  rows={2}
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Nama jalan, nomor rumah atau gedung, lantai/unit, RT/RW, kelurahan"
                  className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural resize-none"
                />
              </div>

              <div>
                <label htmlFor="new-address-notes" className="block text-xs font-semibold text-warm-black mb-1.5">
                  Catatan untuk kurir (opsional)
                </label>
                <input
                  id="new-address-notes"
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Contoh: Titip di pos sekuriti atau resepsionis"
                  className="w-full text-xs p-2.5 rounded-lg border border-warm-border bg-tebu-50 text-warm-black focus:outline-none focus:border-forest shadow-natural"
                />
              </div>

              {/* Row: Pin Map Section (Opsional) */}
              <div className="pt-2 border-t border-warm-border/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-forest" />
                    <div>
                      <span className="text-xs font-semibold text-warm-black block">
                        Titik akurasi peta (opsional)
                      </span>
                      <span className="text-[11px] text-warm-muted">
                        Bantu kurir motor menemukan pagar atau lobi secara presisi
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPinMapActive}
                    onClick={() => setIsPinMapActive((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border cursor-pointer ${
                      isPinMapActive
                        ? 'bg-forest text-tebu-50 border-forest'
                        : 'bg-tebu-50 text-warm-muted border-warm-border hover:text-warm-black'
                    }`}
                  >
                    {isPinMapActive ? 'Pin aktif' : '+ Pasang pin'}
                  </button>
                </div>

                {isPinMapActive && (
                  <div className="space-y-3 p-3 bg-tebu-50 rounded-xl border border-warm-border animate-toast">
                    {/* Interactive Leaflet Pin Map (Directly Clickable & Draggable Pin) */}
                    <InteractivePinMap
                      lat={pinnedCoordinates.lat}
                      lng={pinnedCoordinates.lng}
                      onChange={(newLat, newLng) => {
                        setPinnedCoordinates({ lat: newLat, lng: newLng });
                      }}
                    />

                    {/* Coordinates & Actions Bar */}
                    <div className="space-y-2.5 pt-1 border-t border-warm-border/60">
                      {/* Row 1: Koordinat Presisi */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-warm-surface border border-warm-border">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-warm-black shrink-0">Koordinat pin:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded border border-warm-border bg-tebu-50 px-2 py-1 text-xs font-mono shadow-natural">
                            <span className="text-[10px] text-warm-stone font-sans mr-1.5 select-none">Lat</span>
                            <input
                              type="number"
                              step="0.0001"
                              value={pinnedCoordinates.lat}
                              onChange={(e) =>
                                setPinnedCoordinates({
                                  lat: parseFloat(e.target.value) || 0,
                                  lng: pinnedCoordinates.lng,
                                })
                              }
                              className="w-20 bg-transparent text-warm-black font-semibold focus:outline-none"
                              aria-label="Latitude titik pengantaran"
                            />
                          </div>

                          <div className="flex items-center rounded border border-warm-border bg-tebu-50 px-2 py-1 text-xs font-mono shadow-natural">
                            <span className="text-[10px] text-warm-stone font-sans mr-1.5 select-none">Lng</span>
                            <input
                              type="number"
                              step="0.0001"
                              value={pinnedCoordinates.lng}
                              onChange={(e) =>
                                setPinnedCoordinates({
                                  lat: pinnedCoordinates.lat,
                                  lng: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20 bg-transparent text-warm-black font-semibold focus:outline-none"
                              aria-label="Longitude titik pengantaran"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: External Google Maps Link */}
                      <div className="flex justify-end">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${pinnedCoordinates.lat},${pinnedCoordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto py-2 px-3 rounded-lg bg-tebu-50 hover:bg-tebu-100 border border-warm-border text-forest text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-natural"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-forest shrink-0" />
                          <span>Buka Google Maps</span>
                        </a>
                      </div>

                      <p className="text-[10px] text-warm-muted leading-tight pt-0.5">
                        Klik pada posisi peta di mana saja atau geser pin langsung untuk menandai pagar atau lobi gedung Anda secara presisi.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="new-address-primary"
                  type="checkbox"
                  checked={newIsPrimary}
                  onChange={(e) => setNewIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-border text-forest focus:ring-forest cursor-pointer"
                />
                <label htmlFor="new-address-primary" className="text-xs text-warm-black cursor-pointer">
                  Jadikan alamat utama untuk pengantaran berikutnya
                </label>
              </div>

              </div>

              {/* Sticky Action Footer */}
              <div className="p-4 px-6 border-t border-warm-border bg-warm-surface flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold tracking-tight transition-colors shadow-natural cursor-pointer"
                >
                  Simpan alamat baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="py-2.5 px-4 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-muted hover:text-warm-black text-xs font-medium transition-colors cursor-pointer"
                >
                  Batalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lihat Rincian Faktur Resmi */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-warm-surface border border-warm-border rounded-[18px] max-w-lg w-full max-h-[90vh] overflow-y-auto custom-pill-scrollbar p-6 space-y-4 shadow-natural-lg">
            <div className="flex justify-between items-start pb-3 border-b border-warm-border">
              <div>
                <span className="eyebrow text-forest">Faktur pembayaran resmi</span>
                <h3 className="font-display font-semibold text-lg text-warm-black mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-warm-stone hover:text-warm-black p-1 -mr-1"
                aria-label="Tutup faktur"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Printable View */}
            <div className="p-4 bg-tebu-50 rounded-xl border border-warm-border space-y-3.5 text-xs font-sans">
              <div className="flex justify-between items-start pb-3 border-b border-warm-border">
                <div>
                  <strong className="text-warm-black font-semibold block text-sm">PT NutriDaily Indonesia</strong>
                  <span className="text-[11px] text-warm-muted block">NPWP: 01.842.921.4-012.000</span>
                  <span className="text-[11px] text-warm-muted block">Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-forest-subtle text-forest font-semibold text-[10px] block mb-1">
                    {selectedInvoice.status}
                  </span>
                  <span className="text-[11px] text-warm-stone font-mono block">Tanggal: {selectedInvoice.date}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-warm-muted block mb-0.5">Ditagihkan kepada:</span>
                <strong className="text-warm-black font-semibold block">{fullName}</strong>
                <span className="text-[11px] text-warm-muted block">{email} • {phoneNumber}</span>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-warm-muted pb-1 border-b border-warm-border">
                  <span>Deskripsi layanan</span>
                  <span>Jumlah</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <div>
                    <strong className="text-warm-black font-semibold block">{selectedInvoice.plan}</strong>
                    <span className="text-[11px] text-warm-muted">{selectedInvoice.cycle}</span>
                  </div>
                  <strong className="text-warm-black font-semibold">{selectedInvoice.subtotal}</strong>
                </div>
                <div className="flex justify-between text-xs py-1 text-warm-muted">
                  <span>PPN 11% (Faktur pajak terintegrasi)</span>
                  <span>{selectedInvoice.taxPpn}</span>
                </div>
                <div className="flex justify-between text-xs py-1 text-warm-muted">
                  <span>Biaya pengantaran kurir Jadetabek (Clean Label)</span>
                  <span className="text-forest font-medium">Gratis (Rp 0)</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-warm-border font-semibold text-warm-black">
                  <span>Total pembayaran</span>
                  <span className="text-forest font-display">{selectedInvoice.amount}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-warm-surface border border-warm-border text-[11px] space-y-0.5">
                <span className="text-warm-muted block">Metode pembayaran:</span>
                <strong className="text-warm-black font-semibold block">{selectedInvoice.paymentMethod}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-warm-stone font-mono">
                Hash sertifikasi: SHA256-ND-{(selectedInvoice.invoiceNumber).replace(/[^0-9]/g, '')}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-md bg-warm-surface border border-warm-border hover:bg-tebu-100 text-warm-black text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-natural-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-forest" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', `Mengunduh berkas PDF resmi untuk ${selectedInvoice.invoiceNumber}...`);
                    setSelectedInvoice(null);
                  }}
                  className="px-3.5 py-2 rounded-md bg-forest hover:bg-forest-hover text-tebu-50 text-xs font-semibold transition-colors shadow-natural flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh salinan PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
