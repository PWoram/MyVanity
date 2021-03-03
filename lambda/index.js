const AWS = require('aws-sdk');
// const dynamodb = new.AWS.DynamoDB();
var checkWord = require('check-word'),
	words = checkWord('en');

//handler method to store data in dynamoDB table
module.exports.handler = (event, context, callback) => {
	const phoneDigitsToLetters = {
		0: '0',
		1: '1',
		2: 'abc',
		3: 'def',
		4: 'ghi',
		5: 'jkl',
		6: 'mno',
		7: 'pqrs',
		8: 'tuv',
		9: 'wxyz',
	};

	const numberSubStrings = function (phoneNumber) {
		var subStrings = [];

		for (var i = 0; i < phoneNumber.length; i++) {
			subStrings.push(phoneNumber.slice(i));
			// subStrings.push(phoneNumber.slice(-i));
		}

		return subStrings;
	};

	const generateWords = function (numberString) {
		if (!numberString.length) {
			return [''];
		}

		var digitsArray = numberString.split('');

		// if (digitsArray.includes(0) || digitsArray.includes(1)) {
		// 	return 'No vanity numbers available!';
		// }

		var results = [];

		//recursive function to generate letter combinations from phone number digits
		var lettersFromDigits = function (word, digitsArray) {
			//base case: if no digits remain, check whether a word is formed and if so push to results array
			if (!digitsArray.length) {
				if (words.check(word)) {
					results.push(word);
				}
				return;
			}
			//recursive case: take current digit from digitsArray
			var letters = phoneDigitsToLetters[digitsArray[0]];

			for (var i = 0; i < letters.length; i++) {
				lettersFromDigits(word + letters[i], digitsArray.slice(1));
			}
		};
		lettersFromDigits('', digitsArray);

		return results;
	};

	var number = event.Details.ContactData.CustomerEndpoint.Address;
	// var testNumber = '7962229';
	var subStrings = numberSubStrings(number);
	subStrings = subStrings.slice(0, 4);
	var vanityNumbers = [];
	subStrings.forEach((i) => vanityNumbers.push(generateWords(i)));
	var results = vanityNumbers.flat();
	// console.log('results:', results);

	const params = {
		Item: {
			phoneNumber: {
				S: number,
			},
			vanityName: {
				S: results[0],
			},
			vanityNameTwo: {
				S: results[1],
			},
			VanityNameThree: {
				S: results[2],
			},
			VanityNameFour: {
				S: results[3],
			},
			VanityNameFive: {
				S: results[4],
			},
		},
		TableName: 'vanityNumbersTable',
	};
	dynamodb.putItem(params, function (err, data) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			console.log(data);
			callback(null, data);
		}
	});
};

// console.log('Vanity numbers: ', vanityNumbers.flat());
