import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/services";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 10 * 24 * 60 * 60, // 10 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    const existingUser = await getUserByEmail(user.email as string);
                    if (!existingUser) {
                        await createUser({
                            name: user.name,
                            email: user.email,
                            avatar: user.image,
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error signing in with Google:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                const dbUser = await getUserByEmail(user.email as string);
                if (dbUser) {
                    token.sub = dbUser._id.toString();
                    token.avatar = dbUser.avatar;
                }
            }

            if (trigger === "update") {
                const { getUserById } = await import("@/lib/services");
                const freshUser = await getUserById(token.sub);

                if (freshUser) {
                    token.name = freshUser.name;
                    token.email = freshUser.email;
                    token.avatar = freshUser.avatar;
                }
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.avatar = token.avatar;
            }
            return session;
        },
    },
};
