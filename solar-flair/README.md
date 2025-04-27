# SolarFlair - AI-Powered Solar Energy Advisor

SolarFlair is an innovative solution that revolutionizes how homeowners evaluate, plan, and implement solar energy systems for their properties. Leveraging Google's Gemini 2.5 multimodal AI capabilities, SolarFlair provides comprehensive, personalized solar energy guidance with unprecedented accuracy and insight.

## 🌟 Key Features

- **Multimodal Solar Assessment**: Upload photos of your property, utility bills, and location information for comprehensive analysis
- **Intelligent Solar Design**: AI-driven solar panel placement visualization using satellite imagery and 3D modeling
- **Real-time Financial Analysis**: Detailed ROI calculations, financing options, and incentive identification
- **Interactive Scenario Comparison**: Compare different system sizes, panel types, and financing options
- **Installation Planning**: Step-by-step guidance through the installation process
- **Sustainability Impact Tracker**: Visualize your carbon footprint reduction and environmental impact

## 🚀 Technology Stack

- **Google Gemini 2.5 Pro**: For multimodal analysis of roof images, documents, and data
- **Next.js 14**: React framework with App Router for fast, server-side rendered pages
- **TypeScript**: For type-safe code and improved developer experience
- **TailwindCSS & ShadcnUI**: For a beautiful, responsive user interface
- **Google Maps API**: For satellite imagery and location data
- **Recharts**: For interactive data visualization

## 📋 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- Google Gemini API key (get from [Google AI Studio](https://aistudio.google.com/))
- Google Maps API key (optional, for enhanced location features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/solar-flair.git
cd solar-flair
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🔍 How It Works

1. **Assessment**: Upload roof photos and enter your address for a comprehensive solar assessment
2. **Analysis**: Gemini 2.5 Pro analyzes your roof condition, orientation, shading, and more
3. **Recommendation**: Receive personalized solar system recommendations with detailed ROI analysis
4. **Design**: View AI-generated solar panel layouts and 3D visualizations of your property
5. **Implementation**: Get connected with qualified local installers and financing options

## 🏆 Gemini 2.5 Implementation

SolarFlair leverages Gemini 2.5's multimodal capabilities in several innovative ways:

1. **Roof Analysis**: Gemini 2.5 evaluates roof photos to determine suitable areas for solar panels, accounting for:
   - Roof orientation and tilt
   - Shading patterns
   - Structural considerations
   - Obstructions (chimneys, vents, etc.)

2. **Document Understanding**: Gemini 2.5 analyzes utility bills to:
   - Extract energy usage patterns
   - Calculate potential savings
   - Determine optimal system size

3. **Satellite Imagery Analysis**: Gemini 2.5 works with satellite images to:
   - Create accurate solar panel layouts
   - Analyze surrounding terrain and vegetation
   - Account for seasonal sun patterns

4. **Financial Modeling**: Gemini 2.5 generates detailed financial projections by understanding:
   - Local utility rates and incentives
   - Panel efficiency and degradation rates
   - Installation costs and financing options

## 🔧 Future Enhancements

- Integration with real-time weather data for production forecasting
- AR visualization of solar panels on your actual roof via mobile device
- Community solar investment opportunities for those unable to install panels
- Grid impact analysis for utility companies and policymakers

## 🌐 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 About the Hackathon

This project was developed for the "Google Gemini: Chase the Future!" Hackathon, showcasing innovative applications of the Gemini 2.5 API to create real-world solutions that contribute to environmental sustainability. 