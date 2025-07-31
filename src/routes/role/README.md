# Role CRUD Module

This module provides comprehensive CRUD (Create, Read, Update, Delete) operations for the Role entity with advanced features like soft deletion, bulk operations, permission assignment, status toggling, pagination, search functionality, and role statistics.

## 📁 File Structure

```
src/routes/role/
├── role.controller.ts    # REST API endpoints
├── role.service.ts       # Business logic layer
├── role.repo.ts          # Data access layer
├── role.module.ts        # Module configuration
├── role.model.ts         # Zod schemas and types
├── role.error.ts         # Custom error definitions
├── dto/
│   └── role.dto.ts       # Data Transfer Objects
└── README.md             # This documentation
```

## 🚀 Features

### ✅ **Complete CRUD Operations**

- **Create**: Add new roles with name and description validation
- **Read**: Retrieve single or multiple roles with pagination
- **Update**: Modify existing role data with conflict checking
- **Delete**: Soft delete with restore capability
- **Hard Delete**: Permanent deletion (admin only)
- **Soft Deletion**: Roles are marked as deleted but not removed from database
- **Bulk Operations**: Delete multiple roles at once
- **Permission Assignment**: Assign/remove permissions to/from roles
- **Status Toggle**: Activate/deactivate roles
- **System Role Protection**: Prevent modification/deletion of system roles (ADMIN, CLIENT, SELLER)
- **User Safety**: Prevent deletion of roles with active users
- **Pagination**: Efficient data retrieval with page-based navigation
- **Search**: Find roles by name or description with case-insensitive matching
- **Status Filtering**: Filter roles by active/inactive status
- **Relations**: Retrieve roles with associated permissions and users
- **Statistics**: Get role counts and breakdowns by status

## 📚 API Endpoints

### Base URL: `/roles`

| Method   | Endpoint             | Description                | Body                                 | Query Params                                            |
| -------- | -------------------- | -------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `POST`   | `/`                  | Create new role            | `{ name, description, isActive }`    | -                                                       |
| `GET`    | `/`                  | Get all roles              | -                                    | -                                                       |
| `GET`    | `/pagination`        | Get paginated roles        | -                                    | `page`, `limit`, `search`, `isActive`, `includeDeleted` |
| `GET`    | `/:id`               | Get role by ID             | -                                    | -                                                       |
| `GET`    | `/:id/relations`     | Get role with relations    | -                                    | -                                                       |
| `PATCH`  | `/:id`               | Update role                | `{ name?, description?, isActive? }` | -                                                       |
| `DELETE` | `/:id`               | Soft delete role           | -                                    | -                                                       |
| `PATCH`  | `/:id/restore`       | Restore deleted role       | -                                    | -                                                       |
| `DELETE` | `/:id/permanent`     | Permanently delete role    | -                                    | -                                                       |
| `DELETE` | `/bulk`              | Bulk soft delete           | `{ ids: number[] }`                  | -                                                       |
| `POST`   | `/:id/permissions`   | Assign permissions to role | `{ permissionIds: number[] }`        | -                                                       |
| `PATCH`  | `/:id/toggle-status` | Toggle role active status  | `{ isActive: boolean }`              | -                                                       |
| `GET`    | `/stats`             | Get role statistics        | -                                    | `includeDeleted`                                        |
| `GET`    | `/count`             | Get role count             | -                                    | `includeDeleted`                                        |

## 🔧 Usage Examples

### Creating a Role

```typescript
POST /roles
Content-Type: application/json

{
  "name": "Manager",
  "description": "Manager role with limited admin access",
  "isActive": true
}
```

### Getting Roles with Filtering

```typescript
GET /roles?page=1&limit=10&search=admin&isActive=true&includeDeleted=false
```

### Updating a Role

```typescript
PATCH /roles/1
Content-Type: application/json

{
  "name": "Manager (Updated)",
  "description": "Updated description for manager role"
}
```

### Assigning Permissions to Role

```typescript
POST /roles/1/permissions
Content-Type: application/json

{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

### Toggling Role Status

```typescript
PATCH /roles/1/toggle-status
Content-Type: application/json

{
  "isActive": false
}
```

### Bulk Deleting Roles

```typescript
DELETE /roles/bulk
Content-Type: application/json

{
  "ids": [4, 5, 6]
}
```

### Getting Role Statistics

```typescript
GET /roles/stats?includeDeleted=false

Response:
{
  "totalRoles": 10,
  "activeRoles": 8,
  "inactiveRoles": 2,
  "deletedRoles": 1,
  "recentlyCreated": 3,
  "rolesByName": {
    "ADMIN": 1,
    "CLIENT": 1,
    "SELLER": 1,
    "Manager": 2,
    "Supervisor": 1
  }
}
```
