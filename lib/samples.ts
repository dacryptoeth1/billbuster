import type { Bill } from "@/lib/schema";

/**
 * Three FAKE bills used for the demo. Names, providers, and account numbers are invented.
 * The PNGs in /public/samples are rendered from this data (see scripts/render-samples.ts),
 * so this also serves as the known-good extraction if Gemini is unavailable.
 */
export type SampleBill = {
  id: string;
  title: string;
  blurb: string;
  image: string;
  bill: Bill;
};

export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: "er-visit",
    title: "ER visit",
    blurb: "Chest pain workup with a charge billed twice",
    image: "/samples/er-visit.png",
    bill: {
      provider: "Riverbend General Hospital",
      patientRef: "RB-40418",
      dateOfService: "2026-08-14",
      lineItems: [
        {
          code: "99284",
          description: "Emergency dept visit, high complexity",
          quantity: 1,
          charge: 1450,
          dateOfService: "2026-08-14",
        },
        {
          code: "71046",
          description: "X-ray chest, 2 views",
          quantity: 1,
          charge: 310,
          dateOfService: "2026-08-14",
        },
        {
          code: "93000",
          description: "Electrocardiogram, complete",
          quantity: 1,
          charge: 165,
          dateOfService: "2026-08-14",
        },
        {
          code: "85025",
          description: "Complete blood count w/ diff",
          quantity: 1,
          charge: 62,
          dateOfService: "2026-08-14",
        },
        {
          code: "36415",
          description: "Venipuncture, routine",
          quantity: 1,
          charge: 28,
          dateOfService: "2026-08-14",
        },
        {
          code: "96374",
          description: "IV push, single drug",
          quantity: 1,
          charge: 295,
          dateOfService: "2026-08-14",
        },
        {
          code: "96374",
          description: "IV push, single drug",
          quantity: 1,
          charge: 295,
          dateOfService: "2026-08-14",
        },
        {
          code: "J2405",
          description: "Ondansetron inj, per 1 mg",
          quantity: 4,
          charge: 96,
          dateOfService: "2026-08-14",
        },
      ],
      totalBilled: 2701,
      insurancePaid: 1620,
      patientOwes: 1081,
    },
  },
  {
    id: "lab-work",
    title: "Lab work",
    blurb: "Routine bloodwork with an inflated test price",
    image: "/samples/lab-work.png",
    bill: {
      provider: "Clearview Diagnostics Lab",
      patientRef: "CVD-88213",
      dateOfService: "2026-07-02",
      lineItems: [
        {
          code: "36415",
          description: "Venipuncture, routine",
          quantity: 1,
          charge: 25,
          dateOfService: "2026-07-02",
        },
        {
          code: "80053",
          description: "Comprehensive metabolic panel",
          quantity: 1,
          charge: 98,
          dateOfService: "2026-07-02",
        },
        { code: "80061", description: "Lipid panel", quantity: 1, charge: 385, dateOfService: "2026-07-02" },
        {
          code: "83036",
          description: "Hemoglobin A1c",
          quantity: 1,
          charge: 72,
          dateOfService: "2026-07-02",
        },
        {
          code: "84443",
          description: "Thyroid stimulating hormone",
          quantity: 1,
          charge: 110,
          dateOfService: "2026-07-02",
        },
      ],
      totalBilled: 690,
      insurancePaid: 210,
      patientOwes: 480,
    },
  },
  {
    id: "imaging",
    title: "Imaging",
    blurb: "Back MRI where the total doesn't add up",
    image: "/samples/imaging.png",
    bill: {
      provider: "Summit Imaging Center",
      patientRef: "SIC-10527",
      dateOfService: "2026-09-03",
      lineItems: [
        {
          code: "72148",
          description: "MRI lumbar spine w/o contrast",
          quantity: 1,
          charge: 2150,
          dateOfService: "2026-09-03",
        },
        {
          code: "72110",
          description: "X-ray lumbar spine, 4+ views",
          quantity: 1,
          charge: 285,
          dateOfService: "2026-09-03",
        },
        {
          code: "76700",
          description: "Ultrasound abdomen, complete",
          quantity: 1,
          charge: 640,
          dateOfService: "2026-09-03",
        },
      ],
      totalBilled: 3375,
      insurancePaid: 2100,
      patientOwes: 1275,
    },
  },
];

export function getSample(id: string) {
  return SAMPLE_BILLS.find((s) => s.id === id);
}
