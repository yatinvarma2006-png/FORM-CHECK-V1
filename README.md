# FormCheck — Sports Form & Injury-Risk Analyzer

FormCheck is a full-stack web application that analyzes user-uploaded videos of athletic movements (Cricket Fast Bowling and Conventional Deadlift) and reports form faults alongside associated injury risks.

It uses **MediaPipe Pose Landmarker** (33-point BlazePose model) for server-side pose extraction and a **rule-based engine** to compare joint angles against reference thresholds stored in a database.

---

## Deliverable Structure

- `/frontend`: React + TypeScript + Vite + Tailwind CSS web interface.
- `/backend`: FastAPI backend app.
  - `sports/bowling.py`: Bowling-specific biomechanical metrics (Elbow Extension, Front Knee Angle, Shoulder-Hip Separation).
  - `sports/deadlift.py`: Deadlift-specific biomechanical metrics (Hip-Shoulder Rise Ratio, Hip Lockout Angle, Knee Lockout Angle).
  - `pose/landmarker.py`: MediaPipe Pose Landmarker wrapper & skeleton visualization.
- `/backend/db`: MySQL schema (`migration.sql`), SQLAlchemy models, and initial seed script (`seed.py`).

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ & npm
- MySQL Server (optional; falls back to SQLite automatically if MySQL server is offline)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Database (MySQL):
   - Set the `DATABASE_URL` environment variable if your MySQL credentials differ from `mysql+mysqlconnector://root:password@localhost:3306/formcheck`:
     ```bash
     export DATABASE_URL="mysql+mysqlconnector://user:password@localhost:3306/formcheck"
     ```
   - Alternatively, execute `backend/db/migration.sql` directly on your MySQL instance:
     ```bash
     mysql -u root -p < db/migration.sql
     ```

5. Seed Reference Data & Start Backend Server:
   - On startup, FastAPI automatically runs `db.seed` to populate the reference thresholds and fault rules into MySQL (or SQLite fallback).
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

---

## Core User Flow

1. **Select Sport**: Choose between "Cricket Bowling" or "Conventional Deadlift".
2. **Upload Video**: Drag & drop or select a side-on video recording.
3. **Scrub & Capture Key Frames**:
   - For Bowling: Capture **"Arm Horizontal"** and **"Release"** frames.
   - For Deadlift: Capture **"Setup"**, **"Early Pull"**, and **"Lockout"** frames.
4. **Configure Side** (Bowling only): Choose Left/Right for bowling arm and front leg.
5. **Run Form Analysis**: Server computes joint angles, checks against DB reference thresholds, and flags any biomechanical faults.
6. **View Results**: View skeleton overlays with green/red joint indicators and detailed fix tips for flagged metrics.
7. **Track History**: Access submission history across past attempts for the session.
