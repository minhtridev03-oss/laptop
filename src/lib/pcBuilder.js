export const PC_BUILD_STORAGE_KEY = 'laptop-world:pc-builder';

export const PC_BUILD_SLOTS = [
  { id: 'cpu', label: 'Bộ xử lý', shortLabel: 'CPU', required: true },
  { id: 'mainboard', label: 'Bo mạch chủ', shortLabel: 'Mainboard', required: true },
  { id: 'ram', label: 'Bộ nhớ trong', shortLabel: 'RAM', required: true },
  { id: 'gpu', label: 'Card đồ họa', shortLabel: 'GPU', required: true },
  { id: 'storage', label: 'Ổ cứng', shortLabel: 'SSD / HDD', required: true },
  { id: 'psu', label: 'Nguồn máy tính', shortLabel: 'PSU', required: true },
  { id: 'case', label: 'Vỏ máy tính', shortLabel: 'Case', required: true },
  { id: 'cooler', label: 'Tản nhiệt CPU', shortLabel: 'Tản nhiệt', required: false },
];

export const DEFAULT_BUILD_PROFILES = [
  {
    id: 'entry',
    name: 'Phổ thông',
    description: 'Học tập, văn phòng và gaming Full HD',
    use_case: 'office',
    budget_min: 15000000,
    budget_max: 26000000,
    default_budget: 20000000,
    target_resolution: '1080p',
    component_budget_weights: { cpu: 0.16, mainboard: 0.11, ram: 0.08, gpu: 0.38, storage: 0.06, psu: 0.07, case: 0.08, cooler: 0.06 },
    score_weights: { performance: 0.34, value: 0.2, budget_fit: 0.29, stock: 0.07, tier: 0.1 },
    requirements: { legacy_tier: 'entry', min_cpu_score: 55, min_gpu_score: 60, min_ram_gb: 16, min_storage_gb: 500 },
    sort_order: 1,
  },
  {
    id: 'balanced',
    name: 'Cân bằng',
    description: 'Gaming 2K, đồ họa và làm việc đa nhiệm',
    use_case: 'gaming',
    budget_min: 28000000,
    budget_max: 48000000,
    default_budget: 37000000,
    target_resolution: '1440p',
    component_budget_weights: { cpu: 0.16, mainboard: 0.11, ram: 0.08, gpu: 0.4, storage: 0.06, psu: 0.07, case: 0.07, cooler: 0.05 },
    score_weights: { performance: 0.38, value: 0.19, budget_fit: 0.27, stock: 0.06, tier: 0.1 },
    requirements: { legacy_tier: 'balanced', min_cpu_score: 75, min_gpu_score: 82, min_ram_gb: 32, min_storage_gb: 1024 },
    sort_order: 2,
  },
  {
    id: 'premium',
    name: 'Cao cấp',
    description: 'Gaming 4K, render và workstation cá nhân',
    use_case: 'creator',
    budget_min: 55000000,
    budget_max: 110000000,
    default_budget: 75000000,
    target_resolution: '4K',
    component_budget_weights: { cpu: 0.15, mainboard: 0.12, ram: 0.07, gpu: 0.46, storage: 0.05, psu: 0.06, case: 0.05, cooler: 0.04 },
    score_weights: { performance: 0.44, value: 0.14, budget_fit: 0.22, stock: 0.05, tier: 0.15 },
    requirements: { legacy_tier: 'premium', min_cpu_score: 90, min_gpu_score: 94, min_ram_gb: 64, min_storage_gb: 2048 },
    sort_order: 3,
  },
];

// Kept as an alias so existing imports continue to work while profiles move to Supabase.
export const BUILDER_PRESETS = DEFAULT_BUILD_PROFILES;

export const getBuilderSpec = (product, key, fallback = null) => product?.specifications?.[key] ?? fallback;

export const estimateSystemPower = (selections) => {
  const cpuPower = Number(getBuilderSpec(selections.cpu, 'tdp_w', 0));
  const gpuPower = Number(getBuilderSpec(selections.gpu, 'tdp_w', 0));
  return cpuPower + gpuPower + (cpuPower || gpuPower ? 120 : 0);
};

export const recommendedPsuWattage = (selections) => {
  const estimate = estimateSystemPower(selections);
  if (!estimate) return 0;
  return Math.ceil((estimate * 1.3) / 50) * 50;
};

const includesValue = (values, value) => Array.isArray(values) && values.includes(value);

