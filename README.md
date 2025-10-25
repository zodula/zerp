# Zerp

A comprehensive ERP (Enterprise Resource Planning) application built on [Zodula](https://github.com/zodula/zodula) framework.

## Features

- **Accounting**: Journal entries, payment processing, financial reporting
- **Sales**: Invoice management, customer tracking
- **Purchase**: Vendor management, procurement
- **Core**: Company setup, accounts, currencies, parties

## Quick Start

```bash
# Install nailgun globally
bun install --global nailgun

# Create a zodula project
nailgun create my-app --branch v0

cd my-app

# Install zerp app
nailgun install-app @zodula/zerp --branch v0

# Start development
nailgun dev
# or
nailgun start
```

## Structure

- `doctypes/` - Data models (Company, Account, Invoice, etc.)
- `actions/` - API endpoints
- `ui/` - Frontend components
- `migrations/` - Database schema changes
- `fixtures/` - Sample data

## Core Doctypes

- **Company** - Organization setup
- **Account** - Chart of accounts
- **Party** - Customers and vendors
- **Invoice** - Sales transactions
- **Journal Entry** - Accounting entries
