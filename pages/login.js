// app/api/setCookie/route.js
import { auth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { idToken } = await req.json();
    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();

    let role = "user";
    const adminEmails = ["totalfruit.id@gmail.com"]; // GANTI EMAIL ADMIN ASLI
    const kasirEmails = ["khasbullah22@gmail.com"];

    if (adminEmails.includes(email)) role = "admin";
    else if (kasirEmails.includes(email)) role = "kasir";

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set("session", sessionCookie, {
      httpOnly: true, secure: true, path: "/", maxAge: expiresIn / 1000,
    });

    return Response.json({ role, email });
  } catch (err) {
    console.log("setCookie error:", err);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}