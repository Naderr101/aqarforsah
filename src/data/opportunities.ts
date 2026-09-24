// DEMO DATA ONLY — sample listings until real submissions come from the platform workflow.
import type { ExitOpportunity, NewUnitOpportunity, ProjectOpportunity } from "@/types/opportunity";

export const exitOpportunities: ExitOpportunity[] = [
  {
    id: "EX-1001", slug: "palm-hills-october-apartment", section: "exit", isDemo: true,
    title: "شقة في بالم هيلز أكتوبر", project: "بالم هيلز أكتوبر", developer: "بالم هيلز",
    location: "٦ أكتوبر، الجيزة", city: "٦ أكتوبر", unitType: "شقة", area: 165, bedrooms: 3, bathrooms: 2,
    floor: "الثالث", delivery: "استلام ٢٠٢٧", imagePosition: "0% center",
    description: "صاحب الوحدة عايز يخرج من عقده بعد سداد جزء من الأقساط. الوحدة داخل كمباوند متكامل الخدمات.",
    exitAmount: 1500000, verifiedPaidAmount: undefined, remainingDeveloperBalance: 3500000, marketValue: 6500000,
    monthlyInstallment: 48600,
    contract: { originalContractValue: 5000000, installmentPlan: "١٠٪ مقدم + أقساط ربع سنوية على ٦ سنوات", nextInstallment: { amount: 145800, dueDate: "يناير ٢٠٢٧" }, contractStatus: "العقد ساري والأقساط منتظمة حسب بيانات البائع" },
    verification: { paidAmount: "under_review", contract: "under_review", unitData: "reviewed", transfer: "needs_documents" },
  },
  {
    id: "EX-1002", slug: "hacienda-west-villa", section: "exit", isDemo: true,
    title: "فيلا في هاسيندا ويست", project: "هاسيندا ويست", developer: "بالم هيلز",
    location: "الساحل الشمالي", city: "الساحل الشمالي", unitType: "فيلا", area: 360, bedrooms: 5, bathrooms: 4,
    floor: "أرضي + أول", delivery: "استلام ٢٠٢٨", imagePosition: "0% center",
    description: "فيلا على اللاجون، صاحبها سدد جزء كبير من قيمة العقد وعايز يخرج من التزامه.",
    exitAmount: 6200000, verifiedPaidAmount: 6200000, remainingDeveloperBalance: 18800000, marketValue: 29000000,
    contract: { originalContractValue: 25000000, installmentPlan: "أقساط سنوية على ٧ سنوات", nextInstallment: { amount: 2685000, dueDate: "مارس ٢٠٢٧" }, contractStatus: "العقد ساري" },
    verification: { paidAmount: "reviewed", contract: "reviewed", unitData: "reviewed", transfer: "under_review" },
  },
  {
    id: "EX-1003", slug: "zed-east-new-cairo-apartment", section: "exit", isDemo: true,
    title: "شقة في زِد إيست", project: "زِد إيست", developer: "أورا للتطوير",
    location: "القاهرة الجديدة", city: "القاهرة الجديدة", unitType: "شقة", area: 190, bedrooms: 3, bathrooms: 3,
    delivery: "استلام ٢٠٢٩", imagePosition: "33% center",
    description: "وحدة بخطة سداد طويلة، البائع قدم بيانات الدفعات وجاري مراجعتها.",
    exitAmount: 950000, remainingDeveloperBalance: 7050000, marketValue: undefined,
    monthlyInstallment: 73400,
    contract: { originalContractValue: 8000000, installmentPlan: "٥٪ مقدم + أقساط شهرية على ٨ سنوات", contractStatus: "قيد المراجعة" },
    verification: { paidAmount: "under_review", contract: "not_submitted", unitData: "under_review", transfer: "not_submitted" },
  },
];

