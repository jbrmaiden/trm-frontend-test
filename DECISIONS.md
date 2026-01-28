# Implementation Decisions

## Features Implemented
<!-- List which features you chose to implement and why -->

### Feature 1: 2 pieces of [Testing & Quality] --> Components tests & Hooks tests
- **Why I chose this**: 
    I decided to start with the testing capability as a way to explore and to know better about the current application. By starting with the testing, I can capture regressions on the state of the application. It will also allow me to as I go to implement the rest of the features outlined, I can have more time to focus on the specific tests for the feature, since all the rest should be already covered. 
- **Time spent**: 
    - ~140 minutes [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3)
    - ~105 minutes [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4)
- **Challenges faced**: 
    #### [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3)
    1. Application startup failed due to Etherscan API version mismatch (app configured for v1 while Etherscan now requires v2). Resolved by consulting Etherscan docs and adding required parameters for v2.
    2. Initial tight coupling of global state in main.tsx made unit and integration testing difficult until refactoring was completed.
    
    #### [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4)
    1. The hooks have custom retry logic that retries failed requests up to 3 times with exponential backoff (1s, 2s, 4s = ~7 seconds total). This forces us to adjust the testing to actually wait for a longer time to make sure the actual behavior is happening. Given the amount of cases we added, it is taking around 70 seconds for these tests to pass. We could have a override configuration which disables the retries, and the testing case would take only around 2 seconds to complete, but this would not test the actual behavior. This have implications on the CI/CD bulding time. Since we are not worried about it and I want the tests to be as confidente as possible I have decided to keep what we currently inherited from the actual code base for now. 
        *Trade-offs*
            - Pros of real testing:
                - Tests verify actual production behavior
                - Catches bugs in retry logic
                - Higher confidence that the app handles failures correctly
            - Cons of real testing:
                - Tests take ~30x longer (68s vs 2s)
                - Slower CI/CD feedback
                - More expensive in CI minutes
                - Flakier if timing is sensitive


- **Key decisions**: 
    #### [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3)

   1. **Decoupled application state**

        - Extracted the Zustand store from main.tsx into a dedicated stores directory (src/stores).
        - Created a sanctionedStore module that centralizes state creation and default address/test configuration to simplify test setup and reduce import friction.

    2. **Simplified application entrypoints**

        - Cleaned up main.tsx to remove store creation and other test-related concerns.
        - Refactored consumer modules (e.g., ExposurePage) to import the store from the new stores module rather than main.tsx, improving clarity and testability.

    3. **Test doubles and mock handlers**

        - Implemented reusable mock handlers in src/test/mocks/handlers.ts to simulate API responses and failure modes. Examples:
            - mockPriceSuccess(3000): return price = $3,000
            - mockPriceError(): return 500 error for price endpoint
            - mockBalanceSuccess('0x123...', '5000'): return 5 ETH balance for address
            - mockBalanceError('0x456...'): return error for address balance
        - These handlers enable deterministic tests and easier simulation of edge cases.

    4. **Test coverage for ExposurePage**

        - Added focused test cases covering realistic UI and business scenarios:
            - Loading states (2 tests)
            - Error states (2 tests)
            - Success states (2 tests)
            - Empty states (1 test)
            - Calculation validation (2 tests)
            - Mixed/intermittent states (2 tests)

    #### [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4)
    
    1. (usePrice) Added basic tests for the happy path, handleding numeric prices, decimal handling and query keys.
    2. (usePrice) Tested the custom/default messages for when the response returns with `status: 0` to make sure condition is caught on the implementation
    3. (usePrice) For the rest of implementation on the success path, but when the values come as unecpected in the code, like we see on lines 38 to 63, also testing the conditions, like INVALID_DATa, INVALID_PRICE or API_ERROR. 
    4. (usePrice) Simulating also a actual Network error to test it being caught on the `catch` statement. 
    5. (usePrice) added test cases for when there is a transaction between `isLoading` and `isPending` 
    6. (usePrice and useBalance) testing inclusion of `chainid` parameter, as required for v2
    7. (useBalance) Tested the happy path for Wei to ETH conversion, precision, zero balance, empty string
    8. (useBalance) Address validation (too short, no 0x prefix, invalid chars, too long, valid cases)
    9. (useBalance) BigNumber precision (1 Wei, 1M ETH, fractional values, rounding)
    10. (useValance) Also tested the transictions between isLoading and isPending. 
    11. For all tests cases we leveraged MSW for mocking the API responses. 
    12. (useValance) Found an unintuitive rounding on the fixed(6), it rounds instead of truncating the result, so added a case for describing that this is the expected behavior. 

### Feature 2: 2 pieces of [Dynamic Address Management] (Add Address Form and Validation) and one piece of [Testing & Quality] (Integration Tests) -- also testing for the new components
- **Why I chose this**:
    #### [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5)
    Since I had already added the foundation tests to the application, the next step would be to start implementing it. I decided to pick Adding Addresses because it is the basic to make sure we can have a more dynamic application, it also unblocks the other features to be more complete and suits well as a first feature to be implemented. The other features would look lacking if we did not pick this one first.
    Initially, adding and validation seemed to be the right approach to break into smaller pieces of work. Since the application is starting to become more dynamic now, I also decided to write integration tests for checking the user flow interactively.

