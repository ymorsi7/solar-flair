// User interface component for the Solar Analysis Agent

class SolarAnalysisUI {
    constructor(dainClient) {
      this.dainClient = dainClient;
      this.results = null;
    }
    
    // Render the input form
    renderInputForm() {
      return `
        <div class="solar-analysis-form">
          <h2>Solar Panel Potential Analysis</h2>
          <form id="solar-analysis-form">
            <div class="form-group">
              <label for="address">Property Address</label>
              <input type="text" id="address" name="address" placeholder="Enter full address" required>
            </div>
            
            <div class="form-group">
              <label for="budget">Budget (Optional)</label>
              <input type="number" id="budget" name="budget" placeholder="Enter your budget in USD">
            </div>
            
            <div class="form-group">
              <label for="energy_needs">Monthly Energy Needs (Optional)</label>
              <input type="number" id="energy_needs" name="energy_needs" placeholder="Enter monthly kWh usage">
            </div>
            
            <button type="submit" id="analyze-button">Analyze Solar Potential</button>
          </form>
        </div>
      `;
    }
    
    // Render loading state
    renderLoading() {
      return `
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Analyzing solar potential for your property...</p>
          <p class="loading-step">Retrieving satellite imagery</p>
        </div>
      `;
    }
    
    // Render results
    renderResults(results) {
      this.results = results;
      
      return `
        <div class="solar-analysis-results">
          <h2>Solar Potential Analysis Results</h2>
          
          <div class="satellite-image">
            <h3>Property Satellite View</h3>
            <img src="${results.satellite_image_url}" alt="Satellite view of property">
          </div>
          
          <div class="summary-stats">
            <div class="stat">
              <h4>System Size</h4>
              <p>${results.recommendations.systemSize.toFixed(2)} kW</p>
            </div>
            <div class="stat">
              <h4>Annual Production</h4>
              <p>${Math.round(results.recommendations.annualProduction)} kWh</p>
            </div>
            <div class="stat">
              <h4>Estimated Cost</h4>
              <p>$${results.recommendations.installationCost.toLocaleString()}</p>
            </div>
            <div class="stat">
              <h4>ROI</h4>
              <p>${results.recommendations.roi}%</p>
            </div>
          </div>
          
          <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
              <li><strong>Panel Material:</strong> ${results.recommendations.panelMaterial}</li>
              <li><strong>Orientation:</strong> ${results.recommendations.orientation}</li>
              <li><strong>Tilt Angle:</strong> ${results.recommendations.tiltAngle}°</li>
              <li><strong>Panel Count:</strong> ${results.recommendations.panelCount}</li>
            </ul>
            
            <div class="special-considerations">
              <h4>Special Considerations</h4>
              <p>${results.recommendations.specialConsiderations}</p>
            </div>
          </div>
          
          <div class="environmental-impact">
            <h3>Environmental Impact</h3>
            <p>Annual CO2 Offset: ${Math.round(results.report.environmentalImpact.co2Offset)} kg</p>
            <p>Equivalent to planting ${Math.round(results.report.environmentalImpact.co2Offset / 20)} trees</p>
          </div>
          
          <button id="download-report">Download Full Report</button>
          <button id="get-quotes">Get Installation Quotes</button>
        </div>
      `;
    }
    
    // Handle form submission
    async handleSubmit(event) {
      event.preventDefault();
      
      const formData = new FormData(event.target);
      const address = formData.get('address');
      const budget = formData.get('budget') ? Number(formData.get('budget')) : null;
      const energy_needs = formData.get('energy_needs') ? Number(formData.get('energy_needs')) : null;
      
      // Show loading state
      document.getElementById('solar-analysis-container').innerHTML = this.renderLoading();
      
      try {
        // Update loading message
        document.querySelector('.loading-step').textContent = 'Retrieving satellite imagery';
        
        // Call the DAIN service
        const result = await this.dainClient.invoke('Solar Analysis Agent', 'analyze_solar_potential', {
          address,
          budget,
          energy_needs
        });
        
        // Update loading message
        document.querySelector('.loading-step').textContent = 'Analyzing solar potential';
        
        // Render results
        document.getElementById('solar-analysis-container').innerHTML = this.renderResults(result.data);
        
        // Add event listeners for result actions
        document.getElementById('download-report').addEventListener('click', this.downloadReport.bind(this));
        document.getElementById('get-quotes').addEventListener('click', this.getQuotes.bind(this));
      } catch (error) {
        console.error('Error analyzing solar potential:', error);
        document.getElementById('solar-analysis-container').innerHTML = `
          <div class="error-container">
            <h3>Error</h3>
            <p>${error.message}</p>
            <button id="try-again">Try Again</button>
          </div>
        `;
        
        document.getElementById('try-again').addEventListener('click', () => {
          document.getElementById('solar-analysis-container').innerHTML = this.renderInputForm();
          this.attachEventListeners();
        });
      }
    }
    
    // Download full report
    downloadReport() {
      // In a real implementation, this would generate and download a PDF report
      console.log('Downloading report for:', this.results);
      alert('Report download started');
    }
    
    // Get installation quotes
    getQuotes() {
      // In a real implementation, this would connect to installer services
      console.log('Getting quotes for:', this.results);
      alert('Connecting you with local solar installers');
    }
    
    // Attach event listeners
    attachEventListeners() {
      document.getElementById('solar-analysis-form').addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // Initialize the UI
    init() {
      const container = document.getElementById('solar-analysis-container');
      container.innerHTML = this.renderInputForm();
      this.attachEventListeners();
    }
  }
  
  // Usage:
  // const ui = new SolarAnalysisUI(dainClient);
  // ui.init();