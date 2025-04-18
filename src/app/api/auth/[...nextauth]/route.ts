// import NextAuth from "next-auth";
// import type { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { prisma } from "../../../../../lib/prisma";
// import bcrypt from "bcryptjs";
// import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       role?: string;
//       organizationId?: string;
//       storeId?: string;
//       username?: string;
//     }
//   }
// }

// // دالة مساعدة لإنشاء اسم مستخدم فريد
// const generateUniqueUsername = async (base: string) => {
//   let username = base;
//   let counter = 1;
//   while (true) {
//     const existingUser = await prisma.user.findUnique({
//       where: { username }
//     });
//     if (!existingUser) return username;
//     username = `${base}${counter}`;
//     counter++;
//   }
// };

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         username: { label: "Username", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         if (!credentials?.username || !credentials?.password) {
//           throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور");
//         }

//         const user = await prisma.user.findUnique({
//           where: { username: credentials.username },
//           include: { 
//             organization: true,
//             store: true
//           }
//         });

//         if (!user || !user.password) {
//           throw new Error("خطأ في اسم المستخدم أو كلمة المرور");
//         }

//         const isValid = await bcrypt.compare(credentials.password, user.password);

//         if (!isValid) {
//           throw new Error("خطأ في اسم المستخدم أو كلمة المرور");
//         }

//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           image: user.image,
//           role: user.role,
//           organizationId: user.organizationId,
//           storeId: user.store?.id,
//           username: user.username,
//         };
//       }
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],
//   adapter: PrismaAdapter(prisma),
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//     maxAge: 30* 24 * 60 * 60, // 30 days
//   },
//   pages: {
//     signIn: '/auth/signin',
//     error: '/auth/error',
//   },
//   callbacks: {
//     async signIn({ user, account, profile }) {
//       try {
//         if (account?.provider === "credentials") return true;

//         if (!user?.email) {
//           throw new Error("لم يتم توفير البريد الإلكتروني من Google");
//         }

//         // التحقق الأولي من وجود الحساب المرتبط بجوجل
//         if (account) {
//           const existingAccount = await prisma.account.findFirst({
//             where: {
//               provider: account.provider,
//               providerAccountId: account.providerAccountId
//             },
//             include: {
//               user: true
//             }
//           });

//           if (existingAccount) return true;
//         }

//         // البحث عن المستخدم عن طريق البريد الإلكتروني
//         const existingUser = await prisma.user.findUnique({
//           where: { email: user.email },
//           include: { 
//             accounts: true,
//             store: true
//           }
//         });

//         if (existingUser) {
//           // تحديث البيانات الأساسية
//           await prisma.user.update({
//             where: { id: existingUser.id },
//             data: {
//               name: user.name || existingUser.name,
//               image: user.image || existingUser.image,
//               emailVerified: new Date(),
//             }
//           });

//           // إنشاء الحساب فقط إذا لم يكن موجودًا
//           if (account && !existingUser.accounts.some(a => a.provider === 'google')) {
//             await prisma.account.create({
//               data: {
//                 userId: existingUser.id,
//                 type: account.type,
//                 provider: account.provider,
//                 providerAccountId: account.providerAccountId,
//                 access_token: account.access_token,
//                 token_type: account.token_type,
//                 scope: account.scope,
//                 id_token: account.id_token,
//                 expires_at: account.expires_at,
//               }
//             });
//           }

//           // إنشاء متجر إذا لم يكن لديه متجر
//           if (!existingUser.store) {
//             await prisma.store.create({
//               data: {
//                 name: `${user.name}'s Store`,
//                 ownerId: existingUser.id,
//                 organizationId: existingUser.organizationId,
//                 description: 'My Store Description',
//               }
//             });
//           }

//           return true;
//         }

//         // إنشاء مستخدم جديد مع مؤسسة ومتجر
//         const baseUsername = user.email.split('@')[0];
//         const username = await generateUniqueUsername(baseUsername);

//         await prisma.$transaction(async (tx) => {
//           // 1. إنشاء المؤسسة
//           const newOrg = await tx.organization.create({
//             data: {
//               name: `${user.name}'s Organization`,
//             }
//           });

//           // 2. إنشاء المستخدم
//           const newUser = await tx.user.create({
//             data: {
//               name: user.name!,
//               email: user.email,
//               emailVerified: new Date(),
//               image: user.image,
//               role: "admin",
//               username,
//               password: await bcrypt.hash(Math.random().toString(36), 10),
//               organizationId: newOrg.id,
//               accounts: account ? {
//                 create: {
//                   type: account.type,
//                   provider: account.provider,
//                   providerAccountId: account.providerAccountId,
//                   access_token: account.access_token,
//                   token_type: account.token_type,
//                   scope: account.scope,
//                   id_token: account.id_token,
//                   expires_at: account.expires_at,
//                 }
//               } : undefined
//             }
//           });

//           // 3. إنشاء المتجر
//           await tx.store.create({
//             data: {
//               name: `${user.name}'s Store`,
//               ownerId: newUser.id,
//               organizationId: newOrg.id,
//               description: 'My Store Description',
//             }
//           });
//         });

//         return true;
//       } catch (error) {
//         console.error("Error in signIn callback:", error);
//         throw error;
//       }
//     },
//     async jwt({ token, user }) {
//       try {
//         if (user) {
//           const dbUser = await prisma.user.findUnique({
//             where: { email: user.email! },
//             include: { 
//               organization: true,
//               store: true
//             }
//           });

//           if (dbUser) {
//             token.id = dbUser.id;
//             token.email = dbUser.email;
//             token.name = dbUser.name;
//             token.role = dbUser.role;
//             token.organizationId = dbUser.organizationId;
//             token.storeId = dbUser.store?.id;
//             token.username = dbUser.username;
//           }
//         }
//         return token;
//       } catch (error) {
//         console.error("Error in jwt callback:", error);
//         return token;
//       }
//     },
//     async session({ session, token }) {
//       try {
//         if (session.user) {
//           session.user.id = token.id as string;
//           session.user.role = token.role as string;
//           session.user.organizationId = token.organizationId as string;
//           session.user.storeId = token.storeId as string;
//           session.user.email = token.email as string;
//           session.user.name = token.name as string;
//           session.user.username = token.username as string;
//         }
//         return session;
//       } catch (error) {
//         console.error("Error in session callback:", error);
//         return session;
//       }
//     },
//     async redirect({ url, baseUrl }) {
//       return `${baseUrl}/dashboard`;
//     },
//   },
//   events: {
//     async signIn({ user, account, profile, isNewUser }) {
//       console.log("Sign in event:", { user, account, isNewUser });
//     },
//     async error(error) {
//       console.error("Auth error event:", error);
//     },
//   },
//   debug: process.env.NODE_ENV === 'development',
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      organizationId?: string;
      storeId?: string | null;
      username?: string | null;
    }
}
}

