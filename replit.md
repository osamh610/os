# OSSMSBot - Telegram SMS Gateway

## Overview

OSSMSBot is a full-stack web application that serves as an SMS gateway integrated with Telegram. The system allows users to receive SMS messages via Twilio and forward them to Telegram chats, providing a unified messaging experience. The application features a comprehensive dashboard for monitoring bot activity, managing users, and viewing message statistics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript, utilizing a component-based architecture with modern UI patterns:
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized builds

The frontend follows a modular structure with separate directories for pages, components, hooks, and utilities. The layout includes a persistent sidebar navigation and a responsive design that adapts to mobile devices.

### Backend Architecture
The server is built on Node.js with Express, following a RESTful API design:
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless hosting
- **Authentication**: Session-based with PostgreSQL session storage
- **File Structure**: Separation of routes, services, and storage layers

The backend implements a service-oriented architecture with dedicated services for Telegram bot operations and SMS handling, promoting modularity and maintainability.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with three main tables:
- **Users Table**: Stores Telegram user information, phone numbers, and registration status
- **Messages Table**: Tracks SMS messages, delivery status, and routing information
- **Bot Stats Table**: Maintains real-time statistics for dashboard analytics

Drizzle ORM provides type-safe database queries and automatic schema validation, with migrations handled through the drizzle-kit toolchain.

### Authentication and Authorization
The system implements a simple authentication model:
- **Telegram Integration**: Users authenticate through Telegram bot commands
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **No Traditional Auth**: The application relies on Telegram's built-in user verification

### External Service Integrations
The application integrates with multiple external services:

**Telegram Bot API**:
- Webhook-based message handling for real-time communication
- Bot command processing for user registration and management
- Message forwarding from SMS to Telegram chats

**Twilio SMS Service**:
- Incoming SMS webhook processing
- SMS-to-Telegram message forwarding
- Phone number management and verification

**Database Services**:
- Neon PostgreSQL for serverless database hosting
- Connection pooling for optimal performance

The webhook architecture enables real-time message processing, with dedicated endpoints for both Telegram and SMS integrations. The system includes comprehensive error handling and logging for monitoring external service interactions.

## External Dependencies

- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **node-telegram-bot-api**: Telegram Bot API integration
- **twilio**: SMS service integration
- **express**: Web framework for API endpoints
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing for React
- **date-fns**: Date manipulation utilities
- **connect-pg-simple**: PostgreSQL session store