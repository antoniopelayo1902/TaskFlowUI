// app/api/auth/google/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User";
import { setAuthCookies, signAccessToken, signRefreshToken } from "@/lib/jwt";

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

    // 1) Intercambio de authorization code por tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Error al obtener tokens de Google:", errorText);
      return NextResponse.json(
        { message: "No se pudieron obtener los tokens de Google" },
        { status: 500 }
      );
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    const accessTokenGoogle = tokenData.access_token;

    // 2) Obtener info del usuario con el access_token
    const userRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessTokenGoogle}`,
        },
      }
    );

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error("Error al obtener perfil de Google:", errorText);
      return NextResponse.json(
        { message: "No se pudo obtener el perfil de Google" },
        { status: 500 }
      );
    }

    const profile = (await userRes.json()) as GoogleUserInfo;

    // 3) Vincular/crear usuario en DB
    await dbConnect();

    // Intentar vincular por sub (providerIds.google) o por email (si ya existe)
    let userDoc =
      (await UserModel.findOne({ "providerIds.google": profile.sub })) ||
      (await UserModel.findOne({ email: profile.email.toLowerCase() }));

    if (!userDoc) {
      userDoc = await UserModel.create({
        name: profile.name ?? profile.email.split("@")[0],
        email: profile.email.toLowerCase(),
        role: "developer",
        providerIds: { google: profile.sub },
      });
    } else if (!userDoc.providerIds?.google) {
      // Actualizar vínculo si existía cuenta por correo, pero sin google sub
      userDoc.providerIds = { ...(userDoc.providerIds || {}), google: profile.sub };
      await userDoc.save();
    }

    const json = userDoc.toJSON() as any;
    const user = {
      id: json.id ?? userDoc._id.toString(),
      name: json.name,
      email: json.email,
      role: json.role,
    };

    // 4) Emitir nuestros propios tokens (no usamos id_token de Google como sesión)
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    let refreshToken: string | undefined;
    try {
      refreshToken = signRefreshToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      // Si no está configurado REFRESH_TOKEN_SECRET, seguimos sin refresh
    }

    const res = NextResponse.json({ user });
    setAuthCookies(res, { accessToken, refreshToken });
    return res;
  } catch (error) {
    console.error("Error en /api/auth/google:", error);
    return NextResponse.json(
      { message: "Error interno al procesar el login con Google" },
      { status: 500 }
    );
  }
}
