export const COMPARISON_MODES = [
  { id: 'overall', label: 'Tổng thể', description: 'Cân bằng hiệu năng, cấu hình và mức giá.', valueWeight: 0.2, weights: { cpu: 0.32, gpu: 0.28, ram: 0.22, storage: 0.18 } },
  { id: 'office', label: 'Văn phòng', description: 'Ưu tiên CPU, RAM, lưu trữ và hiệu quả chi phí.', valueWeight: 0.25, weights: { cpu: 0.36, gpu: 0.1, ram: 0.32, storage: 0.22 } },
  { id: 'gaming', label: 'Gaming', description: 'Ưu tiên GPU, sau đó là CPU và dung lượng RAM.', valueWeight: 0.15, weights: { cpu: 0.28, gpu: 0.46, ram: 0.18, storage: 0.08 } },
  { id: 'creative', label: 'Đồ họa', description: 'Ưu tiên GPU, CPU và RAM cho render, dựng hình.', valueWeight: 0.1, weights: { cpu: 0.32, gpu: 0.36, ram: 0.22, storage: 0.1 } },
];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const normalizedText = (value) => String(value ?? '').toLocaleLowerCase('vi').replaceAll(',', '.');

export const parseCapacityGb = (value) => {
  const match = normalizedText(value).match(/([\d.]+)\s*(tb|gb)/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? amount * 1024 : amount;
};

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
    if (/hx\b/.test(text)) score += 7;
    else if (/h\b/.test(text)) score += 4;
    else if (/u\b/.test(text)) score -= 3;
    return clamp(score);
  }

  const ryzenTier = text.match(/ryzen\s*([3579])\b/)?.[1];
  if (ryzenTier) {
    let score = ({ 3: 45, 5: 64, 7: 81, 9: 94 })[ryzenTier];
    const generation = Number(text.match(/\b([3-9])\d{3}\b/)?.[1] ?? 5);
    score += clamp((generation - 5) * 2, -4, 8);
    if (/hx\b/.test(text)) score += 7;
    else if (/h\b|hs\b/.test(text)) score += 4;
    return clamp(score);
  }

  return 40;
};

const RTX_SCORES = {
  2050: 43, 3050: 54, 3060: 67, 3070: 78, 3080: 88,
  4050: 66, 4060: 79, 4070: 89, 4080: 96, 4090: 100,
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
  if (text.includes('integrated') || text.includes('onboard')) return 24;
  return 38;
};

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

export const getComparableSpecValue = (key, value) => {
  if (key === 'cpu') return scoreCpu(value);
  if (key === 'gpu') return scoreGpu(value);
  if (key === 'ram' || key === 'storage') return parseCapacityGb(value);
  return 0;
};

export const scoreComparison = (products, modeId = 'overall') => {
  const mode = COMPARISON_MODES.find((item) => item.id === modeId) ?? COMPARISON_MODES[0];
  const measured = products.map((product) => {
    const components = {
      cpu: scoreCpu(product.specs?.cpu),
      gpu: scoreGpu(product.specs?.gpu),
      ram: scoreRam(product.specs?.ram),
      storage: scoreStorage(product.specs?.storage),
    };
    const performance = Object.entries(mode.weights).reduce((total, [key, weight]) => total + components[key] * weight, 0);
    const priceMillions = Math.max(Number(product.price) / 1_000_000, 1);
    return { product, components, performance, efficiency: performance / priceMillions };
  });

  if (measured.length === 0) return [];
  const efficiencies = measured.map((item) => item.efficiency);
  const minEfficiency = Math.min(...efficiencies);
  const maxEfficiency = Math.max(...efficiencies);

  return measured
    .map((item) => {
      const valueScore = maxEfficiency === minEfficiency
        ? 75
        : 55 + ((item.efficiency - minEfficiency) / (maxEfficiency - minEfficiency)) * 45;
      const score = item.performance * (1 - mode.valueWeight) + valueScore * mode.valueWeight;
      return {
        id: item.product.id,
        score: Math.round(clamp(score)),
        valueScore: Math.round(clamp(valueScore)),
        components: item.components,
      };
    })
    .sort((a, b) => b.score - a.score);
};
