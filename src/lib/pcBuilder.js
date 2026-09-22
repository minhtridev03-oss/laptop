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

export const BUILDER_PRESETS = [
  { id: 'entry', label: 'Phổ thông', description: 'Học tập, văn phòng và gaming Full HD' },
  { id: 'balanced', label: 'Cân bằng', description: 'Gaming 2K, đồ họa và làm việc đa nhiệm' },
  { id: 'premium', label: 'Cao cấp', description: 'Gaming 4K, render và workstation cá nhân' },
];

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
