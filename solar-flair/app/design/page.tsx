"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock data for the design page
const mockSystem = {
  address: "123 Main St, Los Angeles, CA 90001",
  systemSize: 8.5,
  panelCount: 24,
  panelType: "REC Alpha Pure 400W",
  inverterType: "SolarEdge HD-Wave SE7600H",
  mountingSystem: "IronRidge XR1000",
  orientation: "South-West",
  tilt: 22,
  annualProduction: 12500
}

export default function DesignPage() {
  const [loading, setLoading] = useState(false)
  const [designComplete, setDesignComplete] = useState(false)
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [system, setSystem] = useState(mockSystem)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // In a full implementation, you'd get this data from an API or state store
    // This is just a mock for demonstration
    setSystem(mockSystem)
    
    // For demo purposes, simulate generating a design 
    generateDesign()
  }, [])

  const generateDesign = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      
      // In a real implementation, this would call Gemini API
      // For this demo, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // This would be an actual image from Gemini in a real implementation
      // For this demo, we'll create a simple canvas representation
      drawSolarPanels()
      
      setDesignComplete(true)
      setLoading(false)
    } catch (error) {
      console.error('Error generating design:', error)
      setErrorMessage('An error occurred while generating your solar design.')
      setLoading(false)
    }
  }

  const drawSolarPanels = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw house
    ctx.fillStyle = '#e5e5e5'
    ctx.beginPath()
    ctx.moveTo(150, 250) // Left bottom
    ctx.lineTo(450, 250) // Right bottom
    ctx.lineTo(450, 150) // Right middle
    ctx.lineTo(300, 50) // Top middle
    ctx.lineTo(150, 150) // Left middle
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // Draw panels (24 panels, based on mockSystem.panelCount)
    ctx.fillStyle = '#2563eb'
    
    // Left side of roof
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(
          170 + col * 30,
          90 + row * 40,
          25,
          35
        )
      }
    }
    
    // Right side of roof
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(
          305 + col * 30,
          90 + row * 40,
          25,
          35
        )
      }
    }
    
    // Convert canvas to image data URL
    const imageUrl = canvas.toDataURL('image/png')
    setDesignImage(imageUrl)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Solar System Design</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Gemini 2.5 optimized panel layout for your property
        </p>
      </div>

      {/* Address Bar */}
      <div className="bg-solar-50 p-3 rounded-md mb-6 flex items-center">
        <svg className="h-5 w-5 text-solar-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium">{system.address}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* System Details */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-bold mb-4">System Details</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500">System Size</h4>
                <p className="font-semibold">{system.systemSize} kW</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Panel Count</h4>
                <p className="font-semibold">{system.panelCount} panels</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Panel Type</h4>
                <p className="font-semibold">{system.panelType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Inverter</h4>
                <p className="font-semibold">{system.inverterType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Mounting System</h4>
                <p className="font-semibold">{system.mountingSystem}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Orientation</h4>
                <p className="font-semibold">{system.orientation}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tilt</h4>
                <p className="font-semibold">{system.tilt}°</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Annual Production</h4>
                <p className="font-semibold">{system.annualProduction.toLocaleString()} kWh</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Design Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Panel Type</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>REC Alpha Pure 400W</option>
                  <option>LG NeON 2 425W</option>
                  <option>SunPower Maxeon 6 440W</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Panel Layout</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Optimized for Production</option>
                  <option>Optimized for Aesthetics</option>
                  <option>Mixed Layout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Size</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={system.systemSize}
                    onChange={(e) => setSystem({...system, systemSize: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <span className="font-medium">{system.systemSize} kW</span>
                </div>
              </div>
              <button
                onClick={generateDesign}
                disabled={loading}
                className="w-full px-4 py-2 bg-solar-600 text-white rounded-md hover:bg-solar-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Update Design'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Design Visualization */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h3 className="text-lg font-bold mb-4">Solar Panel Layout</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <svg className="animate-spin h-12 w-12 text-solar-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Gemini 2.5 is analyzing your roof and generating the optimal panel layout...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center p-12 bg-red-50 rounded-md">
                <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-600 mb-2">{errorMessage}</p>
                <button
                  onClick={generateDesign}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="relative">
                <canvas 
                  ref={canvasRef} 
                  width="600" 
                  height="400" 
                  className="w-full h-auto border border-gray-200 rounded-md"
                />
                <div className="mt-4 flex justify-between">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                    View 3D Model
                  </button>
                  <button className="px-4 py-2 bg-solar-600 text-white rounded-md hover:bg-solar-700">
                    Download Design
                  </button>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Design Notes from Gemini 2.5</h4>
                  <p className="text-gray-600 text-sm">
                    The design places 24 panels (400W each) across the southern and southwestern facing roof sections, maximizing sun exposure throughout the day. The panel arrangement avoids shading from the nearby trees and chimney. This configuration is expected to produce approximately 12,500 kWh annually, meeting about 95% of your household energy needs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="#"
          className="px-6 py-3 bg-solar-600 text-white rounded-md hover:bg-solar-700 font-medium text-lg"
        >
          Get Installation Quotes
        </Link>
      </div>
    </div>
  )
} 