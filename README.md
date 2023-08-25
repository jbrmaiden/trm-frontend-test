# Frontend Interview Challenge

Your mission, if you choose to accept it, is to demonstrate your Frontend skills using this premade repository.
We have a simple checklist of items for you to complete.
Items will range from from varying skill levels.
We ask that you comment your thoughts and decision making, so we get a good idea of how you think out solutions to the problems.

You will be using the [Etherscan API](https://docs.etherscan.io/api-endpoints/accounts) to fetch Address Balances and Transactions.
You may check the validity of your response and the proper way to display any data using their web application: https://etherscan.io/

To get started, run `npm install`.
Make a copy of `.env.example` to `.env` and use the API key that was provided in your challenge email.
Once you're ready to go, run with `npm start`.
You will notice a build error that prevents it from starting, which you will need to debug and solve to see the app.
Once running, you should see an output to navigate to the webapp (typically http://localhost:8080)

Your task list is in user stories.
As you read and follow each user story, write down your thoughts and solution in a separate document so we can review together when you demo your challenge. Then solve the story to the best of your knowledge and ability.
As you work through these User Stories, they may require other changes that you will need to debug to complete them (such as Webpack changes).

Sample addresses:

- 0x7e0188b0312a26ffe64b7e43a7a91d430fb20673
- 0x26f2049cc605bf8028e407b71a2d83cd520fa4de
- 0xd61f469f632525e2e87ffb3a113c893961aa9714

User Stories

- [Easy] As a user, I don't think these Ether values are correct.
  Review the Address Balance and Transactions Value.
  Eth is returned in "Wei": https://www.investopedia.com/terms/w/wei.asp
  Display as Eth, including only up to 6 decimals
  We've included the [BigNumber.js](https://github.com/MikeMcl/bignumber.js) package to help you get started
- [Easy] As a project maintainer, the Redux Sagas seem to follow a similar pattern and could be cleaned up to make it easier to maintain.
  Show your ability to refactor code.
  Take the 2 sagas for address balance and transactions, and create a common pattern to execute these API calls that makes it easy for us to add a 3rd saga without continuing to duplicate this pattern.
- [Medium] As a data provider, you are sending us too many invalid ETH addresses. Please validate the address before requesting our API.
  There's an easy-to-use package that supports [validating Ethereum addresses](https://www.npmjs.com/package/multicoin-address-validator). This is a NodeJS library that will require extra effort to use with Webpack, here's a hint here: https://viglucci.io/how-to-polyfill-buffer-with-webpack-5
  In addition to validation, please add some feedback using the existing AntDesign Form to the user that their input is invalid.
- [Hard] As a user, I want to see more than just the last 10 transactions an address has made.
  We need to be able to show more transactions, but Etherscan does not provide a total.
  Add a way to paginate this table.
  Please keep in mind that total number of transactions of an address can be very large.
- [Hard] As a user, I want to involve my colleagues in what I'm working on. I want to be able to link someone to an address that would automatically request the balance and transactions.
  Use the `/address/:address` route to build a way that when a user selects an address to view the transactions, the URL will update, so that the user can quickly share it with someone else, that will automatically: Add the address and select it (which should trigger to pull down the transactions)

To give you some insight into what we're looking for, and questions that we're likely to ask:

- How well are decisions documented? Assume that someone else has to maintain your code and that it's readable.
- How well do you solve the user story? Did you think about multiple implementations?
- If you were part of a team that needed to refactor or improve the application to better maintain and support it over the next 2-3 years, what are things you would change or improve, and why?

Be prepared to demo your running application, and walk us through the user story with your commits and decisions. We're excited to see what you come up with! Have fun :)
