# Live Coding Interview Guide

**CONFIDENTIAL - INTERVIEWER ONLY**

## Session Overview
- **Duration**: 45 minutes
- **Setup**: 5 minutes
- **Challenge**: 35 minutes  
- **Wrap-up**: 5 minutes

## The Challenge: Search & Filter System

### Objective
Build a search and filter system that allows users to find addresses by balance ranges, search text, and sort results.

### Starting Context
*"Users have complained that with many addresses, it's hard to find what they're looking for. They want to search by address, filter by balance ranges, and sort the results. Build a system that makes this easy and performant."*

### Requirements
1. **Search bar** - Filter addresses by text (address or any displayed text)
2. **Balance filter** - Show only addresses within a balance range (e.g., 0.1 - 10 ETH)
3. **Sort options** - Sort by balance (high to low, low to high) or alphabetically
4. **Results count** - Show "Showing X of Y addresses"
5. **Clear filters** - Reset all filters button

---

## Target UI Layout

The target interface should include these key elements arranged in a clean, intuitive layout:

### **Filter Controls (Top Section)**
- **Search Input**: Full-width search bar with placeholder "Search addresses..."
- **Balance Range**: Two number inputs labeled "Min" and "Max" for filtering by ETH balance
- **Sort Dropdown**: Select with options like "Balance (High to Low)", "Balance (Low to High)", "Address (A-Z)"
- **Clear Filters Button**: Reset all filters to default state
- **Results Counter**: Display "Showing X of Y addresses" below the controls

### **Address Cards Grid (Main Content)**
- **Responsive Grid**: 3-column layout on desktop, adapting to smaller screens
- **Card Content**: Each card displays:
  - Truncated address (e.g., "0x1234...5678")
  - ETH balance (e.g., "15.23 ETH") 
  - USD value (e.g., "$24,567.89")
- **Visual Hierarchy**: Clear typography and spacing between elements
- **Interactive States**: Hover effects and clean card borders

---

## What Separates L3 from L5

### **L3 Candidate** will:
- Build basic search input with `onChange` handler
- Use `filter()` and `sort()` on the array
- Simple state management with `useState`
- Basic UI implementation

### **L5 Candidate** will:
- Consider performance with large datasets
- Implement debounced search
- Think about component architecture
- Handle edge cases elegantly
- Create reusable, maintainable code

---

## Implementation Areas

### **Phase 1: Basic Search (10 minutes)**
*"Let's start with a search bar that filters addresses by text"*

