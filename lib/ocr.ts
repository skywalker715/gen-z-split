import type { ReceiptItem } from '@/types/receipt'

// OCR Configuration
export const OCR_CONFIG = {
  language: 'eng',
  tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,@: ',
  tessedit_pageseg_mode: '6', // Uniform block of text
  preserve_interword_spaces: '1',
  tessjs_create_pdf: '0',
  tessjs_create_hocr: '0',
  tessjs_create_tsv: '0',
  tessjs_create_box: '0',
  tessjs_create_unlv: '0',
  tessjs_create_osd: '0',
} as const

// OCR Result interface
export interface OCRResult {
  text: string
  confidence: number
  items: ReceiptItem[]
  processingTime: number
  debugInfo?: {
    originalText: string
    preprocessedText?: string
    patternMatches: Array<{
      pattern: string
      matches: number
    }>
  }
}

// Image preprocessing for better OCR results
export const preprocessImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Apply contrast enhancement
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const contrast = 1.5 // Adjust contrast
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
        const newValue = factor * (avg - 128) + 128
        
        data[i] = Math.max(0, Math.min(255, newValue))     // R
        data[i + 1] = Math.max(0, Math.min(255, newValue)) // G
        data[i + 2] = Math.max(0, Math.min(255, newValue)) // B
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // Convert back to file
      canvas.toBlob((blob) => {
        const processedFile = new File([blob!], file.name, { type: file.type })
        resolve(processedFile)
      }, file.type)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Enhanced text parsing with comprehensive patterns
export const parseReceiptText = (text: string): ReceiptItem[] => {
  const lines = text.split(/[\n\r]+/).filter((line) => line.trim())
  const items: ReceiptItem[] = []
  
  // Comprehensive patterns for menu items with prices
  const itemPatterns = [
    // Standard patterns
    { pattern: /^(.+?)\s+\$(\d+\.?\d*)$/, name: 'Standard with $' },
    { pattern: /^(.+?)\s+(\d+\.\d{2})$/, name: 'Standard decimal' },
    { pattern: /^(.+?)\s*\$(\d+\.?\d*)$/, name: 'No space with $' },
    // Comma as decimal separator
    { pattern: /^(.+?)\s+(\d+,\d{2})$/, name: 'Standard decimal with comma' },
    { pattern: /^(.+?)\s*\$(\d+,\d{2})$/, name: 'Dollar with comma' },
    // Enhanced patterns for various receipt formats
    { pattern: /^(.+?)\s+USD\s*(\d+\.?\d*)$/i, name: 'USD currency' },
    { pattern: /^(.+?)\s*:\s*\$?(\d+\.?\d*)$/, name: 'Colon separator' },
    { pattern: /^(.+?)\s+@\s*\$?(\d+\.?\d*)$/, name: 'At symbol' },
    // New patterns for better coverage
    { pattern: /^(.+?)\s+(\d+\.\d{2})\s*$/, name: 'Trailing space' },
    { pattern: /^(.+?)\s*\$(\d+\.\d{2})\s*$/, name: 'Dollar with cents' },
    { pattern: /^(.+?)\s*(\d+\.\d{2})\s*USD$/i, name: 'USD suffix' },
    { pattern: /^(.+?)\s*(\d+\.\d{2})\s*\$?$/, name: 'Optional dollar' },
    // Handle quantities and prices
    { pattern: /^(\d+)\s+(.+?)\s+\$(\d+\.?\d*)$/, name: 'Quantity prefix' },
    { pattern: /^(.+?)\s+(\d+)\s+\$(\d+\.?\d*)$/, name: 'Quantity suffix' },
    // Handle tax-inclusive prices
    { pattern: /^(.+?)\s+\$(\d+\.?\d*)\s*\(incl\.\s*tax\)$/i, name: 'Tax inclusive' },
    // Comma with quantity
    { pattern: /^(\d+)\s+(.+?)\s+(\d+,\d{2})$/, name: 'Quantity prefix with comma' },
    { pattern: /^(.+?)\s+(\d+)\s+(\d+,\d{2})$/, name: 'Quantity suffix with comma' },
  ]
  
  // Enhanced skip patterns with regex
  const skipPatterns = [
    /^total\s*:?\s*\$?\d+\.?\d*$/i,
    /^subtotal\s*:?\s*\$?\d+\.?\d*$/i,
    /^tax\s*:?\s*\$?\d+\.?\d*$/i,
    /^tip\s*:?\s*\$?\d+\.?\d*$/i,
    /^gratuity\s*:?\s*\$?\d+\.?\d*$/i,
    /^service\s*charge\s*:?\s*\$?\d+\.?\d*$/i,
    /^discount\s*:?\s*\$?\d+\.?\d*$/i,
    /^thank\s+you/i,
    /^visit\s+again/i,
    /^receipt\s+#\d+/i,
    /^date\s*:?\s*\d+/i,
    /^time\s*:?\s*\d+/i,
    /^server\s*:?\s*\w+/i,
    /^table\s*:?\s*\d+/i,
  ]
  
  // Price validation function
  const isValidPrice = (price: number): boolean => {
    return price >= 0.01 && price <= 1000 && 
           Number.isFinite(price) && 
           /^\d+\.?\d{0,2}$/.test(price.toString())
  }
  
  // Name validation function
  const isValidItemName = (name: string): boolean => {
    const cleanName = name.trim()
    return cleanName.length >= 2 && 
           cleanName.length <= 100 &&
           !/^[\d\s.$\-+=*/\\]+$/.test(cleanName) &&
           !skipPatterns.some(pattern => pattern.test(cleanName))
  }
  
  const patternMatches: Array<{ pattern: string; matches: number }> = []
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    // Skip empty lines and obvious non-items
    if (!trimmedLine || skipPatterns.some(pattern => pattern.test(trimmedLine))) {
      return
    }
    
    // Try each pattern
    for (const { pattern, name } of itemPatterns) {
      const match = trimmedLine.match(pattern)
      if (match !== null) {
        let name = match[1]?.trim()
        let priceStr = match[2] || match[3]
        if (typeof priceStr === 'string' && priceStr.includes(',')) {
          priceStr = priceStr.replace(',', '.')
        }
        let price = Number.parseFloat(priceStr)
        
        // Handle quantity patterns
        if (match[1] && match[2] && match[3]) {
          const quantity = Number.parseInt(match[1])
          if (quantity > 0 && quantity <= 99) {
            name = match[2].trim()
            priceStr = match[3]
            if (typeof priceStr === 'string' && priceStr.includes(',')) {
              priceStr = priceStr.replace(',', '.')
            }
            price = Number.parseFloat(priceStr)
          }
        }
        
        if (isValidItemName(name) && isValidPrice(price)) {
          items.push({
            id: `item-${Date.now()}-${index}`,
            name: name,
            price: price,
            assignments: {},
          })
          
          // Track pattern usage
          const existingPattern = patternMatches.find(p => p.pattern === name)
          if (existingPattern) {
            existingPattern.matches++
          } else {
            patternMatches.push({ pattern: name, matches: 1 })
          }
          
          break
        }
      }
    }
  })
  
  return items
}

