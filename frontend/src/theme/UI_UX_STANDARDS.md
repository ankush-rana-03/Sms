# UI/UX Standards - School Management System

## 🎯 **Overview**
This document defines the comprehensive UI/UX standards for the School Management System to ensure consistency, accessibility, and professional appearance across all components and pages.

## 📏 **Spacing System**
We use an **8px base unit** for consistent spacing throughout the application:

```typescript
spacing: {
  xs: 4,    // 4px  - Minimal spacing
  sm: 8,    // 8px  - Small spacing
  md: 16,   // 16px - Medium spacing (default)
  lg: 24,   // 24px - Large spacing
  xl: 32,   // 32px - Extra large spacing
  xxl: 48,  // 48px - Section spacing
}
```

### Usage Guidelines:
- **Component padding**: Use `md` (16px) as default
- **Section margins**: Use `xl` (32px) between major sections
- **Element spacing**: Use `sm` (8px) between related elements
- **Card spacing**: Use `lg` (24px) for card content

## 🔤 **Typography Scale**
Consistent typography hierarchy for readability and visual hierarchy:

```typescript
typography: {
  h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3 },
  h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
  caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5 },
  button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' },
}
```

### Typography Rules:
- **Page titles**: Use `h1` or `h2`
- **Section headers**: Use `h3` or `h4`
- **Card titles**: Use `h5` or `h6`
- **Body text**: Use `body1` for main content, `body2` for secondary
- **Buttons**: Use `button` variant for consistent button text

## 🎨 **Color System**
Consistent color palette for branding and accessibility:

### Primary Colors:
```typescript
primary: {
  main: '#1976d2',    // Primary brand color
  light: '#42a5f5',   // Light variant
  dark: '#1565c0',    // Dark variant
  contrast: '#ffffff' // Text on primary
}
```

### Semantic Colors:
```typescript
success: '#2e7d32'    // Success states
warning: '#ed6c02'    // Warning states
error: '#d32f2f'      // Error states
info: '#0288d1'       // Information states
```

### Color Usage:
- **Primary**: Main actions, navigation, branding
- **Success**: Confirmations, completed actions
- **Warning**: Caution, pending actions
- **Error**: Errors, destructive actions
- **Info**: Information, neutral actions

## 🔲 **Border Radius System**
Consistent corner rounding for modern, friendly appearance:

```typescript
borderRadius: {
  xs: 4,    // 4px  - Small elements
  sm: 8,    // 8px  - Buttons, inputs
  md: 12,   // 12px - Cards, panels
  lg: 16,   // 16px - Large cards
  xl: 20,   // 20px - Modals, dialogs
  xxl: 24,  // 24px - Hero sections
}
```

### Usage:
- **Buttons**: `sm` (8px)
- **Cards**: `md` (12px) to `lg` (16px)
- **Dialogs**: `xl` (20px)
- **Inputs**: `sm` (8px)

## 🌟 **Shadow System**
Layered shadows for depth and hierarchy:

```typescript
shadows: {
  sm: '0 2px 8px rgba(0,0,0,0.1)',      // Subtle elevation
  md: '0 4px 20px rgba(0,0,0,0.08)',    // Card elevation
  lg: '0 8px 40px rgba(0,0,0,0.12)',    // Modal elevation
  xl: '0 12px 60px rgba(0,0,0,0.15)',   // Hero elevation
}
```

### Shadow Usage:
- **Cards**: `md` shadow
- **Modals**: `lg` shadow
- **Hero sections**: `xl` shadow
- **Hover effects**: Increase shadow by one level

## ⚡ **Animation Standards**
Consistent motion for better user experience:

```typescript
transitions: {
  fast: '150ms ease-in-out',    // Hover effects
  normal: '250ms ease-in-out',  // Standard transitions
  slow: '350ms ease-in-out',    // Page transitions
}
```

### Animation Rules:
- **Hover effects**: Use `fast` (150ms)
- **State changes**: Use `normal` (250ms)
- **Page transitions**: Use `slow` (350ms)
- **Always use**: `ease-in-out` for smooth motion

## 📱 **Responsive Design Standards**
Mobile-first approach with consistent breakpoints:

```typescript
breakpoints: {
  xs: 0,      // Mobile: 0-599px
  sm: 600,    // Tablet: 600-899px
  md: 900,    // Desktop: 900-1199px
  lg: 1200,   // Large: 1200-1535px
  xl: 1536    // Extra large: 1536px+
}
```

### Responsive Guidelines:
- **Mobile-first**: Design for mobile, enhance for larger screens
- **Touch targets**: Minimum 44px × 44px for mobile
- **Typography**: Scale down on mobile (h1 → h2, h2 → h3)
- **Spacing**: Reduce padding on mobile (lg → md, md → sm)

