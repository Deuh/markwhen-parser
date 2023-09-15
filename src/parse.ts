import { Timeline, DateRangePart, Timelines, emptyTimeline } from "./Types.js";
import { getDateRangeFromCasualRegexMatch } from "./dateRange/getDateRangeFromCasualRegexMatch.js";
import { getDateRangeFromEDTFRegexMatch } from "./dateRange/getDateRangeFromEDTFRegexMatch.js";
import { Caches } from "./Cache.js";
import { checkEvent } from "./lineChecks/checkEvent.js";
import { ParsingContext } from "./ParsingContext.js";
import { checkNonEvents } from "./lineChecks/checkNonEvents.js";
import { parseHeader as _parseHeader } from "./parseHeader.js";
import ICAL from "ical.js";
import { DateTime } from "luxon";
import {
  DateFormap,
  ISOMap,
  dateRangeToString,
} from "./utilities/dateRangeToString.js";

// The bump script looks for this line specifically,
// if you edit it you need to edit the bump script as well
const version = "0.10.8";

export function parseDateRange(
  dateRangeString: string
): DateRangePart | undefined {
  const parsingContext = new ParsingContext();
  let dateRange = getDateRangeFromEDTFRegexMatch(
    dateRangeString,
    0,
    [],
    parsingContext
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      dateRangeString,
      0,
      [],
      parsingContext
    );
  }
  return dateRange;
}

const linesAndLengths = (timelineString: string) => {
  const lines = timelineString.split("\n");
  let lengthAtIndex: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(0);
    }
    lengthAtIndex.push(
      1 + lines[i].length + lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }
  return { lines, lengthAtIndex };
};

export function parse(
  timelineString?: string,
  cache?: Caches | true
): Timelines {
  if (cache === true) {
    cache = new Caches();
  }
  const parser = {
    version,
  };
  if (!timelineString) {
    return { timelines: [emptyTimeline()], cache, parser };
  }
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  return {
    timelines: [parseTimeline(lines, lengthAtIndex, cache)],
    cache,
    parser,
  };
}

export function parseHeader(timelineString: string) {
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  const context = new ParsingContext();
  const headerEndLineIndex = _parseHeader(lines, lengthAtIndex, context);
  return { ...context, lines, lengthAtIndex, headerEndLineIndex };
}

export function parseTimeline(
  lines: string[],
  lengthAtIndex: number[],
  cache?: Caches
): Timeline {
  const context = new ParsingContext();

  const headerEndLineIndex = _parseHeader(lines, lengthAtIndex, context, cache);

  for (let i = headerEndLineIndex; i < lines.length; i++) {
    const line = lines[i];
    if (checkNonEvents(line, i, lengthAtIndex, context, cache)) {
      continue;
    }

    // TODO: Setting i from the result of checkEvent here allows us to not needlessly reparse lines,
    // but also breaks folding of comments under events
    i = checkEvent(line, lines, i, lengthAtIndex, context, cache);
  }

  // if (context.eventSubgroup) {
  //   context.events.push(context.eventSubgroup);
  // }
  return context.toTimeline(
    lengthAtIndex,
    lines.length - 1,
    // As this is the last timeline, return the length of the whole string
    lengthAtIndex[lines.length - 1] + lines[lines.length - 1].length
  );
}

export function parseICal(
  ical: string,
  options?: {
    output?: "markwhen" | "json";
    formap?: DateFormap;
  }
) {
  let markwhenText = "";
  const icalParse = ICAL.parse(ical);
  const component = new ICAL.Component(icalParse);
  const vevents = component.getAllSubcomponents("vevent");
  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    const timezone =
      component
        .getFirstSubcomponent("vtimezone")
        ?.getFirstPropertyValue<string>("tzid") || "";

    const fromDateTime = timezone
      ? DateTime.fromISO(event.startDate.toString(), { zone: timezone })
      : DateTime.fromMillis(event.startDate.toUnixTime() * 1000);

    const toDateTime = timezone
      ? DateTime.fromISO(event.endDate.toString(), { zone: timezone })
      : DateTime.fromMillis(event.endDate.toUnixTime() * 1000);

    markwhenText += `${dateRangeToString(
      {
        fromDateTime,
        toDateTime,
      },
      options?.formap ?? ISOMap
    )}: ${event.summary}\n`;
    if (event.description) {
      const adjustedDescription = event.description
        .split("\n")
        .map((line) => {
          if (parseDateRange(line)) {
            return `. ${line}`;
          }
          return line;
        })
        .join("\n");
      markwhenText += `${adjustedDescription}\n\n`;
    }
  }
  if (options?.output === "json") {
    const result = parse(markwhenText);
    return result;
  }
  return markwhenText;
}
