"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface MarketStages {
  step_1_regime: boolean;
  step_2_panic: number;
  step_3_breadth: boolean;
  step_4_magnitude: boolean;
  step_5_valuation: string;
  step_6_liquidity: string;
}

interface HistoricalPoint {
  date: string;
  sp500: number;
  sma200: number;
  sma125: number;
  vix: number;
}

interface MarketData {
  date: string;
  sp500_close: number;
  sma_200: number;
  sma_125?: number;
  drawdown_ath: number;
  vix: number;
  fear_greed_index?: number;
  put_call_ratio?: number;
  sentiment_bearish_pct?: number;
  market_opportunity_score: number;
  recommended_allocation: number;
  stages?: MarketStages;
  historical_chart?: HistoricalPoint[];
}

export default function Dashboard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<"1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "10Y" | "MAX">("10Y");

  // Inputs en blanco
  const [availableCash, setAvailableCash] = useState<string>("");
  const [alreadyInvested, setAlreadyInvested] = useState<string>("");
  const [inputFearGreed, setInputFearGreed] = useState<string>("");
  const [inputPutCall, setInputPutCall] = useState<string>("");
  const [inputSentiment, setInputSentiment] = useState<string>("");
  const [inputNyseHl, setInputNyseHl] = useState<string>("");
  const [inputMcClellan, setInputMcClellan] = useState<string>("");
  const [inputStockBond, setInputStockBond] = useState<string>("");
  const [inputBelow200, setInputBelow200] = useState<string>(""); 
  const [inputAbove50, setInputAbove50] = useState<string>("");   
  const [inputForwardPe, setInputForwardPe] = useState<string>("");
  const [inputCape, setInputCape] = useState<string>("");
  const [inputErp, setInputErp] = useState<string>("");
  const [inputEpsCurrent, setInputEpsCurrent] = useState<string>(""); 
  const [inputEpsNext, setInputEpsNext] = useState<string>("");
  const [inputBsChange, setInputBsChange] = useState<string>("");
  const [inputRateChange, setInputRateChange] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8000/api/latest")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo conectar con la API de FastAPI");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-300">Cargando panel cuantitativo...</div>;
  if (error) return <div className="p-10 text-center text-red-400">Error: {error} (¿Tienes FastAPI corriendo en el puerto 8000?)</div>;

  const drawdown = data?.drawdown_ath ?? 0; 
  const sp500 = data?.sp500_close ?? 0;
  const sma200 = data?.sma_200 ?? 0;
  const sma125 = data?.sma_125 ?? 0;
  const vix = data?.vix ?? 15.0;

  // 1. Paso 1 (Régimen) - Máx 10 pts
  const s1_below200 = sp500 < sma200;
  const s1_below125 = sp500 < sma125;
  const step1Points = (s1_below200 ? 1 : 0) + (s1_below125 ? 1 : 0);
  const step1ScoreNormalized = (step1Points / 2) * 10;

  // 2. Paso 2 (Pánico) - Máx 20 pts
  const fgVal = inputFearGreed !== "" ? parseFloat(inputFearGreed) : null;
  const pcVal = inputPutCall !== "" ? parseFloat(inputPutCall) : null;
  const sentVal = inputSentiment !== "" ? parseFloat(inputSentiment) : null;
  const step2Points = (
    (fgVal !== null && fgVal <= 10 ? 1 : 0) + 
    (vix >= 27.5 ? 1 : 0) + 
    (pcVal !== null && pcVal >= 0.85 ? 1 : 0) + 
    (sentVal !== null && sentVal >= 47.5 ? 1 : 0)
  );
  const step2ScoreNormalized = (step2Points / 4) * 20;

  // 3. Paso 3 (Amplitud) - Máx 20 pts
  const s3_1 = inputNyseHl !== "" && parseFloat(inputNyseHl) <= -1.0 ? 1 : 0;
  const s3_2 = inputMcClellan !== "" && parseFloat(inputMcClellan) <= 850 ? 1 : 0;
  const s3_3 = inputStockBond !== "" && parseFloat(inputStockBond) <= -5.0 ? 1 : 0;
  const s3_4 = inputBelow200 !== "" && parseFloat(inputBelow200) > 70.0 ? 1 : 0;
  const s3_5 = inputAbove50 !== "" && parseFloat(inputAbove50) < 20.0 ? 1 : 0;
  const step3TotalPoints = s3_1 + s3_2 + s3_3 + s3_4 + s3_5;
  const step3BreadthConfirmed = step3TotalPoints >= 3;
  const step3ScoreNormalized = (step3TotalPoints / 5) * 20;

  // 4. Paso 4 (Magnitud) - Máx 15 pts
  const s4_ath = drawdown <= -10.0;
  const sp500VsSma200Pct = sma200 > 0 ? ((sp500 - sma200) / sma200) * 100 : 0;
  const s4_sma200 = sp500VsSma200Pct <= -8.0;
  const step4Points = (s4_ath ? 1 : 0) + (s4_sma200 ? 1 : 0);
  const step4ScoreNormalized = (step4Points / 2) * 15;
  const step4Confirmed = step4Points >= 2;

  // 5. Paso 5 (Valoración) - Máx 20 pts (Excelente = 5 pts, Bueno = 3 pts, Neutral/Pobre = 0 pts)
  const fPe = inputForwardPe !== "" ? parseFloat(inputForwardPe) : null;
  const cape = inputCape !== "" ? parseFloat(inputCape) : null;
  const erp = inputErp !== "" ? parseFloat(inputErp) : null;
  const epsCur = inputEpsCurrent !== "" ? parseFloat(inputEpsCurrent) : null;
  const epsNxt = inputEpsNext !== "" ? parseFloat(inputEpsNext) : null;
  const expectedEpsGrowth = epsCur !== null && epsNxt !== null && epsCur > 0 ? ((epsNxt / epsCur) - 1) * 100 : null;

  const getPeRating = (val: number | null) => val === null ? "Pendiente" : val < 16 ? "Excelente" : val <= 18 ? "Bueno" : val <= 21 ? "Neutral" : "Pobre";
  const getCapeRating = (val: number | null) => val === null ? "Pendiente" : val < 20 ? "Excelente" : val <= 25 ? "Bueno" : val <= 30 ? "Neutral" : "Pobre";
  const getErpRating = (val: number | null) => val === null ? "Pendiente" : val > 5 ? "Excelente" : val >= 4 ? "Bueno" : val >= 3 ? "Neutral" : "Pobre";
  const getGrowthRating = (val: number | null) => val === null ? "Pendiente" : val > 10 ? "Excelente" : val >= 5 ? "Bueno" : val >= 0 ? "Neutral" : "Pobre";

  const peRating = getPeRating(fPe);
  const capeRating = getCapeRating(cape);
  const erpRating = getErpRating(erp);
  const growthRating = getGrowthRating(expectedEpsGrowth);

  const getValuationPoints = (rating: string) => {
    if (rating === 'Excelente') return 5;
    if (rating === 'Bueno') return 3;
    return 0;
  };

  const step5RawPoints = getValuationPoints(peRating) + getValuationPoints(capeRating) + getValuationPoints(erpRating) + getValuationPoints(growthRating); // Máximo 20 puntos
  const step5ScoreNormalized = (step5RawPoints / 20) * 20;

  // 6. Paso 6 (Liquidez) - Máx 15 pts
  const bsVal = inputBsChange !== "" ? parseFloat(inputBsChange) : null;
  const rateVal = inputRateChange !== "" ? parseFloat(inputRateChange) : null;

  const getBsScore = (val: number | null) => {
    if (val === null) return { score: 0, desc: "Pendiente" };
    if (val > 5) return { score: 2, desc: "Expansión significativa (+2)" };
    if (val >= 0) return { score: 1, desc: "Expansión moderada (+1)" };
    if (val >= -5) return { score: 0, desc: "Contracción moderada (0)" };
    return { score: -1, desc: "Contracción significativa (-1)" };
  };

  const getRateScore = (val: number | null) => {
    if (val === null) return { score: 0, desc: "Pendiente" };
    if (val <= -150) return { score: 2, desc: "Bajada de tipos ≥ 150 bps (+2)" };
    if (val <= -75) return { score: 1, desc: "Bajada de tipos 75–149 bps (+1)" };
    if (val >= -75 && val <= 25) return { score: 0, desc: "Neutral (-75 a +25 bps) (0)" };
    if (val <= 99) return { score: -0.5, desc: "Subida de tipos 25–99 bps (-0.5)" };
    return { score: -1, desc: "Subida de tipos ≥ 100 bps (-1)" };
  };

  const bsResult = getBsScore(bsVal);
  const rateResult = getRateScore(rateVal);
  const rawStep6Score = bsResult.score + rateResult.score;
  const step6ScoreNormalized = (bsVal === null && rateVal === null) ? 0 : Math.max(0, Math.min(15, ((rawStep6Score + 2) / 6) * 15));

  // Puntuación Total Real sobre 100 sumando los 6 módulos (10 + 20 + 20 + 15 + 20 + 15 = 100)
  const totalCalculatedScore = Math.round(
    step1ScoreNormalized + 
    step2ScoreNormalized + 
    step3ScoreNormalized + 
    step4ScoreNormalized + 
    step5ScoreNormalized + 
    step6ScoreNormalized
  );

  const getScoreAllocationPct = (score: number) => {
    if (score < 50) return 0;
    if (score <= 59) return 10;
    if (score <= 69) return 15;
    if (score <= 79) return 20;
    if (score <= 89) return 25;
    return 30;
  };

  const getDrawdownMaxAllocationPct = (dd: number) => {
    if (dd <= -40) return 100;
    if (dd <= -30) return 80;
    if (dd <= -25) return 65;
    if (dd <= -20) return 50;
    if (dd <= -15) return 35;
    if (dd <= -10) return 20;
    return 0;
  };

  const scoreAllocationPct = getScoreAllocationPct(totalCalculatedScore);
  const drawdownMaxPct = getDrawdownMaxAllocationPct(drawdown);
  const finalCumulativeAllocationPct = Math.min(scoreAllocationPct, drawdownMaxPct);

  const cashNum = parseFloat(availableCash) || 0;
  const investedNum = parseFloat(alreadyInvested) || 0;
  const maxCumulativeAllowedAmount = (finalCumulativeAllocationPct / 100) * cashNum;
  const recommendedInvestmentAmount = Math.max(0, maxCumulativeAllowedAmount - investedNum);

  const rawHistory = data?.historical_chart || [];
  
  const getFilteredHistory = () => {
    if (rawHistory.length === 0) return [];
    if (timeWindow === "MAX") return rawHistory;

    const latestDateStr = rawHistory[rawHistory.length - 1].date;
    const maxDate = new Date(latestDateStr);
    const cutoffDate = new Date(maxDate);

    if (timeWindow === "1M") cutoffDate.setMonth(maxDate.getMonth() - 1);
    else if (timeWindow === "3M") cutoffDate.setMonth(maxDate.getMonth() - 3);
    else if (timeWindow === "6M") cutoffDate.setMonth(maxDate.getMonth() - 6);
    else if (timeWindow === "1Y") cutoffDate.setFullYear(maxDate.getFullYear() - 1);
    else if (timeWindow === "3Y") cutoffDate.setFullYear(maxDate.getFullYear() - 3);
    else if (timeWindow === "5Y") cutoffDate.setFullYear(maxDate.getFullYear() - 5);
    else if (timeWindow === "10Y") cutoffDate.setFullYear(maxDate.getFullYear() - 10);

    return rawHistory.filter(item => new Date(item.date) >= cutoffDate);
  };

  const chartData = getFilteredHistory();

  let runningMax = 0;
  const step4ChartData = chartData.map(item => {
    if (item.sp500 > runningMax) runningMax = item.sp500;
    const dd = runningMax > 0 ? ((item.sp500 - runningMax) / runningMax) * 100 : 0;
    const distSma200 = item.sma200 > 0 ? ((item.sp500 - item.sma200) / item.sma200) * 100 : 0;
    return {
      date: item.date,
      drawdownPct: dd,
      distSma200Pct: distSma200
    };
  });

  const stepDetails: Record<string, { title: string; desc: string; rule: string; current: string }> = {
    step_1: {
      title: "Paso 1: Régimen de Mercado (Medias Móviles)",
      desc: "Distingue correcciones normales de mercados bajistas profundos.",
      rule: "• S&P < SMA 200 (1 pt)\n• S&P < SMA 125 (1 pt)",
      current: `• S&P 500 (${sp500}) vs SMA 200 (${sma200.toFixed(2)}): ${s1_below200 ? "✅ Cumple" : "❌ No"}\n• S&P 500 (${sp500}) vs SMA 125 (${sma125.toFixed(2)}): ${s1_below125 ? "✅ Cumple" : "❌ No"}`
    },
    step_2: {
      title: "Paso 2: Pánico de Mercado",
      desc: "Mide si el pánico y el pesimismo han alcanzado extremos.",
      rule: "• Fear & Greed <= 10\n• VIX >= 27.5\n• Put/Call >= 0.85\n• Sentimiento Bajista >= 47.5%",
      current: `Puntos de pánico alcanzados: ${step2Points} / 4`
    },
    step_3: { 
      title: "Paso 3: Amplitud de Mercado", 
      desc: "Confirmación de venta masiva generalizada (Broad-based sell-off).", 
      rule: "Requiere cumplir al menos 3 de las 5 condiciones de amplitud.", 
      current: `Condiciones cumplidas: ${step3TotalPoints} / 5 (${step3BreadthConfirmed ? "🟢 Confirmado" : "⚪ No confirmado"})` 
    },
    step_4: { 
      title: "Paso 4: Magnitud de la Caída", 
      desc: "Mide la magnitud y profundidad de la caída frente a máximos y su media de 200 días.", 
      rule: "• S&P 500 > 10% por debajo de su Máximo Histórico (ATH)\n• S&P 500 > 8% por debajo de su SMA 200", 
      current: `• Drawdown desde ATH (${drawdown}%): ${s4_ath ? "✅ Cumple" : "❌ No"}\n• Distancia a SMA 200 (${sp500VsSma200Pct.toFixed(2)}%): ${s4_sma200 ? "✅ Cumple" : "❌ No"}` 
    },
    step_5: { 
      title: "Paso 5: Evaluar Valoración de Mercado", 
      desc: "Filtra la valoración global para evitar comprar en mercados claramente sobrevalorados.", 
      rule: "Evalúa Forward P/E, Shiller CAPE, Prima de Riesgo de las Acciones (ERP) y Crecimiento Esperado del EPS.", 
      current: `• Forward P/E: ${fPe ?? 'N/A'} (${peRating})\n• Shiller CAPE: ${cape ?? 'N/A'} (${capeRating})\n• ERP: ${erp !== null ? erp + '%' : 'N/A'} (${erpRating})\n• Crecimiento EPS: ${expectedEpsGrowth !== null ? expectedEpsGrowth.toFixed(2) + '%' : 'N/A'} (${growthRating})` 
    },
    step_6: { 
      title: "Paso 6: Evaluar Liquidez del Sistema", 
      desc: "Evalúa la liquidez del sistema mediante el cambio del balance y la expectativa de tipos de interés.", 
      rule: "• Cambio del balance a 12 meses (%)\n• Cambio esperado de los tipos de los Fondos Federales a 12 meses (bps)", 
      current: `• Cambio del Balance: ${bsVal !== null ? bsVal + '%' : 'N/A'} (${bsResult.desc})\n• Cambio de Tipos: ${rateVal !== null ? rateVal + ' bps' : 'N/A'} (${rateResult.desc})` 
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Panel de Asignación Sistemática</h1>
            <p className="text-sm text-gray-400 mt-1">Proceso sistemático e independiente de emociones para la asignación de capital.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300">
            Fecha de análisis: <span className="font-semibold text-white">{data?.date}</span>
          </div>
        </header>

        {/* Tarjetas Principales de Puntuación y Asignación de Capital */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Puntuación de Oportunidad de Mercado</h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-6xl font-black text-white">{totalCalculatedScore}</span>
              <span className="text-xl text-gray-500">/ 100</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {totalCalculatedScore >= 50 ? "🟢 Condición mínima de entrada cumplida (≥50)" : "🔴 Sin oportunidad (Menor a 50)"}
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Asignación Sugerida (Capital)</h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-6xl font-black text-emerald-400">{finalCumulativeAllocationPct}%</span>
              <span className="text-sm text-gray-400">del efectivo reservado</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Score rec: {scoreAllocationPct}% | Límite por Drawdown: {drawdownMaxPct}%
            </p>
          </div>

          {/* Calculadora de Dinero a Invertir */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-blue-900/50 shadow-xl space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Calculadora de Inversión</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block">Efectivo Total:</label>
                <input type="number" placeholder="Ej: 100000" value={availableCash} onChange={(e) => setAvailableCash(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white font-bold px-2 py-1 rounded text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block">Ya Invertido:</label>
                <input type="number" placeholder="Ej: 0" value={alreadyInvested} onChange={(e) => setAlreadyInvested(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white font-bold px-2 py-1 rounded text-xs" />
              </div>
            </div>
            <div className="pt-1 border-t border-gray-800 flex justify-between items-baseline">
              <span className="text-xs text-gray-300 font-semibold">A Invertir Ahora:</span>
              <span className="text-2xl font-black text-emerald-400">€{recommendedInvestmentAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* TABLA EXPLICATIVA DE ASIGNACIÓN SEGÚN PUNTOS */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-md font-bold text-white">Guía de Asignación según la Puntuación de Oportunidad de Mercado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] border-b border-gray-800">
                <tr>
                  <th className="p-3">Puntuación de Oportunidad</th>
                  <th className="p-3">Nivel de Oportunidad</th>
                  <th className="p-3">Asignación Recomendada (% de Efectivo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className={totalCalculatedScore >= 0 && totalCalculatedScore <= 49 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">0 – 49</td>
                  <td className="p-3">Sin Oportunidad</td>
                  <td className="p-3">0%</td>
                </tr>
                <tr className={totalCalculatedScore >= 50 && totalCalculatedScore <= 59 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">50 – 59</td>
                  <td className="p-3">Oportunidad Inicial</td>
                  <td className="p-3">10%</td>
                </tr>
                <tr className={totalCalculatedScore >= 60 && totalCalculatedScore <= 69 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">60 – 69</td>
                  <td className="p-3">Oportunidad Moderada</td>
                  <td className="p-3">15%</td>
                </tr>
                <tr className={totalCalculatedScore >= 70 && totalCalculatedScore <= 79 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">70 – 79</td>
                  <td className="p-3">Oportunidad Alta</td>
                  <td className="p-3">20%</td>
                </tr>
                <tr className={totalCalculatedScore >= 80 && totalCalculatedScore <= 89 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">80 – 89</td>
                  <td className="p-3">Oportunidad Muy Alta</td>
                  <td className="p-3">25%</td>
                </tr>
                <tr className={totalCalculatedScore >= 90 && totalCalculatedScore <= 100 ? "bg-blue-950/30 font-bold text-white" : ""}>
                  <td className="p-3">90 – 100</td>
                  <td className="p-3">Capitulacion</td>
                  <td className="p-3">30%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Desglose de las 6 Etapas */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
          <h3 className="text-lg font-bold text-white">Desglose de las 6 Etapas Cuantitativas (Máx. 100 pts)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            
            <div onClick={() => setSelectedStep("step_1")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 1: Régimen de Mercado</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step1ScoreNormalized.toFixed(0)} / 10 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">S&P 500 vs Medias Móviles</p>
              <span className="text-xs text-gray-400 mt-2 block">Haz clic para ver gráfico</span>
            </div>

            <div onClick={() => setSelectedStep("step_2")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 2: Pánico de Mercado</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step2ScoreNormalized.toFixed(0)} / 20 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">VIX & Sentimiento Extremo</p>
              <span className="text-xs text-gray-400 mt-2 block">Haz clic para editar métricas</span>
            </div>

            <div onClick={() => setSelectedStep("step_3")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 3: Amplitud de Mercado</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step3ScoreNormalized.toFixed(0)} / 20 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">Amplitud Masiva</p>
              <span className={`text-xs mt-2 block font-semibold ${step3BreadthConfirmed ? 'text-emerald-400' : 'text-gray-400'}`}>
                {step3BreadthConfirmed ? '🟢 Confirmado (≥3 pts)' : '⚪ No confirmado'}
              </span>
            </div>

            <div onClick={() => setSelectedStep("step_4")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 4: Magnitud</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step4ScoreNormalized.toFixed(0)} / 15 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">Desplome Mínimo</p>
              <span className={`text-xs mt-2 block font-semibold ${step4Confirmed ? 'text-emerald-400' : 'text-gray-300'}`}>
                Drawdown: {drawdown.toFixed(2)}% {step4Confirmed ? '🟢' : ''}
              </span>
            </div>

            <div onClick={() => setSelectedStep("step_5")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 5: Valoración</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step5ScoreNormalized.toFixed(0)} / 20 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">Forward P/E & CAPE</p>
              <span className="text-xs text-gray-300 mt-2 block">P/E: {peRating} | CAPE: {capeRating}</span>
            </div>

            <div onClick={() => setSelectedStep("step_6")} className="p-4 rounded-xl border border-gray-800 bg-gray-950 cursor-pointer hover:border-blue-500 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase">Paso 6: Liquidez</span>
                <span className="text-xs font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">{step6ScoreNormalized.toFixed(0)} / 15 pts</span>
              </div>
              <p className="font-semibold text-white mt-1">Balance Fed & Tipos</p>
              <span className="text-xs text-gray-300 mt-2 block">Puntuación: {rawStep6Score}</span>
            </div>

          </div>
        </div>
      </div>

      {/* Modal Detallado */}
      {selectedStep && stepDetails[selectedStep] && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl max-w-4xl w-full space-y-4 shadow-2xl relative my-8">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white">{stepDetails[selectedStep].title}</h3>
              <button onClick={() => setSelectedStep(null)} className="text-gray-400 hover:text-white text-lg font-bold px-2 py-1 bg-gray-800 rounded-lg">✕</button>
            </div>
            
            <p className="text-sm text-gray-300">{stepDetails[selectedStep].desc}</p>

            {(selectedStep === "step_1" || selectedStep === "step_2" || selectedStep === "step_4") && (
              <div className="flex justify-end bg-gray-950 p-2 rounded-xl border border-gray-800">
                <div className="flex flex-wrap gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-semibold">
                  {(["1M", "3M", "6M", "1Y", "3Y", "5Y", "10Y", "MAX"] as const).map((w) => (
                    <button key={w} onClick={() => setTimeWindow(w)} className={`px-2.5 py-1 rounded-md transition ${timeWindow === w ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>{w}</button>
                  ))}
                </div>
              </div>
            )}

            {/* GRÁFICO PASO 1 */}
            {selectedStep === "step_1" && (
              <div className="space-y-3 bg-gray-950 p-4 rounded-xl border border-gray-800">
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                      <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="sma125" name="SMA 125" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="sma200" name="SMA 200" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* PASO 2: PANICO */}
            {selectedStep === "step_2" && (
              <div className="space-y-4">
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-red-400 uppercase">Evolución Histórica Automática (VIX):</span>
                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#6b7280" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} formatter={(value: any) => [typeof value === 'number' ? value.toFixed(2) : value, "VIX"]} />
                        <Line type="monotone" dataKey="vix" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <span className="text-xs font-semibold text-red-400 uppercase">VIX (Automático)</span>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-2xl font-black text-white">{vix}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${vix >= 27.5 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {vix >= 27.5 ? '✅ (Cumple)' : '❌ (No)'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <span className="text-xs font-semibold text-purple-400 uppercase">Fear & Greed</span>
                    <div className="flex justify-between items-center mt-2">
                      <input type="number" placeholder="Ej: 10" value={inputFearGreed} onChange={(e) => setInputFearGreed(e.target.value)} className="w-20 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputFearGreed !== "" && fgVal <= 10 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {inputFearGreed !== "" && fgVal <= 10 ? '✅ (Cumple)' : '❌ (No)'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <span className="text-xs font-semibold text-sky-400 uppercase">Ratio Put/Call</span>
                    <div className="flex justify-between items-center mt-2">
                      <input type="number" step="0.01" placeholder="Ej: 0.85" value={inputPutCall} onChange={(e) => setInputPutCall(e.target.value)} className="w-20 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputPutCall !== "" && pcVal >= 0.85 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {inputPutCall !== "" && pcVal >= 0.85 ? '✅ (Cumple)' : '❌ (No)'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 md:col-span-3">
                    <span className="text-xs font-semibold text-yellow-400 uppercase">Encuesta de Sentimiento Bajista (%)</span>
                    <div className="flex items-center gap-4 mt-2">
                      <input type="number" step="0.01" placeholder="Ej: 47.5" value={inputSentiment} onChange={(e) => setInputSentiment(e.target.value)} className="w-28 bg-gray-900 border border-gray-700 text-white font-black text-lg px-3 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${inputSentiment !== "" && sentVal >= 47.5 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {inputSentiment !== "" && sentVal >= 47.5 ? '✅ Cumple' : '❌ No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: AMPLITUD */}
            {selectedStep === "step_3" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase">Máximos/Mínimos NYSE (%) [CNN]</span>
                  <div className="flex justify-between items-center">
                    <input type="number" step="0.1" placeholder="Ej: -1.5" value={inputNyseHl} onChange={(e) => setInputNyseHl(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputNyseHl !== "" ? (s3_1 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400') : 'bg-gray-800 text-gray-500'}`}>
                      {inputNyseHl !== "" ? (s3_1 ? '✅ (Cumple)' : '❌ (No)') : '⚪ Vacío'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase">Suma McClellan [CNN]</span>
                  <div className="flex justify-between items-center">
                    <input type="number" placeholder="Ej: 800" value={inputMcClellan} onChange={(e) => setInputMcClellan(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputMcClellan !== "" ? (s3_2 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400') : 'bg-gray-800 text-gray-500'}`}>
                      {inputMcClellan !== "" ? (s3_2 ? '✅ (Cumple)' : '❌ (No)') : '⚪ Vacío'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase">Diferencial Acciones/Bonos (%) [CNN]</span>
                  <div className="flex justify-between items-center">
                    <input type="number" step="0.1" placeholder="Ej: -6.0" value={inputStockBond} onChange={(e) => setInputStockBond(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputStockBond !== "" ? (s3_3 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400') : 'bg-gray-800 text-gray-500'}`}>
                      {inputStockBond !== "" ? (s3_3 ? '✅ (Cumple)' : '❌ (No)') : '⚪ Vacío'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-purple-400 uppercase">% Acciones Bajo SMA 200 ($MMTH)</span>
                  <div className="flex justify-between items-center">
                    <input type="number" step="0.1" placeholder="Ej: 75.0" value={inputBelow200} onChange={(e) => setInputBelow200(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${inputBelow200 !== "" ? (s3_4 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400') : 'bg-gray-800 text-gray-500'}`}>
                      {inputBelow200 !== "" ? (s3_4 ? '✅ (Cumple)' : '❌ (No)') : '⚪ Vacío'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold text-yellow-400 uppercase">% Acciones Sobre SMA 50 ($MMFI)</span>
                  <div className="flex items-center gap-4 mt-2">
                    <input type="number" step="0.1" placeholder="Ej: 15.0" value={inputAbove50} onChange={(e) => setInputAbove50(e.target.value)} className="w-28 bg-gray-900 border border-gray-700 text-white font-black text-lg px-3 py-1 rounded-lg" />
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${inputAbove50 !== "" ? (s3_5 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400') : 'bg-gray-800 text-gray-500'}`}>
                      {inputAbove50 !== "" ? (s3_5 ? '✅ Cumple' : '❌ No') : '⚪ Vacío'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: MAGNITUD */}
            {selectedStep === "step_4" && (
              <div className="space-y-4">
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase">1. Porcentaje de Caída desde el ATH (Límite requerido: -10%):</span>
                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={step4ChartData}>
                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#6b7280" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} formatter={(val: any) => [`${Number(val).toFixed(2)}%`, "Drawdown"]} />
                        <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Límite -10%", fill: "#ef4444", fontSize: 11 }} />
                        <Line type="monotone" dataKey="drawdownPct" name="Drawdown (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-purple-400 uppercase">2. Distancia porcentual respecto a la SMA 200 (Límite requerido: -8%):</span>
                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={step4ChartData}>
                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#6b7280" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} formatter={(val: any) => [`${Number(val).toFixed(2)}%`, "Distancia SMA 200"]} />
                        <ReferenceLine y={-8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Límite -8%", fill: "#ef4444", fontSize: 11 }} />
                        <Line type="monotone" dataKey="distSma200Pct" name="% vs SMA 200" stroke="#a855f7" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: VALORACIÓN */}
            {selectedStep === "step_5" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <span className="text-xs font-semibold text-blue-400 uppercase">Ratio Forward P/E</span>
                    <div className="flex justify-between items-center">
                      <input type="number" step="0.1" placeholder="Ej: 18.5" value={inputForwardPe} onChange={(e) => setInputForwardPe(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${peRating === 'Excelente' ? 'bg-emerald-900/40 text-emerald-400' : peRating === 'Bueno' ? 'bg-blue-900/40 text-blue-400' : peRating === 'Neutral' ? 'bg-yellow-900/40 text-yellow-400' : peRating === 'Pobre' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                        {peRating}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <span className="text-xs font-semibold text-purple-400 uppercase">Ratio Shiller CAPE</span>
                    <div className="flex justify-between items-center">
                      <input type="number" step="0.1" placeholder="Ej: 26.0" value={inputCape} onChange={(e) => setInputCape(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${capeRating === 'Excelente' ? 'bg-emerald-900/40 text-emerald-400' : capeRating === 'Bueno' ? 'bg-blue-900/40 text-blue-400' : capeRating === 'Neutral' ? 'bg-yellow-900/40 text-yellow-400' : capeRating === 'Pobre' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                        {capeRating}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase">Prima de Riesgo de Acciones (%)</span>
                    <div className="flex justify-between items-center">
                      <input type="number" step="0.1" placeholder="Ej: 3.5" value={inputErp} onChange={(e) => setInputErp(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${erpRating === 'Excelente' ? 'bg-emerald-900/40 text-emerald-400' : erpRating === 'Bueno' ? 'bg-blue-900/40 text-blue-400' : erpRating === 'Neutral' ? 'bg-yellow-900/40 text-yellow-400' : erpRating === 'Pobre' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                        {erpRating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-yellow-400 uppercase">Crecimiento EPS Esperado (Próximos 12 Meses)</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${growthRating === 'Excelente' ? 'bg-emerald-900/40 text-emerald-400' : growthRating === 'Bueno' ? 'bg-blue-900/40 text-blue-400' : growthRating === 'Neutral' ? 'bg-yellow-900/40 text-yellow-400' : growthRating === 'Pobre' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                      {expectedEpsGrowth !== null ? `${expectedEpsGrowth.toFixed(2)}% (${growthRating})` : 'Pendiente de estimación'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-900">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">EPS Año Actual:</label>
                      <input type="number" step="0.01" placeholder="Introduce valor actual" value={inputEpsCurrent} onChange={(e) => setInputEpsCurrent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm" />
                      <span className="text-[10px] text-gray-400 mt-1 block">FactSet Earnings Insight (Páginas 31 y 32: S&P 500 Calendar Year Bottom-Up EPS Actuals & Estimates).</span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">EPS Próximo Año (Estimación):</label>
                      <input type="number" step="0.01" placeholder="Introduce valor estimado" value={inputEpsNext} onChange={(e) => setInputEpsNext(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white font-bold px-3 py-1.5 rounded-lg text-sm" />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-900 text-xs text-gray-300 space-y-1">
                    <p className="font-semibold text-blue-400">Fórmula Crecimiento EPS Esperado:</p>
                    <p className="font-mono bg-gray-900 p-2 rounded border border-gray-800 text-center text-yellow-300">
                      Crecimiento EPS = ((EPS Próximo Año / EPS Año Actual) - 1) × 100
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 6: LIQUIDEZ */}
            {selectedStep === "step_6" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <span className="text-xs font-semibold text-blue-400 uppercase">Cambio del Balance a 12 Meses (%)</span>
                    <div className="flex justify-between items-center">
                      <input type="number" step="0.1" placeholder="Ej: +3.5" value={inputBsChange} onChange={(e) => setInputBsChange(e.target.value)} className="w-28 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-900/40 text-blue-300">
                        Puntuación: {bsResult.score > 0 ? `+${bsResult.score}` : bsResult.score}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-1">Interpretación: {bsResult.desc}</span>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                    <span className="text-xs font-semibold text-purple-400 uppercase">Cambio Esperado de Tipos (bps)</span>
                    <div className="flex justify-between items-center">
                      <input type="number" step="25" placeholder="Ej: -75" value={inputRateChange} onChange={(e) => setInputRateChange(e.target.value)} className="w-28 bg-gray-900 border border-gray-700 text-white font-black text-lg px-2 py-1 rounded-lg" />
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-900/40 text-purple-300">
                        Puntuación: {rateResult.score > 0 ? `+${rateResult.score}` : rateResult.score}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-1">Interpretación: {rateResult.desc}</span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2 text-xs text-gray-300">
                  <p className="font-bold text-blue-400 uppercase">Fórmula Cambio del Balance:</p>
                  <p className="font-mono bg-gray-900 p-2 rounded border border-gray-800 text-yellow-300 text-center">
                    [(Balance Actual - Balance hace 12 Meses) / Balance hace 12 Meses] × 100
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-900/50 space-y-2">
              <p className="text-xs font-semibold text-blue-300 uppercase">Resumen del Estado:</p>
              <pre className="text-xs text-white font-mono whitespace-pre-wrap">{stepDetails[selectedStep].current}</pre>
              
              {selectedStep === "step_1" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de cumplimiento (Paso 1): Máx 10 pts</p>
                  <p className="text-sm font-bold text-emerald-400 pt-1">Puntuación obtenida: {step1ScoreNormalized.toFixed(0)} / 10 puntos</p>
                </div>
              )}

              {selectedStep === "step_2" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de cumplimiento (Paso 2): Máx 20 pts</p>
                  <p>• <b>Índice Fear & Greed:</b> ≤ 10 (Pánico extremo)</p>
                  <p>• <b>Índice de Volatilidad VIX:</b> ≥ 27.5 (Pánico elevado)</p>
                  <p>• <b>Ratio Put/Call:</b> ≥ 0.85 (Alta cobertura bajista)</p>
                  <p>• <b>Sentimiento Bajista:</b> ≥ 47.5% (Pesimismo extremo)</p>
                  <p className="text-sm font-bold text-emerald-400 pt-1">Puntuación obtenida: {step2ScoreNormalized.toFixed(0)} / 20 puntos</p>
                </div>
              )}

              {selectedStep === "step_3" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de cumplimiento (Paso 3 - Amplitud): Máx 20 pts</p>
                  <p>• <b>Máximos/Mínimos NYSE (%):</b> ≤ -1.0%</p>
                  <p>• <b>Suma McClellan:</b> ≤ 850</p>
                  <p>• <b>Diferencial Acciones/Bonos (%):</b> ≤ -5.0%</p>
                  <p>• <b>% Acciones Bajo SMA 200 ($MMTH):</b> &gt; 70.0%</p>
                  <p>• <b>% Acciones Sobre SMA 50 ($MMFI):</b> &lt; 20.0%</p>
                  <p className="text-xs text-gray-400 pt-1">*(Requiere cumplir al menos 3 de las 5 condiciones)*</p>
                  <p className="text-sm font-bold text-emerald-400 pt-1">Puntuación obtenida: {step3ScoreNormalized.toFixed(0)} / 20 puntos</p>
                </div>
              )}

              {selectedStep === "step_4" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de cumplimiento (Paso 4): Máx 15 pts</p>
                  <p className="text-sm font-bold text-emerald-400 pt-1">Puntuación obtenida: {step4ScoreNormalized.toFixed(0)} / 15 puntos</p>
                </div>
              )}

              {selectedStep === "step_5" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de valoración (Paso 5): Máx 20 pts</p>
                  <p>• <b>Forward P/E Ratio:</b> Excelente (&lt;16) [5 pts], Bueno (16-18) [3 pts], Neutral (18-21) [0 pts], Pobre (&gt;21) [0 pts]</p>
                  <p>• <b>Ratio Shiller CAPE:</b> Excelente (&lt;20) [5 pts], Bueno (20-25) [3 pts], Neutral (25-30) [0 pts], Pobre (&gt;30) [0 pts]</p>
                  <p>• <b>Prima de Riesgo de Acciones (ERP):</b> Excelente (&gt;5%) [5 pts], Bueno (4-5%) [3 pts], Neutral (3-4%) [0 pts], Pobre (&lt;3%) [0 pts]</p>
                  <p>• <b>Crecimiento EPS Esperado:</b> Excelente (&gt;10%) [5 pts], Bueno (5-10%) [3 pts], Neutral (0-5%) [0 pts], Pobre (&lt;0%) [0 pts]</p>
                  <p className="text-xs text-gray-400 pt-1">💡 <i>Recuerda: Cada una de las 4 métricas otorga 5 pts si es Excelente, 3 pts si es Bueno, o 0 pts en Neutral/Pobre (hasta un máximo de 20 puntos).</i></p>
                  <p className="text-sm font-bold text-emerald-400 pt-2">Puntuación obtenida: {step5ScoreNormalized.toFixed(0)} / 20 puntos</p>
                </div>
              )}

              {selectedStep === "step_6" && (
                <div className="mt-3 pt-3 border-t border-blue-900/40 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-blue-400">Reglas de liquidez (Paso 6): Máx 15 pts</p>
                  <p>• <b>Cambio del Balance a 12 Meses (%):</b> &gt; +5% (+2 pts) | 0% a +5% (+1 pt) | 0% a -5% (0 pts) | &lt; -5% (-1 pt)</p>
                  <p>• <b>Cambio de Tipos Esperado:</b> Bajada ≥ 150 bps (+2 pts) | Bajada 75–149 bps (+1 pt) | Neutral (0 bps) | Subida 25–99 bps (-0.5 pts) | Subida ≥ 100 bps (-1 pt)</p>
                  <p className="text-sm font-bold text-emerald-400 pt-2">Puntuación obtenida: {step6ScoreNormalized.toFixed(0)} / 15 puntos</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedStep(null)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                Cerrar detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}