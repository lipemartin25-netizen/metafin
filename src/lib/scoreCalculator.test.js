import { describe, it, expect } from 'vitest';
import { calculateScore, calculateEcoImpact } from './scoreCalculator';

describe('scoreCalculator - Unit Tests', () => {

 it('should calculate base score correctly for positive balance and 20% savings', () => {
 const summary = { totalIncome: 10000, totalExpenses: 8000, balance: 2000 };
 const transactions = new Array(15).fill({}); // > 10 transactions
 const topCategories = [{ cat: 'Lazer', pct: 30 }]; // diversified

 // Base 50 + Savings(25) + Balance(10) + Trans(5) + Div(10) = 100
 const score = calculateScore(summary, transactions, topCategories);
 expect(score).toBe(100);
 });

 it('should penalize negative balance and low savings', () => {
 const summary = { totalIncome: 5000, totalExpenses: 6000, balance: -1000 };
 const transactions = [];

 // Base 50 - Savings(-10) - Balance(-10) = 30
 const score = calculateScore(summary, transactions, []);
 expect(score).toBe(30);
 });

 it('should handle zero income gracefully', () => {
 const summary = { totalIncome: 0, totalExpenses: 1000, balance: -1000 };
 const score = calculateScore(summary, [], []);
 // Savings rate 0 or negative. 
 expect(score).toBeLessThanOrEqual(50);
 });

 it('should calculate Eco Impact correctly with multipliers', () => {
 const transactions = [
 { type: 'expense', category: 'carro', amount: 1000 }, // 0.8
 { type: 'expense', category: 'alimentacao', amount: 1000 }, // 0.3
 ];
 const co2Mult = { carro: 0.8, alimentacao: 0.3, default: 0.15 };

 const total = calculateEcoImpact(transactions, co2Mult);
 expect(total).toBe(1100);
 });
});
