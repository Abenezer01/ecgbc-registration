# ECGBC Admin Backend - Local Deployment Guide

This guide will help you deploy the ECGBC Admin Backend application locally for development and testing purposes.

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Node.js** (v22 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (Package manager) - Install with: `npm install -g pnpm`
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Docker & Docker Compose** (Optional, for containerized deployment)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecgbc-admin-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/ecgbc_db"

# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Configuration
JWT_ACCESS_SECRET_KEY="your-super-secret-access-key-here"
JWT_REFRESH_SECRET_KEY="your-super-secret-refresh-key-here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Super Admin Configuration
SUPER_ADMIN_EMAIL="admin@ecgbc.com"
SUPER_ADMIN_PASSWORD="SecurePassword123!"
```

**Important**: Replace the placeholder values with your actual configuration:
- Update database credentials in `DATABASE_URL`
- Generate strong, unique secret keys for JWT tokens
- Set a secure password for the super admin account

### 4. Database Setup

#### Option A: Local MySQL Database

1. Create a MySQL database:
```sql
CREATE DATABASE ecgbc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run database migrations:
```bash
pnpm run prisma:push
```

3. Generate Prisma client:
```bash
pnpm run prisma:generate
```

#### Option B: Using Docker Compose (Recommended)

Uncomment the database service in `docker-compose.yml` and add these to your `.env`:

```env
# Database Docker Configuration
DB_ROOT_PASSWORD=rootpassword123
DB_NAME=ecgbc_db
DB_USER=ecgbc_user
DB_PASSWORD=ecgbc_password123
DATABASE_URL="mysql://ecgbc_user:ecgbc_password123@localhost:3307/ecgbc_db"
```

Then run:
```bash
docker-compose up db -d
pnpm run prisma:push
pnpm run prisma:generate
```

### 5. Seed the Database

Run the following commands in order to populate the database with initial data:

```bash
# Seed basic data lookups
pnpm run seed:datalookup

# Seed permissions
pnpm run seed:permission

# Seed roles
pnpm run seed:role

# Link roles with permissions
pnpm run seed:role-permission

# Create super admin user
pnpm run seed:staff

# Seed council fellowships (optional)
pnpm run seed:council-fellowship

# Or run all seeds at once
pnpm run seed:create
```

### 6. Start the Application

#### Development Mode
```bash
pnpm run dev
```

#### Production Mode
```bash
pnpm run build
pnpm run serve
```

The application will be available at: `http://localhost:8080`

## API Endpoints

Once running, the following API endpoints will be available:

- **Authentication**: `http://localhost:8080/api/v1/auth`
- **Staff Management**: `http://localhost:8080/api/v1/staff`
- **Roles & Permissions**: `http://localhost:8080/api/v1/role`, `http://localhost:8080/api/v1/permission`
- **Council Fellowships**: `http://localhost:8080/api/v1/council-fellowship`
- **Members**: `http://localhost:8080/api/v1/members`
- **Reports**: `http://localhost:8080/api/v1/reports`
- **Files**: `http://localhost:8080/api/v1/files`

## Docker Deployment

### Using Docker Compose (Full Stack)

1. Ensure your `.env` file is properly configured
2. Run the application:

```bash
docker-compose up --build
```

### Using Docker Only (App Container)

```bash
# Build the image
docker build -t ecgbc-backend .

# Run the container
docker run -p 8080:8080 --env-file .env ecgbc-backend
```

## File Storage

The application stores uploaded files in the `public/` directory:
- **General files**: `public/files/file/`
- **Reports**: `public/files/report/`
- **Avatars**: `public/images/avatar/`

Ensure these directories have proper write permissions.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check DATABASE_URL in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:8080 | xargs kill`

3. **Prisma Client Error**
   - Regenerate client: `pnpm run prisma:generate`
   - Reset database: `pnpm run prisma:reset`

4. **Permission Errors**
   - Check file permissions for `public/` directory
   - Ensure user has write access

### Logs

Check application logs for detailed error information:
- Development: Logs appear in console
- Production: Consider using PM2 or similar process manager

## Security Notes

- Never commit `.env` file to version control
- Use strong, unique passwords and secret keys
- Regularly update dependencies
- Configure firewall rules for production deployment
- Use HTTPS in production environments

## Additional Commands

```bash
# Reset database (WARNING: Deletes all data)
pnpm run reset

# Database migrations
pnpm run prisma:reset

# Seed specific member groups
pnpm run seed:member-selam
pnpm run seed:member-addis
# ... (see package.json for all available seed commands)

# Build for production
pnpm run build
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Contact the development team

---

**Author**: Natnael Feleke  
**Version**: 1.0.0  
**Last Updated**: January 2025