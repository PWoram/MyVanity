# MyVanity

MyVanity is an application designed to run in Amazon Connect which enables the creation of an Amazon Connect contact flow that:
  1) generates vanity phone words from an incoming caller's phone number,
  2) stores those vanity phone words in an Amazon DynamoDB table,
  3) repeats those vanity phone words to the caller live.

To test the contact flow, call 1-213-776-4759 (depending on my current AWS Free Tier usage, this may or may not return words). 

# Implementation

I chose to implement this application via two different lambda functions invoked in the same Amazon Connect contact flow:

_lambdaFunc/index.js_

In the lambda directory folder, index.js contains the code which I uploaded to AWS Lambda as a function named lambdaFunc. This function does the majority of the work in the application.  It works as follows:

A caller's phone number is accessed via event variables passed from Amazon Connect. The last 4 digits of the phone number are saved before being passed to the numberSubStrings function which generates an array of substrings. Each of these substrings is passed to generateWords. GenerateWords recursively generates all possible letter combinations from a string of numbers using the alphanumeric correspondence on standard phone keypad. In order to check whether a given letter combination constitutes an English word, I made use of a third-party dependency, check-words. If a given letter combination constitutes an English word, it is added to a results array. 

When all substrings have been processed, the resulting array represents all possible valid words that can be generated from a phone number's last four digits, sorted by descending length. I kept the array sorted this way to reflect my choice that the "better" vanity phone words are the longest. 

Finally, the first five words in the results array are stored in order in a DynamoDB table with original caller's number stored as the primary key.

Throughout index.js, edge cases are handled to ensure that errors are properly identified.

In order to deploy index.js, I had to create .zip file and upload it to AWS Lambda. This was necessary because I made use of a third-party dependency. Ultimately, I came to prefer this method over working in the AWS Lambda console, because it allowed me to work in my preferred IDE and simply use the AWS CLI to update my AWS Lambda. 

_returnVanityNumbers_

returnVanityNumbers is a standalone lambda function which, when invoked in an Amazon Connect contact flow, will retrieve data from the vanityNumbersTable DynamoDB table. Specifically, the function uses the caller's phone number to look up attributes (i.e., vanity phone words) stored in the table.

returnVanityNumbers incorporates basic error handling to ensure that an error in either the database querying or response generation can be identified if one occurs.

_contact flow_

I incorporated the above two lambda functions into the following Amazon Connect contact flow:

![image](https://user-images.githubusercontent.com/66330208/109868174-5371a600-7c35-11eb-9c84-d441cebbcd22.png)

I tested my contact flow by calling my Amazon Connect number at 1-213-776-4759.

# Additional Notes

_Reasons for my implementation_

Given the time constraints, I tried to implement my application in a straightforward manner. I decided to separate my two primary concerns (writing data to the database and reading data from the database) into separate lambda functions in order to make testing easier. I tested my lambda functions within the AWS console, but I have included the JSON code for the test event in this repo. In order to test my returnVanityNumbers lambda, I simply prepopulated my database with sample records. 

The greatest difficulty I faced in implementing this application was aggregating necessary information across documentation and tutorials online in order to understand how to create this particular contact flow in Amazon Connect using Lambda and DynamoDB. For instance, I was able to rely on AWS documentation to learn how to create an Amazon Connect contact flow that used a Lambda to read from a DynamoDB database, but this same resource did not cover how to write to the DynamoDB database. To learn how to implement the write functionality, I turned to a third-party resource which in turn led me to DynamoDB API reference on Amazon SDK. In this way, I gradually pieced together an understanding of how to implement different pieces of the required functionality. 

_Improvements_

With more time, I would make the following improvements:

  1) I would clean up index.js by separating the functions into their own files to increase readability and separation of logic. I consider this a necessity for production-quality code. 
  2) I would improve the formatting of the outputted vanity phone words so that it includes the first part of the number as well. Currently, my Amazon Connect instance will repeat to the user only the vanity words themselves (e.g., "baby" instead of "+1-214-555-baby"). 
  3) I would increase the number of digits examined to generate phone words. My application currently looks at only the last four digits of a phone number. For example, if a user were to call my Amazon Connect instance using the phone number +1-214-846-7663, its vanity words would include "roof" but not "tin-roof." Implementing this improvement would require further optimization of the code, because the more digits of a phone number under consideration, the greater the number of substrings I must pass to the generateWords. 
  4) I would refactor my generateWords function to be able to identify multiple vanity words within a single number. For instance, it should be able to recognize that +1-934-283-7437 can make "1-We have pies." Implementing this would demand careful attention to the increased burden on performance. 
  5) I would incorporate, if possible, automated end-to-end testing.
  6) I would improve the logic for how vanity words are added to the database. In my implementation, whenever I had a phone number that yielded fewer than five vanity words, I encountered an error when referring to items in the array that were undefined (e.g., storing results[4] in the DynamoDB would throw an error if the results array had fewer than five elements). My current fix for this problem entails adding additional elements--with a value of "None"--to the array. With more time, I would ensure that only valid vanity words are added to the database table.
  7) Related to the last point, I would modify the contact flow so that the final prompt took into account the number of valid vanity words generated by a number. For isntance, I would want it to differentiate between a user whose phone number does not yield any vanity words and one whose phone number yields 3. I would also further distinguish between a outcomes of either one, two, or three vanity words so that I could have grammatically correct prompts (e.g., the prompt would say "Your vanity words are X and Y" if a user's number yielded two vanity words but would say "Your vanity word is X" if it yielded only one).
