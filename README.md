# P&I Revenue Universe Dashboard

A client-side-only "Revenue Universe Command Center" for a P&I / Digital Assets master revenue model. The deployed app is a public shell: it includes no real model data, performs no remote fetches, and sends no uploaded CSV data to any server, API, database, analytics service, or external endpoint.

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL and drag CSV exports into the upload panel.

## Build

```bash
npm run build
npm run preview
```

## Deploy Shell To Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Use the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

The deployment contains only the React shell and synthetic placeholder generator. Real presentation data is uploaded locally by the presenter during the session.

## Presentation Workflow

1. Export the seven model tabs as CSV files.
2. Open the deployed dashboard.
3. Drag all CSV files into the "Local-only upload" panel, or upload one file at a time with manual mapping.
4. Use filters for year, probability threshold, status, revenue level, business line, and client search.
5. Export the currently filtered table if needed.
6. Click "Reset data" before ending the session.

Uploaded data is parsed and calculated locally in the browser session. Data is not persisted by default. The "Persist in this browser" toggle stores data in localStorage only on that device and only after the user explicitly enables it.

## Expected CSV Schemas

### L1-DAC-DATA.csv

- `(Do Not Modify) Opportunity`
- `(Do Not Modify) Row Checksum`
- `(Do Not Modify) Last Modified Date`
- `Oppty ID`
- `Platform/Business Line`
- `Client`
- `Opportunity Name`
- `Status`
- `Probability`
- `Total Bid Value (Excluding NII)`
- `Close Date`

### L1-Stablecoin-DATA.csv

Uses the same 11 required columns as `L1-DAC-DATA.csv`.

### L1-TADA-DATA.csv

Uses the same 11 required columns as `L1-DAC-DATA.csv`.

### L1-P&I-OTHER-DATA.csv

Uses the same 11 required columns as `L1-DAC-DATA.csv`.

### L1-HARD-CODED-DATA.csv

- `Opportunity Name`
- `Business Line`
- `Date Closed`
- `Status`
- `Probability`
- `Total Bid Value`
- `Notes`

### Bucket B Revenue Data.csv

- `Oppty ID`
- `Platform/Business Line`
- `Client`
- `Client Group`
- `Opportunity Name`
- `Status`
- `Probability`
- `Total Bid Value (Excluding NII)`
- `Close Date`

### Bucket C Revenue Data.csv

Uses the same 9 required columns as `Bucket B Revenue Data.csv`.

## Data Handling Guarantees

- No real data is checked into this repo.
- No backend is required.
- No uploaded CSV data is sent over the network by the app.
- No remote data source is fetched.
- CSV parsing uses PapaParse in the browser.
- Calculations and filtering run in the browser.
- Extra CSV columns are ignored.
- Missing required columns are surfaced as warnings.
- Empty numeric values are treated as zero where appropriate.
- Uploaded data is not persisted unless the user explicitly toggles browser persistence.
