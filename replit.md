# Damage Records Management System

## Overview

This is a full-stack TypeScript application for managing damage records in the automotive industry. It's built with a modern tech stack including React, Express, and PostgreSQL, designed to track and manage vehicle damage records with features for data entry, filtering, reporting, and administrative management.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Turkish - User prefers Turkish communication.

## Recent Changes (January 2025)

### System Configuration Updates
- **Settings Enhancement**: Added configurable footer note field for customizable disclaimer text
- **Branding Update**: Changed default title from "MERTUR HASAR TAKİP SİSTEMİ" to "HASAR TAKİP SİSTEMİ"
- **Logo Integration**: Added company logo (https://resmim.net/cdn/2025/07/11/TzfqXo.jpg) to main interface and reports
- **Professional Styling**: Enhanced action buttons with gradient backgrounds and improved visual hierarchy

### Report Generation Improvements
- **PDF Reports**: Enhanced with logo, proper signature sections, and configurable footer notes
- **Print Layout**: Improved with logo integration and professional signature areas
- **Excel Export**: Maintained existing functionality with better formatting
- **Import/Export UI**: Made more prominent with descriptive cards and better visual organization

### Database Schema Updates
- Added `footerNote` field to settings table for customizable disclaimer text
- Updated default values to remove specific company branding for flexibility

### Latest Updates (July 2025)
- **Excel Import Format**: Fixed to read A column (models) and B column (chassis numbers) correctly
- **Chassis Autocomplete**: Enhanced to prioritize end-matching results (e.g., "0251" shows chassis ending with "0251" first)
- **Edit Existing Records**: Added functionality to edit existing records when duplicate chassis numbers are entered
- **Professional Print/PDF**: Enhanced with professional styling, logos, and automatic date-based PDF naming
- **Smart Search**: Improved chassis number search with priority ordering (exact match > end match > start match > contains)
- **Database Migration**: Migrated from in-memory storage to PostgreSQL for production deployment
- **MySQL Support**: Added full MySQL database support with configuration and setup guides
- **Flexible Database**: System supports both PostgreSQL and MySQL with easy switching
- **Production Ready**: Complete hosting setup guides for Turkish and international providers
- **Simplified PDF**: Removed signature and note sections for cleaner PDF output
- **Clean UI**: Removed logo from main interface, keeping only the system title

## System Architecture

### Overall Architecture
The application follows a monorepo structure with clear separation between client and server code:
- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui components for a modern, responsive interface

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express backend API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── attached_assets/ # Static assets and files
```

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for utility-first styling

### Backend Architecture
- **Express.js** with TypeScript for the REST API
- **Drizzle ORM** for type-safe database operations
- **Zod** for request validation and schema enforcement
- **In-memory storage** with interface abstraction for easy database migration
- **Vite integration** for serving the frontend in development

### Database Schema
Three main entities:
1. **Damage Records**: Core entity storing damage information (id, date, chassisNumber, model, description)
2. **Models**: Vehicle models management (id, name)
3. **Settings**: Application configuration (id, title, merturOfficial, omsanOfficial)

## Data Flow

### Frontend to Backend
1. User interactions trigger React components
2. Forms are validated using React Hook Form with Zod schemas
3. TanStack Query handles API calls with automatic caching and error handling
4. API responses update the UI reactively

### Backend Processing
1. Express routes receive requests and validate data using Zod schemas
2. Storage interface abstracts database operations
3. Drizzle ORM provides type-safe database queries
4. Structured error handling returns appropriate HTTP status codes

### Database Operations
1. Drizzle schema definitions ensure type safety
2. Migrations handle database structure changes
3. Unique constraints prevent duplicate chassis numbers
4. Relationships maintain data integrity

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation
- **lucide-react**: Icon library

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Optional Features
- **jsPDF**: PDF generation for reports
- **xlsx**: Excel file import/export functionality
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds the React app to `dist/public`
2. **Backend**: ESBuild bundles the Express server to `dist/index.js`
3. **Database**: Drizzle migrations ensure schema consistency

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **PORT**: Server port (defaults to standard ports)

### Production Deployment
- Single command build process (`npm run build`)
- Optimized bundle sizes with code splitting
- Static asset serving integrated with Express
- Database migrations applied automatically

## Key Features

### Data Management
- Create, read, update, and delete damage records
- Vehicle model management with CRUD operations
- Chassis number uniqueness validation
- Application settings management

### User Interface
- Responsive design for desktop and mobile
- Real-time filtering and search functionality
- Data export to Excel and PDF formats
- Print-friendly report generation
- Modal-based forms for data entry and editing

### Data Validation
- Type-safe schemas shared between frontend and backend
- Real-time form validation with error messages
- Unique constraint enforcement for chassis numbers
- Required field validation

### Reporting
- PDF generation with customizable headers
- Excel export with proper formatting
- Print functionality for damage records
- Configurable report titles and official names

The architecture prioritizes type safety, maintainability, and user experience while providing a solid foundation for future enhancements and scaling.