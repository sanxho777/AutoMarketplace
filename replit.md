# AutoLister Pro - Vehicle Listing Management System

## Overview

AutoLister Pro is a comprehensive web application for managing vehicle listings with AI-powered image analysis and automated listing generation. The system helps users create and manage vehicle inventory by uploading photos, extracting vehicle details through AI, and generating optimized listings for various platforms like Facebook Marketplace.

The application features a modern React frontend with a Node.js/Express backend, utilizing AI services (Ollama) for image analysis and vehicle data extraction, plus VIN lookup capabilities for automated vehicle information retrieval.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for build tooling and development
- **UI Library**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod schema validation for type-safe forms
- **Component Structure**: Modular architecture with reusable UI components, custom hooks, and service layers

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API endpoints with structured error handling and request logging middleware
- **Data Storage**: In-memory storage implementation (MemStorage class) with interface abstraction for future database integration
- **File Handling**: Multer for multipart file uploads with validation and storage management
- **Development Setup**: Hot module replacement via Vite integration for seamless development experience

### Data Models
The system uses a relational data structure with three main entities:
- **Vehicles**: Core vehicle information including specs, pricing, images, and AI-extracted data
- **Listings**: Platform-specific listing data linked to vehicles (Facebook, Craigslist, etc.)
- **AI Extractions**: Individual image analysis results with confidence scores and extracted metadata

### AI Integration
- **Vision Analysis**: Ollama integration for local AI image processing and vehicle detail extraction
- **Data Extraction**: Automated extraction of license plates, damage assessment, vehicle condition, make/model identification, and feature recognition
- **Health Monitoring**: Real-time AI service status checking with fallback handling

### External Services
- **VIN Lookup**: Multi-provider VIN decoding service with NHTSA API integration and commercial API fallback
- **Image Processing**: Local file storage with organized directory structure and validation
- **Listing Generation**: AI-powered listing text generation optimized for different marketplace platforms

## External Dependencies

### Core Technologies
- **Node.js Runtime**: Server-side JavaScript execution environment
- **PostgreSQL**: Database system (configured via Drizzle but not actively used with current in-memory storage)
- **Vite**: Frontend build tool and development server with React plugin support

### AI and Machine Learning
- **Ollama**: Local AI model serving for image analysis and text generation (Llava model for vision tasks)
- **Vision Models**: Image recognition capabilities for vehicle analysis and text extraction

### Third-party APIs
- **NHTSA Vehicle API**: Free government VIN lookup service for vehicle specifications
- **Commercial VIN APIs**: Optional paid services for enhanced VIN decoding capabilities

### Database and Storage
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support
- **Neon Database**: Serverless PostgreSQL provider integration
- **Local File Storage**: Image upload handling with organized directory structure

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Lucide React**: Modern icon library for consistent iconography

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration
- **Replit Integration**: Development environment compatibility with runtime error overlay