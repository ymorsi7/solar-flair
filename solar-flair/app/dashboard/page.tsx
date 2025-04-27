"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Sample data - in a real app, this would come from your assessment or API
const mockAssessment = {
  address: "123 Main St, Los Angeles, CA 90001",
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

const monthlyProductionData = [
  { month: 'Jan', production: 820 },
  { month: 'Feb', production: 932 },
  { month: 'Mar', production: 1120 },
  { month: 'Apr', production: 1150 },
  { month: 'May', production: 1250 },
  { month: 'Jun', production: 1350 },
  { month: 'Jul', production: 1450 },
  { month: 'Aug', production: 1400 },
  { month: 'Sep', production: 1280 },
  { month: 'Oct', production: 1100 },
  { month: 'Nov', production: 880 },
  { month: 'Dec', production: 770 },
]

export default function DashboardPage() {
  const [assessment, setAssessment] = useState(mockAssessment)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Simulate loading the assessment data
  useEffect(() => {
    // In a real app, you'd fetch this from an API or state management store
    setAssessment(mockAssessment)
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Solar Assessment</h1>
          <Link 
            href="/design"
            className="px-4 py-2 bg-solar-600 text-white rounded-md hover:bg-solar-700"
          >
            Proceed to Design
          </Link>
        </div>
        <p className="text-gray-600 mt-2">
          Powered by Gemini 2.5 Multimodal AI
        </p>
      </div>

      {/* Address Bar */}
      <div className="bg-solar-50 p-3 rounded-md mb-6 flex items-center">
        <svg className="h-5 w-5 text-solar-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium">{assessment.address}</span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-solar-500 text-solar-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'financial'
                ? 'border-solar-500 text-solar-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Financial Analysis
          </button>
          <button
            onClick={() => setActiveTab('environmental')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'environmental'
                ? 'border-solar-500 text-solar-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Environmental Impact
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">System Size</h3>
                <p className="text-3xl font-bold text-solar-600">{assessment.solarPotential.recommendedSystemSize} kW</p>
                <p className="text-sm text-gray-500 mt-1">{assessment.roofAnalysis.recommendedPanels} panels recommended</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Annual Production</h3>
                <p className="text-3xl font-bold text-solar-600">{assessment.solarPotential.annualProduction.toLocaleString()} kWh</p>
                <p className="text-sm text-gray-500 mt-1">Estimated yearly energy generation</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Savings</h3>
                <p className="text-3xl font-bold text-solar-600">${assessment.solarPotential.monthlySavings}</p>
                <p className="text-sm text-gray-500 mt-1">Average monthly utility bill savings</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estimated Monthly Production</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyProductionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="production" fill="#ca8a04" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Roof Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Suitable Area</h4>
                  <p className="text-lg font-semibold">{assessment.roofAnalysis.suitableArea} m²</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Optimal Direction</h4>
                  <p className="text-lg font-semibold">{assessment.roofAnalysis.optimalDirection}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Shading Issues</h4>
                  <p className="text-lg font-semibold">{assessment.roofAnalysis.shadingIssues}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Recommended Panels</h4>
                  <p className="text-lg font-semibold">{assessment.roofAnalysis.recommendedPanels}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">System Cost</h3>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-solar-600">${assessment.financialAnalysis.netCost.toLocaleString()}</p>
                  <p className="text-lg text-gray-500 ml-2 line-through">${assessment.financialAnalysis.installationCost.toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">After incentives and tax credits</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payback Period</h3>
                <p className="text-3xl font-bold text-solar-600">{assessment.solarPotential.paybackPeriod} years</p>
                <p className="text-sm text-gray-500 mt-1">Time to recover your investment</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Incentives & Credits</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-medium">Federal Tax Credit (30%)</span>
                  <span className="font-bold text-green-600">${assessment.financialAnalysis.federalTaxCredit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-medium">State Incentives</span>
                  <span className="font-bold text-green-600">${assessment.financialAnalysis.stateTaxCredit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">Total Savings</span>
                  <span className="font-bold text-green-600">${(assessment.financialAnalysis.federalTaxCredit + assessment.financialAnalysis.stateTaxCredit).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Long-Term Value</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">25-Year Savings</h4>
                  <p className="text-2xl font-bold text-solar-600">${assessment.financialAnalysis.projectedSavings25yr.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Total utility bill savings</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Return on Investment</h4>
                  <p className="text-2xl font-bold text-solar-600">{assessment.financialAnalysis.roi}%</p>
                  <p className="text-sm text-gray-500 mt-1">Better than most investments</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'environmental' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">CO2 Reduction</h3>
                <p className="text-3xl font-bold text-green-600">{assessment.solarPotential.co2Reduction.toLocaleString()} kg</p>
                <p className="text-sm text-gray-500 mt-1">Annual carbon reduction</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Equivalent Trees</h3>
                <p className="text-3xl font-bold text-green-600">{Math.round(assessment.solarPotential.co2Reduction / 21.7)}</p>
                <p className="text-sm text-gray-500 mt-1">Annual carbon sequestering trees</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Car Equivalent</h3>
                <p className="text-3xl font-bold text-green-600">{(assessment.solarPotential.co2Reduction / 4600).toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-1">Cars removed from the road</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Environmental Impact</h3>
              <p className="mb-4">Your solar system's environmental impact over 25 years:</p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Carbon Dioxide (CO₂)</h4>
                  <div className="mt-1 relative pt-1">
                    <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500">
                        {(assessment.solarPotential.co2Reduction * 25 / 1000).toFixed(1)} tonnes
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Water Savings</h4>
                  <div className="mt-1 relative pt-1">
                    <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: "80%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                        {(assessment.solarPotential.annualProduction * 0.4 * 25).toLocaleString()} gallons
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Equivalent Trees Planted</h4>
                  <div className="mt-1 relative pt-1">
                    <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: "90%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600">
                        {Math.round(assessment.solarPotential.co2Reduction * 25 / 21.7)} trees
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Community Impact</h3>
              <p className="mb-4">By going solar, you're joining a community of environmentally conscious homeowners:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Reducing demand on fossil fuel power plants</li>
                <li>Decreasing air and water pollution in your local area</li>
                <li>Supporting renewable energy infrastructure development</li>
                <li>Increasing energy independence and grid resilience</li>
                <li>Inspiring neighbors to consider clean energy alternatives</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link 
          href="/design"
          className="px-6 py-3 bg-solar-600 text-white rounded-md hover:bg-solar-700 font-medium text-lg"
        >
          Continue to System Design
        </Link>
      </div>
    </div>
  )
} 