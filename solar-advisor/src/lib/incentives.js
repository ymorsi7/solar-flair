"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncentives = getIncentives;
async function getIncentives(address, systemSize) {
    console.log(`Getting incentives for ${address}, system size: ${systemSize}kW`);
    // Extract state from address
    const stateMatch = address.match(/[A-Z]{2}/);
    const state = stateMatch ? stateMatch[0] : "";
    // Federal tax credit is 30% for all states
    const federalTaxCredit = systemSize * 1000 * 2.95 * 0.3;
    // State-specific incentives (simplified)
    let stateTaxCredit = 0;
    let utilityRebate = 0;
    let otherIncentives = 0;
    if (state === "CA") {
        // California has additional incentives
        stateTaxCredit = 0;
        utilityRebate = systemSize * 100; // $100 per kW
        otherIncentives = 500; // SGIP or other programs
    }
    else if (state === "NY") {
        // New York has strong incentives
        stateTaxCredit = systemSize * 1000 * 2.95 * 0.25; // 25% of cost up to $5000
        utilityRebate = systemSize * 350; // $350 per kW
        otherIncentives = 0;
    }
    else {
        // Default modest incentives for other states
        stateTaxCredit = 0;
        utilityRebate = systemSize * 50; // $50 per kW
        otherIncentives = 0;
    }
    // Cap the state tax credit at $5000 for NY
    if (state === "NY" && stateTaxCredit > 5000) {
        stateTaxCredit = 5000;
    }
    const totalValue = federalTaxCredit + stateTaxCredit + utilityRebate + otherIncentives;
    return {
        federalTaxCredit,
        stateTaxCredit,
        utilityRebate,
        otherIncentives,
        totalValue
    };
}
