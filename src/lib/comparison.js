// Comparison scoring engine — rule-based, no API calls. Scores 0-100 per component.

export const COMPARISON_MODES = [
  {
    id: 'overall',
    label: 'Tổng thể',
    description: 'Cân bằng hiệu năng, màn hình, tính di động và mức giá.',
    valueWeight: 0.20,
    weights: { cpu: 0.28, gpu: 0.24, ram: 0.18, storage: 0.12, display: 0.10, mobility: 0.08 },
  },
  {
    id: 'office',
    label: 'Văn phòng',
    description: 'Ưu tiên CPU, RAM, tính di động (máy nhẹ, pin bền) và hiệu quả chi phí.',
    valueWeight: 0.28,
    weights: { cpu: 0.32, gpu: 0.05, ram: 0.26, storage: 0.14, display: 0.05, mobility: 0.18 },
  },
  {
    id: 'gaming',
    label: 'Gaming',
    description: 'Ưu tiên GPU, CPU hiệu năng cao và màn hình tần số quét cao.',
    valueWeight: 0.12,
    weights: { cpu: 0.24, gpu: 0.38, ram: 0.14, storage: 0.06, display: 0.14, mobility: 0.04 },
  },
  {
    id: 'creative',
    label: 'Đồ họa',
    description: 'Ưu tiên GPU, CPU đa nhân, RAM lớn và màn hình độ phủ màu cao (OLED, DCI-P3).',
    valueWeight: 0.10,
    weights: { cpu: 0.26, gpu: 0.30, ram: 0.20, storage: 0.08, display: 0.16, mobility: 0.00 },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const normalizedText = (value) => String(value ?? '').toLocaleLowerCase('vi').replaceAll(',', '.');

export const parseCapacityGb = (value) => {
  const match = normalizedText(value).match(/([\d.]+)\s*(tb|gb)/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? amount * 1024 : amount;
};

// ─── CPU Scorer ───────────────────────────────────────────────────────────────

export const scoreCpu = (value) => {
  const text = normalizedText(value);
  if (!text) return 0;

  const apple = text.match(/\bm([1-5])\b/);
  if (apple) {
    let score = 54 + Number(apple[1]) * 8;
    if (text.includes('pro')) score += 7;
    if (text.includes('max')) score += 13;
    if (text.includes('ultra')) score += 18;
    return clamp(score);
  }

  const intelTier = text.match(/(?:core\s*)?i([3579])\b/)?.[1] ?? text.match(/core\s*ultra\s*([579])\b/)?.[1];
  if (intelTier) {
    let score = ({ 3: 43, 5: 62, 7: 79, 9: 92 })[intelTier];
    const model = text.match(/\b(\d{4,5})[a-z]{0,2}\b/)?.[1];
    if (model) {
      const generation = Number(model.slice(0, model.length === 5 ? 2 : 1));
      score += clamp((generation - 10) * 2, -6, 9);
    }
    if (/hx\b/.test(text)) score += 8;
    else if (/h\b/.test(text)) score += 4;
    else if (/u\b/.test(text)) score -= 4;
    else if (/p\b/.test(text)) score -= 2;
    return clamp(score);
  }

  const ryzenTier = text.match(/ryzen\s*([3579])\b/)?.[1];
  if (ryzenTier) {
    let score = ({ 3: 45, 5: 64, 7: 81, 9: 94 })[ryzenTier];
    const generation = Number(text.match(/\b([3-9])\d{3}\b/)?.[1] ?? 5);
    score += clamp((generation - 5) * 2, -4, 8);
    if (/hx\b/.test(text)) score += 8;
    else if (/h\b|hs\b/.test(text)) score += 4;
    return clamp(score);
  }

  return 40;
};

// ─── GPU Scorer ───────────────────────────────────────────────────────────────

const RTX_SCORES = {
  2050: 43, 3050: 54, 3060: 67, 3070: 78, 3080: 88,
  4050: 66, 4060: 79, 4070: 89, 4080: 96, 4090: 100,
  5070: 92, 5080: 98,
};

export const scoreGpu = (value) => {
  const text = normalizedText(value);
  if (!text) return 0;
  const rtx = Number(text.match(/rtx\s*(\d{4})/)?.[1]);
  if (rtx && RTX_SCORES[rtx]) return RTX_SCORES[rtx];
  const gtx = Number(text.match(/gtx\s*(\d{4})/)?.[1]);
  if (gtx) return gtx >= 1660 ? 44 : 36;
  const appleCores = Number(text.match(/(\d+)\s*core\s*gpu/)?.[1]);
  if (appleCores) return clamp(28 + appleCores * 3);
  if (text.includes('iris')) return 29;
  if (text.includes('radeon')) return text.includes('rx') ? 58 : 32;
  if (text.includes('integrated') || text.includes('onboard') || text.includes('uhd')) return 24;
  return 38;
};

// ─── RAM / Storage Scorers ────────────────────────────────────────────────────

export const scoreRam = (value) => {
  const capacity = parseCapacityGb(value);
  if (!capacity) return 0;
  if (capacity >= 64) return 100;
  if (capacity >= 32) return 92;
  if (capacity >= 16) return 74;
  if (capacity >= 8) return 48;
  return 28;
};

export const scoreStorage = (value) => {
  const capacity = parseCapacityGb(value);
  if (!capacity) return 0;
  if (capacity >= 2048) return 100;
  if (capacity >= 1024) return 88;
  if (capacity >= 512) return 68;
  if (capacity >= 256) return 46;
  return 28;
};

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const parseRefreshRate = (text) => {
  const match = normalizedText(text).match(/(\d{2,4})\s*hz/);
  return match ? Number(match[1]) : 0;
};

export const parseWeightKg = (text) => {
  const t = normalizedText(text);
  const kg = t.match(/([\d.]+)\s*kg/);
  if (kg) return Number(kg[1]);
  const g = t.match(/([\d.]+)\s*(g|gram)\b/);
  if (g) return Number(g[1]) / 1000;
  return null;
};

const detectPanel = (text) => {
  const t = normalizedText(text);
  if (t.includes('oled') || t.includes('amoled')) return 'oled';
  if (t.includes('qled') || t.includes('mini-led') || t.includes('miniled')) return 'qled';
  if (t.includes('ips')) return 'ips';
  if (t.includes('va')) return 'va';
  if (t.includes('tn')) return 'tn';
  return null;
};

const detectColorGamut = (text) => {
  const t = normalizedText(text);
  const dcip3 = t.match(/(\d{2,3})\s*%?\s*dci[-\s]?p3/);
  if (dcip3) return { type: 'dci-p3', pct: Number(dcip3[1]) };
  const srgb = t.match(/(\d{2,3})\s*%?\s*srgb/);
  if (srgb) return { type: 'srgb', pct: Number(srgb[1]) };
  const ntsc = t.match(/(\d{2,3})\s*%?\s*ntsc/);
  if (ntsc) return { type: 'ntsc', pct: Number(ntsc[1]) };
  return null;
};

const detectResolution = (text) => {
  const t = normalizedText(text);
  if (t.includes('4k') || t.includes('uhd') || /3840.?2160/.test(t)) return 'uhd4k';
  if (t.includes('2.8k') || /2880/.test(t)) return '2.8k';
  if (t.includes('2k') || t.includes('qhd') || t.includes('wqhd') || /2560.?1600|2560.?1440/.test(t)) return 'qhd';
  if (t.includes('fhd') || t.includes('1080') || /1920.?1080/.test(t)) return 'fhd';
  if (t.includes('hd') || /1280.?720/.test(t)) return 'hd';
  return null;
};

const collectProductText = (product) => {
  const sources = [
    product?.spec_display, product?.display, product?.screen, product?.spec_screen,
    product?.spec_refresh_rate, product?.refresh_rate,
    product?.spec_resolution, product?.resolution,
    product?.spec_panel, product?.panel,
    product?.spec_color_gamut, product?.color_gamut,
    product?.specs?.display, product?.specs?.screen,
    product?.weight,
  ].filter(Boolean).join(' ');
  let specsObj = {};
  try {
    specsObj = typeof product?.specifications === 'string'
      ? JSON.parse(product.specifications)
      : (product?.specifications ?? {});
  } catch { /* noop */ }
  return `${sources} ${Object.values(specsObj).join(' ')}`;
};

// ─── Display Mode Scorers ─────────────────────────────────────────────────────

const scoreDisplayGaming = ({ hz, panel, resolution }) => {
  let score = 0;
  // Refresh rate is king for gaming
  if (hz >= 360) score += 52;
  else if (hz >= 240) score += 48;
  else if (hz >= 165) score += 42;
  else if (hz >= 144) score += 36;
  else if (hz >= 120) score += 28;
  else if (hz >= 60) score += 14;
  else if (hz > 0) score += 8;
  // Panel: fast response > colour
  const panelBonus = { oled: 28, qled: 20, ips: 16, va: 12, tn: 10 };
  score += panelBonus[panel] ?? 10;
  // Resolution — FHD is sweet spot for gaming perf
  const resBonus = { fhd: 20, qhd: 18, 'uhd4k': 8, '2.8k': 16, hd: 8 };
  score += resBonus[resolution] ?? 0;
  return clamp(score);
};

const scoreDisplayCreative = ({ hz, panel, resolution, colorGamut }) => {
  let score = 0;
  // Colour gamut — most important for design work
  if (colorGamut) {
    if (colorGamut.type === 'dci-p3') score += colorGamut.pct >= 100 ? 44 : colorGamut.pct >= 90 ? 36 : 24;
    else if (colorGamut.type === 'srgb') score += colorGamut.pct >= 100 ? 30 : colorGamut.pct >= 90 ? 20 : 12;
    else if (colorGamut.type === 'ntsc') score += colorGamut.pct >= 72 ? 18 : 10;
  }
  // Panel type — OLED/QLED for design
  const panelBonus = { oled: 30, qled: 22, ips: 16, va: 10, tn: 4 };
  score += panelBonus[panel] ?? 10;
  // Resolution — higher is better for design
  const resBonus = { 'uhd4k': 26, '2.8k': 22, qhd: 18, fhd: 10, hd: 4 };
  score += resBonus[resolution] ?? 0;
  if (hz >= 120) score += 4; // small bonus
  return clamp(score);
};

const scoreDisplayOffice = ({ hz, panel, resolution }) => {
  let score = 0;
  // IPS or OLED for eye comfort
  const panelBonus = { ips: 30, qled: 28, oled: 25, va: 18, tn: 12 };
  score += panelBonus[panel] ?? 14;
  // FHD–QHD is standard for office
  const resBonus = { fhd: 36, qhd: 30, 'uhd4k': 24, hd: 14 };
  score += resBonus[resolution] ?? 0;
  if (hz >= 120) score += 10;
  else if (hz >= 60) score += 6;
  return clamp(score);
};

// ─── Display Master Scorer ────────────────────────────────────────────────────

export const scoreDisplay = (product, modeId = 'overall') => {
  const combined = collectProductText(product);
  if (!combined.trim()) return null;
  const hz = parseRefreshRate(combined);
  const panel = detectPanel(combined);
  const resolution = detectResolution(combined);
  const colorGamut = detectColorGamut(combined);
  if (!hz && !panel && !resolution && !colorGamut) return null;
  const info = { hz, panel, resolution, colorGamut };
  if (modeId === 'gaming') return scoreDisplayGaming(info);
  if (modeId === 'creative') return scoreDisplayCreative(info);
  if (modeId === 'office') return scoreDisplayOffice(info);
  // overall: balanced between gaming and office display needs
  return Math.round((scoreDisplayGaming(info) + scoreDisplayOffice(info)) / 2);
};

// ─── Mobility Scorer ─────────────────────────────────────────────────────────

export const scoreMobility = (product, modeId = 'overall') => {
  const combined = collectProductText(product);
  const kg = parseWeightKg(combined);
  if (kg === null) return null;

  if (modeId === 'office') {
    // Lighter = much better for commuters
    if (kg <= 1.1) return 100;
    if (kg <= 1.3) return 92;
    if (kg <= 1.5) return 82;
    if (kg <= 1.8) return 64;
    if (kg <= 2.2) return 42;
    return 22;
  }
  if (modeId === 'gaming') {
    // Medium-heavy = better cooling = better sustained performance
    if (kg <= 1.3) return 35;
    if (kg <= 1.7) return 58;
    if (kg <= 2.2) return 82;
    if (kg <= 2.8) return 90;
    return 78;
  }
  if (modeId === 'creative') return 60; // neutral — creative users are desk-bound
  // overall
  if (kg <= 1.5) return 85;
  if (kg <= 2.0) return 72;
  if (kg <= 2.5) return 55;
  return 38;
};

// ─── Bottleneck Penalty ───────────────────────────────────────────────────────

export const bottleneckPenalty = (components, modeId) => {
  const { cpu, gpu, ram } = components;
  let penalty = 0;
  // Strong GPU but RAM-starved
  if (gpu > 68 && ram < 52) penalty += 12;
  // Gaming/Creative: CPU bottlenecks a strong GPU
  if ((modeId === 'gaming' || modeId === 'creative') && gpu > 70 && cpu < 55) penalty += 18;
  // Gaming with integrated GPU is a huge penalty
  if (modeId === 'gaming' && gpu <= 32) penalty += 22;
  // Creative with integrated GPU
  if (modeId === 'creative' && gpu <= 32) penalty += 18;
  // Very low RAM hurts everyone
  if (ram > 0 && ram < 35) penalty += 8;
  // Office: strong CPU but insufficient RAM for multitasking
  if (modeId === 'office' && cpu > 65 && ram < 52) penalty += 10;
  return clamp(penalty, 0, 35);
};

// ─── Insight Generator ────────────────────────────────────────────────────────

export const generateInsights = (components, displayScore, mobilityScore, modeId, productRaw) => {
  const insights = [];
  const { cpu, gpu, ram } = components;
  const combined = collectProductText(productRaw);
  const panel = detectPanel(combined);
  const hz = parseRefreshRate(combined);
  const colorGamut = detectColorGamut(combined);
  const kg = parseWeightKg(combined);

  // GPU insights
  if (modeId === 'gaming') {
    if (gpu >= 85) insights.push({ text: 'GPU hàng đầu — xử lý mượt mà game AAA 4K', type: 'good' });
    else if (gpu >= 65) insights.push({ text: 'GPU tốt cho gaming 1080p–1440p', type: 'good' });
    else if (gpu <= 35) insights.push({ text: 'Card tích hợp — chỉ phù hợp game nhẹ/indie', type: 'warn' });
  }
  if (modeId === 'creative') {
    if (gpu >= 75) insights.push({ text: 'GPU đủ mạnh cho render 3D và xuất video', type: 'good' });
    else if (gpu <= 35) insights.push({ text: 'Card tích hợp — không phù hợp render 3D nặng', type: 'warn' });
  }

  // RAM bottleneck
  if (ram < 52 && gpu > 68) insights.push({ text: 'RAM hơi thiếu so với GPU — có thể giật khi multitask', type: 'warn' });
  if (ram >= 92) insights.push({ text: 'RAM 32GB+ — lý tưởng cho đa nhiệm nặng', type: 'good' });

  // Display insights
  if (panel === 'oled') {
    if (modeId === 'creative') insights.push({ text: 'Màn OLED — tương phản vô cực, màu chuẩn cho đồ họa', type: 'good' });
    else insights.push({ text: 'Màn OLED premium — hình ảnh sống động xuất sắc', type: 'good' });
  }
  if (colorGamut?.type === 'dci-p3' && colorGamut.pct >= 95) {
    insights.push({ text: `Phủ ${colorGamut.pct}% DCI-P3 — chuẩn nghề thiết kế chuyên nghiệp`, type: 'good' });
  } else if (colorGamut?.type === 'srgb' && colorGamut.pct >= 100 && modeId === 'creative') {
    insights.push({ text: '100% sRGB — ổn cho thiết kế web/UI, chưa đạt chuẩn in ấn cao cấp', type: 'info' });
  }
  if (hz >= 144 && modeId === 'gaming') {
    insights.push({ text: `Màn ${hz}Hz — siêu mượt, lợi thế lớn trong FPS`, type: 'good' });
  } else if (hz > 0 && hz < 120 && modeId === 'gaming') {
    insights.push({ text: `Màn ${hz}Hz — GPU bị giới hạn bởi tốc độ màn hình`, type: 'warn' });
  }

  // Weight/mobility insights
  if (kg !== null) {
    if (kg <= 1.3 && modeId === 'office') insights.push({ text: `Siêu nhẹ ${kg}kg — lý tưởng mang đi làm hàng ngày`, type: 'good' });
    else if (kg >= 2.5 && modeId === 'office') insights.push({ text: `Nặng ${kg}kg — không thoải mái mang đi lại`, type: 'warn' });
    if (kg >= 2.0 && modeId === 'gaming') insights.push({ text: `${kg}kg — trọng lượng phù hợp tản nhiệt gaming`, type: 'info' });
  }

  return insights.slice(0, 3);
};

// ─── Comparable value for table highlighting ─────────────────────────────────

export const getComparableSpecValue = (key, value) => {
  if (key === 'cpu') return scoreCpu(value);
  if (key === 'gpu') return scoreGpu(value);
  if (key === 'ram' || key === 'storage') return parseCapacityGb(value);
  return 0;
};

// ─── Display info extractor (for table rows) ─────────────────────────────────

export const extractDisplayInfo = (product) => {
  const combined = collectProductText(product);
  if (!combined.trim()) return null;
  return {
    hz: parseRefreshRate(combined) || null,
    panel: detectPanel(combined),
    resolution: detectResolution(combined),
    colorGamut: detectColorGamut(combined),
    weightKg: parseWeightKg(combined),
  };
};

// ─── Main Scoring Function ────────────────────────────────────────────────────

export const scoreComparison = (products, modeId = 'overall') => {
  const mode = COMPARISON_MODES.find((item) => item.id === modeId) ?? COMPARISON_MODES[0];

  const measured = products.map((product) => {
    const rawProduct = product._raw ?? product;

    const cpuScore = scoreCpu(product.specs?.cpu);
    const gpuScore = scoreGpu(product.specs?.gpu);
    const ramScore = scoreRam(product.specs?.ram);
    const storageScore = scoreStorage(product.specs?.storage);
    const displayScore = scoreDisplay(rawProduct, modeId);
    const mobilityScore = scoreMobility(rawProduct, modeId);

    const components = {
      cpu: cpuScore,
      gpu: gpuScore,
      ram: ramScore,
      storage: storageScore,
      display: displayScore ?? 0,
      mobility: mobilityScore ?? 0,
    };

    // Re-normalize weights if display/mobility data is missing
    const effectiveWeights = { ...mode.weights };
    if (displayScore === null) effectiveWeights.display = 0;
    if (mobilityScore === null) effectiveWeights.mobility = 0;
    const weightSum = Object.values(effectiveWeights).reduce((a, b) => a + b, 0);
    const normalizedWeights = weightSum > 0
      ? Object.fromEntries(Object.entries(effectiveWeights).map(([k, v]) => [k, v / weightSum]))
      : effectiveWeights;

    const performance = Object.entries(normalizedWeights).reduce(
      (total, [key, weight]) => total + (components[key] ?? 0) * weight, 0,
    );
    const penalty = bottleneckPenalty(components, modeId);
    const priceMillions = Math.max(Number(product.price) / 1_000_000, 1);
    const efficiency = performance / priceMillions;

    return { product, rawProduct, components, performance, efficiency, penalty, displayScore, mobilityScore };
  });

  if (measured.length === 0) return [];

  const efficiencies = measured.map((item) => item.efficiency);
  const minEff = Math.min(...efficiencies);
  const maxEff = Math.max(...efficiencies);

  return measured
    .map((item) => {
      const valueScore = maxEff === minEff
        ? 75
        : 55 + ((item.efficiency - minEff) / (maxEff - minEff)) * 45;
      const rawScore = item.performance * (1 - mode.valueWeight) + valueScore * mode.valueWeight;
      const score = clamp(rawScore - item.penalty * (1 - mode.valueWeight));
      const insights = generateInsights(
        item.components, item.displayScore, item.mobilityScore, modeId, item.rawProduct,
      );
      return {
        id: item.product.id,
        score: Math.round(clamp(score)),
        valueScore: Math.round(clamp(valueScore)),
        components: item.components,
        penalty: item.penalty,
        insights,
        displayInfo: extractDisplayInfo(item.rawProduct),
      };
    })
    .sort((a, b) => b.score - a.score);
};
