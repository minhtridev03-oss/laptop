import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, LogOut, Mail, ShieldCheck, UserPlus, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AUTH_MESSAGES = {
  'Invalid login credentials': 'Email hoặc mật khẩu chưa chính xác.',
  'Email not confirmed': 'Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.',
  'User already registered': 'Email này đã được đăng ký.',
};

const translateAuthError = (error) => {
  if (!error) return '';
  if (AUTH_MESSAGES[error.message]) return AUTH_MESSAGES[error.message];
  if (error.message?.toLowerCase().includes('password')) return 'Mật khẩu cần có ít nhất 6 ký tự.';
  return 'Chưa thể xử lý yêu cầu. Vui lòng thử lại.';
};

export default function AuthModal({ open, onClose }) {
  const { loading: sessionLoading, sendPasswordReset, signIn, signOut, signUp, user } = useAuth();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => firstInputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    setMessage(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (open) window.setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [mode, open]);

  if (!open) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (mode === 'register' && password !== confirmPassword) {
      setMessage({ tone: 'error', text: 'Mật khẩu nhập lại chưa trùng khớp.' });
      return;
    }

    setSubmitting(true);
    const response = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(fullName, email.trim(), password);
    setSubmitting(false);

    if (response.error) {
      setMessage({ tone: 'error', text: translateAuthError(response.error) });
      return;
    }

    if (mode === 'register' && !response.data.session) {
      setMessage({ tone: 'success', text: 'Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản.' });
      resetForm();
      return;
    }

    resetForm();
    onClose();
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    const { error } = await signOut();
    setSubmitting(false);
    if (error) {
      setMessage({ tone: 'error', text: translateAuthError(error) });
      return;
    }
    onClose();
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setMessage({ tone: 'error', text: 'Nhập email tài khoản trước khi yêu cầu đổi mật khẩu.' });
      return;
    }
    setSubmitting(true);
    const { error } = await sendPasswordReset(normalizedEmail);
    setSubmitting(false);
    setMessage(error
      ? { tone: 'error', text: 'Chưa thể gửi email đổi mật khẩu. Vui lòng thử lại.' }
      : { tone: 'success', text: 'Đã gửi liên kết đổi mật khẩu tới email của bạn.' });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Khách hàng';
  const isRegister = mode === 'register';
  const HeaderIcon = user ? UserRound : isRegister ? UserPlus : UserRound;
  const modalTitle = user
    ? `Xin chào, ${displayName}`
    : isRegister
      ? 'Tạo tài khoản Laptop World'
      : 'Đăng nhập Laptop World';
  const modalDescription = user
    ? 'Quản lý phiên đăng nhập của bạn.'
    : isRegister
      ? 'Tạo tài khoản để lưu cấu hình, sản phẩm yêu thích và theo dõi đơn hàng thuận tiện hơn.'
      : 'Đăng nhập để tiếp tục trải nghiệm mua sắm và quản lý thông tin cá nhân.';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/80 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`luxury-panel relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[14px] border-primary/25 shadow-[0_30px_100px_rgba(0,0,0,0.65)] transition-[max-width] duration-300 sm:max-h-[calc(100dvh-3rem)] ${user || !isRegister ? 'max-w-md' : 'max-w-3xl'}`} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button type="button" onClick={onClose} className="luxury-icon-button absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-lg sm:right-5 sm:top-5 sm:h-10 sm:w-10" aria-label="Đóng cửa sổ tài khoản">
          <X size={18} aria-hidden="true" />
        </button>

        <div className="shrink-0 border-b border-border-subtle bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4 pr-10 sm:pr-12">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary/[0.08] text-primary-hover sm:h-12 sm:w-12">
              <HeaderIcon size={22} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="luxury-eyebrow mb-1.5">TÀI KHOẢN KHÁCH HÀNG</p>
              <h2 id="auth-modal-title" className="luxury-heading text-xl leading-tight sm:text-2xl">{modalTitle}</h2>
              <p className="mt-2 text-xs leading-5 text-text-muted sm:text-sm sm:leading-6">{modalDescription}</p>
            </div>
          </div>
        </div>

        {sessionLoading ? (
          <div className="grid min-h-56 place-items-center text-primary"><LoaderCircle className="animate-spin" aria-label="Đang tải tài khoản" /></div>
        ) : user ? (
          <div className="custom-scrollbar min-h-0 overflow-y-auto p-5 sm:p-7">
            <div className="mb-6 rounded-lg border border-primary/15 bg-primary/[0.05] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-main"><CheckCircle2 size={16} className="text-primary-hover" aria-hidden="true" /> Đã đăng nhập</div>
              <p className="break-all text-sm text-text-muted">{user.email}</p>
            </div>
            {message && <p className="mb-4 rounded-md border border-[#d56f66]/25 bg-[#d56f66]/[0.08] px-4 py-3 text-sm text-[#e7958d]" role="alert">{message.text}</p>}
            <button type="button" onClick={handleSignOut} disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-border-subtle bg-bg-main text-xs font-bold uppercase tracking-[0.08em] text-text-main transition-colors hover:border-primary/45 hover:text-primary-hover disabled:opacity-60">
              {submitting ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <LogOut size={17} aria-hidden="true" />} Đăng xuất
            </button>
          </div>
        ) : (
          <div className="custom-scrollbar min-h-0 overflow-y-auto p-5 sm:p-7">
            <div className="mb-5 grid grid-cols-2 rounded-lg border border-border-subtle bg-bg-main p-1" role="tablist" aria-label="Chọn hình thức tài khoản">
              {[
                { id: 'login', label: 'Đăng nhập' },
                { id: 'register', label: 'Đăng ký' },
              ].map((tab) => (
                <button key={tab.id} type="button" role="tab" aria-selected={mode === tab.id} onClick={() => setMode(tab.id)} className={`min-h-10 rounded-md text-xs font-bold uppercase tracking-[0.08em] transition-colors ${mode === tab.id ? 'bg-primary/15 text-primary-hover' : 'text-text-muted hover:text-text-main'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={`grid gap-4 ${isRegister ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              {isRegister && (
                <label className="block text-xs font-semibold text-text-muted">
                  Họ và tên
                  <span className="relative mt-2 block">
                    <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" aria-hidden="true" />
                    <input ref={firstInputRef} type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} autoComplete="name" className="luxury-search min-h-12 w-full rounded-md pl-10 pr-3 text-sm text-text-main outline-none" placeholder="Nguyễn Văn An" />
                  </span>
                </label>
              )}
              <label className="block text-xs font-semibold text-text-muted">
                Email
                <span className="relative mt-2 block">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" aria-hidden="true" />
                  <input ref={mode === 'login' ? firstInputRef : undefined} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="luxury-search min-h-12 w-full rounded-md pl-10 pr-3 text-sm text-text-main outline-none" placeholder="email@example.com" />
                </span>
              </label>
              <label className="block text-xs font-semibold text-text-muted">
                Mật khẩu
                <span className="relative mt-2 block">
                  <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" aria-hidden="true" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="luxury-search min-h-12 w-full rounded-md pl-10 pr-11 text-sm text-text-main outline-none" placeholder="Tối thiểu 6 ký tự" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:bg-primary/10 hover:text-primary-hover" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </span>
              </label>
              {isRegister && (
                <label className="block text-xs font-semibold text-text-muted">
                  Nhập lại mật khẩu
                  <span className="relative mt-2 block">
                    <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" aria-hidden="true" />
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} autoComplete="new-password" className="luxury-search min-h-12 w-full rounded-md pl-10 pr-11 text-sm text-text-main outline-none" placeholder="Nhập lại mật khẩu" />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:bg-primary/10 hover:text-primary-hover" aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}>
                      {showConfirmPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </span>
                </label>
              )}

              {message && <p className={`rounded-md border px-4 py-3 text-sm ${isRegister ? 'sm:col-span-2' : ''} ${message.tone === 'success' ? 'border-[#79b88d]/25 bg-[#79b88d]/[0.08] text-[#9ed1ad]' : 'border-[#d56f66]/25 bg-[#d56f66]/[0.08] text-[#e7958d]'}`} role="alert">{message.text}</p>}

              <button type="submit" disabled={submitting} className={`luxury-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-60 ${isRegister ? 'sm:col-span-2' : ''}`}>
                {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
                {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
              {!isRegister && <button type="button" onClick={handlePasswordReset} disabled={submitting} className="text-xs font-semibold text-text-muted transition-colors hover:text-primary-hover disabled:opacity-50">Quên mật khẩu?</button>}
            </form>

            <p className="mt-4 flex items-start gap-2 border-t border-border-subtle pt-4 text-[11px] leading-5 text-text-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary/70" aria-hidden="true" /> Mật khẩu được Supabase Auth xử lý bảo mật và không được lưu trong giao diện website.</p>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
