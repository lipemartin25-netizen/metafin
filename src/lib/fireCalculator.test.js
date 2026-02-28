import { describe, it, expect } from 'vitest';
import { calculateFIRE } from './fireCalculator';

describe('fireCalculator - Unit Tests', () => {

 it('should calculate the correct FIRE number (25x rule)', () => {
 const scenario = {
 monthlyIncome: 10000,
 monthlyExpenses: 5000,
 withdrawalRate: 0.04 // 4% rule
 };
 const result = calculateFIRE(scenario);
 // 5000 * 12 = 60,000 yearly. 
 // 60,000 / 0.04 = 1,500,000
 expect(result.fireNumber).toBe(1500000);
 });

 it('should calculate time to FIRE correctly', () => {
 const scenario = {
 monthlyIncome: 10000,
 monthlyExpenses: 5000,
 currentInvestments: 500000,
 annualReturn: 0.07,
 withdrawalRate: 0.04
 };
 const result = calculateFIRE(scenario);

 expect(result.totalYears).toBeGreaterThan(0);
 expect(result.totalMonths).toBeGreaterThan(result.totalYears * 12);
 expect(result.projection.length).toBeGreaterThan(0);
 });

 it('should handle zero annual return gracefully', () => {
 const scenario = {
 monthlyIncome: 2000,
 monthlyExpenses: 1000,
 currentInvestments: 0,
 annualReturn: 0,
 inflationRate: 0,
 withdrawalRate: 0.04
 };
 const result = calculateFIRE(scenario);
 // Goal: 1000 * 12 / 0.04 = 300,000
 // Savings: 1000/mo. Without interest, 300 months = 25 years
 expect(result.totalYears).toBe(25);
 });

 it('should indicate user is already FIRE if investments > target', () => {
 const scenario = {
 monthlyIncome: 2000,
 monthlyExpenses: 1000,
 currentInvestments: 500000,
 withdrawalRate: 0.04
 };
 const result = calculateFIRE(scenario);
 expect(result.progress).toBeGreaterThanOrEqual(100);
 expect(result.totalYears).toBe(0);
 });
});
