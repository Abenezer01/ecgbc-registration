# Auth Service

The centralized authentication service for the ECGBC Admin Enterprise frontend.

## Files

- `auth.service.ts` - Core authentication logic
- `api.ts` - API client with auth interceptor

## Features

### 1. Login (`login`)
```typescript
import { login } from "@/lib/auth.service";

const response = await login(email, password);
// Returns: { accessToken, staff, rbac }
```

### 2. Logout (`logout`)
```typescript
import { logout } from "@/lib/auth.service";

logout();
```

### 3. Authentication Check (`isAuthenticated`)
```typescript
import { isAuthenticated } from "@/lib/auth.service";

if (isAuthenticated()) { ... }
```

### 4. Permission Checking
```typescript
import { 
  hasPermission,
  hasAnyPermission,
  hasAllPermissions 
} from "@/lib/auth.service";

// Check single permission
if (hasPermission(staff, "add_member")) { ... }

// Check any of multiple permissions
if (hasAnyPermission(staff, ["add_member", "change_member"])) { ... }

// Check all of multiple permissions
if (hasAllPermissions(staff, ["add_member", "view_member"])) { ... }
```

### 5. Feature Access (`canAccessMembers`)
```typescript
import { canAccessMembers } from "@/lib/auth.service";

if (canAccessMembers(staff, rbac)) { ... }
```

## Usage in Components

```tsx
import { useAuth } from "@/hooks/useAuth";
import { RequirePermission } from "@/components/guards/RequirePermission";

export function MyComponent() {
  const { staff, logout, hasPermission } = useAuth();
  
  if (!hasPermission("view_member")) {
    return <div>Access denied</div>;
  }
  
  return (
    <div>
      <button onClick={logout}>Sign out</button>
      <RequirePermission permission="add_member">
        <button>Add Member</button>
      </RequirePermission>
    </div>
  );
}
```

## Integration with Backend

The auth service uses the backend endpoints:
- `POST /api/v1/auth/login` - Authenticate user
- `GET /api/v1/auth` - Get authenticated staff
- `POST /api/v1/auth/refresh` - Refresh access token (future)

## Token Management

- **Access Token**: Stored in localStorage, sent in Authorization header
- **Refresh Token**: Stored in localStorage and cookies
- **Cookie**: Set for server-side requests (middleware)
