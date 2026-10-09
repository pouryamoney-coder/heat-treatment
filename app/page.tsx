"use client";
import React, { useState } from 'react';

export default function CK67CalculatorV18() {
  const [structure, setStructure] = useState('alt_beynit');
  const [thickness, setThickness] = useState<number>(5);
  const [shapeForm, setShapeForm] = useState<number>(1.0); 
  const [partWeight, setPartWeight] = useState<number>(7.3); 
  const [orderQuantity, setOrderQuantity] = useState<number>(3000); 
  const [recoverySystem, setRecoverySystem] = useState<number>(0.60); 

  const [blindHoles, setBlindHoles] = useState(false);
  const [sectionDiff, setSectionDiff] = useState(false);

  // --- FİZİK VE SÜRE HESAPLARI ---
  const calculatedSpecificArea = Math.round((2500 / thickness) * shapeForm);

  let baseHeating = (thickness / 25.4) * 60;
  if (sectionDiff) baseHeating *= 1.5; 
  const heatingTime = Math.round(baseHeating);
  
  const transformationTime = structure === 'alt_beynit' ? 25 : 15;
  // Şok Soğuma (Equalization) Süresi
  const equalizationTimeInSalt = Math.ceil(thickness * 0.15); 
  const saltBathTime = transformationTime + equalizationTimeInSalt;
  
  const totalTime = heatingTime + saltBathTime;
  const timeMultiplier = Math.max(0.5, totalTime / 60);

  // --- KAPASİTE VE TUZ ZAYİAT HESABI ---
  const nominalCapacityPerHour = 200; 
  const geometryEfficiency = Math.max(0.20, Math.min(1.0, 100 / calculatedSpecificArea));
  const actualCapacityPerHour = Math.round((60 / totalTime) * nominalCapacityPerHour * geometryEfficiency);
  const geometryMultiplier = (1 / geometryEfficiency);

  let dragOutCoefficient = structure === 'alt_beynit' ? 0.06 : 0.04;
  if (blindHoles) dragOutCoefficient *= 1.50; 
  
  const grossSaltLossPerKg = Math.round(calculatedSpecificArea * dragOutCoefficient);
  const grossLossPerPartGram = grossSaltLossPerKg * partWeight;
  const totalGrossSaltKg = Math.round((grossLossPerPartGram * orderQuantity) / 1000);
  
  const recoveredSaltKg = Math.round(totalGrossSaltKg * recoverySystem);
  const netSaltLossPerKg = Math.round(grossSaltLossPerKg * (1 - recoverySystem));
  const netLossPerPartGram = grossLossPerPartGram * (1 - recoverySystem);
  const totalNetSaltNeedKg = totalGrossSaltKg - recoveredSaltKg;
  
  const saltCostMultiplier = 1.0 + Math.max(0, (netSaltLossPerKg - 10) * 0.005);
  const totalProcessMultiplier = (timeMultiplier * geometryMultiplier * saltCostMultiplier).toFixed(2);

  const details = React.useMemo(() => {
    return { 
      yCoord: structure === 'alt_beynit' ? 260 : 220 
    };
  }, [structure]);

  const coolingPath = `M 60,40 L 70,${details.yCoord} L 320,${details.yCoord} L 320,380`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">CK67 İzotermal Analiz (V18)</h1>
        <p className="text-slate-500 mb-8">Süre Kırılımlı ve Geri Kazanım Simülatörü</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-6 border-b pb-2">Proses Girdileri</h2>

            <div className="mb-5 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <label className="block text-sm font-medium mb-2 flex justify-between text-amber-900">
                <span>Toplam Sipariş</span>
                <span className="font-bold">{orderQuantity.toLocaleString('tr-TR')} Adet</span>
              </label>
              <input type="range" min="100" max="50000" step="100" value={orderQuantity} onChange={(e) => setOrderQuantity(Number(e.target.value))} className="w-full accent-amber-600" />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 flex justify-between">
                <span>Tek Parça Ağırlığı</span>
                <span className="font-bold">{partWeight} kg</span>
              </label>
              <input type="range" min="0.1" max="20" step="0.1" value={partWeight} onChange={(e) => setPartWeight(Number(e.target.value))} className="w-full" />
            </div>

            <div className="mb-5 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-medium mb-2 flex justify-between text-blue-900">
                <span>Maksimum Et Kalınlığı</span>
                <span className="font-bold">{thickness} mm</span>
              </label>
              <input type="range" min="1" max="50" step="1" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
            
            <div className="mb-5 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <label className="block text-sm font-medium mb-2 text-emerald-900">Yıkama / Geri Kazanım Sistemi</label>
              <select value={recoverySystem} onChange={(e) => setRecoverySystem(Number(e.target.value))} className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg outline-none text-sm">
                <option value={0}>Yok (Direkt Atık / %0 Kurtarma)</option>
                <option value={0.60}>Standart Yıkama Tankı (%60 Kurtarma)</option>
                <option value={0.85}>Evaporatörlü Gelişmiş Sistem (%85 Kurtarma)</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Parça Formu</label>
              <select value={shapeForm} onChange={(e) => setShapeForm(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none">
                <option value={0.7}>Masif Kütük / Takoz</option>
                <option value={1.0}>Standart Mil / Plaka</option>
                <option value={1.8}>Açık Yay / Boru</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Hedeflenen Yapı</label>
              <select value={structure} onChange={(e) => setStructure(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none">
                <option value="alt_beynit">Alt Beynit (310°C)</option>
                <option value="ust_beynit">Üst Beynit (360°C)</option>
              </select>
            </div>

            <div className="space-y-3 mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="sectionDiff" checked={sectionDiff} onChange={(e) => setSectionDiff(e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-slate-300 cursor-pointer" />
                <label htmlFor="sectionDiff" className="text-sm font-medium cursor-pointer text-slate-700">İnce/Kalın kesit farkı (Yavaş ısıtma)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="blindHoles" checked={blindHoles} onChange={(e) => setBlindHoles(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-indigo-300 cursor-pointer" />
                <label htmlFor="blindHoles" className="text-sm font-medium cursor-pointer text-indigo-900 font-bold">Kör delik / Sık sarım var (Tuz hapsolur)</label>
              </div>
            </div>

          </div>

          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4">CCT/TTT Soğutma Rotası (CK67)</h2>
              <div className="relative w-full h-[220px] bg-slate-50 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden">
                <svg viewBox="0 0 450 400" className="w-full h-full">
                  <text x="15" y="25" fontSize="11" fill="#64748b">Sıcaklık (°C)</text>
                  <text x="360" y="385" fontSize="11" fill="#64748b">Zaman (Log)</text>
                  <line x1="10" y1="280" x2="430" y2="280" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,5"/>
                  <text x="15" y="275" fontSize="11" fill="#ef4444">Ms (~290°C)</text>
                  <line x1="10" y1="40" x2="430" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                  <path d="M 220,40 Q 110,130 220,280" fill="none" stroke="#64748b" strokeWidth="2"/>
                  <path d="M 270,40 Q 160,130 270,280" fill="none" stroke="#64748b" strokeWidth="2"/>
                  
                  <text x="75" y="32" fontSize="12" fill="#2563eb" fontWeight="bold">Isınma: {heatingTime} Dk.</text>
                  <path d={coolingPath} fill="none" stroke="#2563eb" strokeWidth="3" style={{ transition: "all 0.4s ease-in-out" }} />
                  <circle cx="60" cy="40" r="5" fill="#2563eb" />
                  <circle cx="320" cy={details.yCoord} r="5" fill="#2563eb" style={{ transition: "all 0.4s ease-in-out" }} />
                  
                  {/* YENİ: SVG İÇİNDE SÜRE KIRILIM DETAYI */}
                  <text x="90" y={details.yCoord - 10} fontSize="12" fill="#1e40af" fontWeight="bold" style={{ transition: "all 0.4s ease-in-out" }}>
                    Tuz: Şok Soğuma ({equalizationTimeInSalt} Dk.) + Faz Dönüşümü ({transformationTime} Dk.)
                  </text>
                </svg>
              </div>
            </div>

            {/* YENİ: PROSES SÜRELERİ KARTLARI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-blue-800 mb-1">Bant Isınma Süresi</div>
                <div className="text-xl font-bold text-blue-900">{heatingTime} <span className="text-sm font-normal">Dk.</span></div>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-sky-800 mb-1">Şok Soğuma Süresi (Tuza Giriş)</div>
                <div className="text-xl font-bold text-sky-900">{equalizationTimeInSalt} <span className="text-sm font-normal">Dk.</span></div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-indigo-800 mb-1">Faz Dönüşüm Süresi (Bekleme)</div>
                <div className="text-xl font-bold text-indigo-900">{transformationTime} <span className="text-sm font-normal">Dk.</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-1">Brüt Sürüklenme</h3>
                <div className="text-4xl font-black mb-2">{totalGrossSaltKg} <span className="text-xl">Kg</span></div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-sm font-bold text-emerald-200 uppercase mb-1">Net Fire (Gerçek Tüketim)</h3>
                <div className="text-4xl font-black mb-2">{totalNetSaltNeedKg} <span className="text-xl">Kg</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center">
                <div className="text-xs font-semibold text-slate-600 mb-1">Kapasite Hızı</div>
                <div className="text-xl font-bold text-slate-800">{actualCapacityPerHour} <span className="text-sm">kg/s</span></div>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center">
                <div className="text-xs font-semibold text-slate-600 mb-1">Hesaplanan Alan</div>
                <div className="text-xl font-bold text-slate-800">{calculatedSpecificArea} <span className="text-sm">cm²/kg</span></div>
              </div>
              <div className="bg-green-50 border-2 border-green-400 p-4 rounded-xl shadow-md flex flex-col justify-center items-center">
                <div className="text-xs font-semibold text-green-800 mb-1 text-center">Proses Maliyet Çarpanı</div>
                <div className="text-2xl font-black text-green-700">{totalProcessMultiplier}x</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}