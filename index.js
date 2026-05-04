
```javascript
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

interface Investment {
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchasePrice: number;
  quantity: number;
}

interface Portfolio {
  investments: Investment[];
  cash: number;
  totalValue: number;
  createdAt: Date;
}

// Initialize portfolio
const portfolio: Portfolio = {
  investments: [],
  cash: 10000,
  totalValue: 10000,
  createdAt: new Date(),
};

// Helper function to add investment
function addInvestment(
  name: string,
  type: string,
  amount: number,
  purchasePrice: number
): void {
  if (amount > portfolio.cash) {
    console.log("Fondos insuficientes para esta inversión.");
    return;
  }

  const quantity = amount / purchasePrice;
  const investment: Investment = {
    name,
    type,
    amount,
    currentValue: amount,
    purchasePrice,
    quantity,
  };

  portfolio.investments.push(investment);
  portfolio.cash -= amount;
  updatePortfolioValue();
  console.log(`✓ Inversión agregada: ${name} - $${amount}`);
}

// Helper function to update portfolio value
function updatePortfolioValue(): void {
  let investmentValue = 0;
  portfolio.investments.forEach((inv) => {
    investmentValue += inv.currentValue;
  });
  portfolio.totalValue = portfolio.cash + investmentValue;
}

// Helper function to simulate price changes
function updatePrices(): void {
  portfolio.investments.forEach((inv) => {
    const change = (Math.random() - 0.5) * 0.1; // -5% to +5% change
    const multiplier = 1 + change;
    inv.currentValue = inv.quantity * (inv.purchasePrice * multiplier);
  });
  updatePortfolioValue();
}

// Helper function to get portfolio summary
function getPortfolioSummary(): string {
  let summary =
    "\n=== RESUMEN DEL PORTAFOLIO DE INVERSIONES ===\n";
  summary += `Fecha: ${portfolio.createdAt.toLocaleString("es-ES")}\n`;
  summary += `Efectivo disponible: $${portfolio.cash.toFixed(2)}\n`;
  summary += `\nInversiones actuales:\n`;

  if (portfolio.investments.length === 0) {
    summary += "Sin inversiones aún.\n";
  } else {
    portfolio.investments.forEach((inv, index) => {
      const change = inv.currentValue - inv.amount;
      const percentChange = ((change / inv.amount) * 100).toFixed(2);
      summary += `${index + 1}. ${inv.name} (${inv.type})\n`;
      summary += `   - Cantidad: ${inv.quantity.toFixed(2)} unidades\n`;
      summary += `   - Costo inicial: $${inv.amount.toFixed(2)}\n`;
      summary += `   - Valor actual: $${inv.currentValue.toFixed(2)}\n`;
      summary += `   - Cambio: ${change >= 0 ? "+" : ""}$${change.toFixed(2)} (${percentChange}%)\n`;
    });
  }

  summary += `\nValor total del portafolio: $${portfolio.totalValue.toFixed(2)}\n`;
  return summary;
}

// Helper function to generate ASCII chart
function generateChart(): string {
  const values = portfolio.investments.map((inv) => inv.currentValue);
  if (values.length === 0) {
    return "\nNo hay inversiones para mostrar en el gráfico.\n";
  }

  const maxValue = Math.max(...values);
  const chartHeight = 10;
  let chart = "\n=== GRÁFICO DE INVERSIONES ===\n";

  // Y-axis labels
  for (let i = chartHeight; i >= 0; i--) {
    const yValue = (maxValue * i) / chartHeight;
    chart += yValue.toFixed(0).padStart(8) + " |";

    // Plot bars
    for (let j = 0; j < values.length; j++) {
      const barHeight = Math.round((values[j] / maxValue) * chartHeight);
      if (barHeight >= i) {
        chart += "  ███  ";
      } else {
        chart += "       ";
      }
    }
    chart += "\n";
  }

  // X-axis
  chart += "         +" + "-------+".repeat(values.length) + "\n";
  chart += "         |";
  portfolio.investments.forEach((inv) => {
    chart += inv.name.substring(0, 6).padEnd(7) + "|";
  });
  chart += "\n";

  return chart;
}

// Helper function to get investment recommendation
async function getInvestmentRecommendation(
  investmentType: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Dame una recomendación breve (máximo 3 líneas) sobre invertir en ${investmentType} considerando el portafolio actual: ${JSON.stringify(portfolio.investments.map((i) => i.type))}. Sé conciso y práctico.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

// Main conversation loop
async function main(): Promise<void> {
  console.log("🏦 SIMULADOR DE PORTAFOLIO DE INVERSIONES");
  console.log("