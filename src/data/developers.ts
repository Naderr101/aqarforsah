// Demo developer/project catalogue. Shape is ready to be replaced by server data.
export interface DeveloperOption { id: string; name: string; projects: { id: string; name: string; location: string }[] }

export const developers: DeveloperOption[] = [
  { id: "palm-hills", name: "بالم هيلز", projects: [
    { id: "ph-october", name: "بالم هيلز أكتوبر", location: "٦ أكتوبر" },
    { id: "hacienda-west", name: "هاسيندا ويست", location: "الساحل الشمالي" },
    { id: "badya", name: "باديا", location: "٦ أكتوبر" },
  ] },
  { id: "sodic", name: "سوديك", projects: [
    { id: "sodic-east", name: "سوديك إيست", location: "الشروق" },
    { id: "villette", name: "فيليت", location: "القاهرة الجديدة" },
  ] },
  { id: "emaar", name: "إعمار مصر", projects: [
    { id: "mivida", name: "ميفيدا", location: "القاهرة الجديدة" },
    { id: "marassi", name: "مراسي", location: "الساحل الشمالي" },
  ] },
  { id: "ora", name: "أورا للتطوير", projects: [
    { id: "zed-east", name: "زِد إيست", location: "القاهرة الجديدة" },
    { id: "zed-west", name: "زِد ويست", location: "الشيخ زايد" },
  ] },
  { id: "mountain-view", name: "ماونتن فيو", projects: [
    { id: "mv-icity", name: "ماونتن فيو آي سيتي", location: "القاهرة الجديدة" },
    { id: "mv-sokhna", name: "ماونتن فيو السخنة", location: "العين السخنة" },
  ] },
];

export const findDeveloper = (id: string) => developers.find((d) => d.id === id);
export const findProject = (devId: string, projectId: string) => findDeveloper(devId)?.projects.find((p) => p.id === projectId);