// دالة مساعدة لإنشاء اسم مستخدم فريد مع حد أقصى للمحاولات
const generateUniqueUsername = async (base: string) => {
  let username = base;
  let counter = 1;
  const maxAttempts = 10;
  
  while (counter <= maxAttempts) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (!existingUser) return username;
    username = `${base}${counter}`;
    counter++;
  }
  throw new Error("فشل في إنشاء اسم مستخدم فريد بعد 10 محاولات");
};

// export const authOptions: NextAuthOptions = {
//   debug: true, // أضف هذا
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         username: { label: "Username", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         if (!credentials?.username || !credentials?.password) {
//           throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور");
//         }

//         const user = await prisma.user.findUnique({
//           where: { username: credentials.username },
//           include: { 
//             organization: true,
//             store: true
//           }
//         });

//         if (!user || !user.password) {
//           throw new Error("خطأ في اسم المستخدم أو كلمة المرور");
//         }

//         const isValid = await bcrypt.compare(credentials.password, user.password);

//         if (!isValid) {
//           throw new Error("خطأ في اسم المستخدم أو كلمة المرور");
//         }

//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           image: user.image,
//           role: user.role,
//           organizationId: user.organizationId,
//           storeId: user.store?.id,
//           username: user.username,
//         };
//       }
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       authorization: {
//         params: {
//           prompt: "consent",
//           access_type: "offline",
//           response_type: "code"
//         }
//       }
//     }),
//   ],
//   adapter: PrismaAdapter(prisma),
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//     maxAge: 5* 60, // 30 يوم
//   },
//   pages: {
//     signIn: '/auth/signin',
//     error: '/auth/error',
//   },
//   callbacks: {
//     async signIn({ user, account, profile }) {
//       try {
//         if (account?.provider === "credentials") return true;

//         if (!user?.email) {
//           throw new Error("لم يتم توفير البريد الإلكتروني من Google");
//         }

//         // التحقق من وجود الحساب المرتبط بجوجل
//         if (account) {
//           const existingAccount = await prisma.account.findFirst({
//             where: {
//               provider: account.provider,
//               providerAccountId: account.providerAccountId
//             },
//             include: { user: true }
//           });

//           if (existingAccount) return true;
//         }

//         // البحث عن المستخدم عن طريق البريد الإلكتروني
//         const existingUser = await prisma.user.findUnique({
//           where: { email: user.email },
//           include: { 
//             accounts: true,
//             store: true
//           }
//         });

//         if (existingUser) {
//           // تحديث البيانات الأساسية
//           await prisma.user.update({
//             where: { id: existingUser.id },
//             data: {
//               name: user.name || existingUser.name,
//               image: user.image || existingUser.image,
//               emailVerified: new Date(),
//             }
//           });

//           // إنشاء الحساب إذا لم يكن موجودًا
//           if (account && !existingUser.accounts.some(a => a.provider === 'google')) {
//             await prisma.account.create({
//               data: {
//                 userId: existingUser.id,
//                 type: account.type,
//                 provider: account.provider,
//                 providerAccountId: account.providerAccountId,
//                 access_token: account.access_token,
//                 token_type: account.token_type,
//                 scope: account.scope,
//                 id_token: account.id_token,
//                 expires_at: account.expires_at,
//               }
//             });
//           }

//           // إنشاء متجر إذا لم يكن موجودًا
//           if (!existingUser.store) {
//             await prisma.store.create({
//               data: {
//                 name: `${user.name}'s Store`,
//                 ownerId: existingUser.id,
//                 organizationId: existingUser.organizationId,
//                 description: 'المتجر الافتراضي',
//               }
//             });
//           }

//           return true;
//         }

//         // إنشاء مستخدم جديد مع مؤسسة ومتجر
//         const baseUsername = user.email.split('@')[0];
//         const username = await generateUniqueUsername(baseUsername);
//          // $transaction تستخدم للتعامل مع عدة عمليات قاعدة بيانات كـ "صفقة واحدة".
//         await prisma.$transaction(async (tx) => {
//           // 1. إنشاء المؤسسة
//           const newOrg = await tx.organization.create({
//             data: {
//               name: `${user.name}'s Organization`,
//             }
//           });

//           // 2. إنشاء المستخدم
//           const newUser = await tx.user.create({
//             data: {
//               name: user.name!,
//               email: user.email!,
//               emailVerified: new Date(),
//               image: user.image,
//               role: "admin",
//               username,
//               password: await bcrypt.hash(Math.random().toString(36), 10),
//               organizationId: newOrg.id,
//               accounts: account ? {
//                 create: {
//                   type: account.type,
//                   provider: account.provider!,
//                   providerAccountId: account.providerAccountId!,
//                   access_token: account.access_token,
//                   token_type: account.token_type,
//                   scope: account.scope,
//                   id_token: account.id_token,
//                   expires_at: account.expires_at,
//                 }
//               } : undefined
//             }
//           });

//           // 3. إنشاء المتجر
//           await tx.store.create({
//             data: {
//               name: `${user.name}'s Store`,
//               ownerId: newUser.id,
//               organizationId: newOrg.id,
//               description: 'المتجر الافتراضي',
//             }
//           });
//         }, { timeout: 30000 }); // 30 ثانية للمعاملة

//         return true;

//       } catch (error) {
//         console.error("Error in signIn callback:", error);
        
//         if (error instanceof PrismaClientKnownRequestError) {
//           if (error.code === 'P2002') {
//             throw new Error("الحساب موجود مسبقاً");
//           }
//         }
//         throw new Error("فشل في عملية التسجيل");
//       }
//     },
//     async jwt({ token, user }) {
//       try {
//         if (user?.email) {
//           const dbUser = await prisma.user.findUnique({
//             where: { email: user.email },
//             include: { 
//               organization: true,
//               store: true
//             }
//           });

//           if (dbUser) {
//             return {
//               ...token,
//               id: dbUser.id,
//               email: dbUser.email,
//               name: dbUser.name,
//               role: dbUser.role,
//               organizationId: dbUser.organizationId,
//               storeId: dbUser.store?.id || null,
//               username: dbUser.username || null
//             };
//           }
//         }
//         return token;
//       } catch (error) {
//         console.error("Error in jwt callback:", error);
//         return token;
//       }
//     },
//     async session({ session, token }) {
//       try {
//         if (session.user) {
//           session.user = {
//             ...session.user,
//             id: token.id as string,
//             role: token.role as string,
//             organizationId: token.organizationId as string,
//             storeId: token.storeId as string | null,
//             email: token.email as string,
//             name: token.name as string,
//             username: token.username as string | null
//           };
//         }
//         return session;
//       } catch (error) {
//         console.error("Error in session callback:", error);
//         return session;
//       }
//     },
//     async redirect({ url, baseUrl }) {
//       return `${baseUrl}/dashboard`;
//     },
//   },
//   events: {
//     async signIn({ user, account, profile, isNewUser }) {
//       console.log("Sign in event:", { user, account, isNewUser });
//     },
//     async error(error) {
//       console.error("Auth error event:", error);
//     },
//   },
//   debug: process.env.NODE_ENV === 'development',
// };
import { AuthOptions } from "next-auth";
import { signIn } from "next-auth/react";
//import GoogleProvider from "next-auth/providers/google";
//import { PrismaAdapter } from "@auth/prisma-adapter";
//import { prisma } from "@/lib/prisma";
//import { signIn, error } from "../../../auth/signin";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { store: true },
      });

      if (!existingUser) {
        const organization = await prisma.organization.create({
          data: {
            name: `${user.name}'s Organization`,
          },
        });

        const newUser = await prisma.user.create({
          data: {
            name: user.name!,
            email: user.email!,
            image: user.image,
            organizationId: organization.id,
            role: "admin",
          },
        });

        await prisma.account.create({
          data: {
            userId: newUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            token_type: account.token_type,
            id_token: account.id_token,
          },
        });

        await prisma.store.create({
          data: {
            name: `${user.name}'s Store`,
            ownerId: newUser.id,
            organizationId: organization.id,
          },
        });
      } else if (!existingUser.store) {
        await prisma.store.create({
          data: {
            name: `${user.name}'s Store`,
            ownerId: existingUser.id,
            organizationId: existingUser.organizationId!,
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { store: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
          token.storeId = dbUser.store?.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.storeId = token.storeId as string;
      }

      return session;
    },

    redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },

  session: {
    strategy: "jwt",
  },

//   events: {
//  signIn(message) {
   
//  },
 
//   },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };