import { adminDb } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";

export const getValidTrailSectionIds = async (trailId: string): Promise<string[]> => {
  const contentsSnap = await adminDb.collection(`trails/${trailId}/contents`).get();
  const allContents = contentsSnap.docs.map((doc) => ({
    id: doc.id,
    type: doc.data().type ?? "text",
  }));

  const trailMdxDir = path.join(process.cwd(), "src", "contents", "trails", trailId);
  const availableMdxIds = new Set<string>();
  if (fs.existsSync(trailMdxDir)) {
    fs.readdirSync(trailMdxDir)
      .filter((fileName) => fileName.endsWith(".mdx"))
      .forEach((fileName) => availableMdxIds.add(fileName.replace(".mdx", "")));
  }

  return allContents
    .filter((section) => section.type !== "text" || availableMdxIds.has(section.id))
    .map((section) => section.id);
};

export const computeTrailProgress = async (
  trailId: string,
  doneSections: string[] = []
): Promise<{
  percentage: number;
  completedSectionsCount: number;
  totalSections: number;
  validSectionIds: string[];
}> => {
  const validSectionIds = await getValidTrailSectionIds(trailId);
  const completedSectionsCount = doneSections.filter((sectionId) =>
    validSectionIds.includes(sectionId)
  ).length;

  const percentage =
    validSectionIds.length > 0
      ? Math.round((completedSectionsCount / validSectionIds.length) * 100)
      : 0;

  return {
    percentage,
    completedSectionsCount,
    totalSections: validSectionIds.length,
    validSectionIds,
  };
};
