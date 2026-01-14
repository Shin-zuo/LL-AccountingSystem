# LL Accounting System

A comprehensive accounting software solution designed for Philippine businesses, built with modern web technologies. This system handles cash receipts, disbursements, payroll, VAT compliance, financial reporting, and BIR (Bureau of Internal Revenue) filings.

## Features

- **Multi-User Role-Based Access Control**: Support for Accountant, Tax Compliance Officer, Payroll Officer, Comptroller, and General Manager roles with granular permissions
- **Cash Receipts & Disbursements**: Complete voucher management with approval workflows
- **Chart of Accounts**: Flexible account structure for Philippine accounting standards
- **Payroll Management**: Full payroll processing with government contribution calculations (SSS, PhilHealth, HDMF)
- **VAT Books**: Automated VAT tracking and reporting
- **Financial Reports**: Comprehensive financial statements and analytics
- **BIR Compliance**: Automated generation of all required Philippine tax forms and reports
- **Tax Management**: MCIT, NOLCO, and final withholding income tracking
- **Subscription Management**: Built-in billing and subscription handling

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Query** for state management
- **React Hook Form** with Zod validation
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **Express Session** with connect-pg-simple
- **WebSocket** support

### Infrastructure
- **Replit** deployment ready
- **Stripe** integration for payments
- **OpenID Connect** for Replit authentication

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LL-Accounting-System.git
   cd LL-Accounting-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ll_accounting
   SESSION_SECRET=your-secret-key
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   REPLIT_APP_URL=https://your-app.replit.dev
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Development Server**
   ```bash
   npm run dev
   ```

6. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Usage

### User Roles and Permissions

The system supports five user roles with specific permissions:

- **Accountant**: Basic accounting operations (receipts, disbursements, journal entries)
- **Tax Compliance Officer**: VAT and tax reporting
- **Payroll Officer**: Employee and payroll management
- **Comptroller**: Financial oversight and approvals
- **General Manager**: Full system access including user management

### Key Workflows

1. **Cash Receipts**: Create and approve cash receipt vouchers with automatic VAT calculation
2. **Cash Disbursements**: Process payments with supplier invoice tracking
3. **Payroll Processing**: Generate payroll with automatic government deductions
4. **VAT Reporting**: Quarterly VAT returns with SLS/SLP attachments
5. **BIR Filings**: Automated generation of all required tax forms

## Project Structure

```
LL-Accounting-System/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   └── ...
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── db.ts             # Database connection
│   ├── storage.ts        # File storage utilities
│   └── ...
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
├── migrations/            # Database migrations
├── scripts/               # Build and utility scripts
└── ...
```

## API Documentation

The API follows RESTful conventions with the following base endpoints:

- `/api/auth` - Authentication endpoints
- `/api/companies` - Company management
- `/api/users` - User management
- `/api/chart-of-accounts` - Account management
- `/api/cash-receipts` - Cash receipt operations
- `/api/cash-disbursements` - Cash disbursement operations
- `/api/payroll` - Payroll operations
- `/api/reports` - Financial reports and BIR forms

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Ensure all commits are properly signed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## Images and Screenshots

Place all images, screenshots, and diagrams in the `images/` directory at the root of the repository. This includes:
<img width="1893" height="871" alt="Screenshot 2026-01-14 172558" src="https://github.com/user-attachments/assets/75049330-a3ab-4e61-8172-9b4c6d433abd" />



<br><br>





<img width="1913" height="884" alt="Screenshot 2026-01-14 110122" src="https://github.com/user-attachments/assets/138939bf-dcf9-4b1e-93d3-c2128713916c" />


Example structure:
```
images/

├── screenshots/
│   ├── dashboard.png
│   ├── cash-receipt-form.png
│   └── financial-reports.png
├── diagrams/
│   ├── system-architecture.png
│   └── user-flow.png
└── icons/
    └── logo.png
```

To reference images in this README or other documentation, use relative paths like:
```markdown
![Dashboard Screenshot](images/screenshots/dashboard.png)
```

---

**Note**: This system is designed specifically for Philippine accounting standards and BIR compliance requirements. Ensure you understand local tax laws before using in production. This is also created from the idea to sell it by subscription.

