# UI/UX Implementation Guide - School Management System

## 🚀 **Quick Start**

### 1. Import Standard Components
```typescript
import { 
  StandardCard, 
  StandardButton, 
  StandardDialog,
  useResponsive 
} from '../components';
```

### 2. Import UI Standards
```typescript
import { UIStandards, ComponentStandards } from '../theme';
```

### 3. Use Responsive Hooks
```typescript
const { isMobile, isTablet, isDesktop } = useResponsive();
```

## 📱 **Mobile-First Implementation**

### Responsive Grid System
```typescript
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid item xs={12} sm={6} md={4}>
    <StandardCard>
      Content here
    </StandardCard>
  </Grid>
</Grid>
```

### Responsive Typography
```typescript
<Typography variant={isMobile ? "h6" : "h5"}>
  Responsive Title
</Typography>
```

### Responsive Spacing
```typescript
<Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
  Content with responsive padding
</Box>
```

## 🎨 **Component Usage Examples**

### Standard Card
```typescript
<StandardCard
  title="Card Title"
  subtitle="Card subtitle"
  size="medium"
  variant="default"
  hover={true}
  onClick={() => handleClick()}
>
  <Typography variant="body1">
    Card content goes here
  </Typography>
</StandardCard>
```

### Standard Button
```typescript
<StandardButton
  variant="contained"
  color="primary"
  size="medium"
  icon={<Add />}
  iconPosition="start"
  fullWidth={false}
>
  Add New Item
</StandardButton>
```

### Standard Dialog
```typescript
<StandardDialog
  open={open}
  onClose={handleClose}
  title="Dialog Title"
  subtitle="Optional subtitle"
  size="medium"
  dividers={true}
  actions={
    <>
      <StandardButton onClick={handleCancel}>Cancel</StandardButton>
      <StandardButton variant="contained" onClick={handleSave}>
        Save
      </StandardButton>
    </>
  }
>
  <Typography variant="body1">
    Dialog content goes here
  </Typography>
</StandardDialog>
```

## 📏 **Spacing Implementation**

### Using Standard Spacing
```typescript
// ✅ Correct - Using theme spacing
sx={{ 
  p: 2,        // 16px (md)
  mb: 3,       // 24px (lg)
  gap: 1,      // 8px (sm)
  mx: 4        // 32px (xl)
}}

// ❌ Incorrect - Arbitrary values
sx={{ 
  p: '15px',   // Not following 8px base unit
  mb: '25px',  // Not following 8px base unit
  gap: '7px'   // Not following 8px base unit
}}
```

### Responsive Spacing
```typescript
sx={{
  p: { xs: 2, sm: 3, md: 4 },        // 16px, 24px, 32px
  mb: { xs: 2, sm: 3, md: 4 },       // 16px, 24px, 32px
  gap: { xs: 1, sm: 2, md: 3 }       // 8px, 16px, 24px
}}
```

## 🔤 **Typography Implementation**

### Using Typography Variants
```typescript
// ✅ Correct - Using theme typography
<Typography variant="h5">Section Title</Typography>
<Typography variant="body1">Main content text</Typography>
<Typography variant="caption">Small helper text</Typography>

// ❌ Incorrect - Custom styling
<Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
  Custom styled text
</Typography>
```

### Responsive Typography
```typescript
<Typography variant={isMobile ? "h6" : "h5"}>
  Responsive heading
</Typography>

<Typography variant={isMobile ? "body2" : "body1"}>
  Responsive body text
</Typography>
```

## 🌟 **Shadow Implementation**

### Using Standard Shadows
```typescript
// ✅ Correct - Using theme shadows
sx={{ boxShadow: UIStandards.shadows.md }}
sx={{ boxShadow: UIStandards.shadows.lg }}

// ❌ Incorrect - Custom shadows
sx={{ boxShadow: '0 3px 15px rgba(0,0,0,0.2)' }}
```

### Hover Shadow Effects
```typescript
sx={{
  boxShadow: UIStandards.shadows.md,
  transition: UIStandards.transitions.normal,
  '&:hover': {
    boxShadow: UIStandards.shadows.lg,
    transform: 'translateY(-4px)'
  }
}}
```

## 🔲 **Border Radius Implementation**

### Using Standard Border Radius
```typescript
// ✅ Correct - Using theme border radius
sx={{ borderRadius: UIStandards.borderRadius.md }}
sx={{ borderRadius: UIStandards.borderRadius.lg }}

// ❌ Incorrect - Custom values
sx={{ borderRadius: '10px' }}
```

### Component-Specific Border Radius
```typescript
// Buttons
sx={{ borderRadius: UIStandards.borderRadius.sm }}

// Cards
sx={{ borderRadius: UIStandards.borderRadius.md }}

// Dialogs
sx={{ borderRadius: UIStandards.borderRadius.xl }}
```

## ⚡ **Animation Implementation**

### Using Standard Transitions
```typescript
// ✅ Correct - Using theme transitions
sx={{ transition: UIStandards.transitions.fast }}
sx={{ transition: UIStandards.transitions.normal }}

// ❌ Incorrect - Custom transitions
sx={{ transition: '200ms ease' }}
```

### Hover Animations
```typescript
sx={{
  transition: UIStandards.transitions.fast,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: UIStandards.shadows.lg
  }
}}
```

## 🎨 **Color Implementation**