// Main OCR processing function
export const processReceiptOCR = async (file: File): Promise<OCRResult> => {
  const startTime = Date.now()
  
  try {
    // Preprocess image for better OCR results
    const processedFile = await preprocessImage(file)
    
    // Dynamic import of Tesseract.js
    const Tesseract = await import("tesseract.js")
    
    // Process the image with Tesseract OCR
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(processedFile, OCR_CONFIG.language, {
      logger: (m) => {
        // Optional: show progress
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
      ...OCR_CONFIG,
    })
    
    // Parse the extracted text
    const parsedItems = parseReceiptText(text)
    const processingTime = Date.now() - startTime
    
    return {
      text,
      confidence,
      items: parsedItems,
      processingTime,
      debugInfo: {
        originalText: text,
        patternMatches: [], // Will be populated in parseReceiptText
      }
    }
    
  } catch (error) {
    console.error("OCR Error:", error)
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Utility function to validate OCR results
export const validateOCRResults = (result: OCRResult): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} => {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Check confidence
  if (result.confidence < 60) {
    issues.push(`Low OCR confidence: ${result.confidence.toFixed(1)}%`)
    suggestions.push('Try taking a clearer photo with better lighting')
  }
  
  // Check if items were found
  if (result.items.length === 0) {
    issues.push('No items were extracted from the receipt')
    suggestions.push('Check if the receipt image is clear and readable')
    suggestions.push('Try manually adding items if OCR fails')
  }
  
  // Check processing time
  if (result.processingTime > 30000) {
    suggestions.push('OCR took longer than expected, consider using a smaller image')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
} 