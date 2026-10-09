"use client";
import { useState } from 'react';


const STEEL_DENSITY = 7850;
const STEEL_VOL_HEAT_CAP = 4.7e6;
const STEEL_CONDUCTIVITY = 25;
const SALT_HTC = 2000;
const EQUALIZATION_TOLERANCE = 5;
const AUSTENITIZE_TEMP = 840;
const A1_TEMP = 727;
const PEARLITE_NOSE_TEMP = 550;
const NOMINAL_C = 0.67;
const NOMINAL_MN = 0.75;
const MS_TEMP = Math.round((539 - 423 * NOMINAL_C - 30.4 * NOMINAL_MN) / 5) * 5;
const MIN_HEATING_TIME = 15;

const NOMINAL_CAPACITY = 200;
const REFERENCE_CYCLE = 60;
const MAX_CAPACITY = 400;
const SAFE_SECTION = 3;
const CRITICAL_SECTION = 5;

const STRUCTURES = {
  alt_beynit: { label: 'Alt Beynit', bathTemp: 310, transformationTime: 25, dragOut: 0.06 },
  ust_beynit: { label: 'Üst Beynit', bathTemp: 360, transformationTime: 15, dragOut: 0.04 },
} as const;
type StructureKey = keyof typeof STRUCTURES;

