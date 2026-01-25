# Implementation Decisions

## Features Implemented
<!-- List which features you chose to implement and why -->

### Feature 1: [Testing & Quality]
- **Why I chose this**: 
    I decided to start with the testing capability as a way to explore and to know better about the current application. By starting with the testing, I can capture regressions on the state of the application. It will also allow me to as I go to implement the rest of the features outlined, I can have more time to focus on the specific tests for the feature, since all the rest should be already covered. 
- **Time spent**: 
    - ~140 minutes (testing-setup)
    - ~105 minutes (hook-tests)
- **Challenges faced**: 
    (testing-setup)
    1. Application startup failed due to Etherscan API version mismatch (app configured for v1 while Etherscan now requires v2). Resolved by consulting Etherscan docs and adding required parameters for v2.
    2. Initial tight coupling of global state in main.tsx made unit and integration testing difficult until refactoring was completed.
    
    (hook-tests)
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
    ### tests-setup

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

    ### hook-tests
    
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
    - hook-tests: 25 minutes
- **Implementation**: 
    - testing-setup: 57 minutes
    - hook-tests: 45 minutes
- **Testing**: 
    - testing-setup: 20 minutes
    - hook tests: 20 minutes
- **Polish/Documentation**: 
    - testing-setup: 20 minutes
    - hook-tests: 15 minutes
- **Total**: X minutes

## Reflection
<!-- Overall thoughts on the assignment and your approach --> 