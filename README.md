# CSO Coaching Dashboard

A real-time dashboard for Chief Sales Officers to gain visibility into deals, pipeline health, and coaching opportunities across their sales team.

## Features

### 🎯 Overview Dashboard
- **Coaching Moments**: Priority-ranked coaching opportunities with actionable recommendations
- **Deal Risk Indicators**: Real-time alerts for at-risk deals requiring attention
- **Pipeline Velocity**: Metrics and visualizations showing pipeline health and conversion rates

### 🚨 Deal Risk Indicators
- Identifies deals with no recent activity
- Highlights high-value deals requiring attention
- Tracks overdue close dates
- Provides direct links to HubSpot for immediate action

### 📊 Pipeline Health
- Pipeline-by-pipeline performance metrics
- Stage distribution and conversion rates
- Average days to close tracking
- Stuck deal identification
- Visual charts for quick insights

### 👥 Rep Performance
- Individual rep metrics and coaching items
- Win rate and velocity tracking
- Active deals and at-risk deal counts
- Priority coaching moments for each rep

### 🔗 Direct HubSpot Integration
- One-click access to deals, contacts, and notes in HubSpot
- Real-time data sync (5-minute refresh interval)
- No data migration needed - works directly with your HubSpot account

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Icons**: Lucide React
- **CRM Integration**: HubSpot API

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A HubSpot account with API access
- HubSpot Private App Access Token (or API Key)

### 1. Clone and Install

```bash
# Navigate to the project directory
cd ClaudeTest

# Install dependencies
npm install
```

### 2. HubSpot API Setup

#### Option A: Create a Private App (Recommended)

1. Go to your HubSpot account settings
2. Navigate to **Integrations** → **Private Apps**
3. Click **Create a private app**
4. Give it a name like "CSO Coaching Dashboard"
5. Under **Scopes**, select:
   - `crm.objects.deals.read`
   - `crm.objects.contacts.read`
   - `crm.objects.owners.read`
   - `crm.schemas.deals.read`
6. Click **Create app** and copy the access token

#### Option B: Use API Key (Legacy)

1. Go to your HubSpot account settings
2. Navigate to **Integrations** → **API Key**
3. Click **Show** or **Create** to get your API key

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your HubSpot credentials:

```env
VITE_HUBSPOT_API_KEY=your_access_token_or_api_key_here
VITE_HUBSPOT_PORTAL_ID=your_portal_id_here
```

To find your Portal ID:
- Go to HubSpot Settings → Account Setup → Account Defaults
- Your Hub ID / Portal ID will be displayed there

### 4. Run the Application

```bash
# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### 5. Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Dashboard Navigation

The dashboard has four main views:

### Overview Tab
Shows a summary of:
- Top 5 coaching moments requiring immediate attention
- Top 5 at-risk deals
- All pipeline velocity metrics

### At-Risk Deals Tab
Complete list of all deals flagged as at-risk with:
- Risk level (High/Medium/Low)
- Risk factors and days in current stage
- Deal amount and owner
- Direct link to HubSpot

### Pipeline Health Tab
Detailed pipeline analysis including:
- Total deals and pipeline value
- Average days to close
- Conversion rates
- Stage-by-stage breakdown
- Stuck deal identification

### Rep Performance Tab
Individual sales rep metrics:
- Active deal count and pipeline value
- Win rate and average velocity
- Deals at risk
- Priority coaching moments for each rep

## Key Metrics Explained

### Deal Risk Indicators

A deal is flagged as at-risk based on:
- **No activity for 14+ days**: High risk
- **No activity for 7-14 days**: Medium risk
- **High value (>$50K) with 7+ days inactivity**: Requires attention
- **Overdue close date**: High risk

### Pipeline Velocity

Calculated as:
- Average time from deal creation to close (won deals only)
- Measured separately for each pipeline
- Helps identify bottlenecks in the sales process

### Stuck Deals

Deals are considered "stuck" if:
- They've been in the same stage for 14+ days with no activity

### Coaching Moments

Automatically generated when:
- Deal has been inactive for 14+ days
- Close date is overdue
- High-value deal needs attention
- Rep has multiple at-risk deals

## Data Refresh

- Dashboard automatically refreshes every **5 minutes**
- Click the **Refresh Data** button in the header for manual refresh
- All data is fetched directly from HubSpot in real-time

## Customization

### Adjust Risk Thresholds

Edit `/src/services/hubspot.ts` and modify the risk calculation logic in `getDealRiskIndicators()`:

```typescript
// Change inactivity thresholds
if (daysInactive > 14) { // Change 14 to your threshold
  riskLevel = 'high';
}

// Change high-value threshold
if (amount > 50000) { // Change 50000 to your threshold
  riskFactors.push('High-value deal requires attention');
}
```

### Modify Refresh Interval

Edit `/src/App.tsx` and change the `refetchInterval`:

```typescript
refetchInterval: 5 * 60 * 1000, // Change to your desired interval in milliseconds
```

### Customize Colors

Edit `/tailwind.config.js` to change the color scheme:

```javascript
colors: {
  primary: {
    // Customize your primary colors
  },
}
```

## Troubleshooting

### API Connection Issues

If you see no data:
1. Check that your `.env` file has the correct API key and Portal ID
2. Verify API scopes/permissions in HubSpot
3. Check browser console for API errors
4. Ensure you have deals in your HubSpot account

### CORS Errors

HubSpot API should work from localhost during development. If you encounter CORS issues:
1. Use a proxy server for production deployments
2. Consider deploying the dashboard and using server-side API calls

### Build Errors

If you get TypeScript errors:
```bash
npm run build -- --mode development
```

## Future Enhancements

Potential features for future versions:
- Email/Slack notifications for high-priority coaching moments
- Historical trend analysis and forecasting
- Customizable coaching playbooks per deal type
- Integration with call recording platforms
- Rep coaching session tracking
- Goal setting and progress tracking

## Support

For issues or questions:
1. Check the HubSpot API documentation: https://developers.hubspot.com/docs/api/overview
2. Review React Query docs: https://tanstack.com/query/latest
3. File an issue in this repository

## License

MIT License - feel free to use and modify for your organization's needs