const yOf = (temp: number) => 40 + (AUSTENITIZE_TEMP - temp) * (340 / (AUSTENITIZE_TEMP - 100));
const fmt = (value: number, digits = 1) =>
  value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function CK67Calculator() {
  const [structure, setStructure] = useState<StructureKey>('alt_beynit');
  const [thickness, setThickness] = useState<number>(5);
  const [shapeForm, setShapeForm] = useState<number>(1.0);
  const [partWeight, setPartWeight] = useState<number>(7.3);
  const [orderQuantity, setOrderQuantity] = useState<number>(3000);
  const [recoverySystem, setRecoverySystem] = useState<number>(0.60);
  const [saltPrice, setSaltPrice] = useState<number>(3.0);
  const [baseProcessCost, setBaseProcessCost] = useState<number>(1.2);

  const [blindHoles, setBlindHoles] = useState(false);
  const [sectionDiff, setSectionDiff] = useState(false);

  const { bathTemp, transformationTime, dragOut } = STRUCTURES[structure];


  const calculatedSpecificArea = (2e4 / (STEEL_DENSITY / 1000) / thickness) * shapeForm;
  const characteristicLength = 1 / (STEEL_DENSITY * calculatedSpecificArea * 1e-4);
  const equivalentPlateThickness = characteristicLength * 2000;


  let baseHeating = Math.max(MIN_HEATING_TIME, (thickness / 25.4) * 60);
  if (sectionDiff) baseHeating *= 1.5;
  const heatingTime = Math.round(baseHeating);


  const timeConstant = STEEL_VOL_HEAT_CAP * characteristicLength
    * (1 / SALT_HTC + characteristicLength / (3 * STEEL_CONDUCTIVITY));
  const equalizationTimeInSalt =
    (timeConstant * Math.log((AUSTENITIZE_TEMP - bathTemp) / EQUALIZATION_TOLERANCE)) / 60;
  const saltBathTime = transformationTime + equalizationTimeInSalt;

  const sectionStatus = equivalentPlateThickness <= SAFE_SECTION
    ? 'safe'
    : equivalentPlateThickness <= CRITICAL_SECTION ? 'risky' : 'pearlite';


  const bottleneckTime = Math.max(heatingTime, saltBathTime);
  const bottleneckStation = heatingTime >= saltBathTime ? 'Isınma fırını' : 'Tuz banyosu';
  const geometryEfficiency = Math.max(0.20, Math.min(1.0, 100 / calculatedSpecificArea));
  const actualCapacityPerHour = Math.min(
    MAX_CAPACITY,
    (REFERENCE_CYCLE / bottleneckTime) * NOMINAL_CAPACITY * geometryEfficiency,
  );

  let dragOutCoefficient: number = dragOut; // g/cm²
  if (blindHoles) dragOutCoefficient *= 1.50;

  const grossSaltLossPerKg = calculatedSpecificArea * dragOutCoefficient; // g/kg
  const totalGrossSaltKg = (grossSaltLossPerKg * partWeight * orderQuantity) / 1000;
  const recoveredSaltKg = totalGrossSaltKg * recoverySystem;
  const netSaltLossPerKg = grossSaltLossPerKg * (1 - recoverySystem);
  const totalNetSaltNeedKg = totalGrossSaltKg - recoveredSaltKg;

  const processCostPerKg = baseProcessCost * (NOMINAL_CAPACITY / actualCapacityPerHour);
  const saltCostPerKg = (netSaltLossPerKg / 1000) * saltPrice;
  const totalCostPerKg = processCostPerKg + saltCostPerKg;
  const totalProcessMultiplier = totalCostPerKg / baseProcessCost;

  const yAust = yOf(AUSTENITIZE_TEMP);
  const yA1 = yOf(A1_TEMP);
  const yMs = yOf(MS_TEMP);
  const yBath = yOf(bathTemp);
  const yNose = yOf(PEARLITE_NOSE_TEMP);
  const yControl = 2 * yNose - (yA1 + yMs) / 2;
  const coolingPath = `M 60,${yAust} L 70,${yBath} L 320,${yBath} L 320,380`;
  const corePath = `M 60,${yAust} L 200,${yOf(480)} L 320,${yBath}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">CK67 İzotermal Analiz</h1>
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
                <span>En Kalın Kesit</span>
                <span className="font-bold">{thickness} mm</span>
              </label>
              <input type="range" min="1" max="50" step="1" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} className="w-full accent-blue-600" />
              <p className="text-xs text-blue-700 mt-1">Levha/boru: et kalınlığı · Mil/tel: çap · Blok: kenar</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Parça Formu</label>
              <select value={shapeForm} onChange={(e) => setShapeForm(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none">
                <option value={1.0}>Levha / Plaka / Boru</option>
                <option value={2.0}>Mil / Tel / Yay (Yuvarlak Kesit)</option>
                <option value={3.0}>Masif Blok / Küp</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Hedeflenen Yapı</label>
              <select value={structure} onChange={(e) => setStructure(e.target.value as StructureKey)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none">
                {Object.entries(STRUCTURES).map(([key, s]) => (
                  <option key={key} value={key}>{s.label} ({s.bathTemp}°C)</option>
                ))}
              </select>
            </div>

            <div className="mb-5 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <label className="block text-sm font-medium mb-2 text-emerald-900">Yıkama / Geri Kazanım Sistemi</label>
              <select value={recoverySystem} onChange={(e) => setRecoverySystem(Number(e.target.value))} className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg outline-none text-sm">
                <option value={0}>Yok (Direkt Atık / %0 Kurtarma)</option>
                <option value={0.60}>Standart Yıkama Tankı (%60 Kurtarma)</option>
                <option value={0.85}>Evaporatörlü Gelişmiş Sistem (%85 Kurtarma)</option>
              </select>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Tuz Fiyatı (€/kg)
                <input type="number" min="0" step="0.1" value={saltPrice} onChange={(e) => setSaltPrice(Number(e.target.value))} className="mt-1 w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none" />
              </label>
              <label className="text-sm font-medium">
                Nominal İşlem (€/kg)
                <input type="number" min="0.01" step="0.1" value={baseProcessCost} onChange={(e) => setBaseProcessCost(Math.max(0.01, Number(e.target.value)))} className="mt-1 w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none" />
              </label>
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

            {sectionStatus !== 'safe' && (
              <div className={`p-4 rounded-xl border text-sm ${sectionStatus === 'pearlite' ? 'bg-red-50 border-red-300 text-red-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
                <div className="font-bold mb-1">
                  {sectionStatus === 'pearlite' ? 'Çekirdekte perlit oluşur — tam beynit sağlanamaz' : 'Sınır kesit — sertleşebilirlik riski'}
                </div>
                Eşdeğer levha kalınlığı {fmt(equivalentPlateThickness)} mm.
                CK67 alaşımsız olduğu için perlit burnu (~{PEARLITE_NOSE_TEMP}°C) yaklaşık 1 saniyede başlar;
                {sectionStatus === 'pearlite'
                  ? ` ~${CRITICAL_SECTION} mm üzerindeki kesitlerde çekirdek burnu atlayamaz. Daha yüksek sertleşebilirlikli çelik (ör. 51CrV4) veya su verme + temperleme değerlendirilmeli.`
                  : ` ${SAFE_SECTION}–${CRITICAL_SECTION} mm aralığında güçlü tuz karıştırması ve su katkısı gerekir; çekirdek mikroyapısı numuneyle doğrulanmalı.`}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4">TTT (İzotermal) Diyagramı — CK67</h2>
              <div className="relative w-full h-65 bg-slate-50 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden">
                <svg viewBox="0 0 450 400" className="w-full h-full">
                  <text x="15" y="18" fontSize="11" fill="#64748b">Sıcaklık (°C)</text>
                  <text x="360" y="395" fontSize="11" fill="#64748b">Zaman (Log)</text>

                  <line x1="10" y1={yAust} x2="430" y2={yAust} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                  <text x="340" y={yAust - 4} fontSize="11" fill="#64748b">Ostenit ({AUSTENITIZE_TEMP}°C)</text>
                  <line x1="10" y1={yA1} x2="430" y2={yA1} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                  <text x="370" y={yA1 - 4} fontSize="11" fill="#64748b">A1 ({A1_TEMP}°C)</text>
                  <line x1="10" y1={yMs} x2="430" y2={yMs} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,5"/>
                  <text x="15" y={yMs + 14} fontSize="11" fill="#ef4444">Ms (~{MS_TEMP}°C)</text>

                  <path d={`M 220,${yA1} Q 110,${yControl} 220,${yMs}`} fill="none" stroke="#64748b" strokeWidth="2"/>
                  <path d={`M 270,${yA1} Q 160,${yControl} 270,${yMs}`} fill="none" stroke="#64748b" strokeWidth="2"/>
                  <text x="150" y={yNose + 4} fontSize="10" fill="#64748b" textAnchor="end">P</text>

                  {sectionStatus === 'pearlite' && (
                    <path d={corePath} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="6,4" />
                  )}
                  <path d={coolingPath} fill="none" stroke="#2563eb" strokeWidth="3" style={{ transition: "all 0.4s ease-in-out" }} />
                  <circle cx="60" cy={yAust} r="5" fill="#2563eb" />
                  <circle cx="320" cy={yBath} r="5" fill="#2563eb" style={{ transition: "all 0.4s ease-in-out" }} />

                  <text x="75" y={yAust + 16} fontSize="12" fill="#2563eb" fontWeight="bold">Isınma: {heatingTime} dk</text>
                  <text x="330" y={yBath + 4} fontSize="12" fill="#1e40af" fontWeight="bold" style={{ transition: "all 0.4s ease-in-out" }}>
                    {bathTemp}°C
                  </text>
                  <text x="80" y={yBath - 8} fontSize="11" fill="#1e40af" style={{ transition: "all 0.4s ease-in-out" }}>
                    Denkleşme {fmt(equalizationTimeInSalt)} dk + Dönüşüm {transformationTime} dk
                  </text>
                  {sectionStatus === 'pearlite' && (
                    <text x="205" y={yOf(480) + 4} fontSize="11" fill="#c2410c">Çekirdek</text>
                  )}
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-blue-800 mb-1">Bant Isınma Süresi</div>
                <div className="text-xl font-bold text-blue-900">{heatingTime} <span className="text-sm font-normal">dk</span></div>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-sky-800 mb-1">Tuzda Denkleşme Süresi</div>
                <div className="text-xl font-bold text-sky-900">{fmt(equalizationTimeInSalt)} <span className="text-sm font-normal">dk</span></div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                <div className="text-xs font-semibold text-indigo-800 mb-1">Faz Dönüşüm Süresi (Bekleme)</div>
                <div className="text-xl font-bold text-indigo-900">{transformationTime} <span className="text-sm font-normal">dk</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-1">Brüt Sürüklenme</h3>
                <div className="text-4xl font-black mb-2">{Math.round(totalGrossSaltKg).toLocaleString('tr-TR')} <span className="text-xl">kg</span></div>
                <div className="text-xs text-slate-300">{fmt(grossSaltLossPerKg)} g/kg parça</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-sm font-bold text-emerald-200 uppercase mb-1">Net Fire (Gerçek Tüketim)</h3>
                <div className="text-4xl font-black mb-2">{Math.round(totalNetSaltNeedKg).toLocaleString('tr-TR')} <span className="text-xl">kg</span></div>
                <div className="text-xs text-emerald-100">{fmt(netSaltLossPerKg)} g/kg parça</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center">
                <div className="text-xs font-semibold text-slate-600 mb-1">Kapasite Hızı</div>
                <div className="text-xl font-bold text-slate-800">{Math.round(actualCapacityPerHour)} <span className="text-sm">kg/s</span></div>
                <div className="text-xs text-slate-500 mt-1">Darboğaz: {bottleneckStation}</div>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center">
                <div className="text-xs font-semibold text-slate-600 mb-1">Hesaplanan Alan</div>
                <div className="text-xl font-bold text-slate-800">{Math.round(calculatedSpecificArea)} <span className="text-sm">cm²/kg</span></div>
                <div className="text-xs text-slate-500 mt-1">Eşdeğer levha: {fmt(equivalentPlateThickness)} mm</div>
              </div>
              <div className="bg-green-50 border-2 border-green-400 p-4 rounded-xl shadow-md flex flex-col justify-center items-center">
                <div className="text-xs font-semibold text-green-800 mb-1 text-center">Proses Maliyet Çarpanı</div>
                <div className="text-2xl font-black text-green-700">{totalProcessMultiplier.toFixed(2)}x</div>
                <div className="text-xs text-green-800 mt-1">
                  {fmt(totalCostPerKg, 2)} €/kg (tuz: {fmt(saltCostPerKg, 2)})
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}