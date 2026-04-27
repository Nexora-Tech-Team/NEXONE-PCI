import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/services/api'
import logoUrl from '../../../logo/logo_ref.png'
import loginBg from '../../../logo/login-bg.png'
import nexoraUrl from '../../../logo/Logo_Nexora_Part.png'
import { KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Password tidak cocok'); return }
    if (password.length < 6) { setError('Password minimal 6 karakter'); return }
    if (!token) { setError('Token reset tidak ditemukan'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Token tidak valid atau sudah kadaluarsa')
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
              {done ? <CheckCircle size={30} style={{ color: '#2aacb8' }} /> : <KeyRound size={30} style={{ color: '#2aacb8' }} />}
            </div>
          </div>

          {done ? (
            <>
              <h2 className="text-center text-[1.4rem] font-bold text-gray-900 mb-2">Password Berhasil Direset</h2>
              <p className="text-center text-sm text-gray-500 mb-6">Silakan login dengan password baru Anda.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded text-sm font-medium text-white"
                style={{ backgroundColor: '#2aacb8' }}
              >
                Login Sekarang
              </button>
            </>
          ) : (
            <>
              <h2 className="text-center text-[1.4rem] font-bold text-gray-900 mb-2">Buat Password Baru</h2>
              <p className="text-center text-sm text-gray-500 mb-6">Masukkan password baru untuk akun Anda.</p>

              {!token && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
                  Link reset tidak valid. Minta link baru dari halaman Lupa Password.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Ulangi password baru"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 rounded text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: '#2aacb8' }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>
            </>
          )}
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
