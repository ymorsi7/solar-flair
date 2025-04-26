/**
 * Utility functions for extracting structured data from Gemini AI responses
 * These functions parse the text responses and extract specific information
 */

// Extract panel material recommendation
function extractMaterialRecommendation(response) {
    // Look for mentions of specific panel types
    const materialTypes = {
      'monocrystalline': ['monocrystalline', 'mono-crystalline', 'mono crystalline', 'mono-si', 'mono si'],
      'polycrystalline': ['polycrystalline', 'poly-crystalline', 'poly crystalline', 'multi-crystalline', 'poly-si', 'poly si'],
      'thin-film': ['thin-film', 'thin film', 'amorphous silicon', 'a-si', 'cdte', 'cigs'],
      'bifacial': ['bifacial', 'bi-facial', 'double-sided', 'two-sided']
    };
    
    // Convert response to lowercase for case-insensitive matching
    const lowerResponse = response.toLowerCase();
    
    // Check for each material type
    for (const [material, keywords] of Object.entries(materialTypes)) {
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword)) {
          // Look for sentences containing the keyword
          const sentences = lowerResponse.split(/[.!?]+/);
          const relevantSentences = sentences.filter(sentence => sentence.includes(keyword));
          
          // If we find relevant sentences, this is likely the recommendation
          if (relevantSentences.length > 0) {
            return {
              material: material.charAt(0).toUpperCase() + material.slice(1), // Capitalize
              confidence: 'high'
            };
          }
        }
      }
    }
    
    // If no clear match, look for general recommendations
    if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest') || lowerResponse.includes('best')) {
      for (const [material, keywords] of Object.entries(materialTypes)) {
        for (const keyword of keywords) {
          if (lowerResponse.includes(keyword)) {
            return {
              material: material.charAt(0).toUpperCase() + material.slice(1),
              confidence: 'medium'
            };
          }
        }
      }
    }
    
    // Default to monocrystalline if no clear recommendation
    return {
      material: 'Monocrystalline',
      confidence: 'low'
    };
  }
  
  // Extract orientation recommendation
  function extractOrientationRecommendation(response) {
    // Define orientation keywords
    const orientations = {
      'South': ['south', 'south-facing', 'south facing', 'southern'],
      'Southeast': ['southeast', 'south-east', 'south east', 'southeastern'],
      'Southwest': ['southwest', 'south-west', 'south west', 'southwestern'],
      'East': ['east', 'east-facing', 'east facing', 'eastern'],
      'West': ['west', 'west-facing', 'west facing', 'western'],
      'North': ['north', 'north-facing', 'north facing', 'northern']
    };
    
    const lowerResponse = response.toLowerCase();
    
    // Look for orientation recommendations
    for (const [orientation, keywords] of Object.entries(orientations)) {
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword) && 
            (lowerResponse.includes('orient') || 
             lowerResponse.includes('direction') || 
             lowerResponse.includes('facing') || 
             lowerResponse.includes('position'))) {
          
          return {
            orientation: orientation,
            confidence: 'high'
          };
        }
      }
    }
    
    // If no clear recommendation with context, just look for mentions
    for (const [orientation, keywords] of Object.entries(orientations)) {
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword)) {
          return {
            orientation: orientation,
            confidence: 'medium'
          };
        }
      }
    }
    
    // Default to South if no clear recommendation
    return {
      orientation: 'South',
      confidence: 'low'
    };
  }
  
  // Extract tilt angle recommendation
  function extractTiltRecommendation(response) {
    // Look for degree symbols or mentions of angles
    const angleRegex = /(\d+)(?:\s*(?:degree|degrees|°))/gi;
    const matches = [...response.matchAll(angleRegex)];
    
    if (matches.length > 0) {
      // Look for angles in the context of tilt or inclination
      const lowerResponse = response.toLowerCase();
      const sentences = lowerResponse.split(/[.!?]+/);
      
      for (const match of matches) {
        const angle = parseInt(match[1]);
        
        // Find the sentence containing this angle
        const relevantSentences = sentences.filter(sentence => 
          sentence.includes(match[0].toLowerCase()) && 
          (sentence.includes('tilt') || 
           sentence.includes('angle') || 
           sentence.includes('inclin') || 
           sentence.includes('pitch'))
        );
        
        if (relevantSentences.length > 0) {
          return {
            angle: angle,
            confidence: 'high'
          };
        }
      }
      
      // If no angles in tilt context, return the first angle found
      return {
        angle: parseInt(matches[0][1]),
        confidence: 'medium'
      };
    }
    
    // If no angles found, look for mentions of latitude
    const latitudeRegex = /(\d+)(?:\s*(?:latitude|lat))/gi;
    const latMatches = [...response.matchAll(latitudeRegex)];
    
    if (latMatches.length > 0) {
      return {
        angle: parseInt(latMatches[0][1]),
        confidence: 'medium'
      };
    }
    
    // Default to 30 degrees if no clear recommendation
    return {
      angle: 30,
      confidence: 'low'
    };
  }
  
  // Extract cost estimate
  function extractCostEstimate(response) {
    // Look for dollar amounts
    const costRegex = /$\s*([\d,]+(?:.\d+)?)\s*(?:k|thousand|million|m)?\b/gi;
    const matches = [...response.matchAll(costRegex)];
    
    if (matches.length > 0) {
      // Look for costs in the context of installation or system
      const lowerResponse = response.toLowerCase();
      const sentences = lowerResponse.split(/[.!?]+/);
      
      for (const match of matches) {
        let cost = parseFloat(match[1].replace(/,/g, ''));
        
        // Adjust for k or m multipliers
        if (match[0].toLowerCase().includes('k') || match[0].toLowerCase().includes('thousand')) {
          cost *= 1000;
        } else if (match[0].toLowerCase().includes('m') || match[0].toLowerCase().includes('million')) {
          cost *= 1000000;
        }
        
        // Find the sentence containing this cost
        const relevantSentences = sentences.filter(sentence => 
          sentence.includes(match[0].toLowerCase()) && 
          (sentence.includes('cost') || 
           sentence.includes('price') || 
           sentence.includes('investment') || 
           sentence.includes('install') || 
           sentence.includes('system'))
        );
        
        if (relevantSentences.length > 0) {
          return {
            cost: cost,
            confidence: 'high'
          };
        }
      }
      
      // If no costs in installation context, return the first cost found
      let cost = parseFloat(matches[0][1].replace(/,/g, ''));
      if (matches[0][0].toLowerCase().includes('k') || matches[0][0].toLowerCase().includes('thousand')) {
        cost *= 1000;
      } else if (matches[0][0].toLowerCase().includes('m') || matches[0][0].toLowerCase().includes('million')) {
        cost *= 1000000;
      }
      
      return {
        cost: cost,
        confidence: 'medium'
      };
    }
    
    // If no dollar amounts found, look for numbers with context
    const numberRegex = /([\d,]+(?:.\d+)?)\s*(?:k|thousand|million|m)?\s*(?:dollars|usd)/gi;
    const numMatches = [...response.matchAll(numberRegex)];
    
    if (numMatches.length > 0) {
      let cost = parseFloat(numMatches[0][1].replace(/,/g, ''));
      if (numMatches[0][0].toLowerCase().includes('k') || numMatches[0][0].toLowerCase().includes('thousand')) {
        cost *= 1000;
      } else if (numMatches[0][0].toLowerCase().includes('m') || numMatches[0][0].toLowerCase().includes('million')) {
        cost *= 1000000;
      }
      
      return {
        cost: cost,
        confidence: 'medium'
      };
    }
    
    // Default cost based on system size (would be calculated from other parameters)
    return {
      cost: 15000, // Placeholder default
      confidence: 'low'
    };
  }
  
  // Extract ROI estimate
  function extractROIEstimate(response) {
    // Look for percentage values
    const roiRegex = /([\d.]+)\s*(?:%|percent)/gi;
    const matches = [...response.matchAll(roiRegex)];
    
    if (matches.length > 0) {
      // Look for percentages in the context of ROI or return
      const lowerResponse = response.toLowerCase();
      const sentences = lowerResponse.split(/[.!?]+/);
      
      for (const match of matches) {
        const percentage = parseFloat(match[1]);
        
        // Find the sentence containing this percentage
        const relevantSentences = sentences.filter(sentence => 
          sentence.includes(match[0].toLowerCase()) && 
          (sentence.includes('roi') || 
           sentence.includes('return') || 
           sentence.includes('investment') || 
           sentence.includes('profit'))
        );
        
        if (relevantSentences.length > 0) {
          return {
            roi: percentage,
            confidence: 'high'
          };
        }
      }
      
      // If no percentages in ROI context, return the first percentage found
      return {
        roi: parseFloat(matches[0][1]),
        confidence: 'medium'
      };
    }
    
    // Look for payback period
    const paybackRegex = /([\d.]+)\s*(?:year|years|yr|yrs)/gi;
    const paybackMatches = [...response.matchAll(paybackRegex)];
    
    if (paybackMatches.length > 0) {
      // Look for years in the context of payback or return
      const lowerResponse = response.toLowerCase();
      const sentences = lowerResponse.split(/[.!?]+/);
      
      for (const match of paybackMatches) {
        const years = parseFloat(match[1]);
        
        // Find the sentence containing this timeframe
        const relevantSentences = sentences.filter(sentence => 
          sentence.includes(match[0].toLowerCase()) && 
          (sentence.includes('payback') || 
           sentence.includes('break even') || 
           sentence.includes('return') || 
           sentence.includes('recover'))
        );
        
        if (relevantSentences.length > 0) {
          // Convert payback period to approximate ROI
          // Simple calculation: ROI over 25 years = (25/payback - 1) * 100
          const estimatedROI = ((25 / years) - 1) * 100;
          return {
            roi: Math.round(estimatedROI),
            confidence: 'medium',
            paybackYears: years
          };
        }
      }
    }
    
    // Default ROI if no clear recommendation
    return {
      roi: 10, // Placeholder default
      confidence: 'low'
    };
  }
  
  // Extract special considerations
  function extractSpecialConsiderations(response) {
    const lowerResponse = response.toLowerCase();
    const considerations = [];
    
    // Look for special considerations in the response
    const considerationKeywords = [
      'consider', 'note', 'keep in mind', 'important', 'recommend', 
      'suggest', 'advice', 'caution', 'warning', 'attention'
    ];
    
    // Split into sentences
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find sentences containing consideration keywords
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      for (const keyword of considerationKeywords) {
        if (lowerSentence.includes(keyword)) {
          // Clean up the sentence
          let cleanSentence = sentence.trim();
          if (!cleanSentence.endsWith('.')) {
            cleanSentence += '.';
          }
          
          // Capitalize first letter
          cleanSentence = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
          
          considerations.push(cleanSentence);
          break; // Only add each sentence once
        }
      }
    }
    
    // Look for specific topics that might be considerations
    const topicKeywords = {
      'shading': ['shade', 'shadow', 'tree', 'obstruction', 'blocking'],
      'weather': ['weather', 'storm', 'wind', 'snow', 'hail', 'hurricane', 'typhoon'],
      'maintenance': ['maintenance', 'clean', 'dust', 'debris', 'inspect'],
      'permits': ['permit', 'approval', 'hoa', 'association', 'regulation', 'code'],
      'incentives': ['incentive', 'rebate', 'tax credit', 'subsidy', 'discount']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword)) {
          // Find sentences containing this keyword
          for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            if (lowerSentence.includes(keyword) && !considerations.some(c => c.toLowerCase().includes(keyword))) {
              // Clean up the sentence
              let cleanSentence = sentence.trim();
              if (!cleanSentence.endsWith('.')) {
                cleanSentence += '.';
              }
              
              // Capitalize first letter
            cleanSentence = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
            
            considerations.push(cleanSentence);
            break; // Only add each sentence once
          }
        }
      }
    }
  }
  
  // If no specific considerations found, look for any sentences with recommendations
  if (considerations.length === 0) {
    const recommendationKeywords = ['should', 'could', 'would', 'recommend', 'optimal', 'best', 'ideal'];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      for (const keyword of recommendationKeywords) {
        if (lowerSentence.includes(keyword)) {
          // Clean up the sentence
          let cleanSentence = sentence.trim();
          if (!cleanSentence.endsWith('.')) {
            cleanSentence += '.';
          }
          
          // Capitalize first letter
          cleanSentence = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
          
          considerations.push(cleanSentence);
          break; // Only add each sentence once
        }
      }
      
      // Limit to 3 considerations if we're just picking up general recommendations
      if (considerations.length >= 3) break;
    }
  }
  
  // If still no considerations, provide a default
  if (considerations.length === 0) {
    considerations.push("Consider seasonal adjustments to panel angles for optimal performance throughout the year.");
    considerations.push("Ensure your roof is in good condition before installation to avoid additional costs later.");
    considerations.push("Check local regulations and permit requirements before proceeding with installation.");
  }
  
  return {
    considerations: considerations,
    confidence: considerations.length > 0 ? 'medium' : 'low'
  };
}

// Extract all recommendations from a Gemini response
function extractAllRecommendations(response) {
  return {
    panelMaterial: extractMaterialRecommendation(response),
    orientation: extractOrientationRecommendation(response),
    tiltAngle: extractTiltRecommendation(response),
    costEstimate: extractCostEstimate(response),
    roi: extractROIEstimate(response),
    specialConsiderations: extractSpecialConsiderations(response)
  };
}

module.exports = {
  extractMaterialRecommendation,
  extractOrientationRecommendation,
  extractTiltRecommendation,
  extractCostEstimate,
  extractROIEstimate,
  extractSpecialConsiderations,
  extractAllRecommendations
};