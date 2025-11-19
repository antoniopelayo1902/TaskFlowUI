import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signUserToken } from "@/lib/jwt";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
};

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email: string;
  picture?: string;
};

export async function POST(req: Request) {
  await connectDB();

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: "Falta el código de Google" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Faltan variables de entorno de Google");
      return NextResponse.json(
        { message: "Configuración de Google incompleta" },
        { status: 500 }
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Error tokens Google:", text);
      return NextResponse.json(
        { message: "No se pudieron obtener los tokens de Google" },
        { status: 500 }
      );
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    const userRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userRes.ok) {
      const text = await userRes.text();
      console.error("Error perfil Google:", text);
      return NextResponse.json(
        { message: "No se pudo obtener el perfil de Google" },
        { status: 500 }
      );
    }

    const profile = (await userRes.json()) as GoogleUserInfo;

    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name ?? profile.email.split("@")[0],
        email: profile.email,
        provider: "google",
        role: "developer", 
      });
    }

    const token = signUserToken(user);

    const safeUser = {
      id: (user as any)._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json({ user: safeUser, token }, { status: 200 });
  } catch (error) {
    console.error("Error en /api/auth/google:", error);
    return NextResponse.json(
      { message: "Error interno al procesar login con Google" },
      { status: 500 }
    );
  }
}
