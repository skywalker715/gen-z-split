import { useState, useCallback } from 'react'
import { processReceiptOCR, validateOCRResults, type OCRResult } from '@/lib/ocr'
import type { ReceiptItem } from '@/types/receipt'

interface UseOCRReturn {
  // State
  isProcessing: boolean
  selectedFile: File | null
  ocrResult: OCRResult | null
  error: string | null
  debugInfo: {
    extractedText: string
    confidence: number
    processingTime: number
  } | null
  
  // Actions
  processFile: (file: File) => Promise<void>
  resetOCR: () => void
  validateResults: () => { isValid: boolean; issues: string[]; suggestions: string[] }
}

export const useOCR = (): UseOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    extractedText: string
    confidence: number
    processingTime: number
  } | null>(null)

  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    setError(null)
    setOcrResult(null)
    setDebugInfo(null)

    try {
      const result = await processReceiptOCR(file)
      
      setOcrResult(result)
      setDebugInfo({
        extractedText: result.text,
        confidence: result.confidence,
        processingTime: result.processingTime,
      })
      
      // Validate results and show warnings if needed
      const validation = validateOCRResults(result)
      if (!validation.isValid) {
        console.warn('OCR validation issues:', validation.issues)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown OCR error'
      setError(errorMessage)
      console.error('OCR processing failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const resetOCR = useCallback(() => {
    setSelectedFile(null)
    setOcrResult(null)
    setError(null)
    setDebugInfo(null)
    setIsProcessing(false)
  }, [])

  const validateResults = useCallback(() => {
    if (!ocrResult) {
      return {
        isValid: false,
        issues: ['No OCR results available'],
        suggestions: ['Please process a receipt first']
      }
    }
    
    return validateOCRResults(ocrResult)
  }, [ocrResult])

  return {
    // State
    isProcessing,
    selectedFile,
    ocrResult,
    error,
    debugInfo,
    
    // Actions
    processFile,
    resetOCR,
    validateResults,
  }
} 