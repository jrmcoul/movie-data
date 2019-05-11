const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	let searchTerm = 'fantastic beasts'
	searchTerm = searchTerm.trim().toLowerCase(); //searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
	urlRT = 'https://www.rottentomatoes.com/search/?search=' + searchTerm.replace(/ /g, "%20");
	urlBO = 'https://www.boxofficemojo.com/search/?q=' + searchTerm.replace(/ /g, "%20");

	console.log(urlRT);
	console.log(urlBO);
	// Navigate to search results page
	await Promise.all([
  		page.waitForNavigation({waitUntil: 'networkidle0'}), // The promise resolves after navigation has finished
  		page.goto(urlRT), // Clicking the link will indirectly cause a navigation
	]);
	console.log('on website')

	// Click button to get only movie results
	const moviesButton = await page.$x("//ul[contains(@id,'filterList')]/descendant::span[contains(text(), 'Movies')]");
	await moviesButton[0].click();
	await page.waitForSelector("#PartialResults");
	console.log('step 1')

	// Get total number of pages of movie results
	let pageString = await page.evaluate(
      () => Array.from(
        document.querySelectorAll('#PartialResults .pull-right span:not(.glyphicon)'),
        element => element.textContent
      )[0]
    );

    let totalPages = 1;
    if(pageString){
    	pageString = pageString.trim();
    	totalPages = parseInt(pageString[pageString.length - 1]);
    }

    let pageNum = 1;
   	let scoreArr = [];
   	let titleArr = [];
   	let linkArr = [];
   	let yearArr = [];

	while(pageNum <= totalPages) {
		console.log(pageNum);
	    // Get all RT scores
		scoreArr = scoreArr.concat(await page.evaluate(
	      () => Array.from(
	        document.querySelectorAll('ul.results_ul span.tMeterScore, ul.results_ul span.noRating'),
	        element => element.textContent
	      )
	    ));

		// Get all movie titles
	    titleArr = titleArr.concat(await page.evaluate(
	      () => Array.from(
	        document.querySelectorAll('ul.results_ul span.bold a.articleLink'),
	        element => element.textContent.toLowerCase()
	      )
	    ));

	    // Get all links to movie pages
	    linkArr = linkArr.concat(await page.evaluate(
	      () => Array.from(
	        document.querySelectorAll('ul.results_ul span.bold a.articleLink'),
	        element => element.getAttribute('href')
	      )
	    ));


		// Get all movie years
		yearArr = yearArr.concat(await page.evaluate(
	      () => Array.from(
	        document.querySelectorAll('ul.results_ul span.bold a.articleLink'),
	        element => element.parentNode.nextSibling.textContent.trim() //!== null ? element.getAttribute('href') : 'n/a'
	      )
	    ));

		// Load next set of results
	    if (pageNum !== totalPages) {   
		    let nextPage = await page.$$('.glyphicon-chevron-right');
		    await nextPage[0].click();
		    await page.waitFor(500);
		}
		pageNum += 1
	}

	// yearArr = yearArr.concat(await page.evaluate(
 //      () => Array.from(
 //        document.querySelectorAll('ul.results_ul span.bold a.articleLink'),
 //        element => element.parentNode.nextSibling.textContent.trim() //!== null ? element.getAttribute('href') : 'n/a'
 //      )
 //    ));

	// Cleaning up data
	const scores = [];
	const titles = [];
	const links = [];
	const years = [];
	for(let i = 0; i < scoreArr.length; i++) {
		if(scoreArr[i] !== 'No Score Yet' && linkArr[i] !== '/m/null' && yearArr[i] !== '') {
			scores.push(scoreArr[i]);
			titles.push(titleArr[i]);
			links.push(linkArr[i]);
			years.push(yearArr[i]);
		}
	}

	await Promise.all([
  		page.waitForNavigation({waitUntil: 'networkidle0'}), // The promise resolves after navigation has finished
  		page.goto(urlBO), // Clicking the link will indirectly cause a navigation
	]);
	// await page.goto('https://www.boxofficemojo.com/search/?q=fantastic'); // Clicking the link will indirectly cause a navigation
	await page.waitForSelector("#hp_banner", {visible: true}); // waiting for DOM to load
	console.log('on website');

	// Get number of movie matches on Box Office Mojo
	let totalMovies;
	let btags = await page.evaluate(
		() => Array.from(
			document.querySelectorAll('b'),
			element => element.textContent
		)
	);
	totalMovies = parseInt(btags.filter((value) => 
		{return value.indexOf("Movie Matches") > -1})[0].split(" ")[0]);
	console.log(totalMovies);

	// Extracting all table entries
	let allEntries = await page.evaluate(
		() => Array.from(
			document.querySelectorAll('font'),
			element => element.textContent.toLowerCase()
		)
	);
	let start = 0;
	while(start < allEntries.length && allEntries[start].indexOf(searchTerm) === -1) {
		start += 1;
	}
	console.log(start);
	table = [];
	while(start <= allEntries.length - 8 && allEntries[start].indexOf(searchTerm) > -1) {
		table.push(allEntries.slice(start,start+8));
		start += 8;
		// console.log(table);
	}
	console.log(table);


  //   // Navigate to each movie page and extract box office numbers
  //   let tempBox;
  //   const box = [];
  //   const finalArr = [];
  //   for(let i = 0; i < scores.length; i++) {
		// await page.waitFor(500)
  //   	await Promise.all([
  // 			page.waitForNavigation({waitUntil: 'networkidle0'}), // The promise resolves after navigation has finished
  // 			page.goto('https://www.rottentomatoes.com' + links[i]), // Clicking the link will indirectly cause a navigation
		// ]);
		// let tempMetaArr = await page.evaluate(
  // 			() => Array.from(
  //   			document.querySelectorAll('div.meta-value'),
  //   			element => element.textContent
  // 			)
		// );
		// tempBox = tempMetaArr.filter((value) => {return value[0] === '$'});
		// box.push((tempBox !== undefined && tempBox.length !== 0) ? tempBox[0] : 'n/a');
		// console.log((i + 1) + " out of " + scores.length + " complete!");
  //   }

    console.log(scores);
    console.log(titles);
    console.log(years);
    // console.log(box);
	console.log('step 2');

	await page.screenshot({path: 'example.png'});


	await browser.close();
})();