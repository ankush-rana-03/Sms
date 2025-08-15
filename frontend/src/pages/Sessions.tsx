import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService as api } from '../services/api';

interface Session {
  _id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  isCurrent: boolean;
  description: string;
  promotionCriteria: {
    minimumAttendance: number;
    minimumGrade: string;
    requireAllSubjects: boolean;
  };
  archivedData?: {
    students: Array<{
      studentId: string;
      finalGrade: string;
      promotionStatus: string;
      attendancePercentage: number;
      archivedAt: string;
    }>;
    classes: Array<{
      classId: string;
      archivedAt: string;
    }>;
  };
  createdAt: string;
}



const Sessions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPromotionDialog, setOpenPromotionDialog] = useState(false);
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [openFreshStartDialog, setOpenFreshStartDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [promotionResults, setPromotionResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    description: '',
    minimumAttendance: 75,
    minimumGrade: 'D',
    requireAllSubjects: true
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get<Session[]>('/sessions');
      return response;
    }
  });

  // Fetch current session
  const { data: currentSession } = useQuery({
    queryKey: ['currentSession'],
    queryFn: async () => {
      const response = await api.get<Session | null>('/sessions/current');
      return response;
    }
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<Session>('/sessions', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['currentSession'] });
      setOpenCreateDialog(false);
      setFormData({
        name: '',
        academicYear: '',
        startDate: '',
        endDate: '',
        description: '',
        minimumAttendance: 75,
        minimumGrade: 'D',
        requireAllSubjects: true
      });
    }
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put<Session>(`/sessions/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenEditDialog(false);
      setSelectedSession(null);
    }
  });

  // Process promotions mutation
  const processPromotionsMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<any>(`/sessions/${sessionId}/process-promotions`);
      return response;
    },
    onSuccess: (data) => {
      setPromotionResults(data.results);
      setOpenPromotionDialog(true);
    }
  });

  // Archive session mutation
  const archiveSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<any>(`/sessions/${sessionId}/archive`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenArchiveDialog(false);
      setSelectedSession(null);
    }
  });

  // Fresh start mutation
  const freshStartMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<any>(`/sessions/${sessionId}/fresh-start`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenFreshStartDialog(false);
      setSelectedSession(null);
    }
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.delete<any>(`/sessions/${sessionId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const handleCreateSession = () => {
    const sessionData = {
      name: formData.name,
      academicYear: formData.academicYear,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      promotionCriteria: {
        minimumAttendance: formData.minimumAttendance,
        minimumGrade: formData.minimumGrade,
        requireAllSubjects: formData.requireAllSubjects
      }
    };
    createSessionMutation.mutate(sessionData);
  };

  const handleEditSession = () => {
    if (!selectedSession) return;
    updateSessionMutation.mutate({
      id: selectedSession._id,
      data: formData
    });
  };

  const handleProcessPromotions = (session: Session) => {
    setSelectedSession(session);
    processPromotionsMutation.mutate(session._id);
  };

  const handleArchiveSession = (session: Session) => {
    setSelectedSession(session);
    setOpenArchiveDialog(true);
  };

  const handleFreshStart = (session: Session) => {
    setSelectedSession(session);
    setOpenFreshStartDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'completed': return <WarningIcon />;
      case 'archived': return <ArchiveIcon />;
      default: return <CancelIcon />;
    }
  };

  if (sessionsLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          Session Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          disabled={!['admin', 'principal'].includes(user?.role || '')}
        >
          Create Session
        </Button>
      </Box>

      {/* Current Session Info */}
      {currentSession && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Active Session
            </Typography>
            <Typography variant="body1">
              {currentSession.name} ({currentSession.academicYear})
            </Typography>
            <Typography variant="body2">
              {new Date(currentSession.startDate).toLocaleDateString()} - {new Date(currentSession.endDate).toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Sessions Grid */}
      <Grid container spacing={3}>
        {sessions.map((session: Session) => (
          <Grid item xs={12} md={6} lg={4} key={session._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {session.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(session.status)}
                    label={session.status}
                    color={getStatusColor(session.status) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {session.academicYear}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                </Typography>
                
                {session.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {session.description}
                  </Typography>
                )}

                {session.isCurrent && (
                  <Chip label="Current Session" color="primary" size="small" sx={{ mb: 2 }} />
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {session.status === 'active' && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<TrendingUpIcon />}
                        onClick={() => handleProcessPromotions(session)}
                        disabled={!['admin', 'principal'].includes(user?.role || '')}
                      >
                        Process Promotions
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ArchiveIcon />}
                        onClick={() => handleArchiveSession(session)}
                        disabled={!['admin', 'principal'].includes(user?.role || '')}
                      >
                        Archive
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => handleFreshStart(session)}
                        disabled={!['admin', 'principal'].includes(user?.role || '')}
                      >
                        Fresh Start
                      </Button>
                    </>
                  )}
                  
                  {['admin', 'principal'].includes(user?.role || '') && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSession(session);
                          setFormData({
                            name: session.name,
                            academicYear: session.academicYear,
                            startDate: session.startDate.split('T')[0],
                            endDate: session.endDate.split('T')[0],
                            description: session.description,
                            minimumAttendance: session.promotionCriteria.minimumAttendance,
                            minimumGrade: session.promotionCriteria.minimumGrade,
                            requireAllSubjects: session.promotionCriteria.requireAllSubjects
                          });
                          setOpenEditDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      
                      {session.status === 'archived' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteSessionMutation.mutate(session._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Session Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 2024-25 Session"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g., 2024-2025"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Promotion Criteria
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Attendance (%)"
                value={formData.minimumAttendance}
                onChange={(e) => setFormData({ ...formData, minimumAttendance: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Minimum Grade</InputLabel>
                <Select
                  value={formData.minimumGrade}
                  onChange={(e) => setFormData({ ...formData, minimumGrade: e.target.value })}
                  label="Minimum Grade"
                >
                  <MenuItem value="F">F</MenuItem>
                  <MenuItem value="E">E</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="A">A</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Require All Subjects</InputLabel>
                <Select
                  value={formData.requireAllSubjects.toString()}
                  onChange={(e) => setFormData({ ...formData, requireAllSubjects: e.target.value === 'true' })}
                  label="Require All Subjects"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Session</DialogTitle>
        <DialogContent>
          {/* Same form as create dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEditSession}
            variant="contained"
            disabled={updateSessionMutation.isPending}
          >
            {updateSessionMutation.isPending ? 'Updating...' : 'Update Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Results Dialog */}
      <Dialog open={openPromotionDialog} onClose={() => setOpenPromotionDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Promotion Results</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Attendance %</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotionResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.studentName}</TableCell>
                    <TableCell>{result.grade}</TableCell>
                    <TableCell>{result.section}</TableCell>
                    <TableCell>{result.attendancePercentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip
                        label={result.promotionStatus}
                        color={result.promotionStatus === 'promoted' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{result.promotionNotes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPromotionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={openArchiveDialog} onClose={() => setOpenArchiveDialog(false)}>
        <DialogTitle>Archive Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to archive the session "{selectedSession?.name}"? 
            This will move all session data to archive and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenArchiveDialog(false)}>Cancel</Button>
          <Button
            onClick={() => archiveSessionMutation.mutate(selectedSession!._id)}
            variant="contained"
            color="warning"
            disabled={archiveSessionMutation.isPending}
          >
            {archiveSessionMutation.isPending ? 'Archiving...' : 'Archive Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fresh Start Confirmation Dialog */}
      <Dialog open={openFreshStartDialog} onClose={() => setOpenFreshStartDialog(false)}>
        <DialogTitle>Prepare Fresh Start</DialogTitle>
        <DialogContent>
          <Typography>
            This will prepare promoted students for the next session by:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• Incrementing grades for promoted students" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Resetting promotion status to pending" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Deactivating current session classes" />
            </ListItem>
          </List>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFreshStartDialog(false)}>Cancel</Button>
          <Button
            onClick={() => freshStartMutation.mutate(selectedSession!._id)}
            variant="contained"
            color="primary"
            disabled={freshStartMutation.isPending}
          >
            {freshStartMutation.isPending ? 'Processing...' : 'Proceed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions;