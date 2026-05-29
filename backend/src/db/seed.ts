import { createSchema } from "../services/schema.service.js";
import { prisma } from "./prisma.js";

async function main() {
  await createSchema({
    name: "invoice_extraction",
    description: "Extract invoice details from invoice text",
    schema: {
      vendorName: { type: "string", required: true },
      invoiceNumber: { type: "string", required: true },
      amount: { type: "number", required: true, min: 0 },
      currency: { type: "enum", values: ["INR", "USD", "EUR"], required: true },
      dueDate: { type: "string", required: false }
    }
  });

  await createSchema({
    name: "resume_extraction",
    description: "Extract candidate profile from resume text",
    schema: {
      candidateName: { type: "string", required: true },
      email: { type: "string", required: false },
      skills: { type: "array", items: "string", required: true },
      education: { type: "string", required: true },
      experienceYears: { type: "number", required: false, min: 0 }
    }
  });

  await createSchema({
    name: "product_review",
    description: "Extract sentiment, rating and issues from product review",
    schema: {
      sentiment: { type: "enum", values: ["positive", "neutral", "negative"], required: true },
      rating: { type: "number", required: true, min: 1, max: 5 },
      keyIssues: { type: "array", items: "string", required: false }
    }
  });

  console.log("✅ Seeded example schemas");
}

main().finally(async () => prisma.$disconnect());
