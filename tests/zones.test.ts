import { DateTime, IANAZone, SystemZone } from "luxon";
import { toDateRange } from "../src/Types";
import { firstEvent, nthEvent, sp } from "./testUtilities";

describe("timezones", () => {
  test.each(sp())("timezone works", (p) => {
    const nyt = `timezone: +5
    2023-05-01: event`;

    const utc = `timezone: +0
    2023-05-01: event`;

    const nytp = p(nyt);
    const utcp = p(utc);
    const nytpFromDateTime = toDateRange(
      firstEvent(nytp).dateRangeIso
    ).fromDateTime;
    const utcpFromDateTime = toDateRange(
      firstEvent(utcp).dateRangeIso
    ).fromDateTime;

    const diff = nytpFromDateTime.diff(utcpFromDateTime);
    expect(diff.as("hours")).toBe(-5);
  });

  test.each(sp())("default timezone is system", (p) => {
    const mw = `2023-05-01: event`;
    const parsed = p(mw);

    const dt = DateTime.fromISO("2023-05-01", { zone: new SystemZone() });
    const diff = toDateRange(firstEvent(parsed).dateRangeIso)
      .fromDateTime.diff(dt)
      .as("hours");
    expect(diff).toEqual(0);
  });

  test.each(sp())("named zone", (p) => {
    const mw = `timezone: America/New_York
    2023-05-01: event`;

    const parsed = p(mw);
    const dt = DateTime.fromISO("2023-05-01", {
      zone: new IANAZone("America/New_York"),
    });
    expect(+toDateRange(firstEvent(parsed).dateRangeIso).fromDateTime).toEqual(
      +dt
    );
  });

  test.each(sp())("named zone 2", (p) => {
    const mw = `timezone: America/New_York
    2023-05-01: event`;

    const parsed = p(mw);
    const dt = DateTime.fromISO("2023-05-01", {
      zone: new IANAZone("America/Chicago"),
    });
    const diff = toDateRange(firstEvent(parsed).dateRangeIso)
      .fromDateTime.diff(dt)
      .as("hours");
    expect(diff).toEqual(-1);
  });

  test.each(sp())("relative dates with zones", (p) => {
    const mw = `timezone: -05:00
    2023-05-01: event
    5 days: event
    `;
  });

  describe("zones via tags", () => {
    test.each(sp())("zone via tag is parsed correctly", (p) => {
      const mw = `
timezone: America/New_York
#generalGrievous:
  timezone: +0
  
2023-05-01: this is an event in the ny timezone

2023-05-01: this is an event in the UK timezone

#generalGrievous`;

      const timelines = p(mw);

      const ny = DateTime.fromISO(
        firstEvent(timelines).dateRangeIso.fromDateTimeIso
      );
      const uk = DateTime.fromISO(
        nthEvent(timelines, 1).dateRangeIso.fromDateTimeIso
      );
      expect(+ny.minus({ hours: 5 })).toBe(+uk);
    });
  });

  test.only.each(sp())("zone via group tag is parsed correctly", (p) => {
    const mw = `
timezone: America/New_York
#generalGrievous:
  timezone: +0

group #generalGrievous 
2023-05-01: this is an event in the UK timezone
endGroup
2023-05-01: this is an event in the UK timezone

#generalGrievous`;

    const timelines = p(mw);

    const ny = DateTime.fromISO(
      firstEvent(timelines).dateRangeIso.fromDateTimeIso
    );
    const uk = DateTime.fromISO(
      nthEvent(timelines, 1).dateRangeIso.fromDateTimeIso
    );
    expect(+ny.minus({ hours: 5 })).toBe(+uk);
  });
});
