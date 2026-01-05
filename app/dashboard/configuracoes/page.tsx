'use client'

import { useState, useEffect } from 'react'
import { Settings, Building, Mail, MapPin, Save, CheckCircle, User, Briefcase, ChevronDown, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { uploadImageToSupabase } from '@/lib/upload'
import { motion } from 'framer-motion'
import { COMPANY_INFO } from '@/lib/company-info'

export default function ConfiguracoesPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState({
    firstName: '',
    lastName: '',
    role: '',
    avatarUrl: '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const roleOptions = [
    { value: '', label: 'Selecione uma função' },
    { value: 'Dono', label: 'Dono' },
    { value: 'Gerente', label: 'Gerente' },
    { value: 'Vendedor', label: 'Vendedor' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Financeiro', label: 'Financeiro' },
    { value: 'Atendente', label: 'Atendente' },
    { value: 'Desenvolvedor', label: 'Desenvolvedor' },
    { value: 'Outro', label: 'Outro' },
  ]

  useEffect(() => {
    const savedEmployee = localStorage.getItem('autopier_employee')
    if (savedEmployee) {
      try {
        const parsed = JSON.parse(savedEmployee)
        setEmployee({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          role: parsed.role || '',
          avatarUrl: parsed.avatarUrl || '',
        })
        if (parsed.avatarUrl) {
          setAvatarPreview(parsed.avatarUrl)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do funcionário:', error)
      }
    }
  }, [])

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB')
        return
      }

      setAvatarFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setEmployee({ ...employee, avatarUrl: '' })
  }

  async function handleSaveEmployee() {
    if (!employee.firstName.trim() || !employee.lastName.trim()) {
      alert('Por favor, preencha nome e sobrenome')
      return
    }

    if (!employee.role) {
      alert('Por favor, selecione uma função')
      return
    }

    setSaving(true)
    try {
      let avatarUrl = employee.avatarUrl

      if (avatarFile) {
        setUploadingAvatar(true)
        try {
          avatarUrl = await uploadImageToSupabase(avatarFile, 'avatars')
          setEmployee({ ...employee, avatarUrl })
        } catch (error: any) {
          console.error('Erro ao fazer upload do avatar:', error)
          alert(`Erro ao fazer upload do avatar: ${error.message}`)
          setSaving(false)
          setUploadingAvatar(false)
          return
        } finally {
          setUploadingAvatar(false)
        }
      }

      const employeeData = { ...employee, avatarUrl }

      const response = await fetch('/api/dashboard/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      })

      if (response.ok) {
        localStorage.setItem('autopier_employee', JSON.stringify(employeeData))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)

        window.dispatchEvent(new CustomEvent('employeeUpdated', { detail: employeeData }))
      } else {
        alert('Erro ao salvar informações do funcionário')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar informações do funcionário')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-text-secondary mt-1">
          Configurações gerais da concessionária
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-static p-6"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Building className="w-5 h-5 text-primary" />
          Informações da Empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nome da Empresa
            </label>
            <p className="text-white">{COMPANY_INFO.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Slogan
            </label>
            <p className="text-white">{COMPANY_INFO.slogan}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <p className="text-white">{COMPANY_INFO.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Endereço
            </label>
            <p className="text-white">{COMPANY_INFO.address}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-static p-6"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-primary" />
          Informações do Funcionário
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={employee.firstName}
              onChange={(e) => setEmployee({ ...employee, firstName: e.target.value })}
              placeholder="Seu nome"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Sobrenome *
            </label>
            <input
              type="text"
              value={employee.lastName}
              onChange={(e) => setEmployee({ ...employee, lastName: e.target.value })}
              placeholder="Seu sobrenome"
              className="input-field w-full"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Função *
            </label>
            <div className="relative">
              <select
                value={employee.role}
                onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                className="input-field w-full pr-10 appearance-none cursor-pointer"
                required
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Foto do Funcionário
            </label>
            {!avatarPreview ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-surface/30 transition-all duration-200"
                >
                  <Upload className="w-8 h-8 text-text-muted mb-2" />
                  <span className="text-text-secondary text-sm font-medium">
                    Clique para fazer upload
                  </span>
                  <span className="text-text-muted text-xs mt-1">
                    JPG, PNG, WEBP, GIF ou AVIF (máx. 5MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative inline-block">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/30">
                  <Image
                    src={avatarPreview}
                    alt="Preview do avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4 md:col-span-2">
            <button
              onClick={handleSaveEmployee}
              disabled={saving || uploadingAvatar}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {uploadingAvatar ? 'Enviando foto...' : saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>

            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-accent flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Configurações salvas!
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