**L3 Approach:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const filteredAddresses = addresses.filter(addr => 
  addr.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**L5 Approach:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const filteredAddresses = useMemo(() => 
  addresses.filter(addr => 
    addr.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [addresses, debouncedSearch]
);
```

### **Phase 2: Balance Filtering (10 minutes)**
*"Now add balance range filtering"*

**L3 Approach:**
```typescript
const [minBalance, setMinBalance] = useState('');
const [maxBalance, setMaxBalance] = useState('');
```

**L5 Approach:**
```typescript
interface BalanceFilter {
  min: number | null;
  max: number | null;
}

const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>({
  min: null,
  max: null
});

const validateAndParseBalance = (value: string): number | null => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};
```

### **Phase 3: Sorting & Polish (15 minutes)**
*"Add sorting and finish with a clear filters button"*

**L3 Approach:**
```typescript
const [sortBy, setSortBy] = useState('balance');
const [sortOrder, setSortOrder] = useState('desc');
```

**L5 Approach:**
```typescript
enum SortOption {
  BalanceDesc = 'balance-desc',
  BalanceAsc = 'balance-asc',
  AddressAsc = 'address-asc'
}

const [sortOption, setSortOption] = useState<SortOption>(SortOption.BalanceDesc);

const sortedAddresses = useMemo(() => {
  const sorted = [...filteredAddresses];
  switch (sortOption) {
    case SortOption.BalanceDesc:
      return sorted.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    case SortOption.BalanceAsc:
      return sorted.sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance));
    case SortOption.AddressAsc:
      return sorted.sort((a, b) => a.address.localeCompare(b.address));
    default:
      return sorted;
  }
}, [filteredAddresses, sortOption]);
```

---

## Evaluation Criteria

### **L5+ Indicators**
- **Performance**: Uses `useMemo`, `useCallback`, debouncing
- **Architecture**: Clean component structure, reusable hooks
- **Types**: Proper TypeScript usage with enums/interfaces
- **UX**: Loading states, input validation, clear feedback
- **Edge Cases**: Empty states, invalid inputs, boundary conditions

### **L4 Indicators**
- **Functionality**: All features work correctly
- **Code Quality**: Clean, readable implementation
- **State Management**: Proper React patterns
- **User Experience**: Good basic UX

### **L3 Indicators**
- **Basic Implementation**: Features work but basic approach
- **Limited Optimization**: No performance considerations
- **Simple State**: Basic useState usage
- **Minimal Edge Cases**: Doesn't handle edge cases well

### **Below L3**
- **Incomplete**: Can't implement basic functionality
- **Poor Patterns**: Doesn't use React properly
- **No Error Handling**: Breaks on invalid input
- **Messy Code**: Hard to follow or understand

---

## Interviewer Guide

### **Setup (5 minutes)**
- Show them the current address cards
- Explain the requirements clearly
- Confirm they understand the existing data structure

### **During Implementation (35 minutes)**

**Minutes 0-10: Search**
- Watch how they approach the problem
- Do they think about performance?
- How do they structure the component?

**Minutes 10-20: Balance Filter**
- How do they handle number inputs?
- Do they validate user input?
- How do they combine multiple filters?

**Minutes 20-35: Sorting & Polish**
- How do they organize the sorting logic?
- Do they consider user experience?
- How do they handle the "clear filters" functionality?

### **Key Questions to Ask**
- *"How would this perform with 1000+ addresses?"*
- *"What happens if the user types very fast?"*
- *"How would you test this component?"*
- *"What if the balance data was loading?"*

---

## Red Flags & Green Flags

### **Red Flags**
- No consideration for performance
- Doesn't handle invalid input
- Can't explain their approach
- Writes code without thinking
- Struggles with basic React patterns

### **Green Flags**
- Thinks about performance upfront
- Handles edge cases naturally
- Explains their approach clearly
- Uses appropriate React patterns
- Considers user experience

---

## Sample Implementation Structure

```typescript
// Expected L5 component structure
interface FilterState {
  searchTerm: string;
  balanceFilter: {
    min: number | null;
    max: number | null;
  };
  sortOption: SortOption;
}

const AddressFilter: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const debouncedSearch = useDebounce(filters.searchTerm, 300);
  
  const filteredAndSortedAddresses = useMemo(() => {
    let result = addresses;
    
    // Apply search filter
    if (debouncedSearch) {
      result = result.filter(addr => 
        addr.address.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    // Apply balance filter
    if (filters.balanceFilter.min !== null || filters.balanceFilter.max !== null) {
      result = result.filter(addr => {
        const balance = parseFloat(addr.balance);
        return (filters.balanceFilter.min === null || balance >= filters.balanceFilter.min) &&
               (filters.balanceFilter.max === null || balance <= filters.balanceFilter.max);
      });
    }
    
    // Apply sorting
    return applySorting(result, filters.sortOption);
  }, [addresses, debouncedSearch, filters.balanceFilter, filters.sortOption]);
  
  return (
    <div>
      <SearchInput 
        value={filters.searchTerm}
        onChange={(value) => setFilters(prev => ({ ...prev, searchTerm: value }))}
      />
      <BalanceFilter 
        value={filters.balanceFilter}
        onChange={(value) => setFilters(prev => ({ ...prev, balanceFilter: value }))}
      />
      <SortSelector 
        value={filters.sortOption}
        onChange={(value) => setFilters(prev => ({ ...prev, sortOption: value }))}
      />
      <div>Showing {filteredAndSortedAddresses.length} of {addresses.length} addresses</div>
      <button onClick={() => setFilters(initialFilters)}>Clear Filters</button>
    </div>
  );
};
```

---

**Success Indicator**: An L5 candidate should naturally think about performance, create clean abstractions, and handle edge cases without prompting, while clearly explaining their architectural decisions. 