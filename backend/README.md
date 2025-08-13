
## Scheduling Module

- POST `/api/admin/teachers/:teacherId/assign-classes`
  - Body: `{ assignedClasses: [{ class, section, subject, grade, time, day }], replace?: boolean }`
  - Validation: prevents assigning the same teacher at the same day+time across any class/section. Returns 400 with message "Time is already assigned".
- GET `/api/admin/teachers/:teacherId/assignments` returns class-wise grouped subjects with day/time.
- GET `/api/classes/:classId/assignments` lists subjects and teachers for a class.