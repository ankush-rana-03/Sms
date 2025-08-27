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

  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [openFreshStartDialog, setOpenFreshStartDialog] = useState(false);
  const [openAutoCreateClassesDialog, setOpenAutoCreateClassesDialog] = useState(false);
  const [openCopyClassesDialog, setOpenCopyClassesDialog] = useState(false);
  const [openDeleteClassesDialog, setOpenDeleteClassesDialog] = useState(false);
  const [openDeleteSessionDialog, setOpenDeleteSessionDialog] = useState(false);
  const [rollingOverSessionId, setRollingOverSessionId] = useState<string | null>(null);
  const [selectedSourceSession, setSelectedSourceSession] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);



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

  // Local editable criteria state per session card (inline editor)
  const [criteriaEdits, setCriteriaEdits] = useState<Record<string, { minimumAttendance: number; minimumGrade: string; requireAllSubjects: boolean }>>({});
  const getCriteriaFor = (session: Session) => criteriaEdits[session._id] || session.promotionCriteria;
  const setCriteriaFor = (sessionId: string, updater: (prev: { minimumAttendance: number; minimumGrade: string; requireAllSubjects: boolean }) => { minimumAttendance: number; minimumGrade: string; requireAllSubjects: boolean }) => {
    setCriteriaEdits(prev => ({
      ...prev,
      [sessionId]: updater(prev[sessionId] || { minimumAttendance: 75, minimumGrade: 'D', requireAllSubjects: true })
    }));
  };

  // Track whether inline criteria editor is open per session
  const [criteriaEditOpen, setCriteriaEditOpen] = useState<Record<string, boolean>>({});

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenEditDialog(false);
      setSelectedSession(null);
      // If this update was for inline promotionCriteria, close the editor for that session
      if ((variables?.data || {}).promotionCriteria) {
        setCriteriaEditOpen(prev => ({ ...prev, [variables.id]: false }));
        // Clear local edits so newly fetched values reflect in UI
        setCriteriaEdits(prev => {
          const copy = { ...prev } as any;
          delete copy[variables.id];
          return copy;
        });
      }
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

  // Auto-create classes mutation
  const autoCreateClassesMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<any>(`/sessions/${sessionId}/auto-create-classes`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenAutoCreateClassesDialog(false);
      setSelectedSession(null);
    }
  });

  // Copy classes mutation
  const copyClassesMutation = useMutation({
    mutationFn: async ({ sessionId, sourceSessionId }: { sessionId: string; sourceSessionId: string }) => {
      const response = await api.post<any>(`/sessions/${sessionId}/copy-classes-from/${sourceSessionId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenCopyClassesDialog(false);
      setSelectedSession(null);
      setSelectedSourceSession('');
    }
  });

  // Auto Rollover mutation
  const rolloverMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<any>(`/sessions/${sessionId}/auto-rollover`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setRollingOverSessionId(null);
    },
    onError: () => setRollingOverSessionId(null)
  });

  // Delete classes mutation
  const deleteClassesMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.delete<any>(`/sessions/${sessionId}/classes`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpenDeleteClassesDialog(false);
      setSelectedSession(null);
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



  const handleArchiveSession = (session: Session) => {
    setSelectedSession(session);
    setOpenArchiveDialog(true);
  };

  const handleFreshStart = (session: Session) => {
    setSelectedSession(session);
    setOpenFreshStartDialog(true);
  };

  const handleAutoCreateClasses = (session: Session) => {
    setSelectedSession(session);
    setOpenAutoCreateClassesDialog(true);
  };

  const handleCopyClasses = (session: Session) => {
    setSelectedSession(session);
    setSelectedSourceSession('');
    setOpenCopyClassesDialog(true);
  };

  const handleDeleteClasses = (session: Session) => {
    setSelectedSession(session);
    setOpenDeleteClassesDialog(true);
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
      {sessions.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sessions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first session to get started with class management.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            disabled={!['admin', 'principal'].includes(user?.role || '')}
          >
            Create First Session
          </Button>
        </Box>
      ) : (
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

                <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Promotion Criteria{session.isCurrent ? ' (Current Session)' : session.status === 'archived' ? ' (Archived)' : ''}</Typography>
                    {session.isCurrent && !criteriaEditOpen[session._id] && (
                      <IconButton size="small" onClick={() => setCriteriaEditOpen(prev => ({ ...prev, [session._id]: true }))} disabled={!['admin','principal'].includes(user?.role || '')}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  {session.isCurrent && criteriaEditOpen[session._id] ? (
                      <>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Min Attendance (%)"
                              value={getCriteriaFor(session).minimumAttendance}
                              inputProps={{ min: 0, max: 100 }}
                              onChange={(e) => setCriteriaFor(session._id, (prev) => ({
                                ...prev,
                                minimumAttendance: Number(e.target.value)
                              }))}
                              disabled={!['admin','principal'].includes(user?.role || '')}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                              <InputLabel>Minimum Grade</InputLabel>
                              <Select
                                label="Minimum Grade"
                                value={getCriteriaFor(session).minimumGrade}
                                onChange={(e) => setCriteriaFor(session._id, (prev) => ({
                                  ...prev,
                                  minimumGrade: String(e.target.value)
                                }))}
                                disabled={!['admin','principal'].includes(user?.role || '')}
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
                                label="Require All Subjects"
                                value={String(getCriteriaFor(session).requireAllSubjects)}
                                onChange={(e) => setCriteriaFor(session._id, (prev) => ({
                                  ...prev,
                                  requireAllSubjects: e.target.value === 'true'
                                }))}
                                disabled={!['admin','principal'].includes(user?.role || '')}
                              >
                                <MenuItem value="true">Yes</MenuItem>
                                <MenuItem value="false">No</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => updateSessionMutation.mutate({ id: session._id, data: { promotionCriteria: getCriteriaFor(session) } })}
                              disabled={!['admin','principal'].includes(user?.role || '') || updateSessionMutation.isPending}
                            >
                              {updateSessionMutation.isPending ? 'Saving…' : 'Save'}
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => { setCriteriaEditOpen(prev => ({ ...prev, [session._id]: false })); setCriteriaEdits(prev => { const copy = { ...prev } as any; delete copy[session._id]; return copy; }); }}
                              disabled={updateSessionMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </Grid>
                        </Grid>
                      </>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">Min Attendance: <strong>{session.promotionCriteria.minimumAttendance}%</strong></Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">Min Grade: <strong>{session.promotionCriteria.minimumGrade}</strong></Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">Require All Subjects: <strong>{session.promotionCriteria.requireAllSubjects ? 'Yes' : 'No'}</strong></Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {/* Class Creation Options - Show for all sessions */}
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<SchoolIcon />}
                    onClick={() => handleAutoCreateClasses(session)}
                    disabled={!['admin', 'principal'].includes(user?.role || '') || session.status === 'archived'}
                    sx={{ mb: 1 }}
                  >
                    Auto-Create Classes
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => {
                      setRollingOverSessionId(session._id);
                      rolloverMutation.mutate(session._id);
                    }}
                    disabled={!['admin', 'principal'].includes(user?.role || '') || rolloverMutation.isPending || session.status === 'archived'}
                    sx={{ mb: 1 }}
                  >
                    {rollingOverSessionId === session._id && rolloverMutation.isPending ? 'Rolling Over…' : 'Auto Rollover'}
                  </Button>
                  {!['admin', 'principal'].includes(user?.role || '') && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Admin/Principal access required for class creation
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => handleCopyClasses(session)}
                    disabled={!['admin', 'principal'].includes(user?.role || '') || session.status === 'archived'}
                    sx={{ mb: 1 }}
                  >
                    Copy Classes
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClasses(session)}
                    disabled={!['admin', 'principal'].includes(user?.role || '')}
                    sx={{ mb: 1 }}
                  >
                    Delete Classes
                  </Button>

                  {/* Session Management Options */}
                  {session.status === 'active' && (
                    <>
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
                          onClick={() => { setSelectedSession(session); setOpenDeleteSessionDialog(true); }}
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
      )}

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

      {/* Auto-Create Classes Dialog */}
      <Dialog open={openAutoCreateClassesDialog} onClose={() => setOpenAutoCreateClassesDialog(false)}>
        <DialogTitle>Auto-Create Classes</DialogTitle>
        <DialogContent>
          <Typography>
            This will automatically create classes for session "{selectedSession?.name}" using a standard template:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• Nursery, LKG, UKG: 3 sections each (A, B, C)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Classes 1-12: 2 sections each (A, B)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Default capacity: 25 for pre-primary, 30 for primary/secondary" />
            </ListItem>
          </List>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAutoCreateClassesDialog(false)}>Cancel</Button>
          <Button
            onClick={() => autoCreateClassesMutation.mutate(selectedSession!._id)}
            variant="contained"
            color="primary"
            disabled={autoCreateClassesMutation.isPending}
          >
            {autoCreateClassesMutation.isPending ? 'Creating...' : 'Create Classes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Classes Dialog */}
      <Dialog open={openCopyClassesDialog} onClose={() => setOpenCopyClassesDialog(false)}>
        <DialogTitle>Copy Classes from Previous Session</DialogTitle>
        <DialogContent>
          <Typography>
            This will copy all classes from a previous session to "{selectedSession?.name}".
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Select the source session to copy from:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Source Session</InputLabel>
            <Select
              value={selectedSourceSession}
              onChange={(e) => setSelectedSourceSession(e.target.value)}
              disabled={copyClassesMutation.isPending}
            >
              <MenuItem value="">
                <em>Select a session...</em>
              </MenuItem>
              {sessions?.filter(session => session._id !== selectedSession?._id).map((session) => (
                <MenuItem key={session._id} value={session._id}>
                  {session.name} ({session.academicYear})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedSourceSession && (
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>
              This will copy all classes from the selected session. Existing classes in the target session will be skipped.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCopyClassesDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedSourceSession && selectedSession) {
                copyClassesMutation.mutate({
                  sessionId: selectedSession._id,
                  sourceSessionId: selectedSourceSession
                });
              }
            }}
            variant="contained"
            color="primary"
            disabled={!selectedSourceSession || copyClassesMutation.isPending}
          >
            {copyClassesMutation.isPending ? 'Copying...' : 'Copy Classes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Classes Dialog */}
      <Dialog open={openDeleteClassesDialog} onClose={() => setOpenDeleteClassesDialog(false)}>
        <DialogTitle>Delete All Classes</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete ALL classes from session "{selectedSession?.name}".
          </Typography>
          <Typography sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
            ⚠️ WARNING: This action cannot be undone!
          </Typography>
          <List sx={{ mt: 2 }}>
            <ListItem>
              <ListItemText primary="• All classes will be permanently deleted" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All teacher assignments for these classes will be removed" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Students in these classes will need to be reassigned" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• This action cannot be reversed" />
            </ListItem>
          </List>
          <Typography sx={{ mt: 2 }}>
            Are you absolutely sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteClassesDialog(false)}>Cancel</Button>
          <Button
            onClick={() => deleteClassesMutation.mutate(selectedSession!._id)}
            variant="contained"
            color="error"
            disabled={deleteClassesMutation.isPending}
          >
            {deleteClassesMutation.isPending ? 'Deleting...' : 'Delete All Classes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Session Dialog (permanent deletion) */}
      <Dialog open={openDeleteSessionDialog} onClose={() => setOpenDeleteSessionDialog(false)}>
        <DialogTitle>Delete Session Permanently</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the session "{selectedSession?.name}"?
          </Typography>
          <Typography sx={{ mt: 1 }} color="error">
            This will permanently delete ALL related data and cannot be retrieved back:
          </Typography>
          <List sx={{ mt: 1 }}>
            <ListItem>
              <ListItemText primary="• The session record" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All classes under this session" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All attendance records for this session" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All results tied to this session" />
            </ListItem>
          </List>
          <Typography sx={{ mt: 1, color: 'error.main', fontWeight: 'bold' }}>
            This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSessionDialog(false)}>Cancel</Button>
          <Button
            onClick={() => { if (selectedSession) { deleteSessionMutation.mutate(selectedSession._id); setOpenDeleteSessionDialog(false); } }}
            variant="contained"
            color="error"
            disabled={deleteSessionMutation.isPending}
          >
            {deleteSessionMutation.isPending ? 'Deleting…' : 'Yes, Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions;