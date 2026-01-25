# Implementation Decisions

## Features Implemented
<!-- List which features you chose to implement and why -->

### Feature 1: [Testing & Quality]
- **Why I chose this**: 
    I decided to start with the testing capability as a way to explore and to know better about the current application. By starting with the testing, I can capture regressions on the state of the application. It will also allow me to as I go to implement the rest of the features outlined, I can have more time to focus on the specific tests for the feature, since all the rest should be already covered. 
- **Time spent**: 
    - ~140 minutes (testing-setup)
- **Challenges faced**: 
    1. Application startup failed due to Etherscan API version mismatch (app configured for v1 while Etherscan now requires v2). Resolved by consulting Etherscan docs and adding required parameters for v2.
    2. Initial tight coupling of global state in main.tsx made unit and integration testing difficult until refactoring was completed.
- **Key decisions**: 
   1. Decoupled application state

        - Extracted the Zustand store from main.tsx into a dedicated stores directory (src/stores).
        - Created a sanctionedStore module that centralizes state creation and default address/test configuration to simplify test setup and reduce import friction.

    2. Simplified application entrypoints

        - Cleaned up main.tsx to remove store creation and other test-related concerns.
        - Refactored consumer modules (e.g., ExposurePage) to import the store from the new stores module rather than main.tsx, improving clarity and testability.

    3. Test doubles and mock handlers

        - Implemented reusable mock handlers in src/test/mocks/handlers.ts to simulate API responses and failure modes. Examples:
            - mockPriceSuccess(3000): return price = $3,000
            - mockPriceError(): return 500 error for price endpoint
            - mockBalanceSuccess('0x123...', '5000'): return 5 ETH balance for address
            - mockBalanceError('0x456...'): return error for address balance
        - These handlers enable deterministic tests and easier simulation of edge cases.

    4. Test coverage for ExposurePage

        - Added focused test cases covering realistic UI and business scenarios:
            - Loading states (2 tests)
            - Error states (2 tests)
            - Success states (2 tests)
            - Empty states (1 test)
            - Calculation validation (2 tests)
            - Mixed/intermittent states (2 tests)

### Feature 2: [Name]
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
    - testing-setup: 45 minutes
- **Implementation**: 
    - testing-setup: 57 minutes
- **Testing**: 
    - testing-setup: 20 minutes
- **Polish/Documentation**: 
    - testing-setup: 20 minutes
- **Total**: X minutes

## Reflection
<!-- Overall thoughts on the assignment and your approach --> 