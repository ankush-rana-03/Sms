import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import {
  Add,
  Delete,
  Assignment,
  CheckCircle
} from '@mui/icons-material';

interface ClassData {
  _id: string;
  name: string;
  grade: string;
  section: string;
}

interface SubjectClassAssignmentData {
  classId: string;
  className: string;
  grade: string;
  section: string;
  subjects: string[];
}

interface SubjectClassAssignmentProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  availableClasses: ClassData[];
  currentAssignments: SubjectClassAssignmentData[];
  onSave: (assignments: SubjectClassAssignmentData[]) => void;
}

export default function SubjectClassAssignment() {
  // Deprecated component - use the Assign Classes & Subjects dialog in TeacherManagement instead
  return null as any;
}