export const getCompatibilityIssues = (selections) => {
  const issues = [];
  const { cpu, mainboard, ram, gpu, psu, case: pcCase, cooler } = selections;
  const missing = PC_BUILD_SLOTS.filter((slot) => slot.required && !selections[slot.id]);

  if (missing.length > 0) {
    issues.push({
      code: 'missing',
      tone: 'warning',
      message: `Còn thiếu ${missing.length} linh kiện bắt buộc: ${missing.map((slot) => slot.shortLabel).join(', ')}.`,
    });
  }

  const cpuSocket = getBuilderSpec(cpu, 'socket');
  const boardSocket = getBuilderSpec(mainboard, 'socket');
  if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
    issues.push({ code: 'socket', tone: 'error', message: `CPU socket ${cpuSocket} không tương thích mainboard socket ${boardSocket}.` });
  }

  const boardRam = getBuilderSpec(mainboard, 'ram_type');
  const ramType = getBuilderSpec(ram, 'ram_type');
  if (boardRam && ramType && boardRam !== ramType) {
    issues.push({ code: 'ram', tone: 'error', message: `Mainboard dùng ${boardRam} nhưng bộ nhớ đang chọn là ${ramType}.` });
  }

  const boardForm = getBuilderSpec(mainboard, 'form_factor');
  const caseForms = getBuilderSpec(pcCase, 'supported_form_factors', []);
  if (boardForm && caseForms.length > 0 && !includesValue(caseForms, boardForm)) {
    issues.push({ code: 'case-board', tone: 'error', message: `Case không hỗ trợ kích thước mainboard ${boardForm}.` });
  }

  const gpuLength = Number(getBuilderSpec(gpu, 'length_mm', 0));
  const caseGpuLimit = Number(getBuilderSpec(pcCase, 'max_gpu_length_mm', 0));
  if (gpuLength && caseGpuLimit && gpuLength > caseGpuLimit) {
    issues.push({ code: 'case-gpu', tone: 'error', message: `GPU dài ${gpuLength} mm vượt giới hạn case ${caseGpuLimit} mm.` });
  }

  const coolerSockets = getBuilderSpec(cooler, 'supported_sockets', []);
  if (cpuSocket && cooler && coolerSockets.length > 0 && !includesValue(coolerSockets, cpuSocket)) {
    issues.push({ code: 'cooler', tone: 'error', message: `Tản nhiệt không hỗ trợ socket ${cpuSocket}.` });
  }

  const psuWattage = Number(getBuilderSpec(psu, 'wattage', 0));
  const recommendedWattage = recommendedPsuWattage(selections);
  if (psuWattage && recommendedWattage && psuWattage < recommendedWattage) {
    issues.push({ code: 'power', tone: 'error', message: `Nguồn ${psuWattage}W thấp hơn mức đề xuất ${recommendedWattage}W.` });
  }

  const cpuScore = Number(getBuilderSpec(cpu, 'performance_score', 0));
  const gpuScore = Number(getBuilderSpec(gpu, 'performance_score', 0));
  if (cpuScore && gpuScore && Math.abs(cpuScore - gpuScore) >= 24) {
    issues.push({
      code: 'balance',
      tone: 'warning',
      message: cpuScore > gpuScore
        ? 'CPU mạnh hơn đáng kể so với GPU; cấu hình có thể chưa tối ưu cho gaming.'
        : 'GPU mạnh hơn đáng kể so với CPU; nên cân nhắc CPU cao hơn để cân bằng.',
    });
  }

  if (!cooler && cpu && Number(getBuilderSpec(cpu, 'tdp_w', 0)) >= 125) {
    issues.push({ code: 'cooler-missing', tone: 'warning', message: 'CPU công suất cao nên bổ sung tản nhiệt phù hợp.' });
  }

  return issues;
};

export const getCandidateConflict = (slotId, candidate, selections) => {
  const next = { ...selections, [slotId]: candidate };
  const relevantCodes = {
    cpu: ['socket', 'cooler'],
    mainboard: ['socket', 'ram', 'case-board'],
    ram: ['ram'],
    gpu: ['case-gpu', 'power'],
    storage: [],
    psu: ['power'],
    case: ['case-board', 'case-gpu'],
    cooler: ['cooler'],
  }[slotId] ?? [];
  return getCompatibilityIssues(next).find((issue) => issue.tone === 'error' && relevantCodes.includes(issue.code))?.message ?? null;
};

