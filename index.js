/**
 * Copyright (c) 2020 Jongwoo Han
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";
const { Octokit } = require("@octokit/rest");

const ENLISTMENT_DATE = process.env.ENLISTMENT_DATE;
const DISCHARGE_DATE = process.env.DISCHARGE_DATE;

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

const octokit = new Octokit({
	auth: `token ${GH_TOKEN}`,
});

const main = async () => {
	let date = dateCalculator(ENLISTMENT_DATE, DISCHARGE_DATE);
	await updateGist(date.day, date.percentage);
};

const updateGist = async (day, percentage) => {
	let content, description, gist;
	let verb = "s are";

	if (day <= 1) {
		verb = " is";
	}

	description = `${day} day${verb} left before discharged.`;
	content = `${description}\nPercentage ${generateBarChart(
		percentage,
		20
	)} ${percentage}%`;

	try {
		gist = await octokit.gists.get({ gist_id: GIST_ID });
	} catch (error) {
		console.error(`Unable to get gist\n${error}`);
	}

	try {
		const filename = Object.keys(gist.data.files)[0];
		await octokit.gists.update({
			gist_id: GIST_ID,
			files: {
				[filename]: {
					filename: `D - ${day} to discharge👊🏻`,
					content: content,
				},
			},
		});
	} catch (error) {
		console.error(`Unable to update gist\n${error}`);
	}
};

const dateCalculator = (enlistmentDate, dischargeDate) => {
	let dateFormat = {
		day: 0,
		percentage: 0,
	};

	const e = enlistmentDate.split("-");
	const d = dischargeDate.split("-");

	const enlistment = new Date(e[0], Number(e[1]) - 1, e[2]).getTime();
	const discharge = new Date(d[0], Number(d[1]) - 1, d[2]).getTime();
	const now = new Date().getTime();

	let duration = Math.ceil((discharge - enlistment) / (1000 * 60 * 60 * 24));
	let pastTime = Math.ceil((now - enlistment) / (1000 * 60 * 60 * 24));

	let calculatedDays = duration - pastTime + 1;
	let percentage = (100 * ((duration - calculatedDays) / duration)).toPrecision(2);

	if (pastTime <= 0) {
		calculatedDays = Math.ceil((discharge - now) / (1000 * 60 * 60 * 24));
		percentage = 0;
	}

	dateFormat.day = calculatedDays;
	dateFormat.percentage = percentage;

	return dateFormat;
};

const generateBarChart = (percent, size) => {
	const syms = "░▏▎▍▌▋▊▉█";

	const frac = Math.floor((size * 8 * percent) / 100);
	const barsFull = Math.floor(frac / 8);
	if (barsFull >= size) {
		return syms.substring(8, 9).repeat(size);
	}
	const semi = frac % 8;

	return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
		.join("")
		.padEnd(size, syms.substring(0, 1));
};

(async () => {
	await main();
})();
