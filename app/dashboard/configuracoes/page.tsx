'use client'

import { useState, useEffect } from 'react'
import { Settings, Building, Mail, MapPin, Save, CheckCircle, User, Briefcase, ChevronDown, Upload, Image as ImageIcon, X } from 'lucide-react'
import Image from 'next/image'
import { uploadImageToSupabase } from '@/lib/upload'
import { motion } from 'framer-motion'

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
    { value: 'Outro', label: 'Outro' },
  ]

  // Carregar dados do funcionário do localStorage ao montar
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

  // Handler para selecionar avatar
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
      
      // Se há uma imagem selecionada, fazer upload
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
        // Salvar no localStorage
        localStorage.setItem('autopier_employee', JSON.stringify(employeeData))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        
        // Disparar evento para atualizar o layout
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-text-secondary mt-1">
          Configurações gerais da concessionária
        </p>
      </div>

      {/* Informações da Empresa (Somente Leitura) */}
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
          {/* Nome da Empresa */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nome da Empresa
            </label>
            <p className="text-white">AutoPier</p>
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Slogan
            </label>
            <p className="text-white">Concessionária Premium</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <p className="text-white">autopiernovacapitalrp@gmail.com</p>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Endereço
            </label>
            <p className="text-white">San Fierro</p>
          </div>
        </div>
      </motion.div>

      {/* Informações do Funcionário */}
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
          {/* Nome */}
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

          {/* Sobrenome */}
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

          {/* Função */}
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

          {/* Avatar/Foto */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Foto do Funcionário
            </label>
            {!avatarPreview ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="employee-avatar-upload"
                />
                <label
                  htmlFor="employee-avatar-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-surface/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-text-muted" />
                    <p className="mb-1 text-sm text-text-secondary">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste a foto
                    </p>
                    <p className="text-xs text-text-muted">
                      PNG, JPG, WEBP até 5MB
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative w-32">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/30">
                  <Image
                    src={avatarPreview}
                    alt="Avatar do funcionário"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute top-1 right-1 p-1.5 bg-background-secondary/90 hover:bg-background-secondary rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Clique no X para remover a foto
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="mt-8 flex items-center gap-4">
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
      </motion.div>
    </div>
  )
}