export const newUnits: NewUnitOpportunity[] = [
  {
    id: "NU-2001", slug: "example-residence-apartment", section: "new-unit", isDemo: true,
    title: "شقة في إجزامبل ريزيدنس", project: "إجزامبل ريزيدنس", developer: "مطور تجريبي",
    location: "القاهرة الجديدة", city: "القاهرة الجديدة", unitType: "شقة", area: 150, bedrooms: 3, bathrooms: 2,
    delivery: "٢٠٢٩", imagePosition: "33% center",
    description: "وحدة مباشرة من المطور بخطة سداد مرنة.",
    unitPrice: 7000000, downPayment: 700000, installmentYears: 8, availability: "متاح",
  },
  {
    id: "NU-2002", slug: "mountain-view-sokhna-chalet", section: "new-unit", isDemo: true,
    title: "شاليه في ماونتن فيو السخنة", project: "ماونتن فيو السخنة", developer: "ماونتن فيو",
    location: "العين السخنة", city: "العين السخنة", unitType: "شاليه", area: 120, bedrooms: 2, bathrooms: 2,
    delivery: "٢٠٢٨", imagePosition: "66% center",
    description: "شاليه في منتجع على البحر، مباشرة من المطور.",
    unitPrice: 3650000, downPayment: 182500, installmentYears: 7, availability: "وحدات محدودة",
  },
  {
    id: "NU-2003", slug: "capital-towers-office", section: "new-unit", isDemo: true,
    title: "مكتب إداري بالعاصمة", project: "كابيتال تاورز", developer: "مطور تجريبي",
    location: "العاصمة الإدارية", city: "العاصمة الإدارية", unitType: "مكتب إداري", area: 85,
    delivery: "٢٠٢٧", imagePosition: "100% center",
    description: "وحدة إدارية في برج بالحي المالي.",
    unitPrice: 5400000, downPayment: 540000, installmentYears: 6, availability: "متاح",
  },
];

export const projectOpportunities: ProjectOpportunity[] = [
  {
    id: "PR-3001", slug: "new-cairo-development-partnership", section: "project", isDemo: true,
    title: "شراكة تطوير سكني في القاهرة الجديدة", opportunityType: "شراكة تطوير",
    location: "القاهرة الجديدة", city: "القاهرة الجديدة", projectSize: 12000, developmentStatus: "مرحلة التخطيط",
    owner: "مالك أرض (بيانات تجريبية)", investmentValue: 120000000, imagePosition: "33% center",
    description: "أرض مرخصة لمشروع سكني متوسط الكثافة، المالك يبحث عن شريك تطوير.",
    highlights: ["رخصة بناء قيد الاستخراج", "قريبة من محور رئيسي", "نموذج شراكة بالنسبة"],
  },
  {
    id: "PR-3002", slug: "north-coast-land", section: "project", isDemo: true,
    title: "أرض ساحلية للتطوير السياحي", opportunityType: "أرض + تطوير",
    location: "الساحل الشمالي", city: "الساحل الشمالي", projectSize: 45000, developmentStatus: "أرض خام",
    owner: "شركة استثمار عقاري (بيانات تجريبية)", investmentValue: 310000000, imagePosition: "0% center",
    description: "قطعة أرض بواجهة على الطريق الساحلي مناسبة لمشروع سياحي.",
    highlights: ["واجهة ٢٠٠ متر", "مناسبة لقرية سياحية", "قابلة للتقسيم"],
  },
  {
    id: "PR-3003", slug: "sheikh-zayed-building-portfolio", section: "project", isDemo: true,
    title: "محفظة مباني سكنية في الشيخ زايد", opportunityType: "محفظة مباني",
    location: "الشيخ زايد", city: "الشيخ زايد", projectSize: 6400, developmentStatus: "مباني قائمة",
    owner: "مالك فرد (بيانات تجريبية)", investmentValue: 85000000, imagePosition: "100% center",
    description: "٣ مباني سكنية قائمة ومؤجرة جزئياً.",
    highlights: ["٣ مباني", "٣٦ وحدة", "دخل إيجاري قائم"],
  },
];

export const cities = ["القاهرة الجديدة", "العاصمة الإدارية", "الساحل الشمالي", "العين السخنة", "الشيخ زايد", "٦ أكتوبر"];
