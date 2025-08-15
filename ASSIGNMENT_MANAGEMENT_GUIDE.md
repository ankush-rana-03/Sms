# Teacher Assignment Management Guide

This guide explains how to manage teacher assignments for classes, sections, and subjects in the School Management System.

## Overview

The system now supports:
- ✅ **Creating** new assignments
- ✅ **Editing** existing assignments  
- ✅ **Deleting** individual assignments
- ✅ **Viewing** all current assignments

## Backend API Endpoints

### 1. Create/Add Assignments
```
POST /api/admin/teachers/:teacherId/assign-classes
```
**Body:**
```json
{
  "assignedClasses": [
    {
      "grade": "10",
      "section": "A", 
      "subject": "Mathematics"
    }
  ]
}
```

### 2. Update/Edit Assignments
```
PUT /api/admin/teachers/:teacherId/subject-assignment
```
**Body:**
```json
{
  "oldGrade": "10",
  "oldSection": "A",
  "oldSubject": "Mathematics",
  "newGrade": "11", 
  "newSection": "B",
  "newSubject": "Advanced Mathematics"
}
```

### 3. Delete Assignments
```
DELETE /api/admin/teachers/:teacherId/subject-assignment
```
**Body:**
```json
{
  "grade": "10",
  "section": "A",
  "subject": "Mathematics"
}
```

## Frontend Usage

### Adding New Assignments
1. Go to **Teacher Management** page
2. Click **"Assign Subjects"** button for any teacher
3. Select **Class** (Grade) and **Section**
4. Choose **Subjects** from the suggested list or type custom subjects
5. Click **Save**

### Editing Existing Assignments
1. In the **"Current Assignments"** section, click the **Edit** (✏️) icon next to any assignment
2. Modify the **Class**, **Section**, or **Subject** as needed
3. Click **Update** to save changes

### Deleting Assignments
1. In the **"Current Assignments"** section, click the **Delete** (🗑️) icon next to any assignment
2. Confirm the deletion in the popup dialog
3. The assignment will be removed immediately

## Data Structure

Each assignment contains:
- **grade**: Class level (e.g., "10", "11", "12")
- **section**: Section identifier (e.g., "A", "B", "C")
- **subject**: Subject name (e.g., "Mathematics", "Physics")

## Validation Rules

- **No Duplicates**: Cannot assign the same subject to the same class-section combination
- **Required Fields**: All fields (grade, section, subject) are mandatory
- **Conflict Prevention**: System checks for conflicts before allowing updates

## Error Handling

The system provides clear error messages for:
- Missing required fields
- Duplicate assignments
- Assignment not found (for updates/deletes)
- Server errors

## Testing

Use the provided test file to verify functionality:
```bash
node test-assignment-management.js
```

## Security

- All endpoints require **admin authentication**
- Uses JWT token-based authorization
- Input validation and sanitization implemented

## Notes

- Assignments are immediately reflected in the UI
- The system automatically refreshes teacher data after operations
- All operations are logged for audit purposes
- Time and day fields are not currently used but may be added in future updates