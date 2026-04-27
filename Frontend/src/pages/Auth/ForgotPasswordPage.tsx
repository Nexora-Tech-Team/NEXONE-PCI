import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/api'
import logoUrl from '../../../logo/logo_ref.png'
import loginBg from '../../../logo/login-bg.png'
import nexoraUrl from '../../../logo/Logo_Nexora_Part.png'
import { ArrowLeft, ShieldAlert, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div
        className="w-full lg:w-1/2 xl:w-5/12 2xl:w-1/3 flex flex-col justify-center relative"
        style={{ borderTop: '3px solid #2aacb8' }}
      >
        <div className="w-full px-8 py-10">
          <div className="flex justify-center mb-8">
            <img src={logoUrl} alt="CBQA Global" style={{ width: 160 }} />
          </div>

          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f8' }}>
              {sent ? <CheckCircle size={30} style={{ color: '#2aacb8' }} /> : <ShieldAlert size={30} style={{ color: '#2aacb8' }} />}
            </div>
          </div>

          {sent ? (
            <>
              <h2 className="text-center text-[1.4rem] font-bold text-gray-900 mb-2">Email Terkirim</h2>
              <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
                Jika email <span className="font-medium text-gray-700">{email}</span> terdaftar,
                link reset password sudah dikirim. Periksa inbox atau folder spam Anda.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-center text-[1.4rem] font-bold text-gray-900 mb-2">Lupa Password?</h2>
              <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
                Masukkan email Anda dan kami akan kirim link untuk reset password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="nama@cbqa.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#2aacb8' } as React.CSSProperties}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded text-sm font-medium text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#2aacb8' }}
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>
            </>
          )}

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 py-2.5 rounded text-sm font-medium text-gray-600 border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft size={15} />
            Kembali ke Login
          </button>
        </div>

        <div className="absolute bottom-0 left-4">
          <img src={nexoraUrl} alt="Nexora" style={{ width: 130, opacity: 0.90 }} />
        </div>
      </div>

      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${loginBg})`, filter: 'blur(24px)', transform: 'scale(1.08)' }} />
        <div className="absolute inset-0 bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'contain' }} />
      </div>
    </div>
  )
}
