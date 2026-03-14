import { drizzle } from "drizzle-orm/mysql2";
import { templates } from "../drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const templatesData = [
  {
    id: "black-white-simple",
    name: "Black and White Simple Infographic",
    description: "Template minimalista em preto e branco com secções destacadas e layout horizontal. Ideal para perfis profissionais clean e diretos.",
    category: "minimalist",
    thumbnailUrl: "/templates/thumbnails/black-white-simple.webp",
    isActive: 1,
    config: JSON.stringify({
      colors: {
        primary: "#000000",
        secondary: "#D3D3D3",
        text: "#000000",
        background: "#FFFFFF",
      },
      fonts: {
        heading: "Arial, sans-serif",
        body: "Arial, sans-serif",
      },
      layout: "horizontal-sections",
    }),
  },
  {
    id: "black-minimalist-engineer",
    name: "Black Minimalist Structural Engineer",
    description: "Template moderno com elementos gráficos amarelos, fotografia destacada e layout em duas colunas. Perfeito para engenheiros e profissionais técnicos.",
    category: "modern",
    thumbnailUrl: "/templates/thumbnails/black-minimalist-engineer.webp",
    isActive: 1,
    config: JSON.stringify({
      colors: {
        primary: "#000000",
        secondary: "#FFD700",
        text: "#000000",
        background: "#FFFFFF",
      },
      fonts: {
        heading: "Arial, sans-serif",
        body: "Arial, sans-serif",
      },
      layout: "two-column-photo",
      features: ["photo", "skill-bars", "geometric-shapes"],
    }),
  },
  {
    id: "bold-modern-marketing",
    name: "Black White Bold Modern Marketing",
    description: "Template com tipografia bold e layout simétrico em duas colunas. Ideal para profissionais de marketing, comunicação e áreas criativas.",
    category: "bold",
    thumbnailUrl: "/templates/thumbnails/bold-modern-marketing.webp",
    isActive: 1,
    config: JSON.stringify({
      colors: {
        primary: "#000000",
        secondary: "#FFFFFF",
        text: "#000000",
        background: "#FFFFFF",
      },
      fonts: {
        heading: "Arial Black, sans-serif",
        body: "Arial, sans-serif",
      },
      layout: "two-column-symmetric",
    }),
  },
  {
    id: "green-business",
    name: "Green and Black Minimalist Business",
    description: "Template com elementos gráficos verdes, fotografia circular e timeline visual. Perfeito para profissionais de negócios e gestão.",
    category: "business",
    thumbnailUrl: "/templates/thumbnails/green-business.webp",
    isActive: 1,
    config: JSON.stringify({
      colors: {
        primary: "#000000",
        secondary: "#00A651",
        text: "#000000",
        background: "#FFFFFF",
      },
      fonts: {
        heading: "Arial, sans-serif",
        body: "Arial, sans-serif",
      },
      layout: "two-column-timeline",
      features: ["photo-circular", "timeline", "geometric-shapes"],
    }),
  },
];

async function seedTemplates() {
  console.log("🌱 A popular templates na base de dados...");

  try {
    for (const template of templatesData) {
      await db.insert(templates).values(template).onDuplicateKeyUpdate({
        set: {
          name: template.name,
          description: template.description,
          category: template.category,
          thumbnailUrl: template.thumbnailUrl,
          isActive: template.isActive,
          config: template.config,
        },
      });
      console.log(`✅ Template "${template.name}" inserido/atualizado`);
    }

    console.log("✨ Seed de templates concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular templates:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedTemplates();