export const getPartHighlights = (product) => {
  const specs = product?.specifications ?? {};
  const highlights = [];
  if (specs.socket) highlights.push(specs.socket);
  if (specs.ram_type) highlights.push(specs.ram_type);
  if (specs.capacity_gb) highlights.push(`${specs.capacity_gb >= 1024 ? `${specs.capacity_gb / 1024}TB` : `${specs.capacity_gb}GB`}`);
  if (specs.wattage) highlights.push(`${specs.wattage}W`);
  if (specs.form_factor) highlights.push(specs.form_factor);
  if (specs.storage_type) highlights.push(specs.storage_type);
  if (specs.efficiency) highlights.push(specs.efficiency);
  if (specs.length_mm) highlights.push(`${specs.length_mm} mm`);
  return highlights.slice(0, 3);
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const TIER_SCORE = { entry: 42, balanced: 70, premium: 92 };
const SELECTION_ORDER = ['cpu', 'mainboard', 'ram', 'gpu', 'case', 'cooler', 'psu', 'storage'];

export const normalizeBuildProfile = (profile) => ({
  ...profile,
  name: profile?.name || profile?.label || 'Cấu hình gợi ý',
  budget_min: Number(profile?.budget_min || 0),
  budget_max: Number(profile?.budget_max || 0),
  default_budget: Number(profile?.default_budget || profile?.budget_max || 0),
  component_budget_weights: profile?.component_budget_weights || {},
  score_weights: profile?.score_weights || {},
  requirements: profile?.requirements || {},
  sort_order: Number(profile?.sort_order || 0),
});

export const isBuilderProductAvailable = (product) => {
  const stock = product?.stock_quantity;
  return Boolean(
    product?.id
    && product?.specifications?.component_type
    && product?.specifications?.builder_enabled !== false
    && product?.status !== 'inactive'
    && Number(product?.price) > 0
    && (stock === null || stock === undefined || Number(stock) > 0),
  );
};

const componentQuality = (product) => {
  const specs = product?.specifications ?? {};
  const tierScore = TIER_SCORE[specs.builder_tier] || 50;
  const explicit = Number(specs.performance_score || 0);
  if (explicit) return clamp(explicit);

  switch (specs.component_type) {
    case 'ram':
      return clamp((Number(specs.capacity_gb || 8) / 64) * 68 + (Number(specs.speed_mhz || 2666) / 6400) * 32);
    case 'storage': {
      const capacityScore = (Number(specs.capacity_gb || 256) / 2048) * 72;
      const typeScore = String(specs.storage_type || '').toLowerCase().includes('nvme') ? 28 : 14;
      return clamp(capacityScore + typeScore);
    }
    case 'psu': {
      const efficiency = String(specs.efficiency || '').toLowerCase();
      const efficiencyScore = efficiency.includes('platinum') ? 25 : efficiency.includes('gold') ? 20 : efficiency.includes('bronze') ? 12 : 8;
      return clamp((Number(specs.wattage || 450) / 1000) * 70 + efficiencyScore + (specs.modular ? 5 : 0));
    }
    case 'case':
      return clamp((Number(specs.max_gpu_length_mm || 300) / 455) * 70 + (Array.isArray(specs.supported_form_factors) ? specs.supported_form_factors.length * 7 : 0));
    case 'cooler':
      return clamp((Number(specs.cooling_capacity_w || 120) / 300) * 90 + (String(specs.cooler_type || '').toLowerCase().includes('aio') ? 10 : 0));
    case 'mainboard':
      return clamp(tierScore + Math.max(0, Number(specs.memory_slots || 2) - 2) * 4);
    default:
      return tierScore;
  }
};

const requirementScore = (slotId, product, requirements) => {
  const specs = product?.specifications ?? {};
  if (slotId === 'cpu' && requirements.min_cpu_score) return clamp((Number(specs.performance_score || 0) / Number(requirements.min_cpu_score)) * 100);
  if (slotId === 'gpu' && requirements.min_gpu_score) return clamp((Number(specs.performance_score || 0) / Number(requirements.min_gpu_score)) * 100);
  if (slotId === 'ram' && requirements.min_ram_gb) return clamp((Number(specs.capacity_gb || 0) / Number(requirements.min_ram_gb)) * 100);
  if (slotId === 'storage' && requirements.min_storage_gb) return clamp((Number(specs.capacity_gb || 0) / Number(requirements.min_storage_gb)) * 100);
  return 100;
};

const stockScore = (product) => {
  if (product.stock_quantity === null || product.stock_quantity === undefined) return 70;
  return clamp(45 + Number(product.stock_quantity) * 5);
};

const rankCandidates = (slotId, candidates, selections, profile, targetBudget) => {
  const compatible = candidates.filter((candidate) => !getCandidateConflict(slotId, candidate, selections));
  if (compatible.length === 0) return [];

  const targetSpend = Math.max(1, targetBudget * Number(profile.component_budget_weights?.[slotId] || (1 / PC_BUILD_SLOTS.length)));
  const valueRatios = compatible.map((product) => componentQuality(product) / Number(product.price));
  const maxValue = Math.max(...valueRatios, 0.000001);
  const weights = {
    performance: Number(profile.score_weights?.performance ?? 0.38),
    value: Number(profile.score_weights?.value ?? 0.2),
    budget_fit: Number(profile.score_weights?.budget_fit ?? 0.27),
    stock: Number(profile.score_weights?.stock ?? 0.07),
    tier: Number(profile.score_weights?.tier ?? 0.08),
  };

  return compatible
    .map((product) => {
      const price = Number(product.price);
      const quality = componentQuality(product);
      const value = clamp(((quality / price) / maxValue) * 100);
      const budgetFit = clamp(100 - (Math.abs(price - targetSpend) / targetSpend) * 100);
      const tier = product.specifications?.builder_tier === profile.requirements?.legacy_tier ? 100 : 35;
      const requirements = requirementScore(slotId, product, profile.requirements || {});
      const weighted = (
        quality * weights.performance
        + value * weights.value
        + budgetFit * weights.budget_fit
        + stockScore(product) * weights.stock
        + tier * weights.tier
      );
      const overAllocationPenalty = price > targetSpend * 1.45 ? Math.min(30, ((price / targetSpend) - 1.45) * 28) : 0;
      return { product, quality, score: weighted + requirements * 0.08 - overAllocationPenalty };
    })
    .sort((a, b) => b.score - a.score || Number(a.product.price) - Number(b.product.price));
};

const totalOfSelections = (selections) => Object.values(selections).reduce((sum, product) => sum + Number(product?.price || 0), 0);

const trimBuildToBudget = (selections, catalogBySlot, profile, targetBudget) => {
  const next = { ...selections };
  let guard = 0;

  while (totalOfSelections(next) > targetBudget && guard < 24) {
    guard += 1;
    const excess = totalOfSelections(next) - targetBudget;
    const downgradeOptions = [];

    for (const slot of PC_BUILD_SLOTS) {
      const current = next[slot.id];
      if (!current) continue;
      const currentPrice = Number(current.price);
      for (const candidate of catalogBySlot[slot.id] || []) {
        const candidatePrice = Number(candidate.price);
        if (candidatePrice >= currentPrice || getCandidateConflict(slot.id, candidate, next)) continue;
        const proposed = { ...next, [slot.id]: candidate };
        const hasError = getCompatibilityIssues(proposed).some((issue) => issue.tone === 'error');
        if (hasError) continue;
        const saving = currentPrice - candidatePrice;
        const qualityLoss = Math.max(1, componentQuality(current) - componentQuality(candidate));
        const budgetBenefit = Math.min(saving, excess) / Math.max(excess, 1);
        const utility = (saving / qualityLoss) * (1 + budgetBenefit);
        downgradeOptions.push({ slotId: slot.id, candidate, utility });
      }
    }

    if (downgradeOptions.length === 0) break;
    downgradeOptions.sort((a, b) => b.utility - a.utility);
    next[downgradeOptions[0].slotId] = downgradeOptions[0].candidate;
  }

  return next;
};

export const createRecommendedBuild = (catalog, rawProfile, requestedBudget) => {
  const profile = normalizeBuildProfile(rawProfile);
  const targetBudget = Math.max(1, Number(requestedBudget || profile.default_budget || profile.budget_max));
  const eligible = (catalog || []).filter(isBuilderProductAvailable);
  const catalogBySlot = Object.fromEntries(PC_BUILD_SLOTS.map((slot) => [
    slot.id,
    eligible.filter((product) => product.specifications?.component_type === slot.id),
  ]));
  let selections = {};

  for (const slotId of SELECTION_ORDER) {
    const ranked = rankCandidates(slotId, catalogBySlot[slotId] || [], selections, profile, targetBudget);
    if (ranked[0]) selections[slotId] = ranked[0].product;
  }

  selections = trimBuildToBudget(selections, catalogBySlot, profile, targetBudget);
  const missingSlots = PC_BUILD_SLOTS.filter((slot) => slot.required && !selections[slot.id]);
  const total = totalOfSelections(selections);
  const issues = getCompatibilityIssues(selections);

  return {
    profile,
    targetBudget,
    selections,
    selectedIds: Object.fromEntries(Object.entries(selections).map(([slotId, product]) => [slotId, product.id])),
    total,
    missingSlots,
    issues,
    withinBudget: total <= targetBudget,
    ready: missingSlots.length === 0 && !issues.some((issue) => issue.tone === 'error'),
  };
};
