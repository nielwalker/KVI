import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/useToast'
import { normalizePhMobileE164 } from '../lib/phone'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'oic', label: 'OIC' },
  { value: 'admin', label: 'Admin' },
]

const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const normalizeMemberName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export default function CreateMember({ recruitmentId: recruitmentIdProp, onClose, embedded = false }) {
  const {
    user,
    committees,
    getAllMembers,
    getAdmins,
    createMember,
    uploadMemberProfileImage,
  } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const recruitmentId = String(recruitmentIdProp || searchParams.get('recruitmentId') || '').trim()

  const recruitmentDraft = useMemo(() => {
    if (!recruitmentId) return null
    try {
      const raw = window.sessionStorage.getItem(`kusgan.recruitmentDraft:${recruitmentId}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }, [recruitmentId])

  const committeeOptions = useMemo(() => {
    const list = Array.isArray(committees) ? committees : []
    const normalized = list.map(name => String(name || '').trim()).filter(Boolean)
    const unique = [...new Set(normalized)]
    unique.sort((a, b) => a.localeCompare(b))
    return unique
  }, [committees])

  const members = useMemo(() => {
    const allMembers = getAllMembers()
    return Array.isArray(allMembers) ? allMembers : []
  }, [getAllMembers])

  const admins = useMemo(() => {
    const allAdmins = getAdmins()
    return Array.isArray(allAdmins) ? allAdmins : []
  }, [getAdmins])

  const [member, setMember] = useState(() => ({
    name: '',
    idNumber: '',
    password: '',
    address: '',
    contactNumber: '',
    emergencyContactNumber: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    bloodType: '',
    insuranceStatus: 'N/A',
    insuranceYear: '',
    memberSince: dayjs().format('YYYY-MM-DD'),
    status: 'active',
    role: ROLE_OPTIONS[0].value,
    committee: committeeOptions[0] || '',
    committeeRole: 'Member',
  }))
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const imagePreviewUrlRef = useRef('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!recruitmentDraft) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMember(prev => ({
      ...prev,
      name: recruitmentDraft.fullName || prev.name,
      idNumber: recruitmentDraft.idNumber || prev.idNumber,
      address: recruitmentDraft.address || prev.address,
      contactNumber: recruitmentDraft.contactNumber || prev.contactNumber,
      emergencyContactNumber: recruitmentDraft.emergencyContactNumber || prev.emergencyContactNumber,
      emergencyContactName: recruitmentDraft.emergencyContactName || prev.emergencyContactName,
      emergencyContactRelationship: recruitmentDraft.emergencyContactRelationship || prev.emergencyContactRelationship,
      bloodType: recruitmentDraft.bloodType || prev.bloodType,
      insuranceStatus: recruitmentDraft.insuranceStatus || prev.insuranceStatus,
      insuranceYear: recruitmentDraft.insuranceYear || prev.insuranceYear,
    }))
  }, [recruitmentDraft])

  useEffect(() => {
    return () => {
      const url = imagePreviewUrlRef.current
      if (!url) return
      try {
        URL.revokeObjectURL(url)
      } catch {
        // ignore
      }
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const inputClassName = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-yellow-300/35'
  const selectClassName = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300/35'
  const labelClassName = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65'

  if (!isAdmin) {
    return (
      <div className="animate-fade-in py-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <p className="text-sm font-semibold text-yellow-200">Admin access required</p>
          <p className="mt-2 text-white/70">Only admins can create accounts.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const normalizedName = String(member.name || '').trim().replace(/\s+/g, ' ')
    if (!normalizedName) {
      toast.error('Full name is required.', { title: 'Error' })
      return
    }

    const alreadyExists = [...admins, ...members].some(existing =>
      normalizeMemberName(existing?.name) === normalizeMemberName(normalizedName)
    )
    if (alreadyExists) {
      toast.error('Member already exists.', { title: 'Error' })
      return
    }

    setSaving(true)
    const role = String(member.role || '').trim() || 'member'
    const ensuredCommittee = role === 'member' ? (String(member.committee || '').trim() || committeeOptions[0] || '') : ''
    const contactNumber = normalizePhMobileE164(member.contactNumber)
    const emergencyContactNumber = normalizePhMobileE164(member.emergencyContactNumber)

    if (String(member.contactNumber || '').trim() && !contactNumber) {
      toast.error('Invalid contact number. Use +639XXXXXXXXX.', { title: 'Error' })
      setSaving(false)
      return
    }
    if (String(member.emergencyContactNumber || '').trim() && !emergencyContactNumber) {
      toast.error('Invalid emergency contact number. Use +639XXXXXXXXX.', { title: 'Error' })
      setSaving(false)
      return
    }
    const result = await createMember({
      ...member,
      name: normalizedName,
      committee: ensuredCommittee,
      contactNumber,
      emergencyContactNumber,
      recruitmentId: recruitmentId || undefined,
    })
    if (!result.success) {
      toast.error(result.message || 'Unable to create member.', { title: 'Error' })
      setSaving(false)
      return
    }

    if (imageFile && result.userId) {
      const uploadResult = await uploadMemberProfileImage(result.userId, imageFile)
      if (!uploadResult.success) {
        toast.error(uploadResult.message || 'Member created but image upload failed.', { title: 'Error' })
      }
    }

    toast.success('Account created.', { title: 'Success' })
    setSaving(false)
    setImageFile(null)
    setShowTempPassword(false)
    try {
      if (recruitmentId) window.sessionStorage.removeItem(`kusgan.recruitmentDraft:${recruitmentId}`)
    } catch {
      // ignore
    }
    setMember({
      name: '',
      idNumber: '',
      password: '',
      address: '',
      contactNumber: '',
      emergencyContactNumber: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      bloodType: '',
      insuranceStatus: 'N/A',
      insuranceYear: '',
      memberSince: dayjs().format('YYYY-MM-DD'),
      status: 'active',
      role: ROLE_OPTIONS[0].value,
      committee: committeeOptions[0] || '',
      committeeRole: 'Member',
    })
  }

  return (
    <div className="animate-fade-in h-full w-full text-gray-900 dark:text-zinc-100">
      <div className={embedded ? '' : 'w-full'}>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (typeof onClose === 'function') onClose()
              else if (window.history.length > 1) navigate(-1)
              else navigate('/members')
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
        <div
          className="w-full rounded-3xl border border-white/15 p-4 shadow-[0_24px_70px_rgba(8,47,73,0.22)] backdrop-blur-md sm:p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(14,116,144,0.52), rgba(30,64,175,0.46) 52%, rgba(96,165,250,0.36))',
          }}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Create Member</h2>
              {recruitmentId ? (
                <p className="mt-0.5 text-xs text-white/70">Recruitment approval in progress.</p>
              ) : null}
            </div>
          </div>

        <form onSubmit={handleSubmit} className="relative flex min-h-[72vh] flex-col">
          <div className="mb-3 flex flex-col items-center gap-2">
            <div
              className="flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 !bg-white shadow-[0_14px_32px_rgba(15,23,42,0.12)]"
              style={{ colorScheme: 'light', backgroundColor: '#ffffff' }}
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Selected profile preview" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center !bg-white text-center text-xs text-slate-400"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  No preview
                </div>
              )}
            </div>

            <div className="w-full max-w-sm mx-auto">
              <label htmlFor="create-member-image" className={labelClassName}>Profile Image (optional)</label>
              <div
                className="flex h-9 w-full items-center gap-3 rounded-lg border border-slate-200 !bg-white px-3 text-sm text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                style={{ colorScheme: 'light', backgroundColor: '#ffffff' }}
              >
                <label
                  htmlFor="create-member-image"
                  className="inline-flex h-7 cursor-pointer items-center justify-center rounded-lg bg-yellow-400 px-4 text-xs font-semibold text-slate-900 shadow-[0_8px_24px_rgba(250,204,21,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300"
                >
                  Choose File
                </label>
                <span className="min-w-0 truncate text-sm text-slate-600">
                  {imageFile?.name || 'No file chosen'}
                </span>
              </div>
              <input
                id="create-member-image"
                name="profileImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null
                  setImageFile(next)

                  const previousUrl = imagePreviewUrlRef.current
                  if (previousUrl) {
                    try {
                      URL.revokeObjectURL(previousUrl)
                    } catch {
                      // ignore
                    }
                    imagePreviewUrlRef.current = ''
                  }

                  if (!next) {
                    setImagePreviewUrl('')
                    return
                  }

                  const nextUrl = URL.createObjectURL(next)
                  imagePreviewUrlRef.current = nextUrl
                  setImagePreviewUrl(nextUrl)
                }}
                className="sr-only"
              />
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div>
            <label htmlFor="create-member-name" className={labelClassName}>Full Name</label>
            <input
              id="create-member-name"
              name="name"
              type="text"
              placeholder="Full name"
              value={member.name}
              onChange={e => setMember({ ...member, name: e.target.value })}
              className={inputClassName}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="create-member-id-number" className={labelClassName}>ID Number</label>
            <input
              id="create-member-id-number"
              name="idNumber"
              type="text"
              placeholder="ID Number"
              value={member.idNumber}
              onChange={e => setMember({ ...member, idNumber: e.target.value })}
              className={inputClassName}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="create-member-password" className={labelClassName}>Temporary Password</label>
            <div className="relative">
              <input
                id="create-member-password"
                name="password"
                type={showTempPassword ? 'text' : 'password'}
                placeholder="Temporary password"
                value={member.password}
                onChange={e => setMember({ ...member, password: e.target.value })}
                className={`${inputClassName} pr-10`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowTempPassword(prev => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-300"
                aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                title={showTempPassword ? 'Hide password' : 'Show password'}
              >
                {showTempPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="create-member-address" className={labelClassName}>Address</label>
            <input
              id="create-member-address"
              name="address"
              type="text"
              placeholder="Address"
              value={member.address}
              onChange={e => setMember({ ...member, address: e.target.value })}
              className={inputClassName}
              autoComplete="street-address"
            />
          </div>

          <div>
            <label htmlFor="create-member-contact-number" className={labelClassName}>Contact Number</label>
            <input
              id="create-member-contact-number"
              name="contactNumber"
              type="text"
              placeholder="Contact Number"
              value={member.contactNumber}
              onChange={e => setMember({ ...member, contactNumber: e.target.value })}
              className={inputClassName}
              autoComplete="tel"
            />
          </div>

          <div className="pt-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <p className="text-sm font-semibold text-white">In Case of Emergency</p>
            <p className="text-xs text-white/70">Emergency contact details for this member.</p>
          </div>

          <div>
            <label htmlFor="create-member-emergency-number" className={labelClassName}>Emergency Number</label>
            <input
              id="create-member-emergency-number"
              name="emergencyContactNumber"
              type="tel"
              placeholder="Emergency Contact Number"
              value={member.emergencyContactNumber}
              onChange={e => setMember({ ...member, emergencyContactNumber: e.target.value })}
              className={inputClassName}
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="create-member-emergency-name" className={labelClassName}>Emergency Contact Name</label>
            <input
              id="create-member-emergency-name"
              name="emergencyContactName"
              type="text"
              placeholder="Emergency Contact Name"
              value={member.emergencyContactName}
              onChange={e => setMember({ ...member, emergencyContactName: e.target.value })}
              className={inputClassName}
              autoComplete="name"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="create-member-emergency-relationship" className={labelClassName}>Relationship</label>
            <input
              id="create-member-emergency-relationship"
              name="emergencyContactRelationship"
              type="text"
              placeholder="Relationship"
              value={member.emergencyContactRelationship}
              onChange={e => setMember({ ...member, emergencyContactRelationship: e.target.value })}
              className={inputClassName}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="create-member-blood-type" className={labelClassName}>Blood Type</label>
            <select
              id="create-member-blood-type"
              name="bloodType"
              value={member.bloodType}
              onChange={e => setMember({ ...member, bloodType: e.target.value })}
              className={selectClassName}
            >
              <option value="">Select Blood Type</option>
              {BLOOD_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="create-member-status" className={labelClassName}>Status</label>
            <select
              id="create-member-status"
              name="status"
              value={member.status}
              onChange={e => setMember({ ...member, status: e.target.value })}
              className={selectClassName}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="create-member-role" className={labelClassName}>Type</label>
            <select
              id="create-member-role"
              name="role"
              value={member.role}
              onChange={e => {
                const nextRole = e.target.value
                setMember(prev => {
                  if (nextRole === 'admin') {
                    return { ...prev, role: 'admin', committeeRole: 'Member', committee: '' }
                  }
                  if (nextRole === 'oic') {
                    return { ...prev, role: 'oic', committeeRole: 'OIC', committee: '' }
                  }
                  return { ...prev, role: 'member', committeeRole: 'Member', committee: prev.committee || committeeOptions[0] || '' }
                })
              }}
              className={selectClassName}
              required
            >
              {ROLE_OPTIONS.map(roleOption => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>

          {member.role === 'member' ? (
            <div>
              <label htmlFor="create-member-committee" className={labelClassName}>Committee</label>
              <select
                id="create-member-committee"
                name="committee"
                value={member.committee}
                onChange={e => setMember({ ...member, committee: e.target.value })}
                className={selectClassName}
                required
              >
                {committeeOptions.map(committee => (
                  <option key={committee} value={committee}>
                    {committee}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden xl:block" />
          )}

          <div>
            <label htmlFor="create-member-member-since" className={labelClassName}>Member Since</label>
            <input
              id="create-member-member-since"
              name="memberSince"
              type="date"
              value={member.memberSince}
              onChange={e => setMember({ ...member, memberSince: e.target.value })}
              className={inputClassName}
              autoComplete="off"
            />
          </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-200 hover:scale-[1.01] hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {recruitmentId ? 'Approve & Create Account' : 'Create Account'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
