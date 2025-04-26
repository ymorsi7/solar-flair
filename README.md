# Solar Analysis Agent for DAIN/Butterfly

A DAIN/Butterfly agent that analyzes properties for solar panel potential using satellite imagery and AI.

## Features

- **Address Analysis**: Enter any address to analyze its solar potential
- **Satellite Imagery**: Uses Google Maps Platform to retrieve satellite imagery
- **Roof Analysis**: Analyzes roof characteristics including area, orientation, and pitch
- **Solar Potential Calculation**: Estimates electricity generation potential
- **AI Recommendations**: Uses Gemini AI to recommend optimal panel materials and configurations
- **ROI Calculation**: Provides detailed cost and return on investment analysis
- **Environmental Impact**: Shows CO2 offset and equivalent environmental benefits

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/solar-analysis-agent.git
   cd solar-analysis-agent
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the service:
   ```
   npm start
   ```

## Usage

Once the service is running, you can:

1. Add it to DAIN/Butterfly using the `add_service_url` function with your service URL
2. Interact with the agent by providing an address to analyze
3. Ask follow-up questions about panel materials, orientation, costs, and savings

## API Reference

### Tools

- `analyze_solar_potential`: Analyzes solar potential for a given address
- `get_satellite_image`: Retrieves satellite imagery for a given address
- `calculate_solar_roi`: Calculates return on investment for solar installation

## Development

### File Structure

```
solar-analysis-service/
├── .env                        # Environment variables (API keys)
├── package.json                # Service dependencies and metadata
├── solar_analysis_service.js   # Service definition (main entry point)
├── index.js                    # Core implementation of service functionality
├── agent_handler.js            # Agent conversation handler
├── server.js                   # Express server to run the service
├── utils/                      # Utility functions
│   ├── calculations.js         # Solar calculations helpers
│   └── extractors.js           # Response parsing helpers
├── public/                     # Public assets
│   ├── css/                    # Stylesheets
│   │   └── styles.css          # UI styles
│   └── js/                     # Client-side JavaScript
│       └── user_interface.js   # UI implementation
└── views/                      # UI templates
    └── index.html              # Main UI template
```

## Dependencies

- Google Maps Platform Solar API
- Gemini AI
- Express.js
- DAIN/Butterfly Framework

## License

MIT