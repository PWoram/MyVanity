var checkWord = require('check-word'),
	words = checkWord('en');
const fs = require('fs');

var dictionary = [];

fs.readFileSync('./words', 'utf8', (err, data) => {
	if (err) {
		console.log('error reading file:', err);
	} else {
		console.log('read success!');
		dictionary = data.toLowerCase().split('\n');
		// console.log(arr);
	}
});

var phoneDigitsToLetters = {
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

// console.log(numberSubStrings('7963007'));

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
			// if (dictionary.includes(word)) {
			// 	results.push(word);
			// }
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

// console.log('Your vanity numbers are ', generateWords('2229'));

var testNumber = '7962229';

var subStrings = numberSubStrings(testNumber);
var vanityNumbers = [];

subStrings.forEach((i) => vanityNumbers.push(generateWords(i)));

console.log('Vanity numbers: ', vanityNumbers.flat());

// console.log('numbers: ', generateWords(testNumber));
