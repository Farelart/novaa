"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
