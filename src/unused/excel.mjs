#!/usr/bin/env osascript -l JavaScript

// This JavaScript file is attempting to do the same thing as the commented out AppleScript
// below. Neither work. Googling leads one to believe that running MS Office in an AppleScript
// sandbox elevates its security protections. Attempting writing anything to the disk results
// in an error with code -50.

/*
tell application "Microsoft Excel"
	-- Attempt to allow access permissions to the desktop
	set desktopFolder to path to desktop folder
	alias desktopFolder

	-- Create a new workbook and get its name.
	set theWorkbook to make new workbook
	set theName to get name of theWorkbook

	--	save workbook as filename ((desktopFolder as text) & theName & ".xlsx") conflict resolution local session changes
	save workbook as filename (POSIX path of (path to temporary items from user domain as text)) & "temp.xlsx"
	set theValue to get value of cell "A1"
	set myNewChartObject to make new chart object at sheet 1 with data theValue with properties {width:100.0, height:100.0}
	save as picture myNewChartObject picture type save as PNG file file name ((desktopFolder as text) & "chart.png")
end tell
*/

const excel = Application('Microsoft Excel');
excel.strictPropertyScope = true;
excel.strictCommandScope = false;
excel.strictParameterType = true;

const workbook = excel.openWorkbook({
	workbookFileName:
		'/Users/rbullen/OneDrive - Gigamon Inc/MN-Central-Files/Gigamon/Misc Documents/GigaVUE-OS Releases Timeline.xlsx',
});

workbook.chartSheets[0].saveAsPicture({
	pictureType: 'save as PNG file',
	fileName: '/Users/rbullen/chart.png',
});
