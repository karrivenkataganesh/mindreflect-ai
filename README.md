# MindReflect - User-Authenticated AI Journaling & Reflection Application

MindReflect is a private, secure cognitive journaling companion powered by Google Gemini 3.6 Flash and secured with Firebase Authentication (Google Federated Identity) and Cloud Firestore with strict per-user document isolation.

---

## 🛡️ Architecture & Threat Modeling Overview

| Threat Zone | Identified Risk | Mitigation / Security Rule |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection, XSS in journal entries | Typed schema validation, string sanitization, length boundaries, HTML/React text encoding |
| **Planning & Reasoning** | Prompt injection or system instruction escape | Deliberate system instructions separating user reflection text from model task; multi-turn context capping |
| **Tool / API Execution** | API key leakage, unauthorized SSRF | Gemini API key held strictly server-side in Express proxy (`/api/gemini/reflect`); zero client key exposure |
| **Memory & State** | Cross-user data contamination in database | Zero-trust Firestore Security Rules binding all read/write operations to `/users/{userId}/interactions/{interactionId}` with `request.auth.uid == userId` |
| **Inter-System Auth** | Broken authentication, credential exposure | Google Federated Identity via Firebase Auth; zero passwords handled or stored |

---

## 🔒 Cloud Firestore Security Rules

All interactions and session data are strictly isolated per authenticated user ID:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔑 Secret Management Setup (GCP Secret Manager)

To eliminate hardcoded credentials in production:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the Gemini API Secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add your Gemini API key version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant the Cloud Run runtime service account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment

Deploy the application container directly to Google Cloud Run:

```bash
# Build and deploy service to Cloud Run
gcloud run deploy mindreflect-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Mandatory Campaign Verification Labeling

To register the service for automated challenge verification:

```bash
gcloud run services update mindreflect-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Functional Walkthrough & Test Suite

The following test cases define every end-to-end user interaction for automated or manual verification:

### Test Case 1: Landing Page & Unauthenticated State
- **Precondition**: User is not logged in.
- **Action**: Navigate to `/`.
- **Expected Result**: 
  - Landing page loads with "Sign In with Google" CTA button.
  - Features overview, architecture badges, and "Review Security Spec" button are visible.
  - Private journal entries and conversation workspace are not accessible.

### Test Case 2: Federated Google Authentication Flow
- **Precondition**: User clicks "Sign In with Google".
- **Action**: Complete Google Sign-In popup with valid credentials.
- **Expected Result**:
  - Auth state resolves with valid `user.uid`, user avatar, and email in Navbar.
  - Automatically transitions to the private Dashboard view.
  - Real-time Firestore subscription connects to `/users/{uid}/interactions`.

### Test Case 3: Create a New Reflection Session
- **Precondition**: User is authenticated on the Dashboard.
- **Action**: Click "New Reflection" button in the History Sidebar.
- **Expected Result**:
  - A new interaction document is initialized with default title "New Reflection" and mood "Reflective".
  - Clean undefined-stripped payload is saved to `/users/{userId}/interactions/{interactionId}` in Firestore.
  - Sync indicator in Navbar displays "Firestore Synced".

### Test Case 4: Title & Mood Customization
- **Precondition**: Active reflection is open.
- **Action**: Click the title input and change to "Q3 Strategy Reflection", then open the Mood picker and select "Inspired".
- **Expected Result**:
  - Document updates optimistically in workspace.
  - Changes are persisted to Firestore under the user's isolated record.
  - History sidebar list immediately reflects the updated title and mood tag.

### Test Case 5: Multi-Turn Conversation with Gemini (Prompt & Response)
- **Precondition**: User types a reflection in the text composer (e.g. "I struggled with team prioritization today").
- **Action**: Click Send or press `Ctrl + Enter`.
- **Expected Result**:
  - User's turn is immediately rendered and persisted to Firestore.
  - Client calls backend proxy `/api/gemini/reflect`.
  - Backend executes resilient fallback ladder starting with `gemini-3.6-flash`.
  - Gemini response is rendered with Markdown styling, timestamp, and model tag.
  - Full transcript is persisted to Firestore.

### Test Case 6: Generation Modes (Brainstorm & Socratic Inquiry)
- **Precondition**: Active reflection workspace.
- **Action**: Switch Mode to "Brainstorm Ideas" and submit "How can I streamline our sprint review?".
- **Expected Result**:
  - Backend receives mode `brainstorm` and tailors system instruction for actionable creative solutions.
  - Gemini response delivers structured ideas and bulleted next steps.

### Test Case 7: Executive Synthesis & Key Takeaways
- **Precondition**: Reflection session has at least 1 conversation turn.
- **Action**: Click "Generate Summary" / "View Synthesis" in the workspace header.
- **Expected Result**:
  - Calls `/api/gemini/summarize` endpoint.
  - Displays Summary Modal with Core Summary, Key Takeaways, Recommended Mindfulness Action, and Categorization Tags.
  - Synthesis data is saved to Firestore within the interaction record.

### Test Case 8: History Search & Mood Filtering
- **Precondition**: Multiple past reflections exist in history.
- **Action**: Type keyword into search input or click a mood pill (e.g., "Inspired").
- **Expected Result**:
  - History sidebar dynamically filters entries matching search text across titles, message content, or tags.
  - Filtered results remain clickable to load into active workspace.

### Test Case 9: Pin & Delete Interaction
- **Precondition**: Entry exists in history.
- **Action**: Click the Pin icon to pin to top; click Trash icon and confirm delete.
- **Expected Result**:
  - Pinned entry moves to top of list.
  - Deletion removes document from `/users/{userId}/interactions/{id}` in Firestore.
  - Workspace falls back cleanly to the next available entry.

### Test Case 10: Cross-User Isolation Verification (Security Negative Test)
- **Precondition**: User A creates interaction `entry_123`. User B logs in.
- **Action**: User B attempts to read `/users/UserA_UID/interactions/entry_123`.
- **Expected Result**:
  - Firestore Security Rule (`request.auth.uid == userId`) rejects the request with `PERMISSION_DENIED`.
  - User B only ever sees documents under `/users/UserB_UID/interactions`.

### Test Case 11: Offline / Sync Error Recovery
- **Precondition**: Network disconnect or simulated transient failure.
- **Action**: Submit entry; observe error banner with "Retry Save".
- **Expected Result**:
  - User input is NOT cleared or lost from the input buffer.
  - Clear error banner is displayed with "Retry Save" button.
  - Clicking "Retry Save" re-attempts Firestore transaction successfully once network returns.
