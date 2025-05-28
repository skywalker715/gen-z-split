"use client"

import { useState } from "react"
import { Upload, Users, Calculator, Share2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ReceiptItem {
  id: string
  name: string
  price: number
  assignments: { [personName: string]: number } // percentage (0-100)
}

interface Person {
  name: string
}

// Sample receipt data
const SAMPLE_RECEIPT = {
  items: [
    { id: "1", name: "Spinach Artichoke Dip", price: 12.99, assignments: {} },
    { id: "2", name: "Chicken Caesar Salad", price: 14.99, assignments: {} },
    { id: "3", name: "Margherita Pizza", price: 18.5, assignments: {} },
    { id: "4", name: "Grilled Salmon", price: 24.99, assignments: {} },
    { id: "5", name: "Coca Cola", price: 3.99, assignments: {} },
    { id: "6", name: "Craft Beer", price: 6.5, assignments: {} },
  ],
  subtotal: 81.96,
  tax: 6.97, // 8.5%
  total: 88.93,
}

export default function BillSplitter() {
  const [currentStep, setCurrentStep] = useState(1)
  const [receiptUploaded, setReceiptUploaded] = useState(false)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [newPersonName, setNewPersonName] = useState("")

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrText, setOcrText] = useState("")
  const [processingError, setProcessingError] = useState("")

  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")

  const [tipAmount, setTipAmount] = useState(15)
  const [taxAmount, setTaxAmount] = useState(8.5)
  const [serviceAmount, setServiceAmount] = useState(0)
  const [tipDistribution, setTipDistribution] = useState("proportional")
  const [taxDistribution, setTaxDistribution] = useState("proportional")

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    setProcessingError("")

    try {
      // Dynamic import of Tesseract.js
      const Tesseract = await import("tesseract.js")

      // Process the image with Tesseract OCR
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          // Optional: show progress
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      setOcrText(text)

      // Parse the extracted text
      const parsedItems = parseReceiptText(text)

      if (parsedItems.length > 0) {
        setItems(parsedItems)
        setReceiptUploaded(true)
        setCurrentStep(2)
      } else {
        // If no items found, show error and allow manual entry
        setProcessingError("Could not extract items from receipt. Please add items manually or try a different image.")
        setItems([])
        setReceiptUploaded(true)
        setCurrentStep(2)
      }
    } catch (error) {
      console.error("OCR Error:", error)
      setProcessingError("Failed to process receipt. Please try again or add items manually.")
      setItems([])
      setReceiptUploaded(true)
      setCurrentStep(2)
    } finally {
      setIsProcessing(false)
    }
  }

  const parseReceiptText = (text: string): ReceiptItem[] => {
    const lines = text.split(/[\n\r]+/).filter((line) => line.trim())
    const items: ReceiptItem[] = []

    // Enhanced patterns for menu items with prices
    const itemPatterns = [
      /^(.+?)\s+\$(\d+\.?\d*)$/, // "Item Name $12.99"
      /^(.+?)\s+(\d+\.\d{2})$/, // "Item Name 12.99"
      /^(.+?)\s*\$(\d+\.?\d*)$/, // "Item Name$12.99"
      /^(.+?)\s+USD\s*(\d+\.?\d*)$/i, // "Item Name USD 12.99"
      /^(.+?)\s*:\s*\$?(\d+\.?\d*)$/, // "Item Name: $12.99"
      /^(.+?)\s+@\s*\$?(\d+\.?\d*)$/, // "Item Name @ $12.99"
    ]

    // Enhanced skip words
    const skipWords = [
      "total",
      "subtotal",
      "tax",
      "tip",
      "gratuity",
      "service",
      "charge",
      "fee",
      "discount",
      "receipt",
      "thank",
      "visit",
      "server",
      "table",
      "check",
      "bill",
      "payment",
      "cash",
      "card",
      "change",
      "balance",
      "amount",
      "due",
      "tender",
      "restaurant",
      "cafe",
      "diner",
      "bar",
      "grill",
      "kitchen",
      "menu",
      "order",
      "date",
      "time",
      "guest",
      "party",
      "seat",
      "transaction",
      "invoice",
    ]

    lines.forEach((line, index) => {
      const cleanLine = line.trim().toLowerCase()

      // Skip very short lines or lines with common non-item text
      if (cleanLine.length < 3 || skipWords.some((word) => cleanLine.includes(word))) {
        return
      }

      // Skip lines that are mostly numbers or special characters
      if (/^[\d\s.$\-+=*/\\]+$/.test(cleanLine)) {
        return
      }

      // Try each pattern
      for (const pattern of itemPatterns) {
        const match = line.trim().match(pattern)
        if (match) {
          const name = match[1].trim()
          const price = Number.parseFloat(match[2])

          // Enhanced validation
          if (
            name.length >= 3 &&
            name.length <= 50 &&
            price > 0.5 &&
            price < 500 &&
            !skipWords.some((word) => name.toLowerCase().includes(word))
          ) {
            items.push({
              id: `item-${Date.now()}-${index}`,
              name: name,
              price: price,
              assignments: {},
            })
            break
          }
        }
      }
    })

    return items
  }

  const addPerson = () => {
    if (newPersonName.trim() && people.length < 8) {
      setPeople([...people, { name: newPersonName.trim() }])
      setNewPersonName("")
    }
  }

  const removePerson = (nameToRemove: string) => {
    setPeople(people.filter((p) => p.name !== nameToRemove))
    // Remove assignments for this person
    setItems(
      items.map((item) => ({
        ...item,
        assignments: Object.fromEntries(Object.entries(item.assignments).filter(([name]) => name !== nameToRemove)),
      })),
    )
  }

  const updateItemAssignment = (itemId: string, personName: string, percentage: number) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const newAssignments = { ...item.assignments }
          if (percentage === 0) {
            delete newAssignments[personName]
          } else {
            newAssignments[personName] = percentage
          }
          return { ...item, assignments: newAssignments }
        }
        return item
      }),
    )
  }

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, price: newPrice } : item)))
  }

  const updateItemName = (itemId: string, newName: string) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, name: newName } : item)))
  }

  const getItemAssignmentTotal = (item: ReceiptItem) => {
    return Object.values(item.assignments).reduce((sum, percentage) => sum + percentage, 0)
  }

  const calculatePersonTotal = (personName: string) => {
    const itemsTotal = items.reduce((sum, item) => {
      const percentage = item.assignments[personName] || 0
      return sum + (item.price * percentage) / 100
    }, 0)

    const subtotal = items.reduce((sum, item) => sum + item.price, 0)
    const tax = subtotal * (taxAmount / 100)
    const service = subtotal * (serviceAmount / 100)
    const tip = subtotal * (tipAmount / 100)

    let taxShare = 0
    let serviceShare = 0
    let tipShare = 0

    if (taxDistribution === "equal") {
      taxShare = tax / people.length
      serviceShare = service / people.length
    } else {
      taxShare = (itemsTotal / subtotal) * tax
      serviceShare = (itemsTotal / subtotal) * service
    }

    if (tipDistribution === "equal") {
      tipShare = tip / people.length
    } else {
      tipShare = (itemsTotal / subtotal) * tip
    }

    return {
      items: itemsTotal,
      tax: taxShare,
      service: serviceShare,
      tip: tipShare,
      total: itemsTotal + taxShare + serviceShare + tipShare,
    }
  }

  const exportSummary = () => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0)
    const tax = subtotal * (taxAmount / 100)
    const service = subtotal * (serviceAmount / 100)
    const tip = subtotal * (tipAmount / 100)

    let summary = `🧾 Bill Split Summary\n\n`
    summary += `📍 Total Bill: $${(subtotal + tax + service + tip).toFixed(2)}\n`
    summary += `💰 Subtotal: $${subtotal.toFixed(2)}\n`
    summary += `🏛️ Tax (${taxAmount}%): $${tax.toFixed(2)}\n`
    if (serviceAmount > 0) {
      summary += `🔧 Service (${serviceAmount}%): $${service.toFixed(2)}\n`
    }
    summary += `💡 Tip (${tipAmount}%): $${tip.toFixed(2)}\n\n`

    people.forEach((person) => {
      const personTotal = calculatePersonTotal(person.name)
      summary += `👤 ${person.name}: $${personTotal.total.toFixed(2)}\n`
    })

    navigator.clipboard.writeText(summary)
    alert("Summary copied to clipboard!")
  }

  const addManualItem = () => {
    if (newItemName.trim() && newItemPrice && Number.parseFloat(newItemPrice) > 0) {
      const newItem: ReceiptItem = {
        id: `manual-${Date.now()}`,
        name: newItemName.trim(),
        price: Number.parseFloat(newItemPrice),
        assignments: {},
      }
      setItems([...items, newItem])
      setNewItemName("")
      setNewItemPrice("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            💰 Bill Splitter
          </h1>
          <p className="text-gray-600 mt-2">Split restaurant bills like a pro! 🍽️</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center space-x-2">
          {[
            { num: 1, icon: "📸" },
            { num: 2, icon: "👥" },
            { num: 3, icon: "🎯" },
            { num: 4, icon: "💸" },
          ].map((step) => (
            <div
              key={step.num}
              className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all duration-300 ${
                currentStep >= step.num
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110"
                  : "bg-white text-gray-600 shadow-md"
              }`}
            >
              <span className="text-lg">{step.icon}</span>
              <span>{step.num}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Receipt Upload */}
        {currentStep === 1 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />📸 Upload Receipt
              </CardTitle>
              <CardDescription className="text-purple-100">Take a photo of your restaurant receipt</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div
                className="border-3 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-pink-400 hover:bg-pink-50 transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add("border-pink-400", "bg-pink-100")
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-pink-400", "bg-pink-100")
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("border-pink-400", "bg-pink-100")
                  const files = Array.from(e.dataTransfer.files)
                  if (files.length > 0 && files[0].type.startsWith("image/")) {
                    handleFileUpload(files[0])
                  }
                }}
              >
                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-purple-700 font-medium">🤖 Processing receipt with AI magic...</p>
                    <p className="text-sm text-purple-600">This may take 10-30 seconds ⏰</p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-green-700 font-medium">🎉 Receipt processed successfully!</p>
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    {processingError && <p className="text-sm text-red-600">{processingError}</p>}
                  </div>
                ) : (
                  <>
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-gray-700 mb-4 font-medium">Click to upload or drag and drop your receipt</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0])
                        }
                      }}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <Button
                      onClick={() => document.getElementById("receipt-upload")?.click()}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      📸 Upload Receipt
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add People */}
        {currentStep === 2 && (
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />👥 Add People
              </CardTitle>
              <CardDescription className="text-blue-100">Who's splitting this bill? 🤝</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter person's name 👤"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addPerson()}
                  className="border-2 border-blue-200 focus:border-blue-400 rounded-xl"
                />
                <Button
                  onClick={addPerson}
                  size="icon"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {people.map((person) => (
                  <Badge
                    key={person.name}
                    variant="secondary"
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-200 px-3 py-1 rounded-full"
                  >
                    👤 {person.name}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => removePerson(person.name)}
                    />
                  </Badge>
                ))}
              </div>

              {processingError && (
                <div className="space-y-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                  <h3 className="font-medium text-yellow-800">⚠️ Add Items Manually</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Item name 🍕"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="flex-1 border-2 border-yellow-200"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price 💰"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-24 border-2 border-yellow-200"
                    />
                    <Button
                      onClick={addManualItem}
                      size="icon"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">📝 Added items:</p>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm bg-white p-2 rounded-lg"
                        >
                          <span>🍽️ {item.name}</span>
                          <span className="font-medium">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {people.length >= 2 && (
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🎯 Continue to Item Assignment
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Item Assignment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card className="border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />🎯 Assign Items
                </CardTitle>
                <CardDescription className="text-green-100">Assign each item to people 🍽️</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-t-lg">
                <CardTitle className="text-lg">➕ Add Missing Items</CardTitle>
                <CardDescription className="text-orange-100">
                  OCR might miss some items - add them here! 🔍
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name 🍕"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 border-2 border-orange-200 focus:border-orange-400"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price 💰"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-24 border-2 border-orange-200 focus:border-orange-400"
                  />
                  <Button
                    onClick={addManualItem}
                    size="icon"
                    variant="outline"
                    className="border-2 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {items.map((item, index) => (
              <Card
                key={item.id}
                className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItemName(item.id, e.target.value)}
                        className="flex-1 border-2 border-purple-200 focus:border-purple-400"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItemPrice(item.id, Number.parseFloat(e.target.value) || 0)}
                        className="w-20 border-2 border-purple-200 focus:border-purple-400"
                      />
                      <Button
                        onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                        size="icon"
                        variant="outline"
                        className="border-2 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {people.map((person) => {
                        const currentAssignment = item.assignments[person.name] || 0
                        return (
                          <div key={person.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">👤 {person.name}</span>
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                                {currentAssignment}%
                              </span>
                            </div>
                            <Slider
                              value={[currentAssignment]}
                              onValueChange={([value]) => updateItemAssignment(item.id, person.name, value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-sm text-right">
                      <span
                        className={`font-bold text-lg ${
                          getItemAssignmentTotal(item) === 100 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {getItemAssignmentTotal(item) === 100 ? "✅" : "⚠️"} Assigned: {getItemAssignmentTotal(item)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={() => setCurrentStep(4)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={items.some((item) => getItemAssignmentTotal(item) !== 100)}
            >
              💸 Continue to Final Calculation
            </Button>
          </div>
        )}

        {/* Step 4: Final Calculation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card className="border-2 border-indigo-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />💸 Tax, Service & Tip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">🏛️ Tax Distribution</Label>
                    <RadioGroup value={taxDistribution} onValueChange={setTaxDistribution} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="proportional" id="tax-prop" />
                        <Label htmlFor="tax-prop" className="text-sm">
                          📊 Proportional to items
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="equal" id="tax-equal" />
                        <Label htmlFor="tax-equal" className="text-sm">
                          ⚖️ Split equally
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="tax" className="text-sm font-medium text-gray-700">
                      🏛️ Tax Percentage: {taxAmount}%
                    </Label>
                    <Slider
                      id="tax"
                      value={[taxAmount]}
                      onValueChange={([value]) => setTaxAmount(value)}
                      max={15}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service" className="text-sm font-medium text-gray-700">
                      🔧 Service Charge: {serviceAmount}%
                    </Label>
                    <Slider
                      id="service"
                      value={[serviceAmount]}
                      onValueChange={([value]) => setServiceAmount(value)}
                      max={25}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">💡 Tip Distribution</Label>
                    <RadioGroup value={tipDistribution} onValueChange={setTipDistribution} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="proportional" id="tip-prop" />
                        <Label htmlFor="tip-prop" className="text-sm">
                          📊 Proportional to items
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="equal" id="tip-equal" />
                        <Label htmlFor="tip-equal" className="text-sm">
                          ⚖️ Split equally
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="tip" className="text-sm font-medium text-gray-700">
                      💡 Tip Percentage: {tipAmount}%
                    </Label>
                    <Slider
                      id="tip"
                      value={[tipAmount]}
                      onValueChange={([value]) => setTipAmount(value)}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Summary */}
            <Card className="border-2 border-emerald-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle>🎉 Final Split</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {people.map((person, index) => {
                  const totals = calculatePersonTotal(person.name)
                  const colors = [
                    "from-pink-100 to-rose-100 border-pink-200",
                    "from-blue-100 to-cyan-100 border-blue-200",
                    "from-green-100 to-emerald-100 border-green-200",
                    "from-purple-100 to-indigo-100 border-purple-200",
                    "from-yellow-100 to-orange-100 border-yellow-200",
                    "from-red-100 to-pink-100 border-red-200",
                    "from-indigo-100 to-purple-100 border-indigo-200",
                    "from-teal-100 to-cyan-100 border-teal-200",
                  ]
                  return (
                    <div
                      key={person.name}
                      className={`space-y-2 p-4 rounded-xl bg-gradient-to-r ${colors[index % colors.length]} border-2`}
                    >
                      <div className="flex justify-between font-bold text-lg">
                        <span>👤 {person.name}</span>
                        <span className="text-2xl">${totals.total.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>🍽️ Items:</span>
                          <span className="font-medium">${totals.items.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🏛️ Tax:</span>
                          <span className="font-medium">${totals.tax.toFixed(2)}</span>
                        </div>
                        {serviceAmount > 0 && (
                          <div className="flex justify-between">
                            <span>🔧 Service:</span>
                            <span className="font-medium">${totals.service.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>💡 Tip:</span>
                          <span className="font-medium">${totals.tip.toFixed(2)}</span>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Button
              onClick={exportSummary}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Share2 className="w-4 h-4 mr-2" />📋 Share Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
