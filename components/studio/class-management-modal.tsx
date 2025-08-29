'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  FileText,
  Target,
  Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar24 } from '@/components/ui/calendar24'
import { ClassItem, Studio } from '@/types'

interface ClassManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (classData: Partial<ClassItem>) => void
  editingClass?: ClassItem | null
  studio: Studio
}

export function ClassManagementModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingClass, 
  studio 
}: ClassManagementModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    class_type: '',
    description: '',
    date: undefined as Date | undefined,
    time: '10:30',
    duration: 60,
    max_capacity: 15,
    credit_cost: 2,
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    instructor_id: 'instructor-1'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingClass) {
      const classDate = new Date(editingClass.start_time)
      const timeString = editingClass.start_time.split('T')[1].substring(0, 5)
      
      setFormData({
        name: editingClass.name,
        class_type: editingClass.class_type,
        description: editingClass.description || '',
        date: classDate,
        time: timeString,
        duration: editingClass.duration,
        max_capacity: editingClass.max_capacity,
        credit_cost: editingClass.credit_cost,
        difficulty_level: editingClass.difficulty_level,
        instructor_id: editingClass.instructor_id || 'instructor-1'
      })
    } else {
      setFormData({
        name: '',
        class_type: '',
        description: '',
        date: undefined,
        time: '10:30',
        duration: 60,
        max_capacity: 15,
        credit_cost: 2,
        difficulty_level: 'beginner',
        instructor_id: 'instructor-1'
      })
    }
    setErrors({})
  }, [editingClass, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Class name is required'
    if (!formData.class_type.trim()) newErrors.class_type = 'Class type is required'
    if (!formData.date || !formData.time) newErrors.start_time = 'Date and time are required'
    if (formData.duration < 15) newErrors.duration = 'Duration must be at least 15 minutes'
    if (formData.max_capacity < 1) newErrors.max_capacity = 'Capacity must be at least 1'
    if (formData.credit_cost < 1) newErrors.credit_cost = 'Credit cost must be at least 1'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    // Combine date and time
    const combinedDateTime = formData.date && formData.time 
      ? new Date(`${formData.date.toISOString().split('T')[0]}T${formData.time}:00`)
      : new Date()

    const classData = {
      name: formData.name,
      class_type: formData.class_type,
      description: formData.description,
      start_time: combinedDateTime.toISOString(),
      duration: formData.duration,
      max_capacity: formData.max_capacity,
      credit_cost: formData.credit_cost,
      difficulty_level: formData.difficulty_level,
      instructor_id: formData.instructor_id,
      studio_id: studio.id
    }

    // Simulate API call
    setTimeout(() => {
      onSave(classData)
      setIsSubmitting(false)
      onClose()
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-fitness">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
        
        <Card className="relative bg-black/80 backdrop-blur-xl border-white/10 text-white">
          <CardHeader className="relative border-b border-white/10 pb-6">
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-purple-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-orange-400 to-pink-600 text-white p-4 rounded-full">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </CardTitle>
                <p className="text-purple-300 text-lg">
                  {studio.name} - {studio.location.neighborhood}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="e.g., Morning Yoga Flow"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Class Type *
                    </label>
                    <select
                      value={formData.class_type}
                      onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select type</option>
                      <option value="Yoga" className="bg-gray-800 text-white">Yoga</option>
                      <option value="Pilates" className="bg-gray-800 text-white">Pilates</option>
                      <option value="HIIT" className="bg-gray-800 text-white">HIIT</option>
                      <option value="Strength" className="bg-gray-800 text-white">Strength Training</option>
                      <option value="Cardio" className="bg-gray-800 text-white">Cardio</option>
                      <option value="CrossFit" className="bg-gray-800 text-white">CrossFit</option>
                      <option value="Meditation" className="bg-gray-800 text-white">Meditation</option>
                      <option value="Dance" className="bg-gray-800 text-white">Dance Fitness</option>
                    </select>
                    {errors.class_type && <p className="text-red-400 text-sm mt-1">{errors.class_type}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Describe what makes this class special..."
                  />
                </div>
              </div>

              {/* Schedule & Capacity */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Schedule & Capacity
                </h3>
                
                <div className="space-y-6">
                  {/* Date and Time Picker */}
                  <div>
                    <Calendar24
                      date={formData.date}
                      time={formData.time}
                      onDateChange={(date) => setFormData({ ...formData, date })}
                      onTimeChange={(time) => setFormData({ ...formData, time })}
                      error={errors.start_time}
                    />
                  </div>

                  {/* Duration and Capacity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                        min="15"
                        max="180"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Max Capacity *
                      </label>
                      <input
                        type="number"
                        value={formData.max_capacity}
                        onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {errors.max_capacity && <p className="text-red-400 text-sm mt-1">{errors.max_capacity}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Difficulty */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Pricing & Difficulty
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Credit Cost *
                    </label>
                    <input
                      type="number"
                      value={formData.credit_cost}
                      onChange={(e) => setFormData({ ...formData, credit_cost: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {errors.credit_cost && <p className="text-red-400 text-sm mt-1">{errors.credit_cost}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Difficulty Level *
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="beginner" className="bg-gray-800 text-white">Beginner</option>
                      <option value="intermediate" className="bg-gray-800 text-white">Intermediate</option>
                      <option value="advanced" className="bg-gray-800 text-white">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex-1 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
