import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { levelFromXp, XP_REWARDS } from "@/lib/xp";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return new NextResponse(JSON.stringify({ message: "Não autorizado" }), { status: 401 }); }
  try {
    const { trailId, sectionId } = await req.json();
    const uid = verifiedUid;

    if (!trailId || !sectionId || !uid) {
      return new NextResponse(
        "Parâmetros trailId, sectionId e uid são obrigatórios",
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(uid);

    const [userDocSnap, contentsSnap] = await Promise.all([
      userDocRef.get(),
      adminDb.collection(`trails/${trailId}/contents`).get(),
    ]);

    if (userDocSnap.exists && contentsSnap.size > 0) {
      const trailSections = contentsSnap.docs.map((doc) => doc.id);

      const userTrails = userDocSnap.data()?.trails || [];
      const existingTrailIndex = userTrails.findIndex(
        (trail: any) => trail.trailId === trailId
      );

      const isNewSection =
        existingTrailIndex === -1 ||
        !userTrails[existingTrailIndex].doneSections.includes(sectionId);
      const previousPercentage =
        existingTrailIndex !== -1
          ? userTrails[existingTrailIndex].percentage
          : 0;

      let doneSections = [];
      if (existingTrailIndex !== -1) {
        // Verifica se a seção já existe em doneSections
        if (!userTrails[existingTrailIndex].doneSections.includes(sectionId)) {
          doneSections = [
            ...userTrails[existingTrailIndex].doneSections,
            sectionId,
          ];
        } else {
          // Se a seção já existe, mantém o doneSections original
          doneSections = userTrails[existingTrailIndex].doneSections;
        }
      } else {
        doneSections = [sectionId];
      }

      const completedSectionsCount = doneSections.filter((section: string) =>
        trailSections.includes(section)
      ).length;

      const percentage =
        trailSections.length > 0
          ? Math.round((completedSectionsCount / trailSections.length) * 100)
          : 0;

      if (existingTrailIndex !== -1) {
        userTrails[existingTrailIndex] = {
          trailId: trailId,
          doneSections: doneSections,
          percentage: percentage,
        };
      } else {
        userTrails.push({
          trailId: trailId,
          doneSections: doneSections,
          percentage: percentage,
        });
      }

      // --- XP Gamificação ---
      let xpGained = 0;
      if (isNewSection) {
        xpGained += XP_REWARDS.SECTION_COMPLETE;
        if (percentage === 100 && previousPercentage < 100) {
          xpGained += XP_REWARDS.TRAIL_COMPLETE;
        }
      }

      const currentXp: number = userDocSnap.data()?.xp || 0;
      const newXp = currentXp + xpGained;
      const newLevel = levelFromXp(newXp);

      await userDocRef.update({
        trails: userTrails,
        ...(xpGained > 0 ? { xp: newXp, level: newLevel } : {}),
      });

      return new NextResponse(
        JSON.stringify({ message: "Seção adicionada com sucesso" }),
        { status: 200 }
      );
    } else {
      return new NextResponse("Usuário ou trilha não encontrado", {
        status: 404,
      });
    }
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
