import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
  providers: [
    // Email/Password Authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mode: { label: "Mode", type: "text" } // 'signin' or 'signup'
      },
      async authorize(credentials) {
        try {
          await dbConnect();

          const { email, password, name, mode } = credentials;

          // Validate inputs
          if (!email || !password) {
            throw new Error('Email and password are required');
          }

          const normalizedEmail = email.toLowerCase().trim();

          if (mode === 'signup') {
            // Sign Up Flow
            if (!name || name.trim().length < 2) {
              throw new Error('Please provide your full name');
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
              throw new Error('An account with this email already exists');
            }

            // Validate password strength (additional server-side check)
            if (password.length < 8) {
              throw new Error('Password must be at least 8 characters');
            }

            // Create new user
            const newUser = await User.create({
              email: normalizedEmail,
              password,
              name: name.trim(),
              authProvider: 'credentials',
              hasCompletedKYC: true
            });

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              hasCompletedKYC: newUser.hasCompletedKYC
            };
          } else {
            // Sign In Flow
            const user = await User.findOne({ email: normalizedEmail });

            if (!user) {
              throw new Error('Invalid email or password');
            }

            // Check if user signed up with different provider
            if (user.authProvider !== 'credentials') {
              throw new Error(`This account uses ${user.authProvider} sign-in. Please use the ${user.authProvider} button to continue.`);
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
              throw new Error('Invalid email or password');
            }

            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              hasCompletedKYC: user.hasCompletedKYC,
              image: user.image
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account.provider === 'google') {
          await dbConnect();

          const normalizedEmail = user.email.toLowerCase().trim();

          // Check if user exists
          let existingUser = await User.findOne({ email: normalizedEmail });

          if (!existingUser) {
            // Create new user for Google OAuth
            existingUser = await User.create({
              email: normalizedEmail,
              name: user.name,
              image: user.image,
              googleId: profile.sub,
              authProvider: 'google',
              hasCompletedKYC: true
            });
          } else {
            // Check if user signed up with credentials
            if (existingUser.authProvider === 'credentials' && !existingUser.googleId) {
              // Link Google account to existing credentials account
              existingUser.googleId = profile.sub;
              existingUser.authProvider = 'google';
              existingUser.image = user.image;
              await existingUser.save();
            } else if (existingUser.authProvider !== 'google') {
              throw new Error(`This account uses ${existingUser.authProvider} sign-in`);
            }
          }

          user.id = existingUser._id.toString();
          user.hasCompletedKYC = existingUser.hasCompletedKYC;
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.hasCompletedKYC = user.hasCompletedKYC;
      }

      // Update token when KYC is completed
      if (trigger === 'update' && session?.hasCompletedKYC !== undefined) {
        token.hasCompletedKYC = session.hasCompletedKYC;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.hasCompletedKYC = token.hasCompletedKYC;
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
    error: '/login'
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
