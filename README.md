# Deal Analyser — Bridge → Refurb → Refi → Hold

React + Firebase app for analysing property deals with bridging finance.

---

## Stack
- **React** (Create React App) — frontend
- **Firebase Auth** (Google) — login
- **Firestore** — deal storage (per user)
- **Firebase Hosting** — deployment (free Spark tier)
- **GitHub Actions** — auto-deploy on push to `main`

---

## One-time setup (do this once)

### 1. Create a new Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `deal-analyser` (or anything)
3. Disable Google Analytics (not needed)

### 2. Enable Firestore

1. In Firebase console → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Pick region: `europe-west2` (London)
5. Click **Enable**

### 3. Enable Google Auth

1. **Build → Authentication → Get started**
2. **Sign-in method → Google → Enable**
3. Add your support email → Save

### 4. Register a Web App

1. **Project Settings (gear icon) → General → Your apps → Add app → Web**
2. Give it a nickname (e.g. `deal-analyser-web`)
3. **Do NOT tick** "Firebase Hosting" yet
4. Copy the `firebaseConfig` values — you'll need them as secrets

### 5. Enable Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project, set public dir to "build", configure as SPA: yes
```

### 6. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 7. Create GitHub repo and push

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/deal-analyser.git
git push -u origin main
```

### 8. Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add each of these:

| Secret name | Value (from Firebase console → Project Settings → Your apps) |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | `apiKey` value |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `authDomain` value |
| `REACT_APP_FIREBASE_PROJECT_ID` | `projectId` value |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `storageBucket` value |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` value |
| `REACT_APP_FIREBASE_APP_ID` | `appId` value |
| `FIREBASE_SERVICE_ACCOUNT` | See below |

**Getting the `FIREBASE_SERVICE_ACCOUNT` secret:**

```bash
firebase init hosting   # if not done already
# GitHub Actions will prompt during "firebase init" — follow prompts
# OR manually:
```

1. Firebase console → **Project Settings → Service accounts**
2. Click **Generate new private key** → Download JSON
3. Copy the **entire JSON content** → paste as the `FIREBASE_SERVICE_ACCOUNT` secret

### 9. Add your email to the whitelist (optional)

Open `src/contexts/AuthContext.js` and add your email:

```js
const ALLOWED_EMAILS = ["you@gmail.com"];
```

Leave the array empty to allow any Google account.

### 10. Authorise your domain in Firebase

1. **Authentication → Settings → Authorised domains**
2. Your `xxx.web.app` domain is added automatically after first deploy

---

## Local development

```bash
cp .env.example .env.local
# Fill in your Firebase values in .env.local

npm install
npm start
```

---

## Deploy

Any push to `main` auto-deploys via GitHub Actions.

Manual deploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## Free tier limits (Spark plan)

| Service | Free limit |
|---|---|
| Firestore reads | 50,000 / day |
| Firestore writes | 20,000 / day |
| Firestore storage | 1 GB |
| Hosting storage | 10 GB |
| Auth | 50,000 MAU |

More than enough for personal property analysis.

---

## Listing Parser (AI-powered)

The app includes a Claude AI listing parser. To analyse any property:

1. Open the listing on Rightmove, Zoopla, OnTheMarket, or an auction house site
2. Select all text on the page (Ctrl+A) and copy (Ctrl+C)
3. Paste into the **Analyse a Listing** box at the top of the calculator
4. Click **Extract Data** — Claude reads the text and pulls out:
   - Address
   - Asking / guide price → pre-fills as bid
   - Beds, type, tenure
   - Condition → estimates refurb cost
   - GDV estimate (based on Scunthorpe/DN area comparables)
   - Rental estimate
   - Auction fees if applicable
5. Review the extracted data, then click **Apply to Calculator**
6. Adjust any figures you know better, then save the deal

The parser uses the Anthropic API. No scraping — you paste, Claude reads.
