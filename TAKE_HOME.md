# Frontend Take-Home Assignment (2–3 hours)

## Overview
This project provides a **production-ready foundation** for monitoring Ethereum address balances. Your task is to extend this application with **advanced features** that demonstrate your frontend engineering skills.

## Current State ✅
The application already includes:
- Professional React + TypeScript architecture
- Real-time ETH balance and price fetching
- Comprehensive error handling and retry logic
- Beautiful UI with shadcn/ui components
- Responsive design and accessibility features
- Testing infrastructure and code quality tools

## Your Mission 🎯
Choose **3 features** from the categories below to implement within **3 hours**. Focus on **quality over quantity** – we want to see your best work.

---

## Core Features (Pick 2)

### 🏗️ **A. Dynamic Address Management**
**Estimated Time: 45-60 minutes**

Implement the ability to add and remove addresses dynamically:

- **Add Address Form**: Input field with Ethereum address validation
- **Remove Address**: Delete button on each address card
- **Persistence**: Save address list to localStorage
- **Validation**: Prevent duplicates and invalid addresses
- **UX Polish**: Success/error notifications for add/remove actions

**Bonus**: Import addresses from CSV or batch add multiple addresses

---

### 📊 **B. Advanced Data Table with Pagination**
**Estimated Time: 60-75 minutes**

Replace the card grid with a sophisticated data table:

- **Sortable Columns**: Click headers to sort by balance, USD value, address
- **Pagination**: Handle 20+ addresses with proper pagination controls
- **Search/Filter**: Filter addresses by balance range or search by address
- **Virtual Scrolling**: Implement for 100+ addresses (performance focus)
- **Export**: Download data as CSV or JSON

**Bonus**: Column visibility toggles and resizable columns

---

### 🎨 **C. Real-time Dashboard Enhancements**
**Estimated Time: 45-60 minutes**

Add interactive dashboard features:

- **Live Updates**: Auto-refresh data every 30 seconds with subtle indicators
- **Balance Alerts**: Set threshold alerts for address balance changes
- **Historical Tracking**: Show balance change indicators (↑ ↓) since last refresh
- **Summary Statistics**: Average balance, highest/lowest exposure
- **Interactive Charts**: Simple bar/pie chart showing balance distribution

**Bonus**: Desktop notifications for balance changes

---

## Advanced Features (Pick 1)

### 🚀 **D. Performance & Caching**
**Estimated Time: 60-75 minutes**

Implement advanced performance optimizations:

- **Smart Caching**: Cache balance data with different TTL per address
- **Background Sync**: Update stale data in background without blocking UI
- **Request Batching**: Batch multiple balance requests efficiently
- **Offline Support**: Show cached data when offline with status indicator
- **Performance Monitoring**: Track and display API response times

**Bonus**: Service Worker implementation for true offline support

---

### 🎭 **E. Theme System & Dark Mode**
**Estimated Time: 45-60 minutes**

Create a comprehensive theming system:

- **Dark/Light Mode**: Toggle with smooth transitions and persistence
- **Theme Customization**: Multiple color schemes (blue, green, purple)
- **System Preference**: Respect user's OS dark mode setting
- **Theme Preview**: Live preview when selecting themes
- **Accessibility**: Ensure WCAG compliance in all themes

**Bonus**: Auto dark mode based on time of day

---

### 🧪 **F. Testing & Quality**
**Estimated Time: 60-90 minutes**

Demonstrate testing excellence:

- **Component Tests**: Test ExposurePage with different states
- **Hook Tests**: Comprehensive tests for useBalance and usePrice with mocks
- **Integration Tests**: Full user flow testing with MSW
- **Accessibility Tests**: Automated a11y testing with jest-axe
- **Performance Tests**: Bundle size and rendering performance checks

**Bonus**: Visual regression testing setup

---

## Stretch Goals (Time Permitting)

### 🎪 **G. Micro-Interactions & Polish**
- Smooth animations for data updates
- Loading skeletons during transitions
- Hover effects and micro-feedback
- Toast notifications for actions
- Keyboard shortcuts for power users

### 🔗 **H. Advanced Routing**
- Deep links with address filtering in URL
- Browser back/forward support
- Route-based state management
- Shareable filtered views

---

## Evaluation Criteria 📋

We'll evaluate your submission on:

1. **Code Quality**: Architecture, patterns, and maintainability
2. **User Experience**: Intuitive design and smooth interactions
3. **Technical Depth**: Problem-solving and implementation approach
4. **Performance**: Optimization and efficient rendering
5. **Testing**: Quality and coverage of tests (if implemented)
6. **Documentation**: Clear explanations of decisions and trade-offs

## Submission Guidelines 📤

1. **Document Your Approach**: Add a `DECISIONS.md` file explaining:
   - Which features you chose and why
   - Technical challenges you encountered
   - Trade-offs you made
   - What you would improve given more time

2. **Code Quality**: Ensure your code follows the existing patterns and standards

3. **Testing**: If you add new features, include basic tests

4. **README Updates**: Update the README with your new features

## Success Tips 💡

- **Start Simple**: Get basic functionality working before adding polish
- **Leverage Existing**: Build upon the excellent foundation provided
- **Focus on UX**: Small details make a big difference
- **Performance Matters**: Consider how your changes affect app performance
- **Ask Questions**: Clarify requirements if anything is unclear

---

**Good luck! We're excited to see your frontend engineering skills in action.** 🚀

> **Note**: The existing codebase demonstrates production-ready practices. Your additions should maintain this quality standard. 