## 🧩 **Component Standards**

### Cards:
```typescript
card: {
  borderRadius: 16,                    // lg radius
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', // md shadow
  padding: 24,                        // lg spacing
  hover: {
    transform: 'translateY(-4px)',    // Subtle lift
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)', // lg shadow
    transition: '250ms ease-in-out'   // normal transition
  }
}
```

### Buttons:
```typescript
button: {
  borderRadius: 8,                     // sm radius
  padding: '8px 24px',                // sm vertical, lg horizontal
  fontWeight: 600,                    // Semi-bold
  textTransform: 'none',              // No uppercase
  hover: {
    transform: 'translateY(-1px)',    // Subtle lift
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', // md shadow
    transition: '150ms ease-in-out'   // fast transition
  }
}
```

### Forms:
```typescript
form: {
  fieldSpacing: 16,                   // md spacing
  labelWeight: 600,                   // Semi-bold labels
  inputBorderRadius: 8,               // sm radius
  errorColor: '#d32f2f'              // Error color
}
```

## 📋 **Layout Standards**

### Page Structure:
```typescript
page: {
  padding: {
    xs: 16,   // Mobile: md spacing
    sm: 24,   // Tablet: lg spacing
    md: 32    // Desktop: xl spacing
  },
  maxWidth: '1200px',                 // Content width limit
  margin: '0 auto'                    // Center content
}
```

### Grid System:
```typescript
grid: {
  spacing: 16,                        // md spacing
  containerPadding: 16,               // md padding
  columns: {
    mobile: 1,                        // Single column
    tablet: 2,                        // Two columns
    desktop: 3,                       // Three columns
    large: 4                          // Four columns
  }
}
```

## 🎭 **Interaction Standards**

### Hover Effects:
- **Cards**: Lift up 4px with increased shadow
- **Buttons**: Lift up 1px with increased shadow
- **Links**: Color change with underline
- **Icons**: Scale up to 1.1x

### Focus States:
- **Visible focus**: Always show focus indicators
- **Keyboard navigation**: Support tab navigation
- **Screen readers**: Proper ARIA labels

### Loading States:
- **Skeletons**: Show content structure while loading
- **Spinners**: Use for short loading times
- **Progress bars**: Use for long operations

## ♿ **Accessibility Standards**

### Color Contrast:
- **Text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Keyboard Navigation:
- **Tab order**: Logical tab sequence
- **Skip links**: Skip to main content
- **Focus indicators**: Visible focus states

### Screen Readers:
- **ARIA labels**: Descriptive labels for elements
- **Semantic HTML**: Use proper HTML elements
- **Alt text**: Descriptive image alternatives

## 🔧 **Implementation Guidelines**

### 1. Use Standard Components:
```typescript
import StandardCard from '../components/StandardCard';
import StandardButton from '../components/StandardButton';
import StandardDialog from '../components/StandardDialog';
```

### 2. Follow Spacing System:
```typescript
// ✅ Correct - Using standard spacing
sx={{ p: 2, mb: 3, gap: 1 }}

// ❌ Incorrect - Arbitrary values
sx={{ p: '15px', mb: '25px', gap: '7px' }}
```

### 3. Use Typography Variants:
```typescript
// ✅ Correct - Using theme typography
<Typography variant="h5">Title</Typography>

// ❌ Incorrect - Custom styling
<Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Title</Typography>
```

### 4. Apply Consistent Shadows:
```typescript
// ✅ Correct - Using standard shadows
sx={{ boxShadow: UIStandards.shadows.md }}

// ❌ Incorrect - Custom shadows
sx={{ boxShadow: '0 3px 15px rgba(0,0,0,0.2)' }}
```

## 📱 **Mobile-First Checklist**

- [ ] Design for mobile screen size first
- [ ] Use touch-friendly button sizes (44px minimum)
- [ ] Implement responsive typography
- [ ] Test on actual mobile devices
- [ ] Ensure proper touch targets
- [ ] Optimize for mobile performance

## 🎨 **Design Review Checklist**

- [ ] Follows spacing system (8px base unit)
- [ ] Uses consistent typography scale
- [ ] Applies standard border radius
- [ ] Implements proper shadow hierarchy
- [ ] Follows color system guidelines
- [ ] Includes hover and focus states
- [ ] Responsive design implemented
- [ ] Accessibility standards met
- [ ] Performance optimized
- [ ] Consistent with existing components

## 📚 **Resources**

- **Material-UI Documentation**: https://mui.com/
- **Accessibility Guidelines**: https://www.w3.org/WAI/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Responsive Design**: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design

---

**Remember**: Consistency is key to professional appearance and user experience. Always refer to these standards when creating new components or modifying existing ones.