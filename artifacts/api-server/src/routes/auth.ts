import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable, questionsTable, answersTable, countriesTable } from "@workspace/db";
import { eq, inArray, desc, sql } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

router.get("/auth/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json(GetCurrentAuthUserResponse.parse({ user: null }));
    return;
  }
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  res.json(GetCurrentAuthUserResponse.parse({ user: dbUser ?? null }));
});

router.patch("/users/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  const { homeCountry, bio, profileImageUrl, isPrivate } = req.body;
  const patch: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if ("homeCountry" in req.body) patch.homeCountry = homeCountry ?? null;
  if ("bio" in req.body) patch.bio = bio ?? null;
  if ("profileImageUrl" in req.body) patch.profileImageUrl = profileImageUrl ?? null;
  if ("isPrivate" in req.body) patch.isPrivate = Boolean(isPrivate);
  const [updated] = await db
    .update(usersTable)
    .set(patch)
    .where(eq(usersTable.id, req.user.id))
    .returning();
  res.json(updated);
});

router.get("/users/me/activity", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  const userId = req.user.id;

  const [myQuestions, myAnswers] = await Promise.all([
    db.select({
      id: questionsTable.id,
      title: questionsTable.title,
      body: questionsTable.body,
      resolved: questionsTable.resolved,
      createdAt: questionsTable.createdAt,
      passportCode: questionsTable.passportCode,
      countryCode: questionsTable.countryCode,
      countryName: countriesTable.name,
      countryFlag: countriesTable.flagEmoji,
      answersCount: sql<number>`(SELECT COUNT(*) FROM answers WHERE question_id = ${questionsTable.id})`,
    })
      .from(questionsTable)
      .leftJoin(countriesTable, eq(questionsTable.countryCode, countriesTable.code))
      .where(eq(questionsTable.userId, userId))
      .orderBy(desc(questionsTable.createdAt)),

    db.select({
      questionId: answersTable.questionId,
      answerBody: answersTable.body,
      answeredAt: answersTable.createdAt,
    })
      .from(answersTable)
      .where(eq(answersTable.userId, userId))
      .orderBy(desc(answersTable.createdAt)),
  ]);

  let questionsAnswered: typeof myQuestions = [];
  if (myAnswers.length > 0) {
    const ids = [...new Set(myAnswers.map((a) => a.questionId))];
    questionsAnswered = await db.select({
      id: questionsTable.id,
      title: questionsTable.title,
      body: questionsTable.body,
      resolved: questionsTable.resolved,
      createdAt: questionsTable.createdAt,
      passportCode: questionsTable.passportCode,
      countryCode: questionsTable.countryCode,
      countryName: countriesTable.name,
      countryFlag: countriesTable.flagEmoji,
      answersCount: sql<number>`(SELECT COUNT(*) FROM answers WHERE question_id = ${questionsTable.id})`,
    })
      .from(questionsTable)
      .leftJoin(countriesTable, eq(questionsTable.countryCode, countriesTable.code))
      .where(inArray(questionsTable.id, ids))
      .orderBy(desc(questionsTable.createdAt));
  }

  const answerByQuestion = Object.fromEntries(myAnswers.map((a) => [a.questionId, a.answerBody]));

  res.json({
    questionsAsked: myQuestions.map((q) => ({ ...q, answersCount: Number(q.answersCount), myAnswer: null })),
    questionsAnswered: questionsAnswered.map((q) => ({
      ...q,
      answersCount: Number(q.answersCount),
      myAnswer: answerByQuestion[q.id] ?? null,
    })),
  });
});

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
});

export default router;
