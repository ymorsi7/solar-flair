"use client"

import { useState } from 'react'
import Link from 'next/link'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

export default function AssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [address, setAddress] = useState('')
  const [utilityBill, setUtilityBill] = useState<File | null>(null)
  const [roofImages, setRoofImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assessment, setAssessment] = useState<any>(null)

  const roofDropzone = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    onDrop: (acceptedFiles) => {
      setRoofImages(acceptedFiles)
    }
  })
  
  const billDropzone = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setUtilityBill(acceptedFiles[0])
    }
  })

  const nextStep = () => {
    if (step === 1 && !address) {
      setError('Please enter your address')
      return
    }
    
    if (step === 3) {
      handleSubmit()
      return
    }
    
    setError('')
    setStep(step + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      
      // This would normally call the Gemini API directly
      // For this demo, we'll simulate a response
      
      // In a real implementation, you'd use the Gemini API like this:
      /*
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      
      // Process files for multimodal inputs
      const imageFiles = [...roofImages];
      if (utilityBill) imageFiles.push(utilityBill);
      
      const imagePromises = imageFiles.map(async (file) => {
        return {
          inlineData: {
            data: await fileToBase64(file),
            mimeType: file.type
          }
        };
      });
      
      const imageContents = await Promise.all(imagePromises);
      
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: `Perform a detailed solar assessment for this address: ${address}. Analyze the provided roof images and utility bill.` },
              ...imageContents
            ]
          }
        ]
      });
      
      const assessment = JSON.parse(result.response.text());
      */
      
      // Simulated response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const simulatedAssessment = {
        address: address,
        solarPotential: {
          annualProduction: 12500,
          recommendedSystemSize: 8.5,
          monthlySavings: 185,
          paybackPeriod: 7.2,
          co2Reduction: 8750
        },
        roofAnalysis: {
          suitableArea: 42,
          optimalDirection: "South-West",
          shadingIssues: "Minimal",
          recommendedPanels: 24
        },
        financialAnalysis: {
          installationCost: 27500,
          federalTaxCredit: 8250,
          stateTaxCredit: 2000,
          netCost: 17250,
          projectedSavings25yr: 83000,
          roi: 15.7
        }
      }
      
      setAssessment(simulatedAssessment)
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Error during assessment:', err)
      setError('An error occurred during the assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Solar Assessment</h1>
        <div className="flex justify-center mt-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-solar-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-solar-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-solar-600 text-white' : 'bg-gray-200'}`}>2</div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-solar-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-solar-600 text-white' : 'bg-gray-200'}`}>3</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Enter Your Address</h2>
            <p className="text-gray-600 mb-4">We'll use this to analyze your solar potential using satellite imagery and local data.</p>
            
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-solar-500 focus:border-transparent"
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Upload Roof Images</h2>
            <p className="text-gray-600 mb-4">Gemini 2.5 will analyze your roof's condition, direction, and solar potential.</p>
            
            <div {...roofDropzone.getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-6 cursor-pointer hover:bg-gray-50">
              <input {...roofDropzone.getInputProps()} />
              {roofImages.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600">{roofImages.length} image(s) selected</p>
                  <ul className="mt-2">
                    {roofImages.map((file, index) => (
                      <li key={index} className="text-xs text-gray-500">{file.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">Drag and drop roof images here, or click to select files</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Upload Utility Bill (Optional)</h2>
            <p className="text-gray-600 mb-4">This helps us calculate your potential savings more accurately.</p>
            
            <div {...billDropzone.getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-6 cursor-pointer hover:bg-gray-50">
              <input {...billDropzone.getInputProps()} />
              {utilityBill ? (
                <div>
                  <p className="text-sm text-gray-600">Selected: {utilityBill.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">Drag and drop your utility bill here, or click to select file</p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mb-6">By continuing, you agree to our Terms of Service and Privacy Policy regarding the processing of your data.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          )}
          <button
            onClick={nextStep}
            disabled={loading}
            className={`px-4 py-2 bg-solar-600 text-white rounded-md hover:bg-solar-700 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : step === 3 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
} 