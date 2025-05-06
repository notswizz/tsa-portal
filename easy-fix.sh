#!/bin/bash

# This script provides a simpler way to handle the credentials issue
# Instead of cleaning history, it:
# 1. Creates a fresh branch with just one commit
# 2. Makes all the necessary changes to use environment variables
# 3. Provides instructions for switching your repo to this clean branch

echo "🔧 Creating a new clean branch without history..."

# Create a clean branch
git checkout --orphan clean-branch

# Remove everything from staging
git rm -rf --cached .

# Update the NextAuth file to use environment variables
mkdir -p pages/api/auth
cat > pages/api/auth/[...nextauth].js << EOL
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(firebaseApp);

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // When a user signs in, store their information in the staff collection
      if (user && user.email) {
        try {
          // Check if user already exists in the staff collection
          const userRef = doc(db, 'staff', user.id);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // If user doesn't exist, add them to the staff collection
            await setDoc(userRef, {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'staff',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error saving user to Firestore:", error);
          // Still allow sign in even if storing to Firestore fails
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Add user info to session from token
      if (token) {
        session.user.id = token.sub;
        session.user.role = 'staff';
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // Persist the Google access token to the token right after sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
EOL

# Create an example environment file
cat > .env.example << EOL
# Environment Variables - COPY THIS FILE TO .env AND ADD YOUR REAL CREDENTIALS
NEXTAUTH_SECRET=your-nextauth-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
EOL

# Create a clean .gitignore
cat > .gitignore << EOL
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOL

# Stage only essential files and ignore node_modules and other large directories
git add .gitignore
git add pages/api/auth/[...nextauth].js
git add .env.example
git add components/Layout.js
git add push-to-github.sh

# Add a file listing what to copy back
echo "After pushing this clean branch, you should copy your actual project files back in, except for files that contained credentials." > RESTORE-FILES-INSTRUCTIONS.txt
git add RESTORE-FILES-INSTRUCTIONS.txt

# Commit the changes
git commit -m "Clean repository setup with environment variables"

echo "✅ Clean branch created!"
echo ""
echo "🚨 IMPORTANT NEXT STEPS 🚨"
echo "1. Force push this branch to remote: git push main clean-branch:main --force"
echo "2. Create a .env file with your actual credentials"
echo "3. Copy over your project files from your main branch (except those with credentials)"
echo ""
echo "⚠️ NOTE: This approach creates a fresh branch without any history. You'll need to copy your files back." 