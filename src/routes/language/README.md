# Language CRUD Module

This module provides comprehensive CRUD (Create, Read, Update, Delete) operations for the Language entity with advanced features like soft deletion, bulk operations, pagination, and search functionality.

## 📁 File Structure

```
src/routes/language/
├── language.controller.ts    # REST API endpoints
├── language.error.ts         # Custom error messages
├── language.service.ts       # Business logic layer
├── language.repository.ts    # Data access layer
├── language.module.ts        # Module configuration
├── language.model.ts         # Zod schemas and types
├── dto/
│   └── language.dto.ts       # Data Transfer Objects
└── README.md                 # This documentation
```

## 🚀 Features

### ✅ **Complete CRUD Operations**

- **Create**: Add new languages with validation
- **Read**: Retrieve single or multiple languages with pagination
- **Update**: Modify existing language data
- **Delete**: Soft delete with restore capability
- **Hard Delete**: Permanent deletion (admin only)
- **Soft Deletion**: Languages are marked as deleted but not removed from database
- **Bulk Operations**: Delete multiple languages at once
- **Pagination**: Efficient data retrieval with page-based navigation
- **Search**: Find languages by name or ID with case-insensitive matching
- **Relations**: Retrieve languages with associated translations

## 📚 API Endpoints

### Base URL: `/languages`

| Method   | Endpoint         | Description                 | Body                           | Query Params                                |
| -------- | ---------------- | --------------------------- | ------------------------------ | ------------------------------------------- |
| `POST`   | `/`              | Create new language         | `{ id: string, name: string }` | -                                           |
| `GET`    | `/`              | Get all languages           | -                              | -                                           |
| `GET`    | `/pagination`    | Get paginated languages     | -                              | `page`, `limit`, `search`, `includeDeleted` |
| `GET`    | `/:id`           | Get language by ID          | -                              | -                                           |
| `GET`    | `/:id/relations` | Get language with relations | -                              | -                                           |
| `PATCH`  | `/:id`           | Update language             | `{ name?: string }`            | -                                           |
| `DELETE` | `/:id`           | Soft delete language        | -                              | -                                           |
| `PATCH`  | `/:id/restore`   | Restore deleted language    | -                              | -                                           |
| `DELETE` | `/:id/permanent` | Permanently delete language | -                              | -                                           |
| `DELETE` | `/bulk`          | Bulk soft delete            | `{ ids: string[] }`            | -                                           |
| `POST`   | `/count`         | Get language count          | -                              | `includeDeleted`                            |

## 🔧 Usage Examples

### Creating a Language

```typescript
POST /languages
Content-Type: application/json

{
  "id": "en",
  "name": "English"
}
```

### Getting Languages with Pagination

```typescript
GET /languages?page=1&limit=10&search=eng&includeDeleted=false
```

### Updating a Language

```typescript
PATCH /languages/en
Content-Type: application/json

{
  "name": "English (Updated)"
}
```

### Bulk Deleting Languages

```typescript
DELETE /languages/bulk
Content-Type: application/json

{
  "ids": ["en", "fr", "de"]
}
```