- **Time spent**:
    - ~180 minutes [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5)

- **Challenges faced**:
    #### [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5)
    1. **Component library selection**: I decided to go for Base UI (from MUI) (instead of Radix UI, since I see it's less being used currently) was selected because it provides headless accessibility primitives without imposing styling, allowing better integration with the existing Tailwind setup.
    2. **Address normalization strategy**: Needed to decide whether to normalize addresses on input, on validation, or on storage. Chose to normalize to lowercase before both duplicate checking and storage to ensure consistent case-insensitive behavior throughout the application.
    3. **Form state management**: Considered using a form library (react-hook-form) but decided a custom hook (`useAddAddressForm`) was sufficient for this single-field form while maintaining clear separation of concerns between UI and business logic.
    4. **Testing dialog interactions**: Ensuring proper focus management and keyboard navigation testing required careful use of `userEvent` over `fireEvent` for realistic user interaction simulation.
    5. **Store state isolation**: Each test needed to reset the Zustand store to avoid state leakage between tests, requiring explicit `beforeEach` cleanup.
    6. **Hooks anti pattern in react**: The code had a small anti pattern rendering loops inside a iterative map, which was breaking a rule of hook in which react loses track of what elements were rendered in the correct order. 
    ``` 
    const balances = addresses.map((address) => {
        const { data, isLoading, error } = useBalance(address);
            return { address, data, isLoading, error };
    });
    So I needed to refactor the code on `ExposurePage` for displaying the balances and the cards to an specific componented. I created a useAddressesBalance hook that does this work for calculating totals without violating hooks rules, using TanStack Query's useQueries. I also created a new component `AddressCard` so that each card manages its own data fetching independently. 

  ```

- **Key decisions**:
    #### [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5)
    1. **Zod for validation**: Added `zod` library for Ethereum address validation. It provides a clean, declarative schema that separates validation concerns from the hook logic. The schema enforces max 42 characters and the regex pattern `/^0x[a-fA-F0-9]{40}$/`.

    2. **Base UI + shadcn/ui + Tailwind architecture**:
        - **Tailwind CSS** : Just leveraged what is already in project. It provides styling via utility classes
        - **Base UI**: Headless primitives handling behavior and accessibility (focus trap, keyboard navigation, ARIA attributes)
        - **shadcn/ui**: Combines both - wraps Base UI primitives with Tailwind styles for ready-to-use components

    3. **Component structure**: Created `AddAddressDialog/` folder with co-located files:
        - `index.tsx` - Main dialog component (presentational)
        - `validation.ts` - Zod schema (co-located for better organization)
        - `__tests__/` - Component-specific tests

    4. **Hook design (`useAddAddressForm`)**: Returns controlled form state with:
        - Automatic error clearing on input change
        - Loading states (`isSubmitting`) for async-ready submission. Added this in case in future adding a new address may take longer to complete, if we were to use some API validation. 
        - Proper form reset on cancel/success
        - Case-insensitive duplicate detection against existing addresses. This needs to check on the SanctionedStore.

    5. **Accessibility requirements**:
        - `autoFocus` on input when dialog opens
        - `aria-label` on all buttons (e.g., "Cancel adding address", "Add address to watchlist")
        - `role="alert"` on error messages for screen reader announcement
        - Proper label association via `htmlFor`/`id`

    6. **Responsive design**: Flexbox layout that stacks vertically on mobile (`< 640px`) and displays horizontally on tablet/desktop using `sm:flex-row sm:items-start sm:justify-between`.

    7. **User-event over fireEvent**: Used `@testing-library/user-event` for realistic user interaction simulation (typing, clicking, keyboard navigation).

    8. **MSW for API mocking**: Leveraged previously added MSW setup for mocking balance fetch responses when new addresses are added.

    9. **Test categories implemented**:
        - Hook unit tests (`useAddAddressForm.test.ts`): Validation, duplicates, state management, error clearing
        - Component integration tests (`AddAddressDialog.test.tsx`): User interactions, form submission, accessibility
        - E2E-style user flow tests (`ExposurePageUserFlow.test.tsx`): Complete add address iteraction with MSW mocking
            - Happy path: Add valid address --> dialog closes --> address appears in list
            - Validation error flow: Invalid input --> error displayed --> user corrects --> success
            - Duplicate address flow: Existing address --> case-insensitive error
            - Cancel flow: Partial input --> cancel --> form resets
            - Keyboard navigation: Escape closes dialog, Enter submits form 


 

### Feature 3: One piece of [Dynamic Address Management] --> Remove Address (with Confirmation Dialog)
- **Why I chose this**:
    After implementing address addition with validation, breaking down subsequent features into smaller, focused PRs became a priority. The remove address feature was the logical next step to complete the core dynamic address management functionality. Smaller PRs improve code review efficiency, reduce cognitive load for reviewers, and create a clearer git history that documents the evolution of the feature set.

- **Time spent**:
    - ~45 minutes [feat/remove-address](https://github.com/jbrmaiden/trm-frontend-test/pull/6)
    - ~60 minutes [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7)


- **Challenges faced**:
    #### [feat/remove-address](https://github.com/jbrmaiden/trm-frontend-test/pull/6)
    1. **UX consideration for destructive actions**: The initial implementation with direct deletion felt incomplete from a user experience perspective. Accidental clicks could lead to unintended data loss, prompting the decision to add a confirmation step.

    2. **Component library consistency**: Needed to create a new AlertDialog component following the same pattern as the existing Dialog component, ensuring consistency across the codebase while leveraging `@base-ui/react/alert-dialog` primitives.

    #### [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7)
    1. **AlertDialog vs Dialog behavior**: Understanding the semantic difference—AlertDialog cannot be dismissed by clicking outside the backdrop, requiring explicit user action (Cancel or Remove). This is intentional for destructive operations.


- **Key decisions**:
    #### Basic Remove Functionality [feat/remove-address](https://github.com/jbrmaiden/trm-frontend-test/pull/6)

    1. **Minimal component modification**: Leveraged the existing `removeAddress` function from `sanctionedStore`, requiring only UI additions to `AddressCard.tsx`.

    2. **Delete button placement and styling**:
        - Positioned in top-right corner, left of the status indicator dot
        - Used `ghost` variant with custom size override (`h-6 w-6`) for a subtle, non-intrusive appearance
        - Hover state transitions to destructive color (`hover:text-destructive hover:bg-destructive/10`) to indicate the action
        - Icon: `Trash2` from `lucide-react` at 16x16px, leveraging existing package.

    3. **Layout adjustment**: Updated the absolute-positioned container to flexbox (`flex items-center gap-2`) to accommodate both the delete button and status indicator. Increased `CardHeader` padding from `pr-8` to `pr-12` to prevent content overlap.

    4. **Accessibility**: Added descriptive `aria-label` including the full address (e.g., `Remove address 0x1234...`) for screen reader users.

    #### Remove Address Confirmation Dialog [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7)

    1. **Created AlertDialog component** (`src/components/ui/alert-dialog.tsx`):
        - Built on `@base-ui/react/alert-dialog` primitives
        - Followed existing Dialog component patterns for consistency

    2. **Focus and keyboard management** (provided by Base UI):
        - Focus trapped within dialog when open
        - Escape key closes dialog without removing
        - Focus returns to trigger button after close

    3. **Test coverage**:
        - Basic removal flow (click delete --> address removed)
        - Empty state transition (remove last address --> "No addresses monitored")
        - Confirmation dialog appears on delete click
        - Cancel button closes dialog, address remains
        - Escape key closes dialog, address remains
        - Remove button confirms deletion


### Feature 4: [Name]
- **Why I chose this**: 
- **Time spent**: 
- **Challenges faced**: 
- **Key decisions**: 

### Feature 5: [Name]
- **Why I chose this**: 
- **Time spent**: 
- **Challenges faced**: 
- **Key decisions**: 
## Technical Approach

### Architecture Decisions
<!-- Explain your architectural choices -->

### Libraries/Tools Added
<!-- List any new dependencies and justify them -->

### Performance Considerations
<!-- How did you ensure your changes don't degrade performance? -->

## Trade-offs Made
<!-- What shortcuts did you take due to time constraints? -->

## Testing Strategy
<!-- How did you approach testing your new features? -->

## What I Would Improve
<!-- Given unlimited time, what would you change or add? -->

## AI Assistance Used
<!-- Document any AI-assisted code per the requirements -->
- **Tool used**: 
- **What was generated**: 
- **How I reviewed/modified it**: 


## Time Breakdown
- **Planning**: 
    - [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3): 45 minutes
    - [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4): 25 minutes
    - [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5): 65 minutes
    - [feat/remove-address](https://github.com/jbrmaiden/trm-frontend-test/pull/6): 20 minutes
    - [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7): 20 minutes

- **Implementation**: 
    - [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3): 57 minutes
    - [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4): 45 minutes
    - [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5): 45 minutes
    - [feat/remove-address]: 15 minutes
    [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7): 20 minutes
- **Testing**: 
    - [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3): 20 minutes
    - [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4): 20 minutes
    - [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5): 40 minutes
    - [feat/remove-address]: 5 minutes
    - [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7): 10 minutes
- **Polish/Documentation**: 
    - [testing-setup](https://github.com/jbrmaiden/trm-frontend-test/pull/3): 20 minutes
    - [hook-tests](https://github.com/jbrmaiden/trm-frontend-test/pull/4): 15 minutes
    - [add-address-form](https://github.com/jbrmaiden/trm-frontend-test/pull/5): 30 minutes
    - [feat/remove-address]: 5 minutes
    [feat/remove-dialog-confirmation](https://github.com/jbrmaiden/trm-frontend-test/pull/7): 10 minutes
- **Total**: X minutes

## Reflection
<!-- Overall thoughts on the assignment and your approach --> 