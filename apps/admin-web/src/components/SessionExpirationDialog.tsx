'use client'

import { Button } from '@website-chat/ui'

interface SessionExpirationDialogProps {
  isOpen: boolean
  onLogin: () => void
}

export default function SessionExpirationDialog({ isOpen, onLogin }: SessionExpirationDialogProps) {

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="fixed border rounded-xl left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg  mx-4">
        <div className="bg-white rounded-xl shadow-2xl border-0 p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Session Expired
            </h3>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Please login again to continue.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center pt-6">
            <Button 
              onClick={onLogin}
              className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Login Now
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}