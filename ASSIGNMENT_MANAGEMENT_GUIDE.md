# Teacher Assignment Management Guide

## Overview

This guide explains how to manage teacher assignments (subject, class, and section) in your school management system. You can now **create**, **edit**, and **delete** individual assignments for teachers.

## Features

### ✅ What's Available Now

1. **Create New Assignments** - Assign new subjects to specific class-section combinations
2. **View Current Assignments** - See all assignments for a teacher
3. **Edit Existing Assignments** - Modify grade, section, or subject for any assignment
4. **Delete Individual Assignments** - Remove specific assignments without affecting others
5. **Duplicate Prevention** - System prevents duplicate assignments automatically

### 🔧 Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/teachers/:teacherId/assign-classes` | Assign new classes/subjects |
| `PUT` | `/api/admin/teachers/:teacherId/assignments/:assignmentId` | Update existing assignment |
| `DELETE` | `/api/admin/teachers/:teacherId/assignments/:assignmentId` | Delete specific assignment |

## How to Use

### 1. Viewing Current Assignments

When you select a teacher in the Teacher Management page, you'll see their current assignments displayed as chips below the assignment form.

### 2. Editing an Assignment

1. **Click the Edit Icon** (✏️) on any assignment chip
2. **Modify the fields** in the popup dialog:
   - Grade (e.g., "10", "11", "12")
   - Section (e.g., "A", "B", "C")
   - Subject (e.g., "Mathematics", "Physics")
3. **Click "Update Assignment"** to save changes

### 3. Deleting an Assignment

1. **Click the Delete Icon** (🗑️) on any assignment chip
2. **Confirm the deletion** in the popup dialog
3. The assignment will be permanently removed

### 4. Adding New Assignments

1. **Fill in the assignment form**:
   - Select Grade and Section
   - Add subjects (comma-separated or individual chips)
2. **Click "Save"** to create new assignments

## Data Structure

Each assignment contains:
```json
{
  "_id": "unique-assignment-id",
  "grade": "10",
  "section": "A", 
  "subject": "Mathematics"
}
```

## Validation Rules

- **No Duplicates**: Cannot have the same subject for the same grade-section combination
- **Required Fields**: Grade, section, and subject are all mandatory
- **Unique IDs**: Each assignment has a unique identifier for editing/deleting

## Error Handling

The system provides clear error messages for:
- Missing required fields
- Duplicate assignments
- Invalid teacher or assignment IDs
- Database connection issues

## Security

- **Admin Only**: All assignment management requires admin privileges
- **Authentication**: JWT token validation required
- **Authorization**: Admin role verification

## Troubleshooting

### Common Issues

1. **"Assignment not found"**
   - The assignment ID may be invalid
   - Refresh the page and try again

2. **"Already assigned" error**
   - Check for existing assignments with the same grade-section-subject
   - Use edit instead of create for existing assignments

3. **"Teacher not found" error**
   - Verify the teacher ID is correct
   - Check if the teacher was deleted

### Best Practices

1. **Always verify** grade-section-subject combinations before assigning
2. **Use edit** for modifications instead of deleting and recreating
3. **Check for conflicts** when assigning multiple subjects to the same class
4. **Backup data** before making bulk changes

## API Examples

### Update Assignment
```bash
PUT /api/admin/teachers/teacher123/assignments/assignment456
{
  "grade": "11",
  "section": "B", 
  "subject": "Chemistry"
}
```

### Delete Assignment
```bash
DELETE /api/admin/teachers/teacher123/assignments/assignment456
```

## Frontend Integration

The frontend automatically:
- Refreshes data after changes
- Shows success/error messages
- Updates the UI in real-time
- Prevents invalid operations

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your admin permissions
3. Ensure the backend server is running
4. Check the database connection

---

**Note**: This system maintains data integrity by preventing duplicate assignments and ensuring all required fields are provided.