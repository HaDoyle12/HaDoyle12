# GRC Tracker - Governance, Risk & Compliance Management System

A simple yet powerful web application designed to help organizations track and manage their Governance, Risk, and Compliance (GRC) activities, including evidence collection and reporting.

## Features

### Core Functionality
- **GRC Items Management**: Create, edit, view, and delete GRC items including policies, controls, risks, audits, and assessments
- **Evidence Management**: Upload files, add URLs, or create text notes as evidence for GRC items
- **Dashboard Analytics**: Real-time statistics and visual charts showing compliance status and progress
- **Search & Filtering**: Powerful search and filtering capabilities across all GRC items and evidence
- **Framework Support**: Built-in support for major compliance frameworks including:
  - ISO 27001, ISO 27018, ISO 27701, ISO 42001, ISO 22301
  - SOC 1, SOC 2, SOC 3
  - FedRAMP (Low Tailored and High)
  - PCI DSS
  - NIST 800-53

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean, Professional UI**: Modern interface with intuitive navigation
- **Real-time Updates**: Instant feedback and notifications for all actions
- **Modal-based Forms**: Streamlined data entry with validation

### Dashboard & Reporting
- **Key Performance Indicators**: Track total items, evidence files, completed items, and pending items
- **Visual Charts**: Interactive charts showing items by status and framework
- **Recent Activity**: Quick view of recently updated items
- **Status Tracking**: Monitor progress with status badges and priority indicators

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: JSON file-based data storage (easily upgradeable to database)
- **File Handling**: Multer for file uploads
- **Styling**: Custom CSS with responsive design and modern UI components

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Quick Start
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd HaDoyle12
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage Guide

### Adding GRC Items
1. Navigate to the "GRC Items" section
2. Click "Add Item" button
3. Fill in the required information:
   - **Title**: Descriptive name for the GRC item
   - **Category**: Control, Policy, Risk, Audit, or Assessment
   - **Framework**: Select applicable compliance framework
   - **Status**: Not Started, In Progress, Under Review, or Completed
   - **Priority**: Low, Medium, High, or Critical
   - **Assigned To**: Person responsible for the item
   - **Due Date**: Target completion date
   - **Description**: Detailed description of the requirements

### Managing Evidence
1. Go to the "Evidence" section
2. Click "Upload Evidence"
3. Select the associated GRC item
4. Choose evidence type:
   - **File Upload**: Upload documents, screenshots, or other files
   - **URL/Link**: Add links to external resources or documentation
   - **Text Note**: Create text-based evidence or observations
5. Add descriptions and notes for context

### Using the Dashboard
- **Statistics Cards**: View high-level metrics at a glance
- **Status Charts**: Analyze distribution of items by status and framework
- **Recent Activity**: See the most recently updated items
- **Filtering**: Use search and filter options to find specific items

## Data Structure

### GRC Items
```json
{
  "id": "unique-uuid",
  "title": "string",
  "description": "string",
  "category": "Control|Policy|Risk|Audit|Assessment",
  "framework": "ISO 27001|SOC 2|FedRAMP|etc",
  "status": "Not Started|In Progress|Under Review|Completed",
  "priority": "Low|Medium|High|Critical",
  "assignedTo": "string",
  "dueDate": "YYYY-MM-DD",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "evidenceIds": ["array of evidence IDs"]
}
```

### Evidence
```json
{
  "id": "unique-uuid",
  "grcItemId": "associated GRC item ID",
  "title": "string",
  "description": "string",
  "type": "file|url|note",
  "fileName": "string (for files)",
  "originalName": "string (for files)",
  "filePath": "string (for files)",
  "url": "string (for URLs)",
  "notes": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## API Endpoints

### GRC Items
- `GET /api/grc-items` - Get all GRC items
- `GET /api/grc-items/:id` - Get specific GRC item
- `POST /api/grc-items` - Create new GRC item
- `PUT /api/grc-items/:id` - Update GRC item
- `DELETE /api/grc-items/:id` - Delete GRC item

### Evidence
- `GET /api/evidence` - Get all evidence
- `GET /api/evidence/item/:itemId` - Get evidence for specific GRC item
- `POST /api/evidence` - Upload new evidence
- `DELETE /api/evidence/:id` - Delete evidence

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics and recent items

## File Structure

```
├── server.js              # Main server file
├── package.json           # Project dependencies and scripts
├── .gitignore            # Git ignore rules
├── data/                 # JSON data storage
│   ├── grc-items.json    # GRC items data
│   └── evidence.json     # Evidence data
├── public/               # Frontend assets
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Application styles
│   └── js/
│       └── app.js        # Frontend JavaScript
└── uploads/              # File upload storage
```

## Security Considerations

- Input validation on all form submissions
- File upload restrictions and validation
- XSS protection through proper HTML escaping
- CORS configuration for API access
- File size limits for uploads

## Future Enhancements

### Potential Improvements
- **Database Integration**: Migrate from JSON files to PostgreSQL/MySQL
- **User Authentication**: Add user management and role-based access
- **Advanced Reporting**: Generate PDF reports and export capabilities
- **Integration APIs**: Connect with external GRC tools and frameworks
- **Audit Trail**: Track all changes and user activities
- **Notifications**: Email/SMS alerts for due dates and status changes
- **Advanced Charts**: More detailed analytics and trend analysis
- **Document Version Control**: Track versions of uploaded evidence
- **Bulk Operations**: Import/export functionality for large datasets

### Compliance Framework Extensions
- Support for additional frameworks like GDPR, HIPAA, PCI-DSS Level 2-4
- Custom framework definitions
- Framework mapping and cross-references
- Automated compliance checking

## Support

For questions, issues, or contributions, please refer to the project repository or contact the development team.

## License

This project is licensed under the ISC License - see the package.json file for details.