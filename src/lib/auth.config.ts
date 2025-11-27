import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Import here to avoid edge runtime issues
          const { prisma } = await import('./prisma');
          const bcrypt = await import('bcryptjs');
          
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username as string },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.default.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            // Log failed login attempt (non-blocking)
            try {
              await prisma.loginLog.create({
                data: {
                  userId: user.id,
                  success: false,
                },
              });
            } catch (logError) {
              console.error('Failed to log login attempt:', logError);
            }
            return null;
          }

          // Log successful login (non-blocking)
          try {
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                success: true,
              },
            });
          } catch (logError) {
            console.error('Failed to log successful login:', logError);
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            name: user.name,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