### Using Theme Colors
```typescript
// ✅ Correct - Using theme colors
sx={{ color: 'primary.main' }}
sx={{ backgroundColor: 'success.main' }}
sx={{ borderColor: 'warning.main' }}

// ❌ Incorrect - Hardcoded colors
sx={{ color: '#1976d2' }}
sx={{ backgroundColor: '#4caf50' }}
```

### Semantic Color Usage
```typescript
// Success states
sx={{ color: 'success.main' }}

// Warning states
sx={{ color: 'warning.main' }}

// Error states
sx={{ color: 'error.main' }}

// Info states
sx={{ color: 'info.main' }}
```

## 📱 **Responsive Design Patterns**

### Mobile-First Grid
```typescript
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
  {/* Single column on mobile, multiple on larger screens */}
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <StandardCard>Content</StandardCard>
  </Grid>
</Grid>
```

### Responsive Layout
```typescript
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 3 },
  alignItems: { xs: 'stretch', md: 'center' }
}}>
  <Box sx={{ flex: { xs: 'none', md: 1 } }}>
    Left content
  </Box>
  <Box sx={{ flex: { xs: 'none', md: 2 } }}>
    Right content
  </Box>
</Box>
```

### Responsive Navigation
```typescript
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

return (
  <Box sx={{
    display: { xs: 'none', md: 'block' }  // Hide on mobile
  }}>
    Desktop navigation
  </Box>
);
```

## 🧩 **Component Composition**

### Building Complex Components
```typescript
const UserProfileCard: React.FC = () => {
  const { isMobile } = useResponsive();
  
  return (
    <StandardCard
      title="User Profile"
      size={isMobile ? 'small' : 'medium'}
      hover={true}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 3 },
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Avatar sx={{ width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 } }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant={isMobile ? 'h6' : 'h5'}>
            John Doe
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Software Developer
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <StandardButton size="small" variant="outlined">
          Edit Profile
        </StandardButton>
        <StandardButton size="small" variant="contained" color="primary">
          View Details
        </StandardButton>
      </Box>
    </StandardCard>
  );
};
```

## 🔧 **Performance Optimization**

### Lazy Loading Components
```typescript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Memoization for Expensive Components
```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
  return <StandardCard>...</StandardCard>;
});
```

### Conditional Rendering
```typescript
{isLoading ? (
  <LoadingSpinner />
) : (
  <StandardCard>
    <Typography variant="body1">Content loaded</Typography>
  </StandardCard>
)}
```

## ♿ **Accessibility Implementation**

### ARIA Labels
```typescript
<StandardButton
  aria-label="Add new student"
  aria-describedby="add-student-help"
>
  Add Student
</StandardButton>

<div id="add-student-help" className="sr-only">
  Click to add a new student to the system
</div>
```

### Keyboard Navigation
```typescript
<StandardCard
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Keyboard accessible card
</StandardCard>
```

### Focus Management
```typescript
const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

useEffect(() => {
  if (focusedElement) {
    focusedElement.focus();
  }
}, [focusedElement]);
```

## 📋 **Code Review Checklist**

### UI Standards
- [ ] Uses standard spacing (8px base unit)
- [ ] Applies consistent typography variants
- [ ] Uses standard border radius values
- [ ] Implements proper shadow hierarchy
- [ ] Follows color system guidelines

### Responsive Design
- [ ] Mobile-first approach implemented
- [ ] Responsive breakpoints used correctly
- [ ] Touch targets are 44px minimum
- [ ] Typography scales appropriately
- [ ] Layout adapts to screen size

### Component Usage
- [ ] Standard components used where appropriate
- [ ] Custom styling follows theme standards
- [ ] Hover and focus states implemented
- [ ] Loading states handled properly
- [ ] Error states styled consistently

### Performance
- [ ] Components are properly memoized
- [ ] Lazy loading implemented for heavy components
- [ ] Conditional rendering optimized
- [ ] Unnecessary re-renders avoided

### Accessibility
- [ ] ARIA labels provided
- [ ] Keyboard navigation supported
- [ ] Focus management implemented
- [ ] Color contrast meets standards
- [ ] Screen reader compatibility

## 🚨 **Common Mistakes to Avoid**

### 1. Hardcoded Values
```typescript
// ❌ Don't do this
sx={{ padding: '20px', margin: '15px' }}

// ✅ Do this instead
sx={{ p: 2.5, m: 2 }}  // 20px, 16px (closest to 8px base unit)
```

### 2. Custom Typography
```typescript
// ❌ Don't do this
sx={{ fontSize: '16px', fontWeight: 'bold' }}

// ✅ Do this instead
<Typography variant="body1" sx={{ fontWeight: 600 }}>
  Text content
</Typography>
```

### 3. Inconsistent Spacing
```typescript
// ❌ Don't do this
sx={{ p: 2, mb: 4, gap: 1.5 }}

// ✅ Do this instead
sx={{ p: 2, mb: 4, gap: 2 }}  // All values follow 8px base unit
```

### 4. Missing Responsive Design
```typescript
// ❌ Don't do this
sx={{ width: '300px', padding: '20px' }}

// ✅ Do this instead
sx={{ 
  width: { xs: '100%', sm: '300px' },
  p: { xs: 2, sm: 2.5 }
}}
```

## 📚 **Additional Resources**

- **Material-UI Documentation**: https://mui.com/
- **UI Standards File**: `src/theme/uiStandards.ts`
- **Component Examples**: `src/components/`
- **Theme Configuration**: `src/theme/theme.ts`

---

**Remember**: Consistency in UI/UX creates trust and improves user experience. Always refer to these standards when building new features or modifying existing ones.