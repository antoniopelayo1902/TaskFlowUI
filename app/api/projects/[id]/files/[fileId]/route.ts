// app/api/projects/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FileModel } from "@/models/File";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  await connectDB();

  const { fileId } = await params;

  try {
    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) {
      return NextResponse.json(
        { message: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // 1) borrar de S3
    try {
      await deleteFromS3(fileDoc.key);
    } catch (err) {
      console.error("Error borrando de S3:", err);
      // seguimos, pero lo registramos
    }

    // 2) borrar de Mongo
    await fileDoc.deleteOne();

    return NextResponse.json({ message: "Archivo eliminado" }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando archivo:", err);
    return NextResponse.json(
      { message: "Error eliminando archivo" },
      { status: 500 }
    );
  }
}
