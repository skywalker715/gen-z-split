"use client"

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useOCR } from '@/hooks/use-ocr'
import type { ReceiptItem } from '@/types/receipt'

interface OCRUploadProps {
  onItemsExtracted: (items: ReceiptItem[]) => void
  onError?: (error: string) => void
}

export const OCRUpload = ({ onItemsExtracted, onError }: OCRUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const {
    isProcessing,
    selectedFile,
    ocrResult,
    error,
    debugInfo,
    processFile,
    resetOCR,
    validateResults,
  } = useOCR()

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file')
      return
    }

    try {
      await processFile(file)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to process file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleRetry = () => {
    resetOCR()
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    if (ocrResult?.items) {
      onItemsExtracted(ocrResult.items)
    }
  }

  const validation = validateResults()

  return (
    <Card className="border-2 border-purple-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          📸 Upload Receipt
        </CardTitle>
        <CardDescription className="text-purple-100">
          Take a photo of your restaurant receipt
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* File Upload Area */}
        <div
          className={`border-3 border-dashed rounded-xl p-8 text-center transition-all duration-300 bg-gradient-to-br ${
            dragActive
              ? 'border-pink-400 bg-pink-100'
              : 'border-purple-300 hover:border-pink-400 hover:bg-pink-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-purple-500" />
              <p className="text-purple-700 font-medium">
                🤖 Processing receipt with AI magic...
              </p>
              <p className="text-sm text-purple-600">
                This may take 10-30 seconds ⏰
              </p>
            </div>
          ) : selectedFile && ocrResult ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-700 font-medium">
                🎉 Receipt processed successfully!
              </p>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
              
              {/* OCR Results Summary */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span>📝 Items found:</span>
                  <Badge variant="secondary">{ocrResult.items.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>🎯 Confidence:</span>
                  <Badge 
                    variant={ocrResult.confidence > 80 ? "default" : "destructive"}
                  >
                    {ocrResult.confidence.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>⏱️ Processing time:</span>
                  <Badge variant="outline">
                    {(ocrResult.processingTime / 1000).toFixed(1)}s
                  </Badge>
                </div>
              </div>

              {/* Debug Info Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="mt-2"
              >
                {showDebugInfo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </Button>

              {/* Debug Information */}
              {showDebugInfo && debugInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <h4 className="font-medium text-gray-700 mb-2">🔍 Extracted Text:</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {debugInfo.extractedText}
                  </pre>
                </div>
              )}

              {/* Validation Warnings */}
              {!validation.isValid && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validation.issues.map((issue, index) => (
                        <p key={index} className="text-sm">⚠️ {issue}</p>
                      ))}
                      {validation.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-sm text-gray-600">💡 {suggestion}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  disabled={ocrResult.items.length === 0}
                >
                  Continue with {ocrResult.items.length} items
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-700 mb-4 font-medium">
                Click to upload or drag and drop your receipt
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                📸 Upload Receipt
              </Button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">OCR Processing Failed</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 