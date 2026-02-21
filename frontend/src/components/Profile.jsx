import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useAuth } from '../context/AuthProvider'

const Profile = () => {
  const [AuthUser, setAuthUser] = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const initials = AuthUser?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { fullName: AuthUser?.fullName || '' }
  })

  const { register: regPass, handleSubmit: handlePass, formState: { errors: passErrors }, watch, reset: resetPass } = useForm()
  const newPass = watch('newPassword', '')

  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 3500)
  }

  const onUpdateProfile = async (data) => {
    setIsLoading(true)
    try {
      const res = await axios.put('/api/user/update', { fullName: data.fullName }, { withCredentials: true })
      const updated = res.data.user
      localStorage.setItem('chatUser', JSON.stringify(updated))
      setAuthUser(updated)
      showMsg('success', 'Name updated successfully!')
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Update failed')
    } finally { setIsLoading(false) }
  }

  const onUpdatePassword = async (data) => {
    setIsLoading(true)
    try {
      await axios.put('/api/user/update', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }, { withCredentials: true })
      showMsg('success', 'Password updated successfully!')
      resetPass()
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Password update failed')
    } finally { setIsLoading(false) }
  }

  const avatarColors = [
    'from-violet-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-blue-500 to-cyan-600',
  ]
  const colorIdx = (AuthUser?.fullName?.charCodeAt(0) || 0) % avatarColors.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Chat
        </Link>
        <div className="h-5 w-px bg-slate-200" />
        <span className="text-sm font-semibold text-slate-700">Profile Settings</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6 flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{AuthUser?.fullName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{AuthUser?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Active account
            </span>
          </div>
        </div>

        {/* Alert */}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[{ id: 'profile', label: '👤 Edit Name' }, { id: 'password', label: '🔒 Change Password' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-3.5 text-sm font-semibold transition ${activeTab === t.id ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfile(onUpdateProfile)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
                    {...regProfile('fullName', { required: 'Name is required' })} />
                  {profileErrors.fullName && <p className="mt-1.5 text-xs text-red-500">{profileErrors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                  <input type="email" value={AuthUser?.email || ''} disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm cursor-not-allowed" />
                  <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed</p>
                </div>
                <button type="submit" disabled={isLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60">
                  {isLoading ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePass(onUpdatePassword)} className="space-y-5">
                {[
                  { name: 'currentPassword', label: 'Current Password', rules: { required: 'Current password is required' } },
                  { name: 'newPassword', label: 'New Password', rules: { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } } },
                  { name: 'confirmNew', label: 'Confirm New Password', rules: { required: 'Please confirm', validate: v => v === newPass || "Passwords don't match" } },
                ].map(({ name, label, rules }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                    <input type="password" placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
                      {...regPass(name, rules)} />
                    {passErrors[name] && <p className="mt-1.5 text-xs text-red-500">{passErrors[name].message}</p>}
                  </div>
                ))}
                <button type="submit" disabled={isLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60">
                  {isLoading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
