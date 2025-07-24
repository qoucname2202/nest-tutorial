# Permission CRUD Module

This module provides comprehensive CRUD (Create, Read, Update, Delete) operations for the Permission entity with advanced features like soft deletion, bulk operations, role assignment, pagination, search functionality, and permission statistics.

## 📁 File Structure

```
src/routes/permission/
├── permission.controller.ts    # REST API endpoints
├── permission.service.ts       # Business logic layer
├── permission.repository.ts    # Data access layer
├── permission.module.ts        # Module configuration
├── permission.model.ts         # Zod schemas and types
├── dto/
│   └── permission.dto.ts       # Data Transfer Objects
└── README.md                   # This documentation
```

## 🚀 Features

### ✅ **Complete CRUD Operations**

- **Create**: Add new permissions with path+method validation
- **Read**: Retrieve single or multiple permissions with pagination
- **Update**: Modify existing permission data with conflict checking
- **Delete**: Soft delete with restore capability
- **Hard Delete**: Permanent deletion (admin only)
- **Soft Deletion**: Permissions are marked as deleted but not removed from database
- **Bulk Operations**: Delete multiple permissions at once
- **Role Assignment**: Assign/remove roles to/from permissions
- **Pagination**: Efficient data retrieval with page-based navigation
- **Search**: Find permissions by name, description, or path with case-insensitive matching
- **Method Filtering**: Filter permissions by HTTP method (GET, POST, PUT, DELETE, etc.)
- **Relations**: Retrieve permissions with associated roles and user information
- **Statistics**: Get permission counts and breakdowns by HTTP method

## 📚 API Endpoints

### Base URL: `/permissions`

| Method   | Endpoint         | Description                   | Body                                      | Query Params                                          |
| -------- | ---------------- | ----------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `POST`   | `/`              | Create new permission         | `{ name, description, path, method }`     | -                                                     |
| `GET`    | `/`              | Get all permissions           | -                                         | -                                                     |
| `GET`    | `/pagination`    | Get paginated permissions     | -                                         | `page`, `limit`, `search`, `method`, `includeDeleted` |
| `GET`    | `/:id`           | Get permission by ID          | -                                         | -                                                     |
| `GET`    | `/:id/relations` | Get permission with relations | -                                         | -                                                     |
| `PATCH`  | `/:id`           | Update permission             | `{ name?, description?, path?, method? }` | -                                                     |
| `DELETE` | `/:id`           | Soft delete permission        | -                                         | -                                                     |
| `PATCH`  | `/:id/restore`   | Restore deleted permission    | -                                         | -                                                     |
| `DELETE` | `/:id/permanent` | Permanently delete permission | -                                         | -                                                     |
| `DELETE` | `/bulk`          | Bulk soft delete              | `{ ids: number[] }`                       | -                                                     |
| `POST`   | `/:id/roles`     | Assign roles to permission    | `{ roleIds: number[] }`                   | -                                                     |
| `GET`    | `/stats`         | Get permission statistics     | -                                         | `includeDeleted`                                      |
| `GET`    | `/count`         | Get permission count          | -                                         | `includeDeleted`                                      |

## 🔧 Usage Examples

### Creating a Permission

```typescript
POST /permissions
Content-Type: application/json

{
  "name": "Read Users",
  "description": "Allow reading user data",
  "path": "/users",
  "method": "GET"
}
```

### Getting Permissions with Filtering

```typescript
GET /permissions?page=1&limit=10&search=user&method=GET&includeDeleted=false
```

### Updating a Permission

```typescript
PATCH /permissions/1
Content-Type: application/json

{
  "name": "Read Users (Updated)",
  "description": "Updated description for reading user data"
}
```

### Assigning Roles to Permission

```typescript
POST /permissions/1/roles
Content-Type: application/json

{
  "roleIds": [1, 2, 3]
}
```

### Bulk Deleting Permissions

```typescript
DELETE /permissions/bulk
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

### Getting Permission Statistics

```typescript
GET /permissions/stats?includeDeleted=false

Response:
{
  "totalPermissions": 25,
  "permissionsByMethod": {
    "GET": 10,
    "POST": 8,
    "PUT": 4,
    "DELETE": 3
  },
  "deletedPermissions": 2,
  "recentlyCreated": 5
}
```
