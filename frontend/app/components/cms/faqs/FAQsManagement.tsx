"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MessageSquare,
  Folder,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronRight,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { logger } from '@/lib/logger';

interface FAQ {
  id: string
  question: string
  answer: string
  category: {
    id: string
    name: string
    slug: string
  }
  order: number
  visible: boolean
  created_at: string
  updated_at: string
}

interface FAQCategory {
  id: string
  name: string
  slug: string
  description: string
  faq_count: number
}

export function FAQsManagement() {
  const router = useRouter()
  const { user } = useAuth()
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null)
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "", category: "" })
  const [showNewFAQ, setShowNewFAQ] = useState(false)

  useEffect(() => {
    fetchFAQs()
    fetchCategories()
  }, [categoryFilter, searchQuery])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        ...(categoryFilter !== "all" && { category: categoryFilter })
      })

      const response = await fetch(`/api/cms/faqs?${params}`)

      if (!response.ok) throw new Error("Failed to fetch FAQs")

      const data = await response.json()
      setFAQs(data.faqs || [])
    } catch (error) {
      logger.error("Error fetching FAQs:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/cms/faqs/categories`)

      if (!response.ok) throw new Error("Failed to fetch categories")

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      logger.error("Error fetching categories:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const response = await fetch(`/api/cms/faqs/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete FAQ")
      
      fetchFAQs()
    } catch (error) {
      logger.error("Error deleting FAQ:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    try {
      const response = await fetch(`/api/cms/faqs/${id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ visible: !visible })
      })

      if (!response.ok) throw new Error("Failed to update visibility")
      
      fetchFAQs()
    } catch (error) {
      logger.error("Error updating visibility:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/cms/faqs/${id}/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ direction })
      })

      if (!response.ok) throw new Error("Failed to reorder FAQ")
      
      fetchFAQs()
    } catch (error) {
      logger.error("Error reordering FAQ:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const handleCreateFAQ = async () => {
    if (!newFAQ.question || !newFAQ.answer || !newFAQ.category) return

    try {
      const response = await fetch(`/api/cms/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newFAQ)
      })

      if (!response.ok) throw new Error("Failed to create FAQ")
      
      setNewFAQ({ question: "", answer: "", category: "" })
      setShowNewFAQ(false)
      fetchFAQs()
    } catch (error) {
      logger.error("Error creating FAQ:", { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const groupedFAQs = faqs.reduce((acc, faq) => {
    const categoryId = faq.category.id
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage frequently asked questions
          </p>
        </div>
        <Button onClick={() => setShowNewFAQ(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total FAQs</p>
              <p className="text-2xl font-bold">{faqs.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <Folder className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Visible</p>
              <p className="text-2xl font-bold">{faqs.filter(f => f.visible).length}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hidden</p>
              <p className="text-2xl font-bold">{faqs.filter(f => !f.visible).length}</p>
            </div>
            <EyeOff className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border bg-white dark:bg-gray-800"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* New FAQ Form */}
          <AnimatePresence>
            {showNewFAQ && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border p-4 space-y-3"
              >
                <h3 className="font-medium">Add New FAQ</h3>
                <Input
                  placeholder="Question"
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                />
                <textarea
                  placeholder="Answer"
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  className="w-full p-3 border min-h-[100px]"
                />
                <select
                  value={newFAQ.category}
                  onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })}
                  className="w-full px-3 py-2 border bg-white dark:bg-gray-800"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleCreateFAQ}>Save FAQ</Button>
                  <Button variant="outline" onClick={() => setShowNewFAQ(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQs List */}
          <div className="space-y-4">
            {categories.map(category => {
              const categoryFAQs = groupedFAQs[category.id] || []
              if (categoryFAQs.length === 0 && !searchQuery) return null
              
              const isExpanded = expandedCategories.includes(category.id)
              
              return (
                <div key={category.id} className="border">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <Folder className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-gray-500">({categoryFAQs.length})</span>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t"
                      >
                        {categoryFAQs
                          .sort((a, b) => a.order - b.order)
                          .map((faq, index) => (
                            <div
                              key={faq.id}
                              className="p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start gap-2">
                                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div className="flex-1">
                                      <h4 className="font-medium">{faq.question}</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {faq.answer}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReorder(faq.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <MoveUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReorder(faq.id, 'down')}
                                    disabled={index === categoryFAQs.length - 1}
                                  >
                                    <MoveDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleVisibility(faq.id, faq.visible)}
                                  >
                                    {faq.visible ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/admin/cms/faqs/edit/${faq.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(faq.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}