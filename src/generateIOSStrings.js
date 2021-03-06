const xlsx = require("xlsx");
const fs = require("fs");
const execSync = require('child_process').execSync;


// Variables
const outputDir = __dirname + "/../output/";
const iosOutputDir = outputDir + "ios/";
const stringsFile = iosOutputDir + "AppStrings.swift";
const workbook = xlsx.readFile(__dirname + "/../Translations.xlsx");
const worksheet = workbook.Sheets["ALL"];
const json = xlsx.utils.sheet_to_json(worksheet);
const keyTab = "iOS Key";

// Translations.xlsx uses Google-friendly codes whereas iOS only supports: https://www.ibabbleon.com/iOS-Language-Codes-ISO-639.html
const languages = {
	"EN": "en",
	"ES": "es",
	"FR": "fr",
	"CN": "zh-Hans",
	"VI": "vi",
	"AR": "ar-001",
	"KO": "ko",
	"JA": "ja",
	"DE": "de",
	"FA": "fa",
	"IW": "he",
	"IT": "it",
	"HY": "hy"
}


// Helper Methods
function clearOutputDirectory() {
	execSync(`rm -rf ${outputDir}`)
	fs.mkdirSync(outputDir)
	fs.mkdirSync(iosOutputDir)

	for (var language of Object.values(languages)) {
		fs.mkdirSync(iosOutputDir + `${language}.lproj`)
	}
}

function generateHeaders() {
	fs.appendFileSync(stringsFile, `//
//  AppStrings.swift
//  Eric Dobyns
//
//  Generated by Eric Dobyns
//  Copyright © 2020 Eric Dobyns, Inc. All rights reserved.
//

import Foundation

extension String {
    public var localized: String {
        return NSLocalizedString(self, comment: "")
    }
}

public struct AppStrings {\n`);

	for (var language of Object.values(languages)) {
		fs.appendFileSync(iosOutputDir + `${language.toLowerCase()}.lproj/Localizable.strings`, `/*
Localizable.strings
Eric Dobyns
	
Generated by Eric Dobyns
Copyright (c) 2020 Eric Dobyns, Inc. All rights reserved.
*/		

`);
	}
}

function generateStrings() {
	totalStrings = 0
	characterLengthArray = [] // Used to sort translations by character length

	for (var i = 0; i < json.length; i++) {
		var row = json[i];

		if (row) {
			var key = row[keyTab];
			if (key && key !== "") {
				totalStrings++;
				var englishValue = row["EN"];

				if (englishValue && englishValue !== "") {
					englishValue = englishValue.replace(/"/g, '\\"'); // Escape double quotes
					// englishValue = englishValue.replace(/'/g, `\\'`); // Escape single quotes (WARNING: Should not do this?)
					characterLengthArray.push(`    public static let ${key} = "${englishValue}".localized\n`);

					for (var language of Object.keys(languages)) {
						var otherLanguageValue = row[language];

						if (otherLanguageValue && otherLanguageValue !== "") {
							otherLanguageValue = otherLanguageValue.replace(/"/g, '\\"'); // Escape double quotes
							// otherLanguageValue = otherLanguageValue.replace(/'/g, `\\'`); // Escape single quotes (WARNING: Should not do this?)
							fs.appendFileSync(iosOutputDir + `${languages[language]}.lproj/Localizable.strings`, `"${englishValue}" = "${otherLanguageValue}";\n`);
						}
					}
				}
			}
		}
	}

	characterLengthArray.sort((a, b) => {
		return a.length - b.length;
	})

	characterLengthArray.forEach((str) => {
		fs.appendFileSync(stringsFile, str);
	})

	fs.appendFileSync(stringsFile, "}");
}


// Run
clearOutputDirectory();
generateHeaders();
generateStrings();
console.log(`Job complete. Generated ${totalStrings} strings.`);
