export const prescriptionRiskCategories = [
  "患者条件",
  "重复用药",
  "用法用量",
  "给药途径",
  "相互作用",
  "生化指标",
  "配伍",
  "过敏",
  "孕产",
  "其他"
];

export const prescriptionRiskLevels = {
  must: "必须处理",
  severe: "严重警告",
  general: "一般警告"
};

export const prescriptionRiskCategoryLevels = {
  重复用药: "must",
  患者条件: "general",
  生化指标: "severe",
  用法用量: "severe",
  给药途径: "severe",
  相互作用: "severe",
  配伍: "severe",
  过敏: "must",
  孕产: "general",
  其他: "general"
};

export const prescriptionRiskLegendItems = [
  { level: "must", text: "必须处理" },
  { level: "severe", text: "严重警告" },
  { level: "general", text: "一般警告" }
];

const warningFieldCategories = {
  name: "重复用药",
  frequency: "用法用量",
  dose: "用法用量",
  quantity: "用法用量",
  unit: "用法用量",
  usage: "给药途径"
};

export function getPrescriptionRiskCategoryLevel(category = "") {
  return prescriptionRiskCategoryLevels[category] || "general";
}

export function normalizeMedicineRiskWarning(warning = {}) {
  if (!warning?.category || !prescriptionRiskCategories.includes(warning.category)) return null;
  return {
    category: warning.category,
    level: getPrescriptionRiskCategoryLevel(warning.category)
  };
}

export function getMedicineRiskWarnings(medicine = {}) {
  const explicitWarnings = Array.isArray(medicine.riskWarnings)
    ? medicine.riskWarnings.map(normalizeMedicineRiskWarning).filter(Boolean)
    : [];
  if (explicitWarnings.length) return explicitWarnings;

  const columnWarnings = Object.entries(medicine.warningColumns || {})
    .map(([column, level]) =>
      normalizeMedicineRiskWarning({
        category: prescriptionRiskCategories[Number(column) - 1],
        level
      })
    )
    .filter(Boolean);
  if (columnWarnings.length) return columnWarnings;

  return Array.from(
    new Set(
      (Array.isArray(medicine.warningFields) ? medicine.warningFields : [])
        .map((field) => warningFieldCategories[field])
        .filter(Boolean)
    )
  ).map((category) => normalizeMedicineRiskWarning({ category }));
}

export function getHighestMedicineRiskLevel(medicine = {}) {
  const priority = { general: 1, severe: 2, must: 3 };
  return getMedicineRiskWarnings(medicine).reduce(
    (current, warning) => (!current || priority[warning.level] > priority[current] ? warning.level : current),
    ""
  );
}
