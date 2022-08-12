import { parse } from "../src";

const exampleTwoPage = `title: Project planning example

#Project1: #d336b1

group Project 1 #Project1
// Supports ISO8601
2021-12/2022-03: some other thing
2022-03/2022-06: Sub task 2 #Michelle
More info about sub task 2

2022-07: Yearly planning

group Project 2 #Project2
2022-04/4 months: Larger sub task #Danielle

// Supports American date formats
03/2022 - 1 year: Longer ongoing task #Michelle
10/2022 - 2 months: Holiday season

group Project 2
01/2023: Project kickoff
02/2023-04/2023: Other stuff

section Overall

2022: Year of the something
2023: Year of something else

_-_-_break_-_-_

title: Life timeline example
description: Start editing to make it your own 🫡

// Comments start with two slashes: \`//\`
// Tags start with a pound sign: \`#\`

// You can color tags
#Work: pink
#Education: #f42

section Education I #Education
08/2008-05/2012: Psych degree #Education
02/2010-06/2012: Dispatcher #Work

// Add a shareable google photos link to display images. 
10/2010: Barn built across the street https://photos.app.goo.gl/Er9D81cdiE2tUwDZA
06/2011-08/2011: Westover Air Reserve Base https://photos.app.goo.gl/NZ5rnGS7vZTXHe7aA #Work
endSection

// 2013
03/15/2013-04/2015: China https://photos.app.goo.gl/4UEkw3EbUkUuNzKGA #Work

// 2014
07/2014: 4th of July in DC https://photos.app.goo.gl/d418j6GSkCD5LGmY8

section Education II #Education
// 2015
05/2015-08/2015: Summer classes so I can graduate in two years #Education
05/2015: James graduation
06/2015: Built desk
06/2015: Kim and Matt wedding
08/2015-05/2017: CS degree #Education

endSection

// 2016
05/22/2016-08/12/2016: Cardinal Health #Work
08/16/2016-08/27/2016: Italy

// 2017
05/2017-05/2018: Cladwell #Work
06/10/2017-06/17/2017: The Hague & Copenhagen

// 2018
group Unemployed Travel #Travel
07/21/2018-07/22/2018: Chicago
07/26/2018-07/31/2018: LA and Seattle (interviewing)
08/04/2018-08/14/2018: Mexico City
09/05/2018-09/11/2018: Hong Kong and Macau
09/19/2018-09/22/2018: Road trip to Seattle
endGroup

10/01/2018-01/2021: [Google](https://www.google.com) #Work
12/28/2018-12/29/2018: Nemacolin and Fallingwater

// 2019
06/08/2019: Paula's wedding
07/04/2019: 4th of July in Seattle with siblings
08/23/2019-08/27/2019: SF and Bishop's Ranch
09/2019: Hawaii with Google
12/20/2019-12/22/2019: Train from Seattle to Chicago
12/2019: Christmas at home, Dad to hospital

// 2020
02/29/2020: Molly and Kaitlyn to Seattle (thus starting covid)
03/28/2020: James to Austin
05/24/2020: Sold the Impala
07/2020: Oregon & Crater Lake
08/2020: Mt. Rainier
08/2020: Oak Island
09/2020: Hurricane Ridge
9/2020: Trip to Coeur d'Alene
11/2020: Trip to Denver
12/2020: Reese
12/25/2020: Christmas in Blaine

// 2021
01/2021: qr.new featured on [Hacker News](https://news.ycombinator.com/item?id=25481772)
02/2021: Hawaii
02/01/2021 - 02/2022: Working on [swink](https://sw.ink) full time RIP #Work
05/25/2021: [cascade.page](https://cascade.page) featured on [Hacker News](https://news.ycombinator.com/item?id=27282842)
06/05/2021-06/12/2021: Ohio and James's Party
08/11/2021-08/17/2021: Cincinnati https://photos.app.goo.gl/h5CfrZamP5Tw6yDn7

// 2022

02/18/2022-02/21/2022: Road trip to LA
#Travel

[Eugene, Oregon](location)
[Mt Shasta](location)
[Los Angeles](location)

02/2022 - now: [Reddit](https://www.reddit.com) #Work`;

const asLines = exampleTwoPage.split("\n");

describe("tokenization", () => {
  test("Ranges are equivalent in length", () => {
    const markwhen = parse(exampleTwoPage);

    for (const timeline of markwhen.timelines) {
      for (const range of timeline.ranges) {
        const sameLine = range.lineFrom.line === range.lineTo.line;
        if (sameLine) {
          expect(range.to - range.from).toBeGreaterThanOrEqual(0);
          expect(range.to - range.from).toBe(
            range.lineTo.index - range.lineFrom.index
          );
        }
      }
    }
  });

  test("Ranges refer to same content", () => {
    const markwhen = parse(exampleTwoPage);

    for (const timeline of markwhen.timelines) {
      for (const range of timeline.ranges) {
        const sameLine = range.lineFrom.line === range.lineTo.line;
        if (sameLine) {
          expect(exampleTwoPage.substring(range.from, range.to)).toEqual(
            asLines[range.lineFrom.line].substring(
              range.lineFrom.index,
              range.lineTo.index
            )
          );
        }
      }
    }
  });
